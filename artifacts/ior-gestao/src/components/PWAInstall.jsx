/**
 * IOR Gestão Pro — Prompt de instalação PWA
 * Detecta iOS vs Android e exibe instruções corretas
 *
 * iOS Safari: não tem evento beforeinstallprompt — exibe instruções manuais
 * Android Chrome: captura beforeinstallprompt e exibe botão de instalação nativo
 */
import { useState, useEffect, useRef } from "react";

function isIOS() {
  return /ipad|iphone|ipod/i.test(navigator.userAgent) && !window.MSStream;
}
function isAndroid() {
  return /android/i.test(navigator.userAgent);
}
function isInStandaloneMode() {
  return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
}

export default function PWAInstall() {
  const [show, setShow] = useState(false);
  const [platform, setPlatform] = useState(null); // "ios" | "android"
  const [step, setStep] = useState(0);
  const deferredPrompt = useRef(null);

  useEffect(() => {
    // Já instalado — não mostrar
    if (isInStandaloneMode()) return;

    // Verificar se já foi dispensado recentemente
    const dismissed = localStorage.getItem("pwa_dismissed");
    if (dismissed && Date.now() - parseInt(dismissed) < 7 * 24 * 3600 * 1000) return;

    if (isIOS()) {
      // iOS: exibe dica após 3 segundos
      const t = setTimeout(() => { setPlatform("ios"); setShow(true); }, 3000);
      return () => clearTimeout(t);
    }

    if (isAndroid() || (!isIOS())) {
      // Android/Desktop: captura evento nativo
      const handler = (e) => {
        e.preventDefault();
        deferredPrompt.current = e;
        setPlatform("android");
        setShow(true);
      };
      window.addEventListener("beforeinstallprompt", handler);
      return () => window.removeEventListener("beforeinstallprompt", handler);
    }
  }, []);

  function dismiss() {
    localStorage.setItem("pwa_dismissed", Date.now().toString());
    setShow(false);
  }

  async function installAndroid() {
    if (!deferredPrompt.current) return;
    deferredPrompt.current.prompt();
    const { outcome } = await deferredPrompt.current.userChoice;
    if (outcome === "accepted") setShow(false);
    deferredPrompt.current = null;
  }

  if (!show) return null;

  const iOS_STEPS = [
    { icon: "↑", label: "Toque em compartilhar", sub: "botão na barra inferior do Safari" },
    { icon: "⊞", label: "Deslize e toque em", sub: '"Adicionar à tela de início"' },
    { icon: "✓", label: "Confirme tocando", sub: '"Adicionar" no canto superior direito' },
  ];

  return (
    <>
      {/* Overlay semitransparente */}
      <div
        onClick={dismiss}
        style={{
          position: "fixed", inset: 0, background: "rgba(20,30,60,.45)",
          backdropFilter: "blur(4px)", zIndex: 9000, animation: "fadeIn .2s ease",
        }}
      />

      {/* Card principal */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 9001,
        background: "#fff", borderRadius: "20px 20px 0 0",
        padding: "20px 20px 32px", maxWidth: 480, margin: "0 auto",
        boxShadow: "0 -8px 40px rgba(30,40,80,.18)",
        animation: "slideUp .3s cubic-bezier(.4,0,.2,1)",
        fontFamily: "'DM Sans', sans-serif",
      }}>
        {/* Handle */}
        <div style={{ width: 36, height: 4, background: "#DDE3EE", borderRadius: 99, margin: "0 auto 18px" }} />

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 13, marginBottom: 16 }}>
          <div style={{
            width: 54, height: 54, borderRadius: 14,
            background: "linear-gradient(135deg,#3066BE,#1A52AA)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 26, flexShrink: 0, boxShadow: "0 4px 14px rgba(48,102,190,.35)",
          }}>🌿</div>
          <div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 17, fontWeight: 700, color: "#1A2540" }}>
              IOR Gestão Pro
            </div>
            <div style={{ fontSize: 12, color: "#6B7A99", marginTop: 2 }}>
              {platform === "ios"
                ? "Instale o app direto na sua tela inicial"
                : "Adicione ao celular para acesso rápido"}
            </div>
          </div>
          <button
            onClick={dismiss}
            style={{ marginLeft: "auto", background: "#F7F9FC", border: "1.5px solid #DDE3EE", borderRadius: 8, width: 30, height: 30, color: "#9AAAC0", cursor: "pointer", fontSize: 16, flexShrink: 0 }}
          >×</button>
        </div>

        {/* Benefícios */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
          {[["⚡", "Acesso instantâneo"], ["📴", "Funciona offline"], ["🔔", "Notificações"]].map(([ic, lb]) => (
            <div key={lb} style={{ display: "flex", alignItems: "center", gap: 5, background: "#F0F4FA", borderRadius: 99, padding: "4px 10px", fontSize: 11, color: "#3066BE", fontWeight: 600 }}>
              <span>{ic}</span><span>{lb}</span>
            </div>
          ))}
        </div>

        {/* iOS: steps manuais */}
        {platform === "ios" && (
          <div>
            {iOS_STEPS.map((s, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 13, padding: "10px 0", borderBottom: i < 2 ? "1px solid #EEF1F7" : "none" }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10, background: "#EEF4FF",
                  border: "1.5px solid #C7D7F5", display: "flex", alignItems: "center",
                  justifyContent: "center", fontSize: 18, flexShrink: 0, color: "#3066BE",
                }}>{s.icon}</div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13, color: "#1A2540" }}>
                    {i + 1}. {s.label}
                  </div>
                  <div style={{ fontSize: 11, color: "#6B7A99", marginTop: 2 }}>{s.sub}</div>
                </div>
              </div>
            ))}
            {/* Seta apontando para baixo (onde fica o botão share do Safari) */}
            <div style={{
              textAlign: "center", marginTop: 14, padding: "8px", background: "#EEF4FF",
              borderRadius: 10, fontSize: 11, color: "#3066BE", fontWeight: 600,
            }}>
              👇 O botão de compartilhar fica na barra inferior do Safari
            </div>
          </div>
        )}

        {/* Android: botão de instalação nativo */}
        {platform === "android" && (
          <div>
            <div style={{ fontSize: 13, color: "#6B7A99", marginBottom: 14, lineHeight: 1.6 }}>
              Use o app direto da tela inicial do seu celular com apenas um toque. Rápido e eficiente sem prejudicar o armazenamento!
            </div>
            <button
              onClick={installAndroid}
              style={{
                width: "100%", background: "linear-gradient(135deg,#3066BE,#1A52AA)",
                border: "none", borderRadius: 12, padding: "14px 0", color: "#fff",
                fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                boxShadow: "0 4px 16px rgba(48,102,190,.35)", marginBottom: 10,
              }}
            >
              ⊞ Instalar IOR Gestão Pro
            </button>
            <button
              onClick={dismiss}
              style={{ width: "100%", background: "transparent", border: "none", color: "#9AAAC0", fontSize: 12, cursor: "pointer", padding: "8px 0" }}
            >
              Agora não
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        @keyframes slideUp { from{transform:translateY(100%)} to{transform:translateY(0)} }
      `}</style>
    </>
  );
}
