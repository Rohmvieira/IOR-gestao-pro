/**
 * IOR Gestão Pro — Hook de autenticação seguro
 * Lê o role do user_profiles (banco) — não depende só do JWT
 * Provê: { user, role, isAdmin, isDev, loading, signOut }
 */
import { useState, useEffect } from "react";
import { supabase } from "./supabase.js";

export function useAuth() {
  const [user, setUser]   = useState(null);
  const [role, setRole]   = useState("Assistente");
  const [loading, setLoading] = useState(true);

  async function loadProfile(userId) {
    if (!userId) { setRole("Assistente"); return; }
    try {
      const { data } = await supabase
        .from("user_profiles")
        .select("role")
        .eq("id", userId)
        .single();
      setRole(data?.role || "Assistente");
    } catch {
      setRole("Assistente");
    }
  }

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      const u = session?.user || null;
      setUser(u);
      loadProfile(u?.id).finally(() => { if (mounted) setLoading(false); });
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!mounted) return;
      const u = session?.user || null;
      setUser(u);
      if (u) {
        loadProfile(u.id);
      } else {
        setRole("Assistente");
        setLoading(false);
      }
    });

    return () => { mounted = false; subscription.unsubscribe(); };
  }, []);

  return {
    user,
    role,
    isAdmin: role === "Proprietária",
    isDev:   role === "Desenvolvedor",
    loading,
    signOut: async () => { await supabase.auth.signOut(); window.location.href = '/'; },
  };
}
