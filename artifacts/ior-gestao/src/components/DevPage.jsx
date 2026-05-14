import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase.js";

const TYPE_C   = {Bug:"#D43030",Feature:"#3066BE","Dúvida":"#6B7A99",Urgente:"#C07700"};
const STATUS_C = {Aberto:"#C07700","Em andamento":"#3066BE",Resolvido:"#1E8A4C"};

function Badge({color,children}){
  return <span style={{display:"inline-flex",alignItems:"center",background:color+"18",color,border:`1.5px solid ${color}44`,borderRadius:99,padding:"2px 9px",fontSize:11,fontWeight:700,fontFamily:"DM Sans",whiteSpace:"nowrap"}}>{children}</span>;
}

export default function DevPage({user,signOut}){
  const[tickets,setTickets] = useState([]);
  const[loading,setLoading] = useState(true);
  const[filter,setFilter]   = useState("Todos");
  const[resp,setResp]       = useState(null);
  const[respText,setRespText] = useState("");
  const[saving,setSaving]   = useState(false);

  useEffect(()=>{
    supabase.from("support_tickets").select("*").order("created_at",{ascending:false})
      .then(({data})=>{setTickets(data||[]);setLoading(false);});
  },[]);

  async function doRespond(t){
    if(!respText.trim())return;
    setSaving(true);
    const{data}=await supabase.from("support_tickets")
      .update({dev_response:respText,status:"Resolvido",responded_at:new Date().toISOString()})
      .eq("id",t.id).select().single();
    if(data)setTickets(ts=>ts.map(x=>x.id===t.id?data:x));
    setResp(null);setRespText("");setSaving(false);
  }

  async function doStatus(t,status){
    const{data}=await supabase.from("support_tickets").update({status}).eq("id",t.id).select().single();
    if(data)setTickets(ts=>ts.map(x=>x.id===t.id?data:x));
  }

  const shown = filter==="Todos" ? tickets : tickets.filter(t=>t.status===filter);
  const counts = {
    Aberto: tickets.filter(t=>t.status==="Aberto").length,
    "Em andamento": tickets.filter(t=>t.status==="Em andamento").length,
    Resolvido: tickets.filter(t=>t.status==="Resolvido").length,
  };

  return(
    <div style={{minHeight:"100vh",background:"#F4F7FB",fontFamily:"'DM Sans',sans-serif"}}>
      {/* Header fixo */}
      <div style={{background:"#fff",borderBottom:"1.5px solid #E5EAF3",padding:"12px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:100,boxShadow:"0 2px 8px rgba(0,0,0,.06)"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:36,height:36,borderRadius:10,background:"linear-gradient(135deg,#3066BE,#1A52AA)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,flexShrink:0}}>🛠</div>
          <div>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:15,fontWeight:700,color:"#1A2540",lineHeight:1.2}}>Dev Panel</div>
            <div style={{fontSize:10,color:"#9AAAC0",marginTop:1}}>{user?.email}</div>
          </div>
        </div>
        <button onClick={()=>signOut?.()} style={{background:"#FEF2F2",border:"1.5px solid #FECACA",borderRadius:8,padding:"6px 12px",fontSize:12,color:"#D43030",cursor:"pointer",fontWeight:700,whiteSpace:"nowrap"}}>
          Sair
        </button>
      </div>

      <div style={{maxWidth:640,margin:"0 auto",padding:"16px 12px"}}>
        {/* Cards de resumo */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:16}}>
          {[["🔴","Aberto","#C07700"],["🔵","Em andamento","#3066BE"],["✅","Resolvido","#1E8A4C"]].map(([ic,s,c])=>(
            <button key={s} onClick={()=>setFilter(filter===s?"Todos":s)}
              style={{background:"#fff",borderRadius:12,padding:"12px 8px",border:`2px solid ${filter===s?c:"#E5EAF3"}`,cursor:"pointer",textAlign:"center",boxShadow:"0 2px 8px rgba(0,0,0,.04)",transition:"border .15s"}}>
              <div style={{fontSize:20}}>{ic}</div>
              <div style={{fontSize:22,fontWeight:700,color:c,lineHeight:1.1}}>{counts[s]||0}</div>
              <div style={{fontSize:10,color:"#9AAAC0",marginTop:2,lineHeight:1.3}}>{s}</div>
            </button>
          ))}
        </div>

        {/* Filtro ativo */}
        {filter!=="Todos"&&(
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
            <span style={{fontSize:12,color:"#9AAAC0"}}>Filtrando:</span>
            <Badge color={STATUS_C[filter]||"#9AAAC0"}>{filter}</Badge>
            <button onClick={()=>setFilter("Todos")} style={{background:"none",border:"none",color:"#9AAAC0",cursor:"pointer",fontSize:12,padding:0}}>× limpar</button>
          </div>
        )}

        {/* Lista */}
        {loading?(
          <div style={{textAlign:"center",padding:"48px 0",color:"#9AAAC0",fontSize:14}}>Carregando…</div>
        ):shown.length===0?(
          <div style={{textAlign:"center",padding:"48px 0",color:"#9AAAC0",fontSize:14}}>
            {filter==="Todos"?"Nenhum ticket ainda 🎉":`Nenhum ticket "${filter}"`}
          </div>
        ):(
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {shown.map(t=>(
              <div key={t.id} style={{background:"#fff",borderRadius:14,border:`1.5px solid ${t.status==="Aberto"?"#FDE68A":t.status==="Resolvido"?"#BBF7D0":"#C7D7F5"}`,overflow:"hidden",boxShadow:"0 2px 8px rgba(0,0,0,.05)"}}>
                <div style={{padding:"14px 14px 10px"}}>
                  {/* Badges + título */}
                  <div style={{display:"flex",flexWrap:"wrap",gap:5,alignItems:"center",marginBottom:6}}>
                    <Badge color={TYPE_C[t.type]||"#9AAAC0"}>{t.type}</Badge>
                    <Badge color={STATUS_C[t.status]||"#9AAAC0"}>{t.status}</Badge>
                  </div>
                  <div style={{fontWeight:700,fontSize:14,color:"#1A2540",marginBottom:6}}>{t.title}</div>
                  {/* Cliente */}
                  <div style={{fontSize:11,color:"#9AAAC0",marginBottom:8}}>
                    👤 {t.from_name} · {t.from_email}
                  </div>
                  {/* Mensagem */}
                  <div style={{fontSize:13,color:"#1A2540",lineHeight:1.6,background:"#F7F9FC",borderRadius:8,padding:"10px 12px"}}>
                    {t.message}
                  </div>
                  {/* Resposta do dev */}
                  {t.dev_response&&(
                    <div style={{fontSize:13,color:"#3066BE",background:"#EEF4FF",borderRadius:8,padding:"10px 12px",borderLeft:"3px solid #3066BE",marginTop:8}}>
                      <div style={{fontSize:10,fontWeight:700,color:"#3066BE",marginBottom:3,textTransform:"uppercase",letterSpacing:.5}}>Sua resposta</div>
                      {t.dev_response}
                    </div>
                  )}
                  {/* Data */}
                  <div style={{fontSize:10,color:"#C0C8D8",marginTop:8,textAlign:"right"}}>
                    {new Date(t.created_at).toLocaleDateString("pt-BR",{day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"})}
                  </div>
                </div>

                {/* Form de resposta */}
                {resp?.id===t.id&&(
                  <div style={{padding:"0 14px 14px"}}>
                    <textarea value={respText} onChange={e=>setRespText(e.target.value)}
                      placeholder="Escreva sua resposta para o cliente…"
                      style={{width:"100%",minHeight:80,background:"#F7F9FC",border:"1.5px solid #3066BE",borderRadius:9,padding:"10px 12px",fontSize:13,fontFamily:"DM Sans",resize:"vertical",boxSizing:"border-box",color:"#1A2540",marginBottom:8}}/>
                    <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                      <button onClick={()=>doRespond(t)} disabled={saving}
                        style={{flex:1,background:"linear-gradient(135deg,#3066BE,#1A52AA)",border:"none",borderRadius:9,padding:"10px 0",color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"DM Sans",minWidth:120}}>
                        {saving?"Enviando…":"Enviar resposta"}
                      </button>
                      <button onClick={()=>{setResp(null);setRespText("");}}
                        style={{background:"#F7F9FC",border:"1.5px solid #DDE3EE",borderRadius:9,padding:"10px 14px",color:"#9AAAC0",fontSize:13,cursor:"pointer",fontFamily:"DM Sans"}}>
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}

                {/* Ações */}
                {resp?.id!==t.id&&(
                  <div style={{borderTop:"1px solid #F0F2F7",padding:"10px 14px",display:"flex",gap:6,flexWrap:"wrap",background:"#FAFBFD"}}>
                    {t.status==="Aberto"&&(
                      <button onClick={()=>doStatus(t,"Em andamento")}
                        style={{background:"#EEF4FF",border:"1.5px solid #C7D7F5",borderRadius:7,padding:"5px 10px",fontSize:11,color:"#3066BE",cursor:"pointer",fontWeight:700}}>
                        Em andamento
                      </button>
                    )}
                    {t.status!=="Resolvido"&&(
                      <button onClick={()=>doStatus(t,"Resolvido")}
                        style={{background:"#F0FDF4",border:"1.5px solid #BBF7D0",borderRadius:7,padding:"5px 10px",fontSize:11,color:"#1E8A4C",cursor:"pointer",fontWeight:700}}>
                        Resolver
                      </button>
                    )}
                    <button onClick={()=>{setResp(t);setRespText(t.dev_response||"");}}
                      style={{background:"#F7F9FC",border:"1.5px solid #DDE3EE",borderRadius:7,padding:"5px 10px",fontSize:11,color:"#9AAAC0",cursor:"pointer",fontWeight:700}}>
                      {t.dev_response?"✏️ Editar":"💬 Responder"}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
