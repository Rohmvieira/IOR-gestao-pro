import { Component, type ReactNode } from "react";
import { useAuth } from "./lib/auth.js";
import IOR from "./IOR.jsx";
import Login from "./components/Login.jsx";
import PWAInstall from "./components/PWAInstall.jsx";

/* ══════════════════════════════════════════════════
   Error Boundary — captura crashes silenciosamente
   Em produção: mensagem amigável
   Em dev: detalhes técnicos
══════════════════════════════════════════════════ */
class ErrorBoundary extends Component<
  { children: ReactNode },
  { error: Error | null }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    // Log interno apenas — nunca expõe ao usuário em produção
    if (import.meta.env.DEV) {
      console.error("[IOR] Erro capturado:", error, info);
    }
  }

  render() {
    if (this.state.error) {
      const isProd = import.meta.env.PROD;
      return (
        <div style={{
          minHeight: "100vh", display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          background: "#F4F7FB", fontFamily: "'DM Sans', sans-serif",
          padding: 24, textAlign: "center",
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>😕</div>
          <h2 style={{
            fontFamily: "'Playfair Display', serif", fontSize: 22,
            color: "#1A2540", marginBottom: 8,
          }}>
            Algo deu errado
          </h2>
          <p style={{ color: "#6B7A99", fontSize: 14, maxWidth: 360, marginBottom: 24, lineHeight: 1.6 }}>
            Ocorreu um erro inesperado. Tente recarregar a página.
            Se o problema persistir, entre em contato com o suporte.
          </p>
          {!isProd && (
            <details style={{
              background: "#FEF2F2", border: "1px solid #FECACA",
              borderRadius: 8, padding: "12px 16px", marginBottom: 16,
              maxWidth: 600, textAlign: "left", fontSize: 11,
              fontFamily: "monospace", color: "#7F1D1D",
            }}>
              <summary style={{ cursor: "pointer", fontWeight: 600 }}>Detalhes (dev only)</summary>
              <pre style={{ marginTop: 8, whiteSpace: "pre-wrap" }}>
                {this.state.error.message}
              </pre>
            </details>
          )}
          <button
            onClick={() => window.location.reload()}
            style={{
              background: "#3066BE", color: "#fff", border: "none",
              borderRadius: 10, padding: "12px 28px", fontSize: 14,
              fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
            }}
          >
            Recarregar página
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

/* ══════════════════════════════════════════════════
   App root — autenticação via useAuth hook
   Role lido do banco (user_profiles), não só JWT
══════════════════════════════════════════════════ */
function AppContent() {
  const { user, role, isAdmin, isDev, loading, signOut } = useAuth();

  // Loading inicial
  if (loading) {
    return (
      <div style={{
        height: "100vh", display: "flex", alignItems: "center",
        justifyContent: "center", background: "#F4F7FB",
        fontFamily: "'DM Sans', sans-serif",
      }}>
        <div>
          <div style={{
            width: 44, height: 44, border: "3px solid #3066BE",
            borderTopColor: "transparent", borderRadius: "50%",
            animation: "spin .8s linear infinite", margin: "0 auto",
          }} />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      </div>
    );
  }

  // Não autenticado
  if (!user) {
    return (
      <ErrorBoundary>
        <Login onLogin={() => {}} />
      </ErrorBoundary>
    );
  }

  // Autenticado — passa role para IOR
  return (
    <ErrorBoundary>
      <IOR user={user} role={role} isAdmin={isAdmin} isDev={isDev} signOut={signOut} />
      <PWAInstall />
    </ErrorBoundary>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}
