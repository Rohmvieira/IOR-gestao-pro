import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase.js";
import IOR from "./IOR.jsx";
import Login from "./components/Login.jsx";
import PWAInstall from "./components/PWAInstall.jsx";

export default function App() {
  const [session, setSession] = useState<any>(undefined); // undefined = loading

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => setSession(session));
    return () => subscription.unsubscribe();
  }, []);

  // Loading inicial
  if (session === undefined) {
    return (
      <div style={{ height:"100vh", display:"flex", alignItems:"center", justifyContent:"center",
        background:"#F4F7FB", fontFamily:"'DM Sans',sans-serif" }}>
        <div style={{ textAlign:"center" }}>
          <div style={{ width:44, height:44, border:"3px solid #3066BE", borderTopColor:"transparent",
            borderRadius:"50%", animation:"spin .8s linear infinite", margin:"0 auto 16px" }} />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      </div>
    );
  }

  // Não autenticado → tela de login
  if (!session) {
    return <Login onLogin={() => {}} />;
  }

  // Autenticado → app completo
  return (
    <>
      <IOR />
      <PWAInstall />
    </>
  );
}
