import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase.js";

const TYPE_C   = {Bug:"#D43030",Feature:"#3066BE",Dúvida:"#6B7A99",Urgente:"#C07700"};
const STATUS_C = {Aberto:"#C07700","Em andamento":"#3066BE",Resolvido:"#1E8A4C"};

function Badge({color,children}){
  return(
    <span style={{display:"inline-flex",alignItems:"center",background:color+"18",color,border:`1.5px solid ${color}44`,borderRadius:99,padding:"2px 9px",fontSize:11,fontWeight:700,fontFamily:"DM Sans"}}>
      {children}
    </span>
  );
}

export default function DevPage({user,signOut}){
  const[tickets,setTickets]   = useState([]);
  const[loading,setLoading]   = useState(true);
  const[filter,setFilter]     = useState("Todos");
  const[responding,setResp]   = useState(null);
  const[respText,setRespText] = useState("");
  const[saving,setSaving]     = useState(false);

  useEffect(()=>{
    supabase.from("support_tickets").select("*").order("created_at",{ascending:false})
      .then(({data})=>{setTickets(data||[]);setLoading(false);});
  },[]);

  async function respond(t){
    if(!respText.trim()) return;
    setSaving(true);
    const{data}=await supabase.from("support_tickets")
      .update({dev_response:respText,status:"Resolvido",responded_at:new Date().toISOString()})
      .eq("id",t.id).select().single();
    if(data) setTickets(ts=>ts.map(x=>x.id===t.id?data:x));
    setResp(null);setRespText("");setSaving(false);
  }

  async function setStatus(t,status){
    const{data}=await supabase.from("support_tickets").update({status}).eq("id",t.id).select().single();
    if(data) setTickets(ts=>ts.map(x=>x.id===t.id?data:x));
  }

  const all = tickets;
  const shown = filter==="Todos" ? all : all.filter(t=>t.status===filter);
  const counts = {
    Aberto:       all.filter(t=>t.status==="Aberto").length,
    "Em andamento":all.filter(t=>t.status==="Em andamento").length,
    Resolvido:    all.filter(t=>t.status==="Resolvido").length,
  };

  return(
    <div style={{minHeight:"100vh",background:"#F4F7FB",fontFamily:"'DM Sans',sans-serif"}}>
      {/* Header */}
      <div style={{background:"#fff",borderBottom:"1.5px solid #E5EAF3",padding:"14px 24px",display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:100}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:38,height:38,borderRadius:10,background:"linear-gradient(135deg,#3066BE,#1A52AA)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>🛠</div>
          <div>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:17,fontWeight:700,color:"#1A2540"}}>IOR · Dev Panel</div>
            <div style={{fontSize:11,color:"#6B7A99"}}>{user?.email}</div>
          </div>
        </div>
        <button onClick={signOut} style={{background:"#FEF2F2",border:"1.5px solid #FECACA",borderRadius:8,padding:"6px 14px",fontSize:12,color:"#D43030",cursor:"pointer",fontWeight:700}}>Sair</button>
      </div>

      <div style={{maxWidth:800,margin:"0 auto",padding:"24px 16px"}}>
        {/* Resumo */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:20}}>
          {[["🔴","Aberto","#C07700"],["🔵","Em andamento","#3066BE"],["✅","Resolvido","#1E8A4C"]].map(([ic,s,c])=>(
            <div key={s} onClick={()=>setFilter(filter===s?"Todos":s)}
              style={{background:"#fff",borderRadius:12,padding:"14px",border:`2px solid ${filter===s?c:"#E5EAF3"}`,cursor:"pointer",textAlign:"center",boxShadow:"0 2px 8px rgba(0,0,0,.05)"}}>
              <div style={{fontSize:22}}>{ic}</div>
              <div style={{fontSize:24,fontWeight:700,color:c}}>{counts[s]||0}</div>
              <div style={{fontSize:12,color:"#6B7A99",marginTop:2}}>{s}</div>
            </div>
          ))}
        </div>

        {/* Filtro ativo */}
        {filter!=="Todos"&&(
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
            <span style={{fontSize:13,color:"#6B7A99"}}>Filtrando:</span>
            <Badge color={STATUS_C[filter]||"#6B7A99"}>{filter}</Badge>
            <button onClick={()=>setFilter("Todos")} style={{background:"none",border:"none",color:"#9AAAC0",cursor:"pointer",fontSize:12}}>limpar ×</button>
          </div>
        )}

        {/* Lista de tickets */}
        {loading ? (
          <div style={{textAlign:"center",padding:"48px 0",color:"#6B7A99"}}>Carregando tickets…</div>
        ) : shown.length===0 ? (
          <div style={{textAlign:"center",padding:"48px 0",color:"#6B7A99",fontSize:14}}>
            {filter==="Todos" ? "Nenhum ticket ainda. 🎉" : `Nenhum ticket "${filter}".`}
          </div>
        ) : (
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {shown.map(t=>(
              <div key={t.id} style={{background:"#fff",borderRadius:14,border:`1.5px solid ${t.status==="Aberto"?"#FDE68A":t.status==="Resolvido"?"#BBF7D0":"#C7D7F5"}`,boxShadow:"0 2px 8px rgba(0,0,0,.06)",overflow:"hidden"}}>
                <div style={{padding:"14px 16px"}}>
                  {/* Header do ticket */}
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8,flexWrap:"wrap",marginBottom:8}}>
                    <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}>
                      <Badge color={TYPE_C[t.type]||"#6B7A99"}>{t.type}</Badge>
                      <Badge color={STATUS_C[t.status]||"#6B7A99"}>{t.status}</Badge>
                      <span style={{fontWeight:700,fontSize:14,color:"#1A2540"}}>{t.title}</span>
                    </div>
                    <span style={{fontSize:11,color:"#9AAAC0",flexShrink:0}}>
                      {new Date(t.created_at).toLocaleDateString("pt-BR",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"})}
                    </span>
                  </div>

                  {/* Cliente */}
                  <div style={{fontSize:12,color:"#6B7A99",marginBottom:8}}>
                    👤 <strong>{t.from_name}</strong> · {t.from_email}
                    {t.tenant_id&&t.tenant_id!=="default"&&<span> · tenant: {t.tenant_id}</span>}
                  </div>

                  {/* Mensagem */}
                  <div style={{fontSize:13,color:"#1A2540",lineHeight:1.6,background:"#F7F9FC",borderRadius:8,padding:"10px 12px",marginBottom:t.dev_response?8:0}}>
                    {t.message}
                  </div>

                  {/* Resposta do dev */}
                  {t.dev_response&&(
                    <div style={{fontSize:13,color:"#3066BE",background:"#EEF4FF",borderRadius:8,padding:"10px 12px",borderLeft:"3px solid #3066BE",marginTop:8}}>
                      <div style={{fontSize:10,fontWeight:700,color:"#3066BE",marginBottom:4,textTransform:"uppercase"}}>Sua resposta</div>
                      {t.dev_response}
                    </div>
                  )}

                  {/* Formulário de resposta */}
                  {responding?.id===t.id&&(
                    <div style={{marginTop:12,paddingTop:12,borderTop:"1px solid #E5EAF3"}}>
                      <textarea
                        value={respText}
                        onChange={e=>setRespText(e.target.value)}
                        placeholder="Escreva sua resposta para o cliente…"
                        style={{width:"100%",minHeight:80,background:"#F7F9FC",border:"1.5px solid #3066BE",borderRadius:9,padding:"10px 12px",fontSize:13,fontFamily:"DM Sans",resize:"vertical",boxSizing:"border-box",color:"#1A2540",marginBottom:8}}
                      />
                      <div style={{display:"flex",gap:8}}>
                        <button onClick={()=>respond(t)} disabled={saving}
                          style={{background:"linear-gradient(135deg,#3066BE,#1A52AA)",border:"none",borderRadius:9,padding:"9px 18px",color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"DM Sans"}}>
                          {saving?"Enviando…":"Enviar resposta"}
                        </button>
                        <button onClick={()=>{setResp(null);setRespText("");}}
                          style={{background:"#F7F9FC",border:"1.5px solid #DDE3EE",borderRadius:9,padding:"9px 14px",color:"#6B7A99",fontSize:13,cursor:"pointer",fontFamily:"DM Sans"}}>
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Ações */}
                {responding?.id!==t.id&&(
                  <div style={{borderTop:"1px solid #E5EAF3",padding:"10px 16px",display:"flex",gap:8,flexWrap:"wrap",background:"#FAFBFD"}}>
                    {t.status==="Aberto"&&(
                      <button onClick={()=>setStatus(t,"Em andamento")}
                        style={{background:"#EEF4FF",border:"1.5px solid #C7D7F5",borderRadius:7,padding:"5px 10px",fontSize:11,color:"#3066BE",cursor:"pointer",fontWeight:700}}>
                        Em andamento
                      </button>
                    )}
                    {t.status!=="Resolvido"&&(
                      <button onClick={()=>setStatus(t,"Resolvido")}
                        style={{background:"#F0FDF4",border:"1.5px solid #BBF7D0",borderRadius:7,padding:"5px 10px",fontSize:11,color:"#1E8A4C",cursor:"pointer",fontWeight:700}}>
                        Marcar resolvido
                      </button>
                    )}
                    <button onClick={()=>{setResp(t);setRespText(t.dev_response||"");}}
                      style={{background:"#F7F9FC",border:"1.5px solid #DDE3EE",borderRadius:7,padding:"5px 10px",fontSize:11,color:"#6B7A99",cursor:"pointer",fontWeight:700}}>
                      {t.dev_response?"Editar resposta":"💬 Responder"}
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
