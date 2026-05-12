import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Token não fornecido" }, 401);

    // Admin client — usa service_role para operações privilegiadas
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Verifica quem está chamando
    const caller = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authErr } = await caller.auth.getUser();
    if (authErr || !user) return json({ error: "Sessão inválida" }, 401);

    // Verifica se é Proprietária
    const { data: profile } = await admin
      .from("user_profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const role = profile?.role ?? user.app_metadata?.role;
    if (role !== "Proprietária") {
      return json({ error: "Acesso negado. Apenas Proprietárias podem gerenciar usuários." }, 403);
    }

    const body = await req.json();

    // ── Listar usuários
    if (body.action === "list") {
      const { data: { users }, error } = await admin.auth.admin.listUsers({ perPage: 100 });
      if (error) throw error;
      const { data: profiles } = await admin.from("user_profiles").select("*");
      const pm: Record<string, any> = Object.fromEntries(
        (profiles || []).map((p: any) => [p.id, p])
      );
      return json({
        data: users.map((u: any) => ({
          id: u.id,
          email: u.email,
          name: pm[u.id]?.name || u.user_metadata?.name || "",
          role: pm[u.id]?.role || u.app_metadata?.role || "Assistente",
          active: pm[u.id]?.active ?? true,
          lastSignIn: u.last_sign_in_at,
          createdAt: u.created_at,
        })),
      });
    }

    // ── Criar usuário
    if (body.action === "create") {
      const { email, password, name, userRole } = body;
      if (!email || !password || !name || !userRole) {
        return json({ error: "email, password, name e role são obrigatórios" }, 422);
      }
      if (password.length < 8) {
        return json({ error: "Senha mínima de 8 caracteres" }, 422);
      }
      const { data: nu, error } = await admin.auth.admin.createUser({
        email,
        password,
        user_metadata: { name },
        app_metadata: { role: userRole, tenant_id: "default" },
        email_confirm: true,
      });
      if (error) throw error;
      return json({ data: { id: nu.user.id, email, name, role: userRole } }, 201);
    }

    // ── Editar nome/perfil
    if (body.action === "update") {
      const { userId, name, userRole } = body;
      if (!userId) return json({ error: "userId obrigatório" }, 422);
      await admin.auth.admin.updateUserById(userId, {
        user_metadata: { name },
        app_metadata: { role: userRole },
      });
      await admin.from("user_profiles").update({ name, role: userRole }).eq("id", userId);
      return json({ data: { success: true } });
    }

    // ── Resetar senha
    if (body.action === "reset_password") {
      const { userId, newPassword } = body;
      if (!userId || !newPassword) return json({ error: "userId e newPassword obrigatórios" }, 422);
      if (newPassword.length < 8) return json({ error: "Senha mínima de 8 caracteres" }, 422);
      const { error } = await admin.auth.admin.updateUserById(userId, { password: newPassword });
      if (error) throw error;
      return json({ data: { success: true } });
    }

    // ── Desativar acesso
    if (body.action === "deactivate") {
      if (!body.userId) return json({ error: "userId obrigatório" }, 422);
      if (body.userId === user.id) return json({ error: "Você não pode desativar sua própria conta" }, 422);
      await admin.auth.admin.updateUserById(body.userId, { ban_duration: "876000h" });
      await admin.from("user_profiles").update({ active: false }).eq("id", body.userId);
      return json({ data: { success: true } });
    }

    // ── Reativar acesso
    if (body.action === "reactivate") {
      if (!body.userId) return json({ error: "userId obrigatório" }, 422);
      await admin.auth.admin.updateUserById(body.userId, { ban_duration: "none" });
      await admin.from("user_profiles").update({ active: true }).eq("id", body.userId);
      return json({ data: { success: true } });
    }

    return json({ error: "Ação desconhecida" }, 400);

  } catch (err: any) {
    console.error("manage-users error:", err);
    return json({ error: err.message || "Erro interno" }, 500);
  }
});
