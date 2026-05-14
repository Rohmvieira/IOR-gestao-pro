/**
 * IOR Gestão Pro — Hook de autenticação
 * Lê role do JWT (app_metadata) — mais rápido e confiável
 * Fallback para user_profiles se JWT não tiver role
 */
import { useState, useEffect } from "react";
import { supabase } from "./supabase.js";

const VALID_ROLES = ["Proprietária","Financeiro","Secretaria","Professor(a)","Assistente","Desenvolvedor"];

function extractRole(user) {
  // 1. JWT app_metadata (definido pelo servidor — mais seguro)
  const jwtRole = user?.app_metadata?.role;
  if (jwtRole && VALID_ROLES.includes(jwtRole)) return jwtRole;
  // 2. JWT user_metadata (definido pelo cliente — fallback)
  const metaRole = user?.user_metadata?.role;
  if (metaRole && VALID_ROLES.includes(metaRole)) return metaRole;
  return null;
}

export function useAuth() {
  const [user,    setUser]    = useState(null);
  const [role,    setRole]    = useState("Assistente");
  const [loading, setLoading] = useState(true);

  async function loadProfileFromDB(userId) {
    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("role")
        .eq("id", userId)
        .single();
      if (!error && data?.role && VALID_ROLES.includes(data.role)) {
        setRole(data.role);
        return data.role;
      }
    } catch (e) {
      console.warn("[auth] user_profiles read failed:", e?.message);
    }
    return null;
  }

  async function resolveRole(u) {
    if (!u) { setRole("Assistente"); setLoading(false); return; }
    // Tenta JWT primeiro (instantâneo, sem chamada de rede)
    const jwtRole = extractRole(u);
    if (jwtRole) {
      setRole(jwtRole);
      setLoading(false);
      return;
    }
    // Se JWT não tem role, busca no banco
    const dbRole = await loadProfileFromDB(u.id);
    if (!dbRole) setRole("Assistente");
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
      resolveRole(u);
    });

    return () => { mounted = false; subscription.unsubscribe(); };
  }, []);

  return {
    user,
    role,
    isAdmin: role === "Proprietária",
    isDev:   role === "Desenvolvedor",
    loading,
    signOut: async () => {
      await supabase.auth.signOut();
      window.location.href = "/";
    },
  };
}
