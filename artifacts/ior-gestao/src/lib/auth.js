import { useState, useEffect } from "react";
import { supabase } from "./supabase.js";

const VALID_ROLES = ["Proprietária","Financeiro","Secretaria","Professor(a)","Assistente","Desenvolvedor"];

function extractRole(user) {
  const r = user?.app_metadata?.role || user?.user_metadata?.role;
  return VALID_ROLES.includes(r) ? r : null;
}

async function loadProfileFromDB(userId) {
  try {
    const { data } = await supabase.from("user_profiles").select("role").eq("id", userId).single();
    if (VALID_ROLES.includes(data?.role)) return data.role;
  } catch {}
  return null;
}

export function useAuth() {
  const [user,    setUser]    = useState(null);
  const [role,    setRole]    = useState("Assistente");
  const [loading, setLoading] = useState(true);

  async function resolveRole(u) {
    if (!u) { setRole("Assistente"); setLoading(false); return; }

    // 1. Tenta JWT atual
    const jwtRole = extractRole(u);
    if (jwtRole) { setRole(jwtRole); setLoading(false); return; }

    // 2. JWT sem role? Força refresh para pegar app_metadata atualizado
    try {
      const { data: { session } } = await supabase.auth.refreshSession();
      const refreshedRole = extractRole(session?.user);
      if (refreshedRole) { setUser(session.user); setRole(refreshedRole); setLoading(false); return; }
    } catch {}

    // 3. Fallback: lê do banco
    const dbRole = await loadProfileFromDB(u.id);
    setRole(dbRole || "Assistente");
    setLoading(false);
  }

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      const u = session?.user || null;
      setUser(u);
      resolveRole(u);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!mounted) return;
      const u = session?.user || null;
      setUser(u);
      if (u) resolveRole(u);
      else { setRole("Assistente"); setLoading(false); }
    });
    return () => { mounted = false; subscription.unsubscribe(); };
  }, []);

  return {
    user, role,
    isAdmin: role === "Proprietária",
    isDev:   role === "Desenvolvedor",
    loading,
    signOut: async () => {
      try { await supabase.auth.signOut(); } catch {}
      window.location.replace("/");
    },
  };
}
