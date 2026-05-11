import { Router, type IRouter } from "express";
import healthRouter from "./health";
import { createCrudRouter } from "./crud-factory";
import {
  coursesTable, insertCourseSchema,
  studentsTable, insertStudentSchema,
  leadsTable, insertLeadSchema,
  productsTable, insertProductSchema,
  salesTable, insertSaleSchema,
  checksTable, insertCheckSchema,
  templatesTable, insertTemplateSchema,
} from "@workspace/db";

const router: IRouter = Router();

/* Health check */
router.use(healthRouter);

/* ══════════════════════════════════════════════════
   ROTAS CRUD — todas as entidades do sistema IOR
   Cada rota: GET / GET/:id / POST / PUT/:id / PATCH/:id / DELETE/:id
══════════════════════════════════════════════════ */
router.use("/courses",   createCrudRouter(coursesTable,   insertCourseSchema,   "Curso"));
router.use("/students",  createCrudRouter(studentsTable,  insertStudentSchema,  "Aluno"));
router.use("/leads",     createCrudRouter(leadsTable,     insertLeadSchema,     "Lead"));
router.use("/products",  createCrudRouter(productsTable,  insertProductSchema,  "Produto"));
router.use("/sales",     createCrudRouter(salesTable,     insertSaleSchema,     "Venda"));
router.use("/checks",    createCrudRouter(checksTable,    insertCheckSchema,    "Tarefa"));
router.use("/templates", createCrudRouter(templatesTable, insertTemplateSchema, "Modelo"));

export default router;
