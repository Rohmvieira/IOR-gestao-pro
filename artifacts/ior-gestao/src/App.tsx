import { Component, type ReactNode } from "react";
import { useAuth } from "./lib/auth.js";
import IOR from "./IOR.jsx";
import Login from "./components/Login.jsx";
import PWAInstall from "./components/PWAInstall.jsx";
import DevPage from "./components/DevPage.jsx";

/* ── Error Boundary ── */
class ErrorBoundary extends Component<{children:ReactNode},{error:Error|null}> {
  constructor(props:{children:ReactNode}){super(props);this.state={error:null};}
  static getDerivedStateFromError(e:Error){return{error:e};}
  componentDidCatch(e:Error){if(import.meta.env.DEV)console.error("[IOR]",e);}
  render(){
    if(this.state.error){
      return(
        <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:"#F4F7FB",fontFamily:"'DM Sans',sans-serif",padding:24,textAlign:"center"}}>
          <div style={{fontSize:48,marginBottom:16}}>😕</div>
          <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:22,color:"#1A2540",marginBottom:8}}>Algo deu errado</h2>
          <p style={{color:"#6B7A99",fontSize:14,maxWidth:360,marginBottom:24,lineHeight:1.6}}>
            Ocorreu um erro inesperado. Tente recarregar a página.<br/>Se persistir, use o Suporte Dev.
          </p>
          {import.meta.env.DEV&&<details style={{background:"#FEF2F2",border:"1px solid #FECACA",borderRadius:8,padding:"12px 16px",marginBottom:16,maxWidth:600,textAlign:"left",fontSize:11,fontFamily:"monospace",color:"#7F1D1D"}}><summary style={{cursor:"pointer",fontWeight:600}}>Dev details</summary><pre style={{marginTop:8,whiteSpace:"pre-wrap"}}>{this.state.error.message}</pre></details>}
          <button onClick={()=>window.location.reload()} style={{background:"#3066BE",color:"#fff",border:"none",borderRadius:10,padding:"12px 28px",fontSize:14,fontWeight:700,cursor:"pointer"}}>Recarregar</button>
        </div>
      );
    }
    return this.props.children;
  }
}

/* ── Loading spinner ── */
function Spinner(){
  return(
    <div style={{height:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#F4F7FB"}}>
      <div style={{width:44,height:44,border:"3px solid #3066BE",borderTopColor:"transparent",borderRadius:"50%",animation:"spin .8s linear infinite"}}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

/* ── App ── */
function AppContent(){
  const{user,role,isAdmin,isDev,loading,signOut}=useAuth();

  if(loading) return <Spinner/>;

  if(!user) return(
    <ErrorBoundary>
      <Login onLogin={()=>{}}/>
    </ErrorBoundary>
  );

  // Desenvolvedor → painel dedicado (sem o IOR completo)
  if(isDev) return(
    <ErrorBoundary>
      <DevPage user={user} signOut={signOut}/>
    </ErrorBoundary>
  );

  // Proprietária / outros → IOR completo
  return(
    <ErrorBoundary>
      <IOR user={user} role={role} isAdmin={isAdmin} isDev={isDev} signOut={signOut}/>
      <PWAInstall/>
    </ErrorBoundary>
  );
}

export default function App(){
  return(
    <ErrorBoundary>
      <AppContent/>
    </ErrorBoundary>
  );
}
