import { useEffect, useState, Component, type ReactNode } from "react";
import { supabase } from "./lib/supabase.js";
import IOR from "./IOR.jsx";
import Login from "./components/Login.jsx";
import PWAInstall from "./components/PWAInstall.jsx";

/* Error Boundary — mostra o erro em vez de tela branca */
class ErrorBoundary extends Component<{children: ReactNode}, {error: Error | null}> {
  constructor(props: {children: ReactNode}) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <div style={{padding:32, fontFamily:"monospace", background:"#FEF2F2", minHeight:"100vh"}}>
          <h2 style={{color:"#D43030", marginBottom:12}}>⚠ Erro no app — copie isso e envie para o suporte</h2>
          <p style={{color:"#7F1D1D", marginBottom:8, fontWeight:600}}>{this.state.error.message}</p>
          <pre style={{color:"#7F1D1D", fontSize:11, overflowX:"auto", whiteSpace:"pre-wrap", background:"#FEE2E2", padding:12, borderRadius:8}}>
            {this.state.error.stack}
          </pre>
          <button onClick={()=>window.location.reload()} style={{marginTop:16,padding:"10px 20px",background:"#D43030",color:"#fff",border:"none",borderRadius:8,cursor:"pointer",fontSize:14}}>
            Recarregar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const [session, setSession] = useState<any>(undefined);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => setSession(session));
    return () => subscription.unsubscribe();
  }, []);

  if (session === undefined) {
    return (
      <div style={{ height:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"#F4F7FB", fontFamily:"'DM Sans',sans-serif" }}>
        <div style={{ textAlign:"center" }}>
          <div style={{ width:44, height:44, border:"3px solid #3066BE", borderTopColor:"transparent", borderRadius:"50%", animation:"spin .8s linear infinite", margin:"0 auto 16px" }} />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <ErrorBoundary>
        <Login onLogin={() => {}} />
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <IOR />
      <PWAInstall />
    </ErrorBoundary>
  );
}
