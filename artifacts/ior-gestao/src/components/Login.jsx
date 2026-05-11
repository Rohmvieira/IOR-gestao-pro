import { useState } from "react";
import { supabase } from "../lib/supabase.js";

export default function Login({ onLogin }) {
  const [email, setEmail]     = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [showPwd, setShowPwd] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    if (!email || !password) { setError("Preencha e-mail e senha."); return; }
    setLoading(true); setError("");
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) { setError(err.message === "Invalid login credentials" ? "E-mail ou senha incorretos." : err.message); }
    else { onLogin(); }
    setLoading(false);
  }

  return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center",
      background:"linear-gradient(135deg,#F4F7FB 0%,#EEF4FF 100%)", fontFamily:"'DM Sans',sans-serif", padding:16 }}>

      {/* Card */}
      <div style={{ background:"#fff", borderRadius:20, padding:"36px 32px", width:"100%", maxWidth:400,
        boxShadow:"0 8px 40px rgba(30,40,80,.13)", border:"1px solid rgba(61,133,200,.1)",
        animation:"up .4s ease" }}>

        {/* Logo */}
        <div style={{ textAlign:"center", marginBottom:28 }}>
          <div style={{ width:64, height:64, borderRadius:16, background:"linear-gradient(135deg,#3066BE,#1A52AA)",
            display:"flex", alignItems:"center", justifyContent:"center", fontSize:30,
            margin:"0 auto 14px", boxShadow:"0 4px 16px rgba(48,102,190,.3)" }}>🌿</div>
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:11, color:"#9AAAC0",
            letterSpacing:2, textTransform:"uppercase", marginBottom:4 }}>Instituto de</div>
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:26, fontWeight:700, color:"#3066BE", lineHeight:1 }}>
            Reflexologia
          </div>
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:11, color:"#9AAAC0", marginBottom:2 }}>
            & Pesquisa
          </div>
          <div style={{ width:28, height:2, background:"#3066BE", borderRadius:99, margin:"8px auto 0" }} />
        </div>

        <div style={{ fontFamily:"'Playfair Display',serif", fontSize:17, fontWeight:600,
          color:"#1A2540", marginBottom:20, textAlign:"center" }}>
          Acesse sua conta
        </div>

        {error && (
          <div style={{ background:"#FEF2F2", border:"1.5px solid #FECACA", borderRadius:10,
            padding:"10px 14px", fontSize:13, color:"#D43030", marginBottom:16, fontWeight:600 }}>
            ⚠ {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          {/* Email */}
          <div style={{ marginBottom:14 }}>
            <label style={{ display:"block", fontSize:11, color:"#6B7A99", fontWeight:600,
              letterSpacing:.8, textTransform:"uppercase", marginBottom:6 }}>E-mail</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="seu@email.com" autoComplete="email" autoFocus
              style={{ width:"100%", background:"#F7F9FC", border:"1.5px solid #DDE3EE",
                borderRadius:10, padding:"11px 14px", color:"#1A2540", fontSize:14,
                outline:"none", fontFamily:"'DM Sans',sans-serif", boxSizing:"border-box" }}
              onFocus={e => e.target.style.borderColor="#3066BE"}
              onBlur={e => e.target.style.borderColor="#DDE3EE"}
            />
          </div>

          {/* Senha */}
          <div style={{ marginBottom:22 }}>
            <label style={{ display:"block", fontSize:11, color:"#6B7A99", fontWeight:600,
              letterSpacing:.8, textTransform:"uppercase", marginBottom:6 }}>Senha</label>
            <div style={{ position:"relative" }}>
              <input
                type={showPwd ? "text" : "password"} value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••" autoComplete="current-password"
                style={{ width:"100%", background:"#F7F9FC", border:"1.5px solid #DDE3EE",
                  borderRadius:10, padding:"11px 44px 11px 14px", color:"#1A2540", fontSize:14,
                  outline:"none", fontFamily:"'DM Sans',sans-serif", boxSizing:"border-box" }}
                onFocus={e => e.target.style.borderColor="#3066BE"}
                onBlur={e => e.target.style.borderColor="#DDE3EE"}
              />
              <button type="button" onClick={() => setShowPwd(v => !v)}
                style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)",
                  background:"transparent", border:"none", color:"#9AAAC0", cursor:"pointer", fontSize:16 }}>
                {showPwd ? "🙈" : "👁"}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading}
            style={{ width:"100%", background: loading ? "#9AAAC0" : "linear-gradient(135deg,#3066BE,#1A52AA)",
              border:"none", borderRadius:11, padding:"13px 0", color:"#fff", fontSize:15,
              fontWeight:700, cursor: loading ? "default" : "pointer",
              fontFamily:"'DM Sans',sans-serif", boxShadow: loading ? "none" : "0 4px 14px rgba(48,102,190,.3)",
              transition:"all .2s" }}>
            {loading ? "Entrando…" : "Entrar"}
          </button>
        </form>

        <p style={{ textAlign:"center", fontSize:11, color:"#9AAAC0", marginTop:20 }}>
          IOR Gestão Pro · Sistema seguro
        </p>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=DM+Sans:wght@400;500;600;700&display=swap');
        @keyframes up { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        * { box-sizing: border-box; }
      `}</style>
    </div>
  );
}
