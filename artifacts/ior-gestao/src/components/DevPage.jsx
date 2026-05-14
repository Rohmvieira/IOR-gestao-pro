import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase.js";

const TYPE_C   = {Bug:"#D43030",Feature:"#3066BE","Dúvida":"#6B7A99",Urgente:"#C07700"};
const STATUS_C = {Aberto:"#C07700","Em andamento":"#3066BE",Resolvido:"#1E8A4C"};

function Badge({color,children}){
  return <span style={{display:"inline-flex",alignItems:"center",background:color+"18",color,border:`1.5px solid ${color}44`,borderRadius:99,padding:"2px 9px",fontSize:11,fontWeight:700,fontFamily:"DM Sans",whiteSpace:"nowrap"}}>{children}</span>;
}

export default function DevPage({user,signOut}){
  const[tab,setTab]         = useState("dash");
  const[tickets,setTickets] = useState([]);
  const[auditLogs,setAudit] = useState([]);
  const[loading,setLoading] = useState(true);
  const[filter,setFilter]   = useState("Todos");
  const[resp,setResp]       = useState(null);
  const[respText,setRespText] = useState("");
  const[saving,setSaving]   = useState(false);
  const[refreshing,setRefreshing] = useState(false);

  async function loadAll(){
    setRefreshing(true);
    const [tickRes, auditRes] = await Promise.allSettled([
      supabase.from("support_tickets").select("*").order("created_at",{ascending:false}),
      supabase.from("audit_logs").select("*").order("created_at",{ascending:false}).limit(20),
    ]);
    if(tickRes.status==="fulfilled")  setTickets(tickRes.value.data||[]);
    if(auditRes.status==="fulfilled")  setAudit(auditRes.value.data||[]);
    setLoading(false);setRefreshing(false);
  }

  useEffect(()=>{ loadAll(); },[]);

  // Auto-refresh a cada 60s
  useEffect(()=>{
    const t = setInterval(loadAll, 60000);
    return ()=>clearInterval(t);
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

  const shown  = filter==="Todos" ? tickets : tickets.filter(t=>t.status===filter);
  const counts = {
    Aberto: tickets.filter(t=>t.status==="Aberto").length,
    "Em andamento": tickets.filter(t=>t.status==="Em andamento").length,
    Resolvido: tickets.filter(t=>t.status==="Resolvido").length,
  };
  const openBugs    = tickets.filter(t=>t.type==="Bug"&&t.status!=="Resolvido").length;
  const urgentOpen  = tickets.filter(t=>t.type==="Urgente"&&t.status!=="Resolvido").length;

  const TABS = [{id:"dash",lbl:"📊 Dashboard"},{id:"tickets",lbl:"🎫 Tickets"},{id:"logs",lbl:"📋 Logs"}];

  return(
    <div style={{minHeight:"100vh",background:"#F4F7FB",fontFamily:"'DM Sans',sans-serif"}}>
      {/* Header */}
      <div style={{background:"#fff",borderBottom:"1.5px solid #E5EAF3",padding:"12px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:100,boxShadow:"0 2px 8px rgba(0,0,0,.06)"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:36,height:36,borderRadius:10,background:"linear-gradient(135deg,#3066BE,#1A52AA)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,flexShrink:0}}>🛠</div>
          <div>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:15,fontWeight:700,color:"#1A2540",lineHeight:1.2}}>IOR · Dev Panel</div>
            <div style={{fontSize:10,color:"#9AAAC0"}}>{user?.email}</div>
          </div>
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <button onClick={loadAll} disabled={refreshing}
            style={{background:"#F7F9FC",border:"1.5px solid #DDE3EE",borderRadius:8,padding:"6px 10px",fontSize:12,color:"#6B7A99",cursor:"pointer",fontWeight:600}}>
            {refreshing?"⏳":"🔄"}
          </button>
          <button onClick={()=>signOut?.()} style={{background:"#FEF2F2",border:"1.5px solid #FECACA",borderRadius:8,padding:"6px 12px",fontSize:12,color:"#D43030",cursor:"pointer",fontWeight:700}}>
            Sair
          </button>
        </div>
      </div>

      {/* Alertas urgentes */}
      {(urgentOpen>0||openBugs>0)&&(
        <div style={{background:"#FEF9C3",borderBottom:"1.5px solid #FDE68A",padding:"10px 16px",display:"flex",gap:12,flexWrap:"wrap",alignItems:"center"}}>
          <span style={{fontSize:16}}>⚠️</span>
          {urgentOpen>0&&<span style={{fontSize:12,fontWeight:700,color:"#92400E"}}>{urgentOpen} ticket(s) URGENTE aberto</span>}
          {openBugs>0&&<span style={{fontSize:12,fontWeight:700,color:"#D43030"}}>{openBugs} bug(s) não resolvido</span>}
          <button onClick={()=>{setTab("tickets");setFilter("Aberto");}} style={{marginLeft:"auto",background:"#F59E0B",border:"none",borderRadius:7,padding:"4px 10px",fontSize:11,color:"#fff",cursor:"pointer",fontWeight:700}}>
            Ver tickets
          </button>
        </div>
      )}

      {/* Tabs */}
      <div style={{background:"#fff",borderBottom:"1.5px solid #E5EAF3",padding:"0 16px",display:"flex",gap:4,overflowX:"auto"}}>
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)}
            style={{padding:"12px 14px",border:"none",background:"transparent",borderBottom:`2px solid ${tab===t.id?"#3066BE":"transparent"}`,color:tab===t.id?"#3066BE":"#9AAAC0",fontWeight:tab===t.id?700:400,fontSize:13,cursor:"pointer",fontFamily:"DM Sans",whiteSpace:"nowrap",transition:"all .15s"}}>
            {t.lbl}
            {t.id==="tickets"&&counts.Aberto>0&&<span style={{marginLeft:6,background:"#FEF2F2",color:"#D43030",borderRadius:99,padding:"1px 6px",fontSize:10,fontWeight:700}}>{counts.Aberto}</span>}
          </button>
        ))}
      </div>

      <div style={{maxWidth:700,margin:"0 auto",padding:"16px 12px"}}>

        {/* ── DASHBOARD TAB ── */}
        {tab==="dash"&&(
          <div>
            {loading?(
              <div style={{textAlign:"center",padding:"40px 0",color:"#9AAAC0"}}>Carregando dados…</div>
            ):(
              <>
                        {/* Tickets */
                <div style={{marginBottom:16}}>
                  <div style={{fontSize:11,fontWeight:700,color:"#9AAAC0",textTransform:"uppercase",letterSpacing:.5,marginBottom:10}}>Suporte</div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
                    {[["🔴","Aberto","#C07700"],["🔵","Em andamento","#3066BE"],["✅","Resolvido","#1E8A4C"]].map(([ic,s,c])=>(
                      <button key={s} onClick={()=>{setTab("tickets");setFilter(s);}}
                        style={{background:"#fff",borderRadius:12,padding:"12px 8px",border:`1.5px solid ${c}22`,cursor:"pointer",textAlign:"center",boxShadow:"0 2px 8px rgba(0,0,0,.04)"}}>
                        <div style={{fontSize:18}}>{ic}</div>
                        <div style={{fontSize:20,fontWeight:700,color:c}}>{counts[s]||0}</div>
                        <div style={{fontSize:10,color:"#9AAAC0",marginTop:2,lineHeight:1.3}}>{s}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Atividade recente (audit logs) */}
                {auditLogs.length>0&&(
                  <div>
                    <div style={{fontSize:11,fontWeight:700,color:"#9AAAC0",textTransform:"uppercase",letterSpacing:.5,marginBottom:10}}>Atividade recente</div>
                    <div style={{background:"#fff",borderRadius:12,border:"1.5px solid #E5EAF3",overflow:"hidden"}}>
                      {auditLogs.slice(0,8).map((log,i)=>(
                        <div key={log.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 14px",borderBottom:i<7?"1px solid #F0F2F7":"none",gap:8}}>
                          <div style={{display:"flex",alignItems:"center",gap:8,minWidth:0}}>
                            <span style={{fontSize:12,flexShrink:0,width:20,textAlign:"center"}}>{log.operation==="INSERT"?"➕":log.operation==="DELETE"?"🗑":"✏️"}</span>
                            <div style={{minWidth:0}}>
                              <div style={{fontSize:12,fontWeight:600,color:"#1A2540",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{log.table_name}</div>
                              <div style={{fontSize:10,color:"#9AAAC0"}}>{log.operation}</div>
                            </div>
                          </div>
                          <div style={{fontSize:10,color:"#C0C8D8",flexShrink:0}}>
                            {new Date(log.created_at).toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"})}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ── TICKETS TAB ── */}
        {tab==="tickets"&&(
          <div>
            {/* Filtros */}
            <div style={{display:"flex",gap:6,marginBottom:12,flexWrap:"wrap"}}>
              {["Todos","Aberto","Em andamento","Resolvido"].map(f=>(
                <button key={f} onClick={()=>setFilter(f)}
                  style={{background:filter===f?"#EEF4FF":"#fff",border:`1.5px solid ${filter===f?"#3066BE":"#DDE3EE"}`,borderRadius:99,padding:"5px 12px",fontSize:12,color:filter===f?"#3066BE":"#9AAAC0",cursor:"pointer",fontWeight:filter===f?700:400}}>
                  {f}{f!=="Todos"&&counts[f]!=null?` (${counts[f]||0})`:""}
                </button>
              ))}
            </div>

            {shown.length===0?(
              <div style={{textAlign:"center",padding:"40px 0",color:"#9AAAC0",fontSize:14}}>
                {filter==="Todos"?"Nenhum ticket ainda 🎉":`Nenhum ticket "${filter}"`}
              </div>
            ):(
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                {shown.map(t=>(
                  <div key={t.id} style={{background:"#fff",borderRadius:14,border:`1.5px solid ${t.status==="Aberto"?"#FDE68A":t.status==="Resolvido"?"#BBF7D0":"#C7D7F5"}`,overflow:"hidden"}}>
                    <div style={{padding:"14px 14px 10px"}}>
                      <div style={{display:"flex",flexWrap:"wrap",gap:5,alignItems:"center",marginBottom:6}}>
                        <Badge color={TYPE_C[t.type]||"#9AAAC0"}>{t.type}</Badge>
                        <Badge color={STATUS_C[t.status]||"#9AAAC0"}>{t.status}</Badge>
                      </div>
                      <div style={{fontWeight:700,fontSize:14,color:"#1A2540",marginBottom:5}}>{t.title}</div>
                      <div style={{fontSize:11,color:"#9AAAC0",marginBottom:8}}>👤 {t.from_name} · {t.from_email}</div>
                      <div style={{fontSize:13,color:"#1A2540",lineHeight:1.6,background:"#F7F9FC",borderRadius:8,padding:"10px 12px"}}>{t.message}</div>
                      {t.dev_response&&(
                        <div style={{fontSize:13,color:"#3066BE",background:"#EEF4FF",borderRadius:8,padding:"10px 12px",borderLeft:"3px solid #3066BE",marginTop:8}}>
                          <div style={{fontSize:10,fontWeight:700,color:"#3066BE",marginBottom:3,textTransform:"uppercase"}}>Sua resposta</div>
                          {t.dev_response}
                        </div>
                      )}
                      <div style={{fontSize:10,color:"#C0C8D8",marginTop:8,textAlign:"right"}}>
                        {new Date(t.created_at).toLocaleDateString("pt-BR",{day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"})}
                      </div>
                    </div>
                    {resp?.id===t.id&&(
                      <div style={{padding:"0 14px 14px"}}>
                        <textarea value={respText} onChange={e=>setRespText(e.target.value)} placeholder="Escreva sua resposta…"
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
                    {resp?.id!==t.id&&(
                      <div style={{borderTop:"1px solid #F0F2F7",padding:"10px 14px",display:"flex",gap:6,flexWrap:"wrap",background:"#FAFBFD"}}>
                        {t.status==="Aberto"&&<button onClick={()=>doStatus(t,"Em andamento")} style={{background:"#EEF4FF",border:"1.5px solid #C7D7F5",borderRadius:7,padding:"5px 10px",fontSize:11,color:"#3066BE",cursor:"pointer",fontWeight:700}}>Em andamento</button>}
                        {t.status!=="Resolvido"&&<button onClick={()=>doStatus(t,"Resolvido")} style={{background:"#F0FDF4",border:"1.5px solid #BBF7D0",borderRadius:7,padding:"5px 10px",fontSize:11,color:"#1E8A4C",cursor:"pointer",fontWeight:700}}>Resolver</button>}
                        <button onClick={()=>{setResp(t);setRespText(t.dev_response||"");}} style={{background:"#F7F9FC",border:"1.5px solid #DDE3EE",borderRadius:7,padding:"5px 10px",fontSize:11,color:"#9AAAC0",cursor:"pointer",fontWeight:700}}>
                          {t.dev_response?"✏️ Editar":"💬 Responder"}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── LOGS TAB ── */}
        {tab==="logs"&&(
          <div>
            <div style={{fontSize:11,fontWeight:700,color:"#9AAAC0",textTransform:"uppercase",letterSpacing:.5,marginBottom:12}}>
              Últimas 20 operações no banco
            </div>
            {auditLogs.length===0?(
              <div style={{textAlign:"center",padding:"40px 0",color:"#9AAAC0",fontSize:14}}>Nenhum log ainda.</div>
            ):(
              <div style={{background:"#fff",borderRadius:12,border:"1.5px solid #E5EAF3",overflow:"hidden"}}>
                {auditLogs.map((log,i)=>(
                  <div key={log.id} style={{display:"flex",alignItems:"flex-start",gap:10,padding:"12px 14px",borderBottom:i<auditLogs.length-1?"1px solid #F0F2F7":"none"}}>
                    <span style={{fontSize:14,flexShrink:0,marginTop:1}}>{log.operation==="INSERT"?"➕":log.operation==="DELETE"?"🗑️":"✏️"}</span>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                        <span style={{fontSize:13,fontWeight:600,color:"#1A2540"}}>{log.table_name}</span>
                        <span style={{fontSize:10,color:"#C0C8D8",flexShrink:0}}>{new Date(log.created_at).toLocaleString("pt-BR",{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"})}</span>
                      </div>
                      <div style={{display:"flex",gap:6,marginTop:3,flexWrap:"wrap"}}>
                        <Badge color={log.operation==="INSERT"?"#1E8A4C":log.operation==="DELETE"?"#D43030":"#3066BE"}>{log.operation}</Badge>
                        {log.record_id&&<span style={{fontSize:10,color:"#9AAAC0"}}>ID: {log.record_id}</span>}
                        {log.tenant_id&&<span style={{fontSize:10,color:"#9AAAC0"}}>tenant: {log.tenant_id}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
