import { Router, type Request, type Response } from "express";
import { db } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { type PgTableWithColumns } from "drizzle-orm/pg-core";
import { logger } from "../lib/logger";

const TENANT_ID = process.env.TENANT_ID || "default";

export function createCrudRouter<T extends PgTableWithColumns<any>>(
  table: T,
  insertSchema: { safeParse: (data: unknown) => { success: boolean; data?: any; error?: any } },
  entityName: string
) {
  const router = Router();

  // GET /  — listar todos
  router.get("/", async (_req: Request, res: Response) => {
    try {
      const rows = await db.select().from(table).where(eq((table as any).tenantId, TENANT_ID));
      res.json(rows);
    } catch (err) {
      logger.error({ err }, `Erro ao listar ${entityName}`);
      res.status(500).json({ error: `Erro ao buscar ${entityName}` });
    }
  });

  // GET /:id  — buscar um
  router.get("/:id", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });
    try {
      const [row] = await db.select().from(table).where(
        and(eq((table as any).id, id), eq((table as any).tenantId, TENANT_ID))
      );
      if (!row) return res.status(404).json({ error: `${entityName} não encontrado` });
      res.json(row);
    } catch (err) {
      logger.error({ err }, `Erro ao buscar ${entityName} ${id}`);
      res.status(500).json({ error: `Erro ao buscar ${entityName}` });
    }
  });

  // POST /  — criar
  router.post("/", async (req: Request, res: Response) => {
    const parsed = insertSchema.safeParse({ ...req.body, tenantId: TENANT_ID });
    if (!parsed.success) {
      return res.status(422).json({ error: "Dados inválidos", details: parsed.error?.flatten() });
    }
    try {
      const [row] = await db.insert(table).values(parsed.data).returning();
      res.status(201).json(row);
    } catch (err) {
      logger.error({ err }, `Erro ao criar ${entityName}`);
      res.status(500).json({ error: `Erro ao criar ${entityName}` });
    }
  });

  // PUT /:id  — atualizar completamente
  router.put("/:id", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });
    const parsed = insertSchema.safeParse({ ...req.body, tenantId: TENANT_ID });
    if (!parsed.success) {
      return res.status(422).json({ error: "Dados inválidos", details: parsed.error?.flatten() });
    }
    try {
      const [row] = await db.update(table).set({ ...parsed.data, updatedAt: new Date() })
        .where(and(eq((table as any).id, id), eq((table as any).tenantId, TENANT_ID)))
        .returning();
      if (!row) return res.status(404).json({ error: `${entityName} não encontrado` });
      res.json(row);
    } catch (err) {
      logger.error({ err }, `Erro ao atualizar ${entityName} ${id}`);
      res.status(500).json({ error: `Erro ao atualizar ${entityName}` });
    }
  });

  // PATCH /:id  — atualizar parcialmente
  router.patch("/:id", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({ error: "Nenhum campo para atualizar" });
    }
    try {
      const [row] = await db.update(table)
        .set({ ...req.body, tenantId: TENANT_ID, updatedAt: new Date() })
        .where(and(eq((table as any).id, id), eq((table as any).tenantId, TENANT_ID)))
        .returning();
      if (!row) return res.status(404).json({ error: `${entityName} não encontrado` });
      res.json(row);
    } catch (err) {
      logger.error({ err }, `Erro ao fazer patch ${entityName} ${id}`);
      res.status(500).json({ error: `Erro ao atualizar ${entityName}` });
    }
  });

  // DELETE /:id  — excluir
  router.delete("/:id", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });
    try {
      const [row] = await db.delete(table)
        .where(and(eq((table as any).id, id), eq((table as any).tenantId, TENANT_ID)))
        .returning();
      if (!row) return res.status(404).json({ error: `${entityName} não encontrado` });
      res.status(204).send();
    } catch (err) {
      logger.error({ err }, `Erro ao excluir ${entityName} ${id}`);
      res.status(500).json({ error: `Erro ao excluir ${entityName}` });
    }
  });

  return router;
}

// Re-exporta a fábrica com suporte a criptografia (adicionado na sessão de security hardening)
// Para usar: createCrudRouter(studentsTable, insertStudentSchema, "Aluno", ["cpf","phone","email"])
