import { useState, useRef, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, Legend } from "recharts";
import { supabase, db } from "./lib/supabase.js";

/* ══════════════════════════════════════════════════
   EXPORTAÇÃO EXCEL — helpers reutilizáveis
══════════════════════════════════════════════════ */
async function exportXLSX(sheets, filename) {
  const XLSX = await import("xlsx");
  const wb = XLSX.utils.book_new();
  sheets.forEach(({ name, rows }) => {
    const ws = XLSX.utils.json_to_sheet(rows);
    const cols = Object.keys(rows[0] || {}).map(k => ({
      wch: Math.max(k.length, ...rows.map(r => String(r[k] || "").length)) + 2
    }));
    ws["!cols"] = cols;
    XLSX.utils.book_append_sheet(wb, ws, name.slice(0, 31));
  });
  XLSX.writeFile(wb, `${filename}_${new Date().toLocaleDateString("pt-BR").replace(/\//g,"-")}.xlsx`);
}

function BtnExport({ onClick, label = "📊 Exportar Excel" }) {
  const [exp, setExp] = useState(false);
  return <button onClick={async()=>{setExp(true);try{await onClick();}finally{setExp(false);}}} disabled={exp} style={{
    display:"flex", alignItems:"center", gap:6,
    background:"#F0FDF4", border:"1.5px solid #BBF7D0",
    borderRadius:9, padding:"7px 13px", color:"#166534",
    fontSize:12, fontWeight:700, cursor:"pointer",
    fontFamily:"DM Sans", whiteSpace:"nowrap",
    boxShadow:"0 1px 4px rgba(0,0,0,.06)", transition:"all .15s",
  }}
    onMouseEnter={e=>e.currentTarget.style.background="#DCFCE7"}
    onMouseLeave={e=>e.currentTarget.style.background="#F0FDF4"}
  >{label}</button>;
}

/* ══════════════════════════════════════════════════
   GLOBAL STYLES
══════════════════════════════════════════════════ */
function GS() {
  return <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;0,900;1,400&family=DM+Sans:wght@300;400;500;600;700&display=swap');
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    ::-webkit-scrollbar{width:4px;height:4px}
    ::-webkit-scrollbar-thumb{background:rgba(61,133,200,.25);border-radius:99px}
    :root{
      --bg:#F4F7FB;--surf:#FFFFFF;
      --b:rgba(61,133,200,.14);
      --bl:#3066BE;--pu:#6244B8;--te:#2B9E98;--am:#C07700;--rd:#D43030;--gn:#1E8A4C;
      --tx:#1A2540;--mu:#6B7A99;--mu2:#9AAAC0;
      --shadow:0 2px 14px rgba(30,40,80,.09);--shadow-md:0 4px 24px rgba(30,40,80,.13);
      --bnh:60px;
    }
    @keyframes up  {from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
    @keyframes sr  {from{opacity:0;transform:translateX(-10px)}to{opacity:1;transform:translateX(0)}}
    @keyframes su  {from{opacity:0;transform:translateY(100%)}to{opacity:1;transform:translateY(0)}}
    body{background:var(--bg);font-family:'DM Sans',sans-serif;color:var(--tx)}
    .g2{display:grid;grid-template-columns:1fr 1fr;gap:0 14px}
    .gdash{display:grid;grid-template-columns:1.5fr 1fr;gap:16px;margin-bottom:16px}
    .gwa{display:grid;grid-template-columns:1fr 360px;gap:14px}
    .tw{overflow-x:auto;-webkit-overflow-scrolling:touch}
    .sd{background:#FFFFFF;border-right:1px solid #E5EAF3;display:flex;flex-direction:column;flex-shrink:0;transition:width .25s;overflow:hidden;box-shadow:2px 0 12px rgba(30,40,80,.06)}
    .sd.e{width:220px;padding:22px 13px}.sd.c{width:58px;padding:16px 8px}
    .dr{position:fixed;top:0;left:0;height:100vh;width:248px;background:#fff;border-right:1px solid #E5EAF3;z-index:200;display:flex;flex-direction:column;padding:22px 13px;transform:translateX(-100%);transition:transform .28s cubic-bezier(.4,0,.2,1);box-shadow:4px 0 24px rgba(30,40,80,.12)}
    .dr.op{transform:translateX(0)}
    .ov{position:fixed;inset:0;background:rgba(20,30,60,.35);z-index:199;opacity:0;pointer-events:none;transition:opacity .28s}
    .ov.op{opacity:1;pointer-events:all}
    .bn{position:fixed;bottom:0;left:0;right:0;height:var(--bnh);background:#fff;border-top:1px solid #E5EAF3;display:none;align-items:stretch;z-index:150;padding-bottom:env(safe-area-inset-bottom,0px);box-shadow:0 -2px 12px rgba(30,40,80,.08)}
    .bni{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;cursor:pointer;background:transparent;border:none;color:var(--mu);transition:color .15s}
    .bni.a{color:var(--bl)}
    .mob{display:none!important}.dsk{display:flex!important}
    .notif-drop{position:fixed;top:60px;left:16px;right:16px;width:auto;max-width:360px;background:#fff;border:1px solid var(--b);border-radius:14px;box-shadow:0 8px 32px rgba(20,30,60,.18);z-index:500;max-height:420px;overflow-y:auto;animation:su .2s ease}
    @media(max-width:768px){
      .g2,.gdash,.gwa{grid-template-columns:1fr!important}
      .mob{display:flex!important}.dsk{display:none!important}
      .bn{display:flex!important}.sd{display:none!important}
      .mc{padding:13px!important;padding-bottom:calc(var(--bnh)+10px)!important}
      .notif-drop{left:0;right:auto;width:calc(100vw - 32px);max-width:290px}
    }
  `}</style>;
}

/* ══════════════════════════════════════════════════
   CONSTANTS
══════════════════════════════════════════════════ */
const STYPES   = ["Curso","Workshop","Produto","Atendimento"];
const SCRM     = ["Leads Frios","Negociação","Espera","Fechado","Perdido"];
const PSTG     = ["Nota Fiscal","Embalar","Pronto","Enviado","Fechado"];
const CTYPES   = ["Curso","Workshop","Estágio","Ambulatório"];
const MODS     = ["Presencial","Online","Híbrido"];
const PRIOS    = ["Alta","Média","Baixa"];
const SRCS     = ["Instagram","WhatsApp","Indicação","Site","Google","Facebook","Evento"];
const PAYS     = ["PIX","Cartão Crédito","Cartão Débito","Boleto","Transferência"];
const LOSSES   = ["Preço alto","Sem tempo","Escolheu concorrente","Sem resposta","Desistiu"];
const TEAM     = ["Ana Lima","Carla Reis","Coord. Pesquisa","Secretaria","Financeiro","Você"];
const MODULES  = ["Dashboard","CRM Leads","CRM Produtos","Alunos","Cursos","Financeiro","Checklist","WA Lembretes","Pedagógico","Permissões","Social Media"];
const ROLES    = ["Proprietária","Financeiro","Secretaria","Professor(a)","Assistente","Desenvolvedor"];
const TYPE_C   = {"Bug":"var(--rd)","Feature":"var(--bl)","Dúvida":"var(--mu)","Urgente":"var(--am)"};
const STATUS_C = {"Aberto":"var(--am)","Em andamento":"var(--bl)","Resolvido":"var(--gn)"};
const MOPT     = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
const MNS      = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const SOCIAL_CATS = ["Reflexologia","Bem-estar","Curso/Workshop","Depoimento","Dica","Evento","Bastidores"];
const SCL  = {"Leads Frios":"#9AAAC0","Negociação":"#C07700","Espera":"#3066BE","Fechado":"#1E8A4C","Perdido":"#D43030"};
const PCL  = {"Nota Fiscal":"#9AAAC0","Embalar":"#C07700","Pronto":"#2B9E98","Enviado":"#3066BE","Fechado":"#1E8A4C"};
const TCL  = {"Curso":"#3066BE","Workshop":"#6244B8","Produto":"#2B9E98","Atendimento":"#C07700"};
const KCL  = {"Curso":"#3066BE","Workshop":"#6244B8","Estágio":"#2B9E98","Ambulatório":"#C07700"};
const IPERMS_INIT = {
  "Proprietária": MODULES.reduce((a,m)=>({...a,[m]:true}),{}),
  "Financeiro":   MODULES.reduce((a,m)=>({...a,[m]:["Financeiro","Dashboard"].includes(m)}),{}),
  "Secretaria":   MODULES.reduce((a,m)=>({...a,[m]:["Dashboard","Alunos","Cursos","Checklist","WA Lembretes"].includes(m)}),{}),
  "Professor(a)": MODULES.reduce((a,m)=>({...a,[m]:["Dashboard","Alunos","Cursos","Checklist","Pedagógico"].includes(m)}),{}),
  "Assistente":   MODULES.reduce((a,m)=>({...a,[m]:["Dashboard","Alunos","Cursos"].includes(m)}),{}),
};

/* ══════════════════════════════════════════════════
   SEED DATA — REMOVIDO (dados ficam no banco)
   Use o endpoint POST /api/seed para dados de demo
══════════════════════════════════════════════════ */

/* ══════════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════════ */
function readFile(file){return new Promise(res=>{const r=new FileReader();r.onload=e=>res({name:file.name,type:file.type,data:e.target.result});r.readAsDataURL(file);});}

// Format YYYY-MM-DD → DD/MM/YYYY  |  YYYY-MM → MM/YYYY
function fmtDate(d){
  if(!d)return"";
  const p=d.split("-");
  if(p.length===3)return`${p[2]}/${p[1]}/${p[0]}`;
  if(p.length===2)return`${p[1]}/${p[0]}`;
  return d;
}

function instDueDate(startMonth,idx,payDay){
  if(!startMonth)return null;
  const [y,m]=startMonth.split("-").map(Number);
  const base=new Date(y,m-1+idx,1);
  const day=payDay||1;
  return `${String(day).padStart(2,"0")}/${String(base.getMonth()+1).padStart(2,"0")}/${base.getFullYear()}`;
}

function isOverdue(student){
  if(student.pType==="avista") return !student.paid;
  if(student.pType==="parcelado"){
    if((student.paidMonths||[]).length>=(student.installments||0)) return false;
    if(!student.startMonth)return false;
    const now=new Date();
    const curIdx=(now.getFullYear()-parseInt(student.startMonth.slice(0,4)))*12+(now.getMonth()-(parseInt(student.startMonth.slice(5,7))-1));
    const ci=Math.max(0,Math.min(curIdx,student.installments-1));
    return !((student.paidMonths||[]).includes(ci));
  }
  return false;
}

function isPaid(student){
  if(student.pType==="avista") return student.paid;
  return (student.paidMonths||[]).length>=(student.installments||0);
}

function confirmedRevenue(students){
  return students.reduce((sum,s)=>{
    if(s.pType==="avista") return sum+(s.paid?(+s.totalValue||0):0);
    return sum+((s.paidMonths||[]).length*(+s.instValue||0));
  },0);
}

function itemAlert(deadline){
  if(!deadline)return null;
  const now=new Date();const dl=new Date(deadline);
  const days=Math.round((dl-now)/86400000);
  if(days<0)return{color:"var(--rd)",label:`${Math.abs(days)}d vencido`,sev:3};
  if(days<=7)return{color:"var(--rd)",label:`${days}d restantes`,sev:2};
  if(days<=30)return{color:"var(--am)",label:`${days}d restantes`,sev:1};
  return{color:"var(--gn)",label:`${days}d restantes`,sev:0};
}

/* ══════════════════════════════════════════════════
   MICRO COMPONENTS
══════════════════════════════════════════════════ */
function Chip({color="#9AAAC0",sm,children}){
  return <span style={{background:`${color}18`,color,border:`1px solid ${color}28`,borderRadius:99,padding:sm?"2px 8px":"3px 11px",fontSize:sm?10:11,fontWeight:600,letterSpacing:.3,whiteSpace:"nowrap"}}>{children}</span>;
}
function Dot({color,size=7}){return <span style={{display:"inline-block",width:size,height:size,borderRadius:"50%",background:color,flexShrink:0}}/>;}
function Lbl({children}){return <label style={{display:"block",fontSize:11,color:"var(--mu)",fontWeight:600,letterSpacing:.8,textTransform:"uppercase",marginBottom:6}}>{children}</label>;}
function Divr(){return <div style={{height:1,background:"var(--b)",margin:"11px 0"}}/>;}
function Av({letter,color="var(--bl)",size=38}){
  return <div style={{width:size,height:size,borderRadius:"50%",background:`${color}15`,border:`1.5px solid ${color}35`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"Playfair Display",fontSize:size*.42,fontWeight:700,color,flexShrink:0}}>{letter}</div>;
}
function SC({icon,label,value,color="var(--bl)",sub,delay=0}){
  return <div style={{background:"#fff",borderRadius:16,padding:"16px 18px",border:"1px solid var(--b)",flex:1,minWidth:130,boxShadow:"var(--shadow)",animation:`up .4s ease ${delay}s both`}}>
    <div style={{fontSize:19,marginBottom:9}}>{icon}</div>
    <div style={{fontFamily:"Playfair Display",fontSize:25,fontWeight:700,color,lineHeight:1}}>{value}</div>
    <div style={{fontSize:11,color:"var(--mu)",marginTop:4}}>{label}</div>
    {sub&&<div style={{fontSize:11,color,marginTop:3,fontWeight:600}}>{sub}</div>}
  </div>;
}
function Inp({label,value,onChange,placeholder,type="text",rows}){
  const[f,sf]=useState(false);
  const s={width:"100%",background:f?"#fff":"#F7F9FC",border:`1.5px solid ${f?"var(--bl)":"#DDE3EE"}`,borderRadius:10,padding:"10px 13px",color:"var(--tx)",fontSize:13,outline:"none",fontFamily:"DM Sans",transition:"all .2s",resize:"none"};
  return <div style={{marginBottom:13}}>{label&&<Lbl>{label}</Lbl>}{rows?<textarea value={value} onChange={onChange} placeholder={placeholder} rows={rows} style={s} onFocus={()=>sf(true)} onBlur={()=>sf(false)}/>:<input type={type} value={value} onChange={onChange} placeholder={placeholder} style={s} onFocus={()=>sf(true)} onBlur={()=>sf(false)}/>}</div>;
}
function Sel({label,value,onChange,options,ph="Selecionar..."}){
  return <div style={{marginBottom:13}}>{label&&<Lbl>{label}</Lbl>}
    <select value={value} onChange={onChange} style={{width:"100%",background:"#F7F9FC",border:"1.5px solid #DDE3EE",borderRadius:10,padding:"10px 13px",color:value?"var(--tx)":"var(--mu)",fontSize:13,outline:"none",fontFamily:"DM Sans"}}>
      <option value="">{ph}</option>{options.map(o=><option key={o}>{o}</option>)}
    </select>
  </div>;
}
function Btn({children,onClick,v="primary",sz="md",disabled,style}){
  const V={
    primary:{background:"linear-gradient(135deg,var(--bl),#1A52AA)",color:"#fff",border:"none",boxShadow:"0 2px 8px rgba(48,102,190,.3)"},
    ghost:{background:"#F7F9FC",color:"var(--mu)",border:"1.5px solid #DDE3EE",boxShadow:"none"},
    danger:{background:"#FEF2F2",color:"var(--rd)",border:"1.5px solid #FECACA",boxShadow:"none"},
    purple:{background:"#F5F1FE",color:"var(--pu)",border:"1.5px solid #DDD0F7",boxShadow:"none"},
    green:{background:"#F0FDF4",color:"var(--gn)",border:"1.5px solid #BBF7D0",boxShadow:"none"},
    teal:{background:"#F0FDFC",color:"var(--te)",border:"1.5px solid #99F6E4",boxShadow:"none"},
  };
  const SZ={sm:"6px 12px",md:"9px 18px",lg:"12px 24px"};
  return <button onClick={onClick} disabled={disabled} style={{...V[v],borderRadius:9,padding:SZ[sz],fontSize:sz==="sm"?11:13,fontFamily:"DM Sans",fontWeight:600,cursor:disabled?"default":"pointer",opacity:disabled?.5:1,transition:"all .15s",...(style||{})}}>{children}</button>;
}
function Modal({title,sub,onClose,children,wide}){
  return <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(20,30,60,.3)",backdropFilter:"blur(6px)",zIndex:300,display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
    <div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:"20px 20px 0 0",padding:22,width:"100%",maxWidth:wide?720:560,border:"1px solid var(--b)",borderBottom:"none",animation:"su .25s ease",maxHeight:"92vh",overflowY:"auto",boxShadow:"0 -8px 40px rgba(30,40,80,.18)"}}>
      <div style={{width:34,height:4,borderRadius:99,background:"#DDE3EE",margin:"-2px auto 16px"}}/>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:16}}>
        <div><div style={{fontFamily:"Playfair Display",fontSize:19,fontWeight:700,color:"var(--tx)"}}>{title}</div>{sub&&<div style={{fontSize:12,color:"var(--mu)",marginTop:2}}>{sub}</div>}</div>
        <button onClick={onClose} style={{background:"#F7F9FC",border:"1.5px solid #DDE3EE",borderRadius:8,width:30,height:30,color:"var(--mu)",cursor:"pointer",fontSize:16}}>×</button>
      </div>
      {children}
    </div>
  </div>;
}
function IAdder({list,selected,onSelect,onAdd,placeholder}){
  const[a,sa]=useState(false);const[nv,sn]=useState("");
  return <div style={{marginBottom:13}}>
    <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:a?7:0}}>
      {list.map(it=><button key={it} onClick={()=>onSelect(it)} style={{background:selected===it?"#EEF4FF":"#F7F9FC",border:`1.5px solid ${selected===it?"var(--bl)":"#DDE3EE"}`,color:selected===it?"var(--bl)":"var(--mu)",borderRadius:99,padding:"4px 11px",fontSize:12,fontWeight:600,cursor:"pointer"}}>{it}</button>)}
      <button onClick={()=>sa(true)} style={{background:"transparent",border:"1.5px dashed #DDE3EE",color:"var(--mu2)",borderRadius:99,padding:"4px 11px",fontSize:12,cursor:"pointer"}}>+ novo</button>
    </div>
    {a&&<div style={{display:"flex",gap:7}}>
      <input value={nv} onChange={e=>sn(e.target.value)} placeholder={placeholder} style={{flex:1,background:"#F7F9FC",border:"1.5px solid var(--bl)",borderRadius:9,padding:"7px 11px",color:"var(--tx)",fontSize:12,outline:"none",fontFamily:"DM Sans"}}/>
      <Btn sz="sm" onClick={()=>{if(nv.trim()){onAdd(nv.trim());onSelect(nv.trim());sn("");sa(false);}}}> ✓</Btn>
      <Btn sz="sm" v="ghost" onClick={()=>{sa(false);sn("");}}> ✕</Btn>
    </div>}
  </div>;
}
function FileUpload({label,file,onFile,accept=".pdf,.doc,.docx"}){
  const ref=useRef();
  return <div style={{marginBottom:13}}>
    {label&&<Lbl>{label}</Lbl>}
    <div style={{display:"flex",gap:8,alignItems:"center"}}>
      <button onClick={()=>ref.current.click()} style={{background:"#F7F9FC",border:"1.5px dashed #DDE3EE",borderRadius:9,padding:"7px 14px",fontSize:12,color:"var(--mu)",cursor:"pointer",fontFamily:"DM Sans",fontWeight:600}}>
        📎 {file?file.name.slice(0,28)+"…":"Escolher arquivo"}
      </button>
      {file&&<button onClick={()=>onFile(null)} style={{background:"#FEF2F2",border:"1.5px solid #FECACA",borderRadius:7,padding:"5px 10px",fontSize:11,color:"var(--rd)",cursor:"pointer",fontFamily:"DM Sans"}}>✕</button>}
      {file&&<a href={file.data} download={file.name} style={{background:"#F0FDF4",border:"1.5px solid #BBF7D0",borderRadius:7,padding:"5px 10px",fontSize:11,color:"var(--gn)",cursor:"pointer",fontFamily:"DM Sans",textDecoration:"none",fontWeight:600}}>↓ Baixar</a>}
    </div>
    <input ref={ref} type="file" accept={accept} style={{display:"none"}} onChange={async e=>{if(e.target.files[0]){const f=await readFile(e.target.files[0]);onFile(f);e.target.value="";}}}/>
  </div>;
}

/* ══════════════════════════════════════════════════
   NOTIFICATIONS BELL
══════════════════════════════════════════════════ */
function NotifBell({students,courses,checks}){
  const[open,setOpen]=useState(false);
  const ref=useRef();
  useEffect(()=>{function h(e){if(ref.current&&!ref.current.contains(e.target))setOpen(false);}document.addEventListener("mousedown",h);return()=>document.removeEventListener("mousedown",h);},[]);
  const today=new Date();const todayStr=today.toISOString().slice(0,10);
  const in14=new Date(today.getTime()+14*86400000).toISOString().slice(0,10);
  const overdue=students.filter(isOverdue);
  const upcoming=courses.filter(c=>c.date>=todayStr&&c.date<=in14);
  const overdueChks=checks.filter(c=>!c.done&&c.due&&c.due<todayStr);
  const total=overdue.length+upcoming.length+overdueChks.length;
  return <div ref={ref} style={{position:"relative"}}>
    <button onClick={()=>setOpen(o=>!o)} style={{background:"transparent",border:"none",cursor:"pointer",position:"relative",padding:"4px 6px",fontSize:18}}>
      🔔
      {total>0&&<span style={{position:"absolute",top:-2,right:-2,background:"var(--rd)",color:"#fff",borderRadius:99,fontSize:9,fontWeight:700,padding:"1px 5px",minWidth:16,textAlign:"center"}}>{total}</span>}
    </button>
    {open&&<div className="notif-drop">
      <div style={{padding:"12px 14px",borderBottom:"1px solid var(--b)",fontFamily:"Playfair Display",fontWeight:700,fontSize:14,color:"var(--tx)"}}>Notificações {total>0&&<span style={{fontSize:11,color:"var(--rd)",fontWeight:600}}>({total})</span>}</div>
      {overdue.length>0&&<div style={{padding:"8px 14px",borderBottom:"1px solid var(--b)"}}>
        <div style={{fontSize:10,color:"var(--rd)",fontWeight:700,letterSpacing:.5,textTransform:"uppercase",marginBottom:5}}>⚠ Inadimplentes ({overdue.length})</div>
        {overdue.map(s=><div key={s.id} style={{display:"flex",alignItems:"center",gap:8,padding:"4px 0",fontSize:12}}><Dot color="var(--rd)" size={6}/><span style={{fontWeight:600,flex:1}}>{s.name}</span><span style={{fontSize:10,color:"var(--mu)"}}>{s.pType==="parcelado"?`${(s.paidMonths||[]).length}/${s.installments}parc`:"À vista"}</span></div>)}
      </div>}
      {upcoming.length>0&&<div style={{padding:"8px 14px",borderBottom:"1px solid var(--b)"}}>
        <div style={{fontSize:10,color:"var(--am)",fontWeight:700,letterSpacing:.5,textTransform:"uppercase",marginBottom:5}}>📅 Cursos em 14 dias ({upcoming.length})</div>
        {upcoming.map(c=><div key={c.id} style={{display:"flex",alignItems:"center",gap:8,padding:"4px 0",fontSize:12}}><Dot color="var(--am)" size={6}/><span style={{flex:1,fontWeight:600}}>{c.name.split("–")[0].trim()}</span><span style={{fontSize:10,color:"var(--mu)"}}>{fmtDate(c.date)}</span></div>)}
      </div>}
      {overdueChks.length>0&&<div style={{padding:"8px 14px"}}>
        <div style={{fontSize:10,color:"var(--pu)",fontWeight:700,letterSpacing:.5,textTransform:"uppercase",marginBottom:5}}>✓ Tarefas Vencidas ({overdueChks.length})</div>
        {overdueChks.map(c=><div key={c.id} style={{display:"flex",alignItems:"center",gap:8,padding:"4px 0",fontSize:12}}><Dot color="var(--pu)" size={6}/><span style={{flex:1,fontWeight:600}}>{c.text.slice(0,35)}{c.text.length>35?"…":""}</span><span style={{fontSize:10,color:"var(--rd)"}}>{fmtDate(c.due)}</span></div>)}
      </div>}
      {total===0&&<div style={{padding:"20px 14px",textAlign:"center",color:"var(--gn)",fontSize:12,fontWeight:600}}>🎉 Tudo em dia!</div>}
    </div>}
  </div>;
}

/* ══════════════════════════════════════════════════
   DASHBOARD
══════════════════════════════════════════════════ */
function DashPage({leads,students,courses,sales}){
  const revenue=sales.reduce((s,v)=>s+(+v.value||0),0);
  const confirmed=confirmedRevenue(students);
  const open=leads.filter(l=>!["Fechado","Perdido"].includes(l.stage)).length;
  const today=new Date().toISOString().slice(0,10);
  const nxt=[...courses].sort((a,b)=>a.date.localeCompare(b.date)).find(c=>c.date>=today);
  const monthMap={};
  sales.forEach(s=>{const m=s.date?.slice(0,7);if(!m)return;if(!monthMap[m])monthMap[m]={};monthMap[m][s.type]=(monthMap[m][s.type]||0)+(+s.value||0);});
  const chartData=Object.keys(monthMap).sort().slice(-7).map(m=>({mes:MOPT[parseInt(m.slice(5,7))-1],...monthMap[m]}));
  const sStudent=id=>students.find(s=>s.id===id);
  return <div style={{animation:"up .4s ease"}}>
    <div style={{marginBottom:22,paddingBottom:18,borderBottom:"1px solid var(--b)"}}>
      <div style={{fontSize:11,color:"var(--bl)",fontWeight:600,letterSpacing:1.4,textTransform:"uppercase",marginBottom:5}}>IOR · Instituto de Reflexologia e Pesquisa</div>
      <h1 style={{fontFamily:"Playfair Display",fontSize:28,fontWeight:400,color:"var(--tx)"}}>Painel de <em style={{fontWeight:700}}>Controle</em></h1>
    </div>
    <div style={{display:"flex",gap:11,flexWrap:"wrap",marginBottom:20}}>
      <SC icon="💰" label="Receita total" value={`R$${revenue.toLocaleString()}`} color="var(--bl)" delay={0}/>
      <SC icon="✅" label="Receita confirmada" value={`R$${confirmed.toLocaleString()}`} color="var(--gn)" delay={.04}/>
      <SC icon="🎓" label="Alunos ativos" value={students.length} color="var(--te)" delay={.08}/>
      <SC icon="⚡" label="Leads em aberto" value={open} color="var(--pu)" delay={.12}/>
      <SC icon="📅" label="Cursos previstos" value={courses.length} color="var(--am)" delay={.16}/>
    </div>
    <div className="gdash">
      <div style={{background:"#fff",borderRadius:16,padding:20,border:"1px solid var(--b)",boxShadow:"var(--shadow)"}}>
        <div style={{fontFamily:"Playfair Display",fontSize:17,fontWeight:600,marginBottom:3}}>Receita por Tipo</div>
        <div style={{fontSize:11,color:"var(--mu)",marginBottom:14}}>Últimos {chartData.length} meses</div>
        {chartData.length>0?<ResponsiveContainer width="100%" height={120}>
          <BarChart data={chartData} margin={{top:0,right:0,left:-22,bottom:0}}>
            <XAxis dataKey="mes" tick={{fontSize:9,fill:"#9AAAC0"}} axisLine={false} tickLine={false}/>
            <YAxis tick={{fontSize:8,fill:"#9AAAC0"}} axisLine={false} tickLine={false}/>
            <Tooltip contentStyle={{background:"#fff",border:"1px solid #DDE3EE",borderRadius:8,fontSize:11}}/>
            {STYPES.map(t=><Bar key={t} dataKey={t} fill={TCL[t]} radius={[3,3,0,0]}/>)}
          </BarChart>
        </ResponsiveContainer>:<div style={{textAlign:"center",padding:"24px 0",color:"var(--mu)",fontSize:12}}>Nenhuma venda ainda</div>}
        <div style={{display:"flex",gap:9,marginTop:8,flexWrap:"wrap"}}>{STYPES.map(t=><div key={t} style={{display:"flex",alignItems:"center",gap:4}}><Dot color={TCL[t]} size={7}/><span style={{fontSize:10,color:"var(--mu)"}}>{t}</span></div>)}</div>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:12}}>
        {nxt&&<div style={{background:"#fff",borderRadius:16,padding:18,border:"1px solid var(--b)",boxShadow:"var(--shadow)"}}>
          <div style={{fontFamily:"Playfair Display",fontSize:14,fontWeight:600,marginBottom:9}}>Próximo Evento</div>
          <div style={{fontWeight:700,fontSize:13}}>{nxt.name}</div>
          <div style={{fontSize:11,color:"var(--mu)",marginTop:3}}>📅 {fmtDate(nxt.date)} · {nxt.modality}</div>
          <div style={{display:"flex",gap:6,marginTop:7,flexWrap:"wrap"}}>
            <Chip color={KCL[nxt.type]||"var(--bl)"}>{nxt.type}</Chip>
            <Chip color={nxt.enrolled.length>=nxt.capacity?"var(--rd)":"var(--gn)"}>{nxt.enrolled.length}/{nxt.capacity} vagas</Chip>
            {nxt.waitlist.length>0&&<Chip color="var(--am)">⏳ {nxt.waitlist.length} espera</Chip>}
          </div>
        </div>}
        <div style={{background:"#fff",borderRadius:16,padding:18,border:"1px solid var(--b)",boxShadow:"var(--shadow)"}}>
          <div style={{fontFamily:"Playfair Display",fontSize:14,fontWeight:600,marginBottom:10}}>Leads por Etapa</div>
          {SCRM.map(s=><div key={s} style={{display:"flex",alignItems:"center",gap:8,padding:"5px 0",borderBottom:"1px solid var(--b)"}}>
            <Dot color={SCL[s]} size={8}/><div style={{flex:1,fontSize:12,color:"var(--mu)"}}>{s}</div>
            <div style={{fontWeight:700,fontSize:13,color:SCL[s]}}>{leads.filter(l=>l.stage===s).length}</div>
          </div>)}
        </div>
      </div>
    </div>
    <div style={{background:"#fff",borderRadius:16,padding:20,border:"1px solid var(--b)",boxShadow:"var(--shadow)"}}>
      <div style={{fontFamily:"Playfair Display",fontSize:16,fontWeight:600,marginBottom:14}}>Últimas Vendas</div>
      {sales.slice(-6).reverse().map((s,i)=>{const st=sStudent(s.studentId);return <div key={s.id} style={{display:"flex",alignItems:"center",gap:11,padding:"8px 0",borderBottom:"1px solid var(--b)",animation:`sr .3s ease ${i*.05}s both`}}>
        <Av letter={(st?.name||s.desc||"?")[0]} size={32} color={TCL[s.type]||"var(--bl)"}/>
        <div style={{flex:1}}><div style={{fontWeight:600,fontSize:13}}>{st?.name||"—"}</div><div style={{fontSize:11,color:"var(--mu)"}}>{s.desc}</div></div>
        <div style={{textAlign:"right"}}><div style={{fontWeight:700,color:"var(--bl)",fontSize:13}}>R${(+s.value).toLocaleString()}</div><Chip color={TCL[s.type]} sm>{s.type}</Chip></div>
      </div>;})}
    </div>
  </div>;
}

/* ══════════════════════════════════════════════════
   CRM LEADS — drag-and-drop kanban
══════════════════════════════════════════════════ */
function CRMPage({leads,setLeads,courses,students,setStudents,sales,setSales}){
  const[stages,setStages]=useState([...SCRM]);
  const[sources,setSources]=useState([...SRCS]);
  const[payments,setPayments]=useState([...PAYS]);
  const[losses,setLosses]=useState([...LOSSES]);
  const[view,setView]=useState("kanban");
  const[showF,setShowF]=useState(false);
  const[editing,setEditing]=useState(null);
  const[search,setSearch]=useState("");
  const[showSA,setShowSA]=useState(false);
  const[newSt,setNewSt]=useState("");
  const[dragId,setDragId]=useState(null);
  const[dragOver,setDragOver]=useState(null);
  const eL={name:"",phone:"",email:"",courseId:"",stage:stages[0],source:"",payment:"",lossReason:"",value:"",type:"Curso",notes:"",date:new Date().toISOString().slice(0,10)};
  const[form,setForm]=useState(eL);
  const f=v=>setForm(p=>({...p,...v}));
  const getCourse=id=>courses.find(c=>c.id===+id);
  async function save(){
    if(!form.name.trim())return;
    const course=getCourse(form.courseId);
    const finalForm={...form,courseId:+form.courseId||null};
    if(form.stage==="Fechado"&&(!editing||editing.stage!=="Fechado")){
      const existing=students.find(s=>s.email===form.email||s.phone===form.phone);
      if(!existing){
        const newSt={name:form.name,email:form.email,phone:form.phone,cpf:"",city:"",since:new Date().toISOString().slice(0,7),courses:form.courseId?[+form.courseId]:[],contract:false,pType:"",pMethod:form.payment||"PIX",totalValue:+form.value||0,installments:0,instValue:0,payDay:null,startMonth:"",paidMonths:[],paid:false,certificate:[],interests:[],notes:form.notes,enrollmentDates:form.courseId?{[+form.courseId]:new Date().toISOString().slice(0,10)}:{},pedDocs:{}};
        const savedSt=await db.students.insert(newSt);
        const stWithId=savedSt||{...newSt,id:Date.now()};
        setStudents(ss=>[...ss,stWithId]);
        if(form.value&&+form.value>0){const sale={date:form.date,studentId:stWithId.id,desc:course?.name||"Lead convertido",value:+form.value,payment:form.payment||"PIX",type:form.type||"Curso",notes:"Lead convertido"};const savedSale=await db.sales.insert(sale);setSales(ss=>[...ss,savedSale||{...sale,id:Date.now()}]);}
      } else {
        if(form.courseId&&!existing.courses.includes(+form.courseId)){
          const updated={...existing,courses:[...new Set([...existing.courses,+form.courseId])]};
          setStudents(ss=>ss.map(s=>s.id!==existing.id?s:updated));
          await db.students.update(existing.id,updated);
          if(form.value&&+form.value>0){const sale={date:form.date,studentId:existing.id,desc:course?.name||"Lead convertido",value:+form.value,payment:form.payment||"PIX",type:form.type||"Curso",notes:"Lead convertido"};const savedSale=await db.sales.insert(sale);setSales(ss=>[...ss,savedSale||{...sale,id:Date.now()}]);}
        }
      }
    }
    if(editing){setLeads(ls=>ls.map(l=>l.id===editing.id?{...finalForm,id:l.id}:l));await db.leads.update(editing.id,finalForm);}
    else{const saved=await db.leads.insert(finalForm);setLeads(ls=>[...ls,saved||{...finalForm,id:Date.now()}]);}
    setShowF(false);setEditing(null);setForm(eL);
  }
  function edit(l){setForm({...l,courseId:l.courseId||""});setEditing(l);setShowF(true);}
  async function del(id){setLeads(ls=>ls.filter(l=>l.id!==id));await db.leads.delete(id);setShowF(false);setEditing(null);}
  const filtered=leads.filter(l=>!search||(l.name.toLowerCase()+(getCourse(l.courseId)?.name||"")).toLowerCase().includes(search.toLowerCase()));
  async function onDrop(stage){if(dragId==null)return;const lead=leads.find(l=>l.id===dragId);if(lead){setLeads(ls=>ls.map(l=>l.id===dragId?{...l,stage}:l));await db.leads.update(dragId,{...lead,stage});}setDragId(null);setDragOver(null);}
  return <div style={{animation:"up .4s ease"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
      <div><h1 style={{fontFamily:"Playfair Display",fontSize:24,fontWeight:700}}>CRM · Leads</h1><p style={{color:"var(--mu)",fontSize:11,marginTop:2}}>{leads.length} leads · {leads.filter(l=>l.stage==="Fechado").length} fechados</p></div>
      <div style={{display:"flex",gap:7}}>
        <BtnExport label="📊 Exportar" onClick={()=>{
          const rows=leads.map(l=>({
            "Nome":l.name,"E-mail":l.email,"Telefone":l.phone,
            "Estágio":l.stage,"Interesse":l.type,
            "Curso":courses.find(c=>c.id===l.courseId)?.name||"",
            "Valor (R$)":(+(l.value||0)/100).toFixed(2),
            "Origem":l.source,"Pagamento":l.payment,"Data":l.date,
            "Motivo perda":l.lossReason,"Notas":l.notes,
          }));
          const porEstagio=SCRM.map(st=>({
            "Estágio":st,
            "Qtd":leads.filter(l=>l.stage===st).length,
            "Valor potencial (R$)":(leads.filter(l=>l.stage===st).reduce((a,l)=>a+(+l.value||0),0)/100).toFixed(2),
          }));
          exportXLSX([
            {name:"Todos os Leads",rows:rows.length?rows:[{"Info":"Nenhum lead"}]},
            {name:"Por Estágio",rows:porEstagio},
          ],"IOR_Leads");
        }}/>
        <Btn v="ghost" sz="sm" onClick={()=>setView(v=>v==="kanban"?"list":"kanban")}>{view==="kanban"?"☰ Lista":"⊞ Kanban"}</Btn>
        <Btn sz="sm" onClick={()=>{setForm(eL);setEditing(null);setShowF(true);}}>+ Novo</Btn>
      </div>
    </div>
    <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍  Buscar lead..." style={{width:"100%",background:"#fff",border:"1.5px solid #DDE3EE",borderRadius:11,padding:"9px 14px",color:"var(--tx)",fontSize:13,outline:"none",fontFamily:"DM Sans",marginBottom:14,boxShadow:"var(--shadow)"}}/>
    {view==="kanban"?(
      <div style={{display:"flex",gap:10,overflowX:"auto",paddingBottom:10}}>
        {stages.map(stage=>{
          const cards=filtered.filter(l=>l.stage===stage);
          const tot=cards.reduce((s,l)=>s+(+l.value||0),0);
          const isDragOver=dragOver===stage;
          return <div key={stage} style={{minWidth:210,flex:"0 0 210px"}}
            onDragOver={e=>{e.preventDefault();setDragOver(stage);}} onDragLeave={()=>setDragOver(null)} onDrop={()=>onDrop(stage)}>
            <div style={{background:"#fff",borderRadius:"11px 11px 0 0",padding:"9px 12px",border:"1px solid var(--b)",borderBottom:`3px solid ${SCL[stage]||"var(--mu2)"}`,boxShadow:"var(--shadow)"}}>
              <div style={{display:"flex",justifyContent:"space-between"}}><div style={{display:"flex",alignItems:"center",gap:6}}><Dot color={SCL[stage]||"#9AAAC0"}/><span style={{fontSize:12,fontWeight:700}}>{stage}</span></div><span style={{background:"#F0F4FA",borderRadius:99,padding:"2px 8px",fontSize:11,fontWeight:700,color:"var(--mu)"}}>{cards.length}</span></div>
              {tot>0&&<div style={{fontSize:10,color:"var(--bl)",marginTop:2,fontWeight:600}}>R${tot.toLocaleString()}</div>}
            </div>
            <div style={{background:isDragOver?"#EEF4FF":"#F7F9FC",borderRadius:"0 0 11px 11px",border:`${isDragOver?"2px dashed var(--bl)":"1px solid var(--b)"}`,borderTop:"none",padding:7,display:"flex",flexDirection:"column",gap:6,minHeight:80,transition:"all .15s"}}>
              {cards.map(lead=>{const c=getCourse(lead.courseId);return <div key={lead.id} draggable onDragStart={()=>setDragId(lead.id)} onDragEnd={()=>{setDragId(null);setDragOver(null);}} onClick={()=>edit(lead)}
                style={{background:"#fff",borderRadius:9,padding:"10px 11px",cursor:"grab",border:"1px solid var(--b)",borderLeft:`3px solid ${SCL[stage]||"#9AAAC0"}`,boxShadow:"0 1px 4px rgba(30,40,80,.06)",opacity:dragId===lead.id?.4:1}}>
                <div style={{fontWeight:600,fontSize:12}}>{lead.name}</div>
                <div style={{fontSize:11,color:"var(--mu)",marginTop:2}}>{c?.name||"—"}</div>
                <div style={{display:"flex",justifyContent:"space-between",marginTop:5}}>
                  {lead.value?<span style={{fontSize:11,fontWeight:700,color:"var(--bl)"}}>R${(+lead.value).toLocaleString()}</span>:<span/>}
                  {lead.source&&<Chip color="var(--mu)" sm>{lead.source}</Chip>}
                </div>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:5}}>
                  <div style={{fontSize:10,color:"var(--mu2)"}}>{fmtDate(lead.date)}</div>
                  {lead.phone&&<a href={`https://wa.me/55${lead.phone.replace(/\D/g,"")}?text=${encodeURIComponent("Olá "+lead.name+"! Tudo bem? Vi seu interesse em nossos cursos de reflexologia. Posso te ajudar? 🌿")}`} target="_blank" rel="noreferrer" onClick={e=>e.stopPropagation()} style={{background:"linear-gradient(135deg,#25D366,#128C7E)",borderRadius:6,padding:"3px 7px",color:"#fff",fontSize:10,fontWeight:700,textDecoration:"none"}} title="Abrir WhatsApp">💬</a>}
                </div>
              </div>;})}
              {!cards.length&&<div style={{textAlign:"center",fontSize:11,color:"var(--mu2)",padding:"10px 0"}}>Arraste cards aqui</div>}
            </div>
          </div>;
        })}
        <div style={{minWidth:120,flex:"0 0 120px"}}>
          {showSA?<div style={{background:"#fff",borderRadius:11,padding:10,border:"1px solid var(--b)",boxShadow:"var(--shadow)"}}>
            <input value={newSt} onChange={e=>setNewSt(e.target.value)} placeholder="Etapa..." autoFocus style={{width:"100%",background:"#F7F9FC",border:"1.5px solid var(--bl)",borderRadius:8,padding:"7px 10px",color:"var(--tx)",fontSize:12,outline:"none",fontFamily:"DM Sans",marginBottom:7}}/>
            <div style={{display:"flex",gap:5}}><Btn sz="sm" onClick={()=>{if(newSt.trim()){setStages(s=>[...s,newSt.trim()]);setNewSt("");setShowSA(false);}}}>✓</Btn><Btn sz="sm" v="ghost" onClick={()=>setShowSA(false)}>✕</Btn></div>
          </div>:<button onClick={()=>setShowSA(true)} style={{width:"100%",background:"#fff",border:"2px dashed #DDE3EE",borderRadius:11,padding:"14px 8px",color:"var(--mu)",fontSize:12,cursor:"pointer",fontFamily:"DM Sans"}}>+ Etapa</button>}
        </div>
      </div>
    ):(
      <div className="tw"><div style={{background:"#fff",borderRadius:14,border:"1px solid var(--b)",overflow:"hidden",minWidth:560,boxShadow:"var(--shadow)"}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
          <thead><tr style={{background:"#F7F9FC",borderBottom:"1px solid var(--b)"}}>{["Nome","Curso","Etapa","Tipo","Valor","Data"].map(h=><th key={h} style={{padding:"9px 12px",textAlign:"left",fontSize:10,color:"var(--mu)",fontWeight:600,letterSpacing:.5,textTransform:"uppercase",whiteSpace:"nowrap"}}>{h}</th>)}</tr></thead>
          <tbody>{filtered.map((l,i)=>{const c=getCourse(l.courseId);return <tr key={l.id} onClick={()=>edit(l)} style={{borderBottom:"1px solid var(--b)",cursor:"pointer",animation:`sr .3s ease ${i*.04}s both`}}
            onMouseEnter={e=>e.currentTarget.style.background="#F7F9FC"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
            <td style={{padding:"9px 12px",fontWeight:600}}>{l.name}</td>
            <td style={{padding:"9px 12px",color:"var(--mu)",maxWidth:150,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c?.name||"—"}</td>
            <td style={{padding:"9px 12px",whiteSpace:"nowrap"}}><Chip color={SCL[l.stage]||"var(--mu)"}>{l.stage}</Chip></td>
            <td style={{padding:"9px 12px",whiteSpace:"nowrap"}}><Chip color={TCL[l.type]||"var(--mu)"} sm>{l.type}</Chip></td>
            <td style={{padding:"9px 12px",fontWeight:700,color:"var(--bl)",whiteSpace:"nowrap"}}>{l.value?`R$${(+l.value).toLocaleString()}`:"—"}</td>
            <td style={{padding:"9px 12px",color:"var(--mu)",whiteSpace:"nowrap"}}>{fmtDate(l.date)}</td>
          </tr>;})}
          </tbody>
        </table>
      </div></div>
    )}
    {showF&&<Modal title={editing?"Editar Lead":"Novo Lead"} sub={editing?.name} onClose={()=>{setShowF(false);setEditing(null);}}>
      <div className="g2"><Inp label="Nome *" value={form.name} onChange={e=>f({name:e.target.value})}/><Inp label="WhatsApp" value={form.phone} onChange={e=>f({phone:e.target.value})}/><Inp label="E-mail" value={form.email} onChange={e=>f({email:e.target.value})}/><Inp label="Valor (R$)" value={form.value} onChange={e=>f({value:e.target.value})} type="number"/></div>
      <Lbl>Curso de Interesse</Lbl>
      <select value={form.courseId} onChange={e=>{const c=getCourse(+e.target.value);f({courseId:e.target.value,value:c?.value||form.value,type:c?.type||form.type});}} style={{width:"100%",background:"#F7F9FC",border:"1.5px solid #DDE3EE",borderRadius:10,padding:"10px 13px",color:"var(--tx)",fontSize:13,outline:"none",fontFamily:"DM Sans",marginBottom:13}}>
        <option value="">Selecionar curso...</option>{courses.map(c=><option key={c.id} value={c.id}>{c.name} · R${(+c.value).toLocaleString()}</option>)}
      </select>
      <Lbl>Tipo</Lbl><div style={{display:"flex",gap:6,marginBottom:12,flexWrap:"wrap"}}>{STYPES.map(t=><button key={t} onClick={()=>f({type:t})} style={{background:form.type===t?`${TCL[t]}15`:"#F7F9FC",border:`1.5px solid ${form.type===t?TCL[t]:"#DDE3EE"}`,color:form.type===t?TCL[t]:"var(--mu)",borderRadius:99,padding:"5px 11px",fontSize:12,fontWeight:600,cursor:"pointer"}}>{t}</button>)}</div>
      <Lbl>Etapa</Lbl><div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:12}}>{stages.map(s=><button key={s} onClick={()=>f({stage:s})} style={{background:form.stage===s?`${SCL[s]||"#9AAAC0"}15`:"#F7F9FC",border:`1.5px solid ${form.stage===s?SCL[s]||"#9AAAC0":"#DDE3EE"}`,color:form.stage===s?SCL[s]||"#9AAAC0":"var(--mu)",borderRadius:99,padding:"5px 11px",fontSize:12,fontWeight:600,cursor:"pointer"}}>{s}</button>)}</div>
      <Lbl>Origem</Lbl><IAdder list={sources} selected={form.source} onSelect={v=>f({source:v})} onAdd={v=>setSources(s=>[...s,v])} placeholder="Nova origem..."/>
      <Lbl>Pagamento</Lbl><IAdder list={payments} selected={form.payment} onSelect={v=>f({payment:v})} onAdd={v=>setPayments(s=>[...s,v])} placeholder="Nova forma..."/>
      {form.stage==="Perdido"&&<><Lbl>Motivo da Perda</Lbl><IAdder list={losses} selected={form.lossReason} onSelect={v=>f({lossReason:v})} onAdd={v=>setLosses(s=>[...s,v])} placeholder="Novo motivo..."/></>}
      <Inp label="Observações" value={form.notes} onChange={e=>f({notes:e.target.value})} rows={2}/>
      {form.stage==="Fechado"&&<div style={{background:"#F0FDF4",border:"1.5px solid #BBF7D0",borderRadius:9,padding:"8px 12px",fontSize:12,color:"var(--gn)",marginBottom:11,fontWeight:600}}>✓ Cria aluno + venda automaticamente</div>}
      <Inp label="Data" value={form.date} onChange={e=>f({date:e.target.value})} type="date"/>
      <div style={{display:"flex",gap:8}}><Btn style={{flex:1}} onClick={save}>{editing?"Salvar":"Cadastrar"}</Btn>{editing&&<Btn v="danger" onClick={()=>del(editing.id)}>Excluir</Btn>}</div>
    </Modal>}
  </div>;
}

/* ══════════════════════════════════════════════════
   CRM PRODUTOS — drag-and-drop + documentos
══════════════════════════════════════════════════ */
function ProductsPage({products,setProducts,sales,setSales}){
  const[showF,setShowF]=useState(false);const[editing,setEditing]=useState(null);
  const[dragId,setDragId]=useState(null);const[dragOver,setDragOver]=useState(null);
  const[viewDocs,setViewDocs]=useState(null);
  const e={product:"",client:"",qty:1,value:"",notes:"",stage:PSTG[0],date:new Date().toISOString().slice(0,10),documents:[]};
  const[form,setForm]=useState(e);
  async function addDoc(file){const f=await readFile(file);setForm(p=>({...p,documents:[...(p.documents||[]),f]}));}
  function removeDoc(idx){setForm(p=>({...p,documents:(p.documents||[]).filter((_,i)=>i!==idx)}));}
  async function save(){
    if(!form.product.trim())return;
    const wasNotClosed=!editing||editing.stage!=="Fechado";const isClosing=form.stage==="Fechado"&&wasNotClosed;
    if(editing){setProducts(ps=>ps.map(p=>p.id===editing.id?{...form,id:p.id}:p));await db.products.update(editing.id,form);}
    else{const saved=await db.products.insert(form);setProducts(ps=>[...ps,saved||{...form,id:Date.now()}]);}
    if(isClosing&&form.value&&+form.value>0){const sale={date:form.date||new Date().toISOString().slice(0,10),studentId:null,desc:form.product,value:+form.value,payment:"PIX",type:"Produto",notes:form.client};const savedSale=await db.sales.insert(sale);setSales(ss=>[...ss,savedSale||{...sale,id:Date.now()}]);}
    setShowF(false);setEditing(null);setForm(e);
  }
  function edit(p){setForm({...p,documents:p.documents||[]});setEditing(p);setShowF(true);}
  async function moveStage(prod,stage){
    const updated={...prod,stage};setProducts(ps=>ps.map(p=>p.id===prod.id?updated:p));
    await db.products.update(prod.id,updated);
    if(stage==="Fechado"&&prod.stage!=="Fechado"&&prod.value&&+prod.value>0){const sale={date:new Date().toISOString().slice(0,10),studentId:null,desc:prod.product,value:+prod.value,payment:"PIX",type:"Produto",notes:prod.client};const ss=await db.sales.insert(sale);setSales(prev=>[...prev,ss||{...sale,id:Date.now()}]);}
  }
  function onDrop(stage){if(dragId==null)return;const prod=products.find(p=>p.id===dragId);if(prod)moveStage(prod,stage);setDragId(null);setDragOver(null);}
  return <div style={{animation:"up .4s ease"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
      <div><h1 style={{fontFamily:"Playfair Display",fontSize:24,fontWeight:700}}>CRM · Produtos</h1><p style={{color:"var(--mu)",fontSize:11,marginTop:2}}>Arraste para mudar etapa · ao fechar gera venda</p></div>
      <Btn sz="sm" onClick={()=>{setForm(e);setEditing(null);setShowF(true);}}>+ Novo</Btn>
    </div>
    <div style={{display:"flex",gap:10,overflowX:"auto",paddingBottom:10}}>
      {PSTG.map(stage=>{const cards=products.filter(p=>p.stage===stage);const isDragOver=dragOver===stage;return <div key={stage} style={{minWidth:195,flex:"0 0 195px"}}
        onDragOver={e=>{e.preventDefault();setDragOver(stage);}} onDragLeave={()=>setDragOver(null)} onDrop={()=>onDrop(stage)}>
        <div style={{background:"#fff",borderRadius:"11px 11px 0 0",padding:"9px 12px",border:"1px solid var(--b)",borderBottom:`3px solid ${PCL[stage]}`,boxShadow:"var(--shadow)"}}>
          <div style={{display:"flex",justifyContent:"space-between"}}><div style={{display:"flex",alignItems:"center",gap:6}}><Dot color={PCL[stage]}/><span style={{fontSize:12,fontWeight:700}}>{stage}</span></div><span style={{background:"#F0F4FA",borderRadius:99,padding:"2px 7px",fontSize:11,fontWeight:700,color:"var(--mu)"}}>{cards.length}</span></div>
        </div>
        <div style={{background:isDragOver?"#EEF4FF":"#F7F9FC",borderRadius:"0 0 11px 11px",border:`${isDragOver?"2px dashed var(--bl)":"1px solid var(--b)"}`,borderTop:"none",padding:7,display:"flex",flexDirection:"column",gap:6,minHeight:70,transition:"all .15s"}}>
          {cards.map(p=><div key={p.id} draggable onDragStart={()=>setDragId(p.id)} onDragEnd={()=>{setDragId(null);setDragOver(null);}} onClick={()=>edit(p)}
            style={{background:"#fff",borderRadius:9,padding:"10px 11px",cursor:"grab",border:"1px solid var(--b)",borderLeft:`3px solid ${PCL[stage]}`,boxShadow:"0 1px 4px rgba(30,40,80,.06)",opacity:dragId===p.id?.4:1}}>
            <div style={{fontWeight:600,fontSize:12}}>{p.product}</div>
            <div style={{fontSize:11,color:"var(--mu)",marginTop:2}}>👤 {p.client}</div>
            <div style={{display:"flex",justifyContent:"space-between",marginTop:5}}><span style={{fontSize:10,color:"var(--mu)"}}>{fmtDate(p.date)}</span><span style={{fontSize:11,fontWeight:700,color:"var(--bl)"}}>R${(+p.value||0).toLocaleString()}</span></div>
            {(p.documents||[]).length>0&&<div style={{marginTop:4,display:"flex",alignItems:"center",gap:4}}><span style={{fontSize:10}}>📎</span><span style={{fontSize:10,color:"var(--bl)",fontWeight:600}}>{p.documents.length} doc{p.documents.length!==1?"s":""}</span><button onClick={ev=>{ev.stopPropagation();setViewDocs(p);}} style={{marginLeft:"auto",background:"#EEF4FF",border:"1px solid #C7D7F5",borderRadius:5,padding:"1px 6px",fontSize:9,color:"var(--bl)",cursor:"pointer",fontFamily:"DM Sans"}}>ver</button></div>}
          </div>)}
          {!cards.length&&<div style={{textAlign:"center",fontSize:11,color:"var(--mu2)",padding:"10px 0"}}>Arraste aqui</div>}
        </div>
      </div>;})}
    </div>
    {viewDocs&&<Modal title="Documentos" sub={viewDocs.product} onClose={()=>setViewDocs(null)}>
      {(viewDocs.documents||[]).map((d,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 12px",borderRadius:9,background:"#F7F9FC",border:"1px solid var(--b)",marginBottom:8}}>
        <span style={{fontSize:18}}>📄</span><span style={{flex:1,fontSize:12,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{d.name}</span>
        <a href={d.data} download={d.name} style={{background:"#F0FDF4",border:"1.5px solid #BBF7D0",borderRadius:7,padding:"5px 10px",fontSize:11,color:"var(--gn)",textDecoration:"none",fontWeight:600}}>↓ Baixar</a>
      </div>)}
      {!(viewDocs.documents||[]).length&&<div style={{textAlign:"center",padding:"18px 0",color:"var(--mu)",fontSize:12}}>Sem documentos</div>}
    </Modal>}
    {showF&&<Modal title={editing?"Editar":"Novo Pedido"} onClose={()=>{setShowF(false);setEditing(null);}}>
      <Inp label="Produto *" value={form.product} onChange={e=>setForm(f=>({...f,product:e.target.value}))}/>
      <Inp label="Cliente" value={form.client} onChange={e=>setForm(f=>({...f,client:e.target.value}))}/>
      <div className="g2"><Inp label="Qtd" value={form.qty} onChange={e=>setForm(f=>({...f,qty:e.target.value}))} type="number"/><Inp label="Valor (R$)" value={form.value} onChange={e=>setForm(f=>({...f,value:e.target.value}))} type="number"/></div>
      <Lbl>Etapa</Lbl><div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:12}}>{PSTG.map(s=><button key={s} onClick={()=>setForm(f=>({...f,stage:s}))} style={{background:form.stage===s?`${PCL[s]}15`:"#F7F9FC",border:`1.5px solid ${form.stage===s?PCL[s]:"#DDE3EE"}`,color:form.stage===s?PCL[s]:"var(--mu)",borderRadius:99,padding:"5px 11px",fontSize:12,fontWeight:600,cursor:"pointer"}}>{s}</button>)}</div>
      <Inp label="Notas" value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} rows={2}/>
      <Lbl>Documentos (NF, comprovantes)</Lbl>
      <label style={{display:"inline-flex",alignItems:"center",gap:7,background:"#F7F9FC",border:"1.5px dashed #DDE3EE",borderRadius:9,padding:"8px 14px",cursor:"pointer",fontSize:12,color:"var(--mu)",fontWeight:600,marginBottom:8}}>
        📎 Adicionar documento
        <input type="file" accept=".pdf,.doc,.docx,.png,.jpg" style={{display:"none"}} onChange={async e=>{if(e.target.files[0]){await addDoc(e.target.files[0]);e.target.value="";}}}/>
      </label>
      {(form.documents||[]).map((d,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:8,marginBottom:5,background:"#F7F9FC",borderRadius:8,padding:"6px 10px",border:"1px solid var(--b)"}}>
        <span>📄</span><span style={{flex:1,fontSize:12,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{d.name}</span>
        <button onClick={()=>removeDoc(i)} style={{background:"transparent",border:"none",color:"var(--rd)",cursor:"pointer",fontSize:14}}>×</button>
      </div>)}
      {form.stage==="Fechado"&&+form.value>0&&<div style={{background:"#F0FDF4",border:"1.5px solid #BBF7D0",borderRadius:9,padding:"8px 12px",fontSize:12,color:"var(--gn)",marginBottom:11,fontWeight:600}}>✓ Ao salvar, gera venda</div>}
      <div style={{display:"flex",gap:8}}><Btn style={{flex:1}} onClick={save}>{editing?"Salvar":"Adicionar"}</Btn>{editing&&<Btn v="danger" onClick={()=>{setProducts(ps=>ps.filter(p=>p.id!==editing.id));setShowF(false);setEditing(null);}}>Excluir</Btn>}</div>
    </Modal>}
  </div>;
}

/* ══════════════════════════════════════════════════
   ALUNOS — payDay, filtros, contratos, vencimentos
══════════════════════════════════════════════════ */
function StudentsPage({students,setStudents,courses,sales,setSales,templates}){
  const[search,setSearch]=useState("");
  const[filterStatus,setFilterStatus]=useState("todos");
  const[filterCourse,setFilterCourse]=useState("");
  const[sel,setSel]=useState(null);
  const[editingSt,setEditingSt]=useState(null);
  const[showF,setShowF]=useState(false);
  const[waM,setWaM]=useState(null);const[waMsg,setWaMsg]=useState("");
  const e={name:"",email:"",phone:"",cpf:"",city:"",since:new Date().toISOString().slice(0,7),courses:[],contract:false,contractFile:null,pType:"avista",pMethod:"PIX",totalValue:"",installments:0,instValue:"",payDay:"",startMonth:"",paidMonths:[],paid:false,certificate:[],interests:[],notes:"",enrollmentDates:{},pedDocs:{}};
  const[form,setForm]=useState(e);
  const ff=v=>setForm(p=>({...p,...v}));
  const ls=id=>students.find(s=>s.id===id)||null;
  const statusFilters=[["todos","Todos"],["emDia","Em dia"],["atrasados","Atrasados"],["quitados","Quitados"]];
  const FC={"todos":"var(--mu)","emDia":"var(--gn)","atrasados":"var(--rd)","quitados":"var(--bl)"};
  const filtered=students.filter(s=>{
    const matchSearch=[s.name,s.email||"",s.city||"",s.cpf||"",(s.phone||"").replace(/\D/g,"")].some(x=>x.toLowerCase().includes(search.toLowerCase()));
    const matchCourse=!filterCourse||s.courses.includes(+filterCourse);
    const od=isOverdue(s);const pd=isPaid(s);
    const matchStatus=filterStatus==="todos"||(filterStatus==="atrasados"&&od)||(filterStatus==="emDia"&&!od&&!pd)||(filterStatus==="quitados"&&pd);
    return matchSearch&&matchCourse&&matchStatus;
  });
  async function save(){
    if(!form.name.trim())return;
    const base={...form,payDay:+form.payDay||null};
    if(editingSt){setStudents(ss=>ss.map(s=>s.id===editingSt.id?{...base,id:editingSt.id}:s));await db.students.update(editingSt.id,base);}
    else{const saved=await db.students.insert(base);const target=saved||{...base,id:Date.now()};setStudents(ss=>[...ss,target]);for(const cid of target.courses){const c=courses.find(x=>x.id===cid);if(c&&c.value>0){const sale={date:target.since+"-01",studentId:target.id,desc:c.name,value:c.value,payment:target.pMethod||"PIX",type:c.type==="Workshop"?"Workshop":"Curso",notes:"Matrícula"};const ss=await db.sales.insert(sale);setSales(prev=>[...prev,ss||{...sale,id:Date.now()}]);}}}
    setShowF(false);setEditingSt(null);setForm(e);
  }
  async function togglePaid(stId,idx){let updated;setStudents(ss=>ss.map(s=>{if(s.id!==stId)return s;const pm=[...(s.paidMonths||[])];const pos=pm.indexOf(idx);if(pos>=0)pm.splice(pos,1);else pm.push(idx);updated={...s,paidMonths:pm};return updated;}));if(updated)await db.students.update(stId,updated);}
  async function toggleAVistaPaid(stId){let updated;setStudents(ss=>ss.map(s=>{if(s.id!==stId)return s;updated={...s,paid:!s.paid};return updated;}));if(updated)await db.students.update(stId,updated);}
  async function toggleContract(stId){let updated;setStudents(ss=>ss.map(s=>{if(s.id!==stId)return s;updated={...s,contract:!s.contract};return updated;}));if(updated)await db.students.update(stId,updated);}
  async function setContractFile(stId,file){setStudents(ss=>ss.map(s=>s.id!==stId?s:{...s,contractFile:file}));}
  function enrollCourse(stId,cid,enroll){
    const course=courses.find(x=>x.id===cid);
    const enrolled=students.filter(s=>s.courses.includes(cid));
    if(enroll&&course&&enrolled.length>=course.capacity){
      if(!window.confirm(`Turma lotada (${enrolled.length}/${course.capacity}). Adicionar à lista de espera?`))return;
      return;
    }
    setStudents(ss=>ss.map(s=>{if(s.id!==stId)return s;const cs=enroll?[...new Set([...s.courses,cid])]:s.courses.filter(x=>x!==cid);const ed={...(s.enrollmentDates||{})};if(enroll)ed[cid]=new Date().toISOString().slice(0,10);else delete ed[cid];return {...s,courses:cs,enrollmentDates:ed};}));
    if(enroll&&course&&course.value>0){setSales(ss=>[...ss,{id:Date.now(),date:new Date().toISOString().slice(0,10),studentId:stId,desc:course.name,value:course.value,payment:"PIX",type:course.type==="Workshop"?"Workshop":"Curso",notes:"Matrícula direta"}]);}
  }
  function openWA(st,msg){const p=(st.phone||"").replace(/\D/g,"");if(p&&p.length>=10&&p.length<=13)window.open(`https://wa.me/55${p}?text=${encodeURIComponent(msg)}`,"_blank");else navigator.clipboard.writeText(msg);}
  return <div style={{animation:"up .4s ease"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
      <div><h1 style={{fontFamily:"Playfair Display",fontSize:24,fontWeight:700}}>Alunos</h1><p style={{color:"var(--mu)",fontSize:11,marginTop:2}}>{students.length} cadastrados · {students.filter(isOverdue).length} pendentes · {students.filter(isPaid).length} quitados</p></div>
      <div style={{display:"flex",gap:8}}>
        <BtnExport onClick={()=>{
          const rows=students.map(s=>({
            "Nome":s.name,"E-mail":s.email,"Telefone":s.phone,"Cidade":s.city,
            "Desde":s.since,"Tipo pgto":s.pType,"Método":s.pMethod,
            "Valor total (R$)":(+(s.totalValue||0)/100).toFixed(2),
            "Parcelas":s.installments||0,"Quitado":s.paid?"Sim":"Não",
            "Cursos":(s.courses||[]).map(cid=>{const c=courses.find(x=>x.id===cid);return c?.name||cid;}).join(", "),
            "Notas":s.notes,
          }));
          const byCourse=[];
          courses.forEach(c=>{
            students.filter(s=>(s.courses||[]).includes(c.id)).forEach(s=>byCourse.push({
              "Curso":c.name,"Tipo":c.type,"Data":c.date,"Aluno":s.name,
              "E-mail":s.email,"Telefone":s.phone,
              "Matrícula em":(s.enrollmentDates||{})[c.id]||"",
              "Pgto quitado":s.paid?"Sim":"Não",
            }));
          });
          exportXLSX([
            {name:"Todos os Alunos",rows:rows.length?rows:[{"Info":"Nenhum aluno"}]},
            {name:"Alunos por Curso",rows:byCourse.length?byCourse:[{"Info":"Sem matrículas"}]},
          ],"IOR_Alunos");
        }}/>
        <Btn sz="sm" onClick={()=>{setForm(e);setEditingSt(null);setShowF(true);}}>+ Cadastrar</Btn>
      </div>
    </div>
    <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍  Nome, e-mail, CPF, telefone..."
      style={{width:"100%",background:"#fff",border:"1.5px solid #DDE3EE",borderRadius:11,padding:"9px 14px",color:"var(--tx)",fontSize:13,outline:"none",fontFamily:"DM Sans",marginBottom:10,boxShadow:"var(--shadow)"}}/>
    <div style={{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap"}}>
      {statusFilters.map(([v,l])=><button key={v} onClick={()=>setFilterStatus(v)} style={{background:filterStatus===v?`${FC[v]}15`:"#fff",border:`1.5px solid ${filterStatus===v?FC[v]:"#DDE3EE"}`,color:filterStatus===v?FC[v]:"var(--mu)",borderRadius:99,padding:"5px 12px",fontSize:11,fontWeight:600,cursor:"pointer",boxShadow:"var(--shadow)"}}>{l}</button>)}
      <select value={filterCourse} onChange={e=>setFilterCourse(e.target.value)} style={{background:"#fff",border:"1.5px solid #DDE3EE",borderRadius:9,padding:"5px 11px",color:"var(--mu)",fontSize:11,outline:"none",fontFamily:"DM Sans"}}>
        <option value="">Todos os cursos</option>{courses.map(c=><option key={c.id} value={c.id}>{c.name.split("–")[0].trim()}</option>)}
      </select>
    </div>
    <div style={{display:"flex",flexDirection:"column",gap:8}}>
      {filtered.map((s,i)=>{
        const live=ls(s.id)||s;const od=isOverdue(live);const pd=isPaid(live);const ex=sel===s.id;
        const statusColor=pd?"var(--gn)":od?"var(--rd)":"var(--bl)";
        return <div key={s.id} style={{background:"#fff",borderRadius:14,border:`1.5px solid ${ex?"var(--bl)":od?"#FECACA":"#E5EAF3"}`,overflow:"hidden",animation:`sr .3s ease ${i*.04}s both`,boxShadow:"var(--shadow)"}}>
          <div onClick={()=>setSel(x=>x?.id===s.id?null:s)} style={{display:"flex",alignItems:"center",gap:11,padding:"13px 16px",cursor:"pointer"}}>
            <Av letter={live.name[0]} size={38} color={statusColor}/>
            <div style={{flex:1}}>
              <div style={{display:"flex",alignItems:"center",gap:7,flexWrap:"wrap"}}>
                <span style={{fontWeight:700,fontSize:13}}>{live.name}</span>
                {!live.contract&&<Chip color="var(--am)" sm>Sem contrato</Chip>}
                {od&&<Chip color="var(--rd)" sm>Pendente</Chip>}
                {pd&&<Chip color="var(--gn)" sm>✓ Quitado</Chip>}
              </div>
              <div style={{fontSize:11,color:"var(--mu)",marginTop:2}}>{live.email} · {live.city}</div>
            </div>
            <div style={{textAlign:"right"}}><div style={{fontWeight:700,color:statusColor,fontSize:13}}>R${(+live.totalValue||0).toLocaleString()}</div><div style={{fontSize:11,color:"var(--mu)"}}>{live.courses.length} cursos</div></div>
            <span style={{color:"var(--mu)",fontSize:11,marginLeft:3}}>{ex?"▲":"▼"}</span>
          </div>
          {ex&&<div style={{borderTop:"1.5px solid #E5EAF3",padding:"14px 16px",background:"#F7F9FC"}}>
            <div className="g2">
              <div>
                <div style={{fontSize:10,color:"var(--bl)",fontWeight:600,letterSpacing:.5,marginBottom:9,textTransform:"uppercase"}}>Informações</div>
                {[["📞",live.phone],["📧",live.email],["📍",live.city],["🪪",live.cpf],["📅","Ingresso: "+fmtDate(live.since+"-01").slice(3)]].filter(([,v])=>v).map(([ic,val])=><div key={ic} style={{display:"flex",gap:7,padding:"4px 0",fontSize:11,borderBottom:"1px solid var(--b)"}}><span>{ic}</span><span style={{color:"var(--mu)"}}>{val}</span></div>)}
                <div onClick={()=>toggleContract(live.id)} style={{display:"flex",gap:8,padding:"7px 0",fontSize:11,borderBottom:"1px solid var(--b)",cursor:"pointer",userSelect:"none"}}>
                  <div style={{width:18,height:18,borderRadius:4,border:`2px solid ${live.contract?"var(--gn)":"#DDE3EE"}`,background:live.contract?"var(--gn)":"transparent",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:"#fff",fontWeight:700,flexShrink:0}}>{live.contract?"✓":""}</div>
                  <span style={{color:live.contract?"var(--gn)":"var(--mu)",fontWeight:live.contract?600:400}}>Contrato assinado</span>
                </div>
                <div style={{padding:"7px 0",borderBottom:"1px solid var(--b)"}}>
                  <FileUpload file={live.contractFile} onFile={f=>setContractFile(live.id,f)} accept=".pdf"/>
                  {!live.contractFile&&<div style={{fontSize:10,color:"var(--mu2)",marginTop:-4}}>Anexar PDF do contrato</div>}
                </div>
                <Divr/>
                <div style={{fontSize:10,color:"var(--bl)",fontWeight:600,letterSpacing:.5,marginBottom:9,textTransform:"uppercase"}}>Cursos</div>
                {courses.map(c=>{const en=live.courses.includes(c.id);const ce=(live.certificate||[]).includes(c.id);const enrolled=students.filter(s=>s.courses.includes(c.id));const isFull=enrolled.length>=c.capacity;const enrollDate=(live.enrollmentDates||{})[c.id];
                  return <div key={c.id} style={{display:"flex",alignItems:"center",gap:7,padding:"5px 0",borderBottom:"1px solid var(--b)"}}>
                    <button onClick={()=>enrollCourse(live.id,c.id,!en)} style={{width:18,height:18,borderRadius:4,border:`2px solid ${en?"var(--bl)":"#DDE3EE"}`,background:en?"var(--bl)":"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,cursor:"pointer",fontSize:10,color:"#fff",fontWeight:700}}>{en?"✓":""}</button>
                    <span style={{fontSize:11,flex:1,color:en?"var(--tx)":"var(--mu)",fontWeight:en?600:400}}>{c.name}</span>
                    {isFull&&!en&&<Chip color="var(--rd)" sm>Lotado</Chip>}
                    {ce&&<Chip color="var(--te)" sm>Cert.✓</Chip>}
                    {enrollDate&&<span style={{fontSize:9,color:"var(--mu2)"}}>{fmtDate(enrollDate)}</span>}
                  </div>;})}
                {live.notes&&<div style={{marginTop:8,background:"#EEF4FF",borderRadius:8,padding:"6px 10px",fontSize:11,color:"var(--bl)"}}>💬 {live.notes}</div>}
              </div>
              <div>
                <div style={{fontSize:10,color:"var(--bl)",fontWeight:600,letterSpacing:.5,marginBottom:9,textTransform:"uppercase"}}>Pagamento</div>
                <div style={{background:"#fff",borderRadius:10,padding:11,marginBottom:10,border:"1px solid var(--b)"}}>
                  {[["Tipo",live.pType==="avista"?"À Vista":"Parcelado"],["Forma",live.pMethod],["Total","R$"+(+live.totalValue||0).toLocaleString()]].map(([k,v])=><div key={k} style={{display:"flex",justifyContent:"space-between",padding:"4px 0",borderBottom:"1px solid var(--b)",fontSize:11}}><span style={{color:"var(--mu)"}}>{k}</span><span style={{fontWeight:600}}>{v}</span></div>)}
                  {live.pType==="parcelado"&&<>
                    <div style={{display:"flex",justifyContent:"space-between",padding:"4px 0",fontSize:11,borderBottom:"1px solid var(--b)"}}><span style={{color:"var(--mu)"}}>Parcelas</span><span style={{fontWeight:600}}>{live.installments}x R${(+live.instValue||0).toLocaleString()}</span></div>
                    {live.payDay&&<div style={{display:"flex",justifyContent:"space-between",padding:"4px 0",fontSize:11,borderBottom:"1px solid var(--b)"}}><span style={{color:"var(--mu)"}}>Vencimento</span><span style={{fontWeight:600}}>Todo dia {live.payDay}</span></div>}
                    <div style={{display:"flex",justifyContent:"space-between",padding:"4px 0",fontSize:11}}><span style={{color:"var(--mu)"}}>Pagas</span><span style={{fontWeight:700,color:"var(--gn)"}}>{(live.paidMonths||[]).length}/{live.installments}</span></div>
                  </>}
                </div>
                {live.pType==="avista"&&<div onClick={()=>toggleAVistaPaid(live.id)} style={{display:"flex",alignItems:"center",gap:9,padding:"10px 12px",borderRadius:10,background:live.paid?"#F0FDF4":"#F7F9FC",border:`1.5px solid ${live.paid?"#BBF7D0":"#DDE3EE"}`,cursor:"pointer",userSelect:"none",marginBottom:10}}>
                  <div style={{width:22,height:22,borderRadius:6,border:`2px solid ${live.paid?"var(--gn)":"#DDE3EE"}`,background:live.paid?"var(--gn)":"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:12,color:"#fff",fontWeight:700}}>{live.paid?"✓":""}</div>
                  <span style={{fontSize:13,fontWeight:live.paid?700:500,color:live.paid?"var(--gn)":"var(--mu)"}}>{live.paid?"✓ Quitado":"Marcar como quitado"}</span>
                </div>}
                {live.pType==="parcelado"&&live.installments>0&&(()=>{
                  const pm=live.paidMonths||[];const allP=pm.length>=live.installments;
                  const now=new Date();const curIdx=live.startMonth?((now.getFullYear()-parseInt(live.startMonth.slice(0,4)))*12+(now.getMonth()-(parseInt(live.startMonth.slice(5,7))-1))):0;
                  const ci=Math.max(0,Math.min(curIdx,live.installments-1));
                  const emDia=allP||pm.includes(ci);
                  return <div>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
                      <div style={{fontSize:10,color:"var(--mu)",fontWeight:600,textTransform:"uppercase"}}>Parcelas</div>
                      <Chip color={allP?"var(--gn)":emDia?"var(--bl)":"var(--rd)"} sm>{allP?"Quitado ✓":emDia?"Em dia":"Em atraso"}</Chip>
                    </div>
                    <div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:8}}>
                      {Array.from({length:live.installments},(_,idx)=>{
                        const paid=pm.includes(idx);const isCur=idx===ci;
                        const mo=live.startMonth?MOPT[((parseInt(live.startMonth.slice(5,7))-1)+idx)%12]:`P${idx+1}`;
                        const due=instDueDate(live.startMonth,idx,live.payDay);
                        return <button key={idx} onClick={()=>togglePaid(live.id,idx)} title={due?`Vencimento: ${due}`:""} style={{width:40,height:44,borderRadius:7,border:`2px solid ${paid?"var(--gn)":isCur?"var(--bl)":"#DDE3EE"}`,background:paid?"#F0FDF4":isCur?"#EEF4FF":"#fff",color:paid?"var(--gn)":isCur?"var(--bl)":"var(--mu)",fontSize:9,fontWeight:700,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:1,position:"relative"}}>
                          {isCur&&!paid&&<div style={{position:"absolute",top:-3,right:-3,width:8,height:8,borderRadius:"50%",background:"var(--bl)"}}/>}
                          <span style={{fontSize:10}}>{mo}</span>
                          <span>{paid?"✓":"—"}</span>
                          {due&&<span style={{fontSize:7,color:paid?"var(--gn)":isCur&&!paid?"var(--rd)":"var(--mu2)",lineHeight:1}}>{due.slice(0,5)}</span>}
                        </button>;
                      })}
                    </div>
                    {allP&&<div style={{background:"#F0FDF4",border:"1.5px solid #BBF7D0",borderRadius:9,padding:"8px 12px",fontSize:12,color:"var(--gn)",fontWeight:700,marginBottom:8}}>🎉 Todas pagas!</div>}
                  </div>;
                })()}
                <div style={{display:"flex",gap:7,marginTop:6}}>
                  <Btn sz="sm" v="ghost" onClick={()=>{setForm({...live,payDay:live.payDay||"",contractFile:live.contractFile||null,enrollmentDates:live.enrollmentDates||{},pedDocs:live.pedDocs||{}});setEditingSt(live);setShowF(true);}}>✏️ Editar</Btn>
                  <button onClick={()=>{setWaM(live);setWaMsg("");}} style={{flex:1,background:"#F0FDF4",border:"1.5px solid #BBF7D0",borderRadius:9,padding:"7px 9px",color:"var(--gn)",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"DM Sans"}}>💬 WhatsApp</button>
                </div>
              </div>
            </div>
          </div>}
        </div>;
      })}
      {!filtered.length&&<div style={{textAlign:"center",padding:"28px 0",color:"var(--mu)",fontSize:12}}>Nenhum aluno encontrado</div>}
    </div>
    {waM&&<Modal title="Lembrete WhatsApp" sub={waM.name} onClose={()=>{setWaM(null);setWaMsg("");}}>
      <div style={{fontSize:11,color:"var(--bl)",fontWeight:700,marginBottom:9,background:"#EEF4FF",padding:"8px 12px",borderRadius:8}}>Para: {waM.name} · {(waM.phone||"").slice(0,14)||"sem telefone"}</div>
      {templates.length>0&&<><Lbl>Usar modelo</Lbl><div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:13}}>
        {templates.map(t=><button key={t.id} onClick={()=>{const cn=(waM.courses||[]).map(cid=>courses.find(c=>c.id===cid)?.name||"").filter(Boolean).join(", ")||"";setWaMsg(t.text.replace("{nome}",waM.name||"").replace("{curso}",cn).replace("{data}",""));}} style={{background:"#F7F9FC",border:"1.5px solid #DDE3EE",borderRadius:8,padding:"6px 12px",fontSize:11,color:"var(--mu)",cursor:"pointer",fontFamily:"DM Sans",fontWeight:600}}>{t.name}</button>)}
      </div></>}
      <div style={{background:"#F5FDF7",border:"1.5px solid #BBF7D0",borderRadius:11,padding:13,marginBottom:11}}>
        <textarea value={waMsg} onChange={e=>setWaMsg(e.target.value)} rows={5} placeholder="Escreva ou selecione modelo..." style={{width:"100%",background:"transparent",border:"none",outline:"none",color:"var(--tx)",fontSize:13,lineHeight:1.7,resize:"none",fontFamily:"DM Sans"}}/>
      </div>
      <button onClick={()=>openWA(waM,waMsg)} disabled={!waMsg.trim()} style={{width:"100%",background:waMsg.trim()?"linear-gradient(135deg,#25D366,#128C7E)":"#F7F9FC",border:"none",borderRadius:9,padding:"11px 0",color:waMsg.trim()?"#fff":"var(--mu)",fontSize:13,fontWeight:700,cursor:waMsg.trim()?"pointer":"default",fontFamily:"DM Sans",opacity:waMsg.trim()?1:.5}}>
        {waM.phone?"✓ Enviar no WhatsApp":"📋 Copiar"}
      </button>
    </Modal>}
    {showF&&<Modal title={editingSt?"Editar Aluno":"Cadastrar Aluno"} onClose={()=>{setShowF(false);setEditingSt(null);}}>
      <div className="g2"><Inp label="Nome *" value={form.name} onChange={e=>ff({name:e.target.value})}/><Inp label="E-mail" value={form.email} onChange={e=>ff({email:e.target.value})} type="email"/><Inp label="WhatsApp" value={form.phone} onChange={e=>ff({phone:e.target.value})}/><Inp label="CPF" value={form.cpf} onChange={e=>ff({cpf:e.target.value})}/><Inp label="Cidade" value={form.city} onChange={e=>ff({city:e.target.value})}/><Inp label="Ingresso" value={form.since} onChange={e=>ff({since:e.target.value})} type="month"/></div>
      <Lbl>Cursos matriculados</Lbl>
      <div style={{display:"flex",flexWrap:"wrap",gap:7,marginBottom:13}}>
        {courses.map(c=>{const en=(form.courses||[]).includes(c.id);const enrolled=students.filter(s=>s.courses.includes(c.id)&&s.id!==editingSt?.id);const isFull=enrolled.length>=c.capacity;return <button key={c.id} onClick={()=>ff({courses:en?(form.courses||[]).filter(x=>x!==c.id):[...(form.courses||[]),c.id]})} style={{display:"flex",alignItems:"center",gap:6,padding:"5px 11px",borderRadius:9,border:`1.5px solid ${en?"var(--bl)":isFull?"var(--rd)":"#DDE3EE"}`,background:en?"#EEF4FF":isFull?"#FEF2F2":"#F7F9FC",cursor:"pointer"}}>
          <div style={{width:14,height:14,borderRadius:3,border:`2px solid ${en?"var(--bl)":"#DDE3EE"}`,background:en?"var(--bl)":"transparent",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,color:"#fff",fontWeight:700}}>{en?"✓":""}</div>
          <span style={{fontSize:11,color:en?"var(--bl)":isFull?"var(--rd)":"var(--mu)",fontWeight:en?700:400}}>{c.name.split("–")[0].trim()}</span>
          {isFull&&!en&&<Chip color="var(--rd)" sm>Lotado</Chip>}
        </button>;})}
      </div>
      <Divr/>
      <div className="g2">
        <div><Lbl>Pagamento</Lbl><div style={{display:"flex",gap:7,marginBottom:13}}>{["avista","parcelado"].map(t=><button key={t} onClick={()=>ff({pType:t})} style={{flex:1,background:form.pType===t?"#EEF4FF":"#F7F9FC",border:`1.5px solid ${form.pType===t?"var(--bl)":"#DDE3EE"}`,color:form.pType===t?"var(--bl)":"var(--mu)",borderRadius:9,padding:"8px 0",fontSize:12,fontWeight:600,cursor:"pointer"}}>{t==="avista"?"À Vista":"Parcelado"}</button>)}</div></div>
        <Sel label="Forma" value={form.pMethod} onChange={e=>ff({pMethod:e.target.value})} options={PAYS}/>
      </div>
      <div className="g2"><Inp label="Valor Total (R$)" value={form.totalValue} onChange={e=>ff({totalValue:e.target.value})} type="number"/>{form.pType==="parcelado"&&<Inp label="Nº Parcelas" value={form.installments} onChange={e=>ff({installments:+e.target.value})} type="number"/>}</div>
      {form.pType==="parcelado"&&<div className="g2">
        <Inp label="Valor Parcela (R$)" value={form.instValue} onChange={e=>ff({instValue:e.target.value})} type="number"/>
        <Inp label="Início (mês/ano)" value={form.startMonth} onChange={e=>ff({startMonth:e.target.value})} type="month"/>
        <Inp label="Dia do vencimento" value={form.payDay} onChange={e=>ff({payDay:e.target.value})} type="number" placeholder="Ex: 5"/>
      </div>}
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:13}}><input type="checkbox" id="ctr" checked={!!form.contract} onChange={e=>ff({contract:e.target.checked})} style={{width:15,height:15,accentColor:"var(--bl)"}}/><label htmlFor="ctr" style={{fontSize:13,color:"var(--mu)",cursor:"pointer"}}>Contrato assinado</label></div>
      <FileUpload label="Contrato em PDF" file={form.contractFile} onFile={f=>ff({contractFile:f})} accept=".pdf"/>
      <Inp label="Observações" value={form.notes} onChange={e=>ff({notes:e.target.value})} rows={2}/>
      <Btn style={{width:"100%"}} onClick={save}>{editingSt?"Salvar alterações":"Cadastrar Aluno"}</Btn>
    </Modal>}
  </div>;
}

/* ══════════════════════════════════════════════════
   CURSOS — sem data de matrícula + checklistDeadlines
══════════════════════════════════════════════════ */
function CoursesPage({courses,setCourses,students,setStudents}){
  const[sel,setSel]=useState(null);const[showF,setShowF]=useState(false);const[tab,setTab]=useState("lista");
  const[calM,setCalM]=useState(new Date(2025,2,1));
  const[clInput,setClInput]=useState("");
  const e={name:"",type:CTYPES[0],date:"",end:"",modality:MODS[0],value:"",capacity:12,enrolled:[],waitlist:[],instructor:"",desc:"",checklist:[],checklistDeadlines:{}};
  const[form,setForm]=useState(e);const f=v=>setForm(p=>({...p,...v}));
  function addCLItem(){if(!clInput.trim())return;f({checklist:[...(form.checklist||[]),clInput.trim()]});setClInput("");}
  function removeCLItem(i){f({checklist:(form.checklist||[]).filter((_,idx)=>idx!==i),checklistDeadlines:Object.fromEntries(Object.entries(form.checklistDeadlines||{}).filter(([k])=>k!==(form.checklist||[])[i]))});}
  function setItemDeadline(item,date){f({checklistDeadlines:{...(form.checklistDeadlines||{}),[item]:date}});}
  async function save(){if(!form.name.trim())return;if(sel?.id){setCourses(cs=>cs.map(c=>c.id===sel.id?{...form,id:c.id}:c));await db.courses.update(sel.id,form);}else{const saved=await db.courses.insert(form);setCourses(cs=>[...cs,saved||{...form,id:Date.now()}]);}setShowF(false);setSel(null);setForm(e);}
  const cy=calM.getFullYear(),cm=calM.getMonth();
  const fd=new Date(cy,cm,1).getDay(),dm=new Date(cy,cm+1,0).getDate();
  function onDay(d){const ds=`${cy}-${String(cm+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;return courses.filter(c=>c.date<=ds&&c.end>=ds);}
  function getEnrolled(courseId){return students.filter(s=>s.courses.includes(courseId));}
  function getWaitlist(courseId){const c=courses.find(x=>x.id===courseId);return(c?.waitlist||[]).map(sid=>students.find(s=>s.id===sid)).filter(Boolean);}
  function confirmFromWait(courseId,studentId){
    const course=courses.find(c=>c.id===courseId);const enrolled=getEnrolled(courseId);
    if(course&&enrolled.length>=course.capacity){alert("Turma com capacidade máxima!");return;}
    setCourses(cs=>cs.map(c=>c.id!==courseId?c:{...c,waitlist:(c.waitlist||[]).filter(x=>x!==studentId)}));
    setStudents(ss=>ss.map(s=>s.id!==studentId?s:{...s,courses:[...new Set([...(s.courses||[]),courseId])],enrollmentDates:{...(s.enrollmentDates||{}),[courseId]:new Date().toISOString().slice(0,10)}}));
  }
  return <div style={{animation:"up .4s ease"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
      <div><h1 style={{fontFamily:"Playfair Display",fontSize:24,fontWeight:700}}>Cursos & Calendário</h1><p style={{color:"var(--mu)",fontSize:11}}>{courses.length} eventos</p></div>
      <div style={{display:"flex",gap:7}}>
        <BtnExport onClick={()=>{
          const rows=courses.map(c=>({
            "Nome":c.name,"Tipo":c.type,"Início":c.date,"Fim":c.end,
            "Modalidade":c.modality,"Valor (R$)":(+(c.value||0)/100).toFixed(2),
            "Vagas":c.capacity,"Inscritos":(c.enrolled||[]).length,
            "Lista espera":(c.waitlist||[]).length,"Instrutor":c.instructor,
          }));
          const byCourse=[];
          courses.forEach(c=>{
            (c.enrolled||[]).forEach(stId=>{
              const s=students.find(x=>x.id===stId);
              byCourse.push({"Curso":c.name,"Tipo":c.type,"Data":c.date,
                "Aluno":s?.name||stId,"E-mail":s?.email||"","Telefone":s?.phone||"",
                "Matrícula em":(s?.enrollmentDates||{})[c.id]||"",
                "Pgto quitado":s?.paid?"Sim":"Não"});
            });
          });
          const waitlist=[];
          courses.forEach(c=>(c.waitlist||[]).forEach(stId=>{
            const s=students.find(x=>x.id===stId);
            waitlist.push({"Curso":c.name,"Aluno":s?.name||stId,"E-mail":s?.email||"","Telefone":s?.phone||""});
          }));
          exportXLSX([
            {name:"Cursos",rows:rows.length?rows:[{"Info":"Nenhum curso"}]},
            {name:"Alunos por Curso",rows:byCourse.length?byCourse:[{"Info":"Sem inscritos"}]},
            {name:"Lista de Espera",rows:waitlist.length?waitlist:[{"Info":"Nenhuma lista de espera"}]},
          ],"IOR_Cursos");
        }}/>
        <Btn v="ghost" sz="sm" onClick={()=>setTab(t=>t==="lista"?"cal":"lista")}>{tab==="lista"?"📅 Cal":"☰ Lista"}</Btn>
        <Btn sz="sm" onClick={()=>{setForm(e);setSel(null);setShowF(true);}}>+ Novo</Btn>
      </div>
    </div>
    {tab==="lista"?<div style={{display:"flex",flexDirection:"column",gap:9}}>
      {[...courses].sort((a,b)=>a.date.localeCompare(b.date)).map((c,i)=>{
        const enrolled=getEnrolled(c.id);const waitlist=getWaitlist(c.id);const ex=sel?.id===c.id;const full=enrolled.length>=c.capacity;
        const hasDeadlines=Object.keys(c.checklistDeadlines||{}).length>0;
        return <div key={c.id} style={{background:"#fff",borderRadius:14,border:`1.5px solid ${ex?"var(--bl)":"#E5EAF3"}`,borderLeft:`4px solid ${KCL[c.type]||"var(--mu)"}`,overflow:"hidden",animation:`sr .3s ease ${i*.05}s both`,boxShadow:"var(--shadow)"}}>
          <div onClick={()=>setSel(p=>p?.id===c.id?null:c)} style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",padding:"13px 16px",cursor:"pointer"}}>
            <div style={{flex:1}}>
              <div style={{display:"flex",gap:6,marginBottom:4,flexWrap:"wrap"}}><Chip color={KCL[c.type]}>{c.type}</Chip><Chip color={c.modality==="Online"?"var(--bl)":"var(--te)"}>{c.modality}</Chip>{full&&<Chip color="var(--rd)">Turma Lotada</Chip>}</div>
              <div style={{fontWeight:700,fontSize:14}}>{c.name}</div>
              <div style={{fontSize:11,color:"var(--mu)",marginTop:2}}>📅 {fmtDate(c.date)}{c.end!==c.date?" → "+fmtDate(c.end):""} · ✦ {c.instructor}</div>
              {c.checklist?.length>0&&<div style={{fontSize:10,color:"var(--pu)",marginTop:2}}>📋 {c.checklist.length} itens{hasDeadlines?" · com prazos":""}</div>}
            </div>
            <div style={{textAlign:"right",marginLeft:11}}>
              {c.value>0&&<div style={{fontWeight:700,color:"var(--bl)",fontSize:14}}>R${(+c.value).toLocaleString()}</div>}
              <div style={{fontSize:11,color:full?"var(--rd)":"var(--gn)",marginTop:2,fontWeight:600}}>{enrolled.length}/{c.capacity} vagas</div>
              {waitlist.length>0&&<div style={{fontSize:10,color:"var(--am)",fontWeight:600}}>⏳ {waitlist.length} espera</div>}
            </div>
          </div>
          {ex&&<div style={{borderTop:"1.5px solid #E5EAF3",padding:"13px 16px",background:"#F7F9FC"}}>
            <div className="g2">
              <div>
                <div style={{fontSize:10,color:"var(--bl)",fontWeight:600,letterSpacing:.5,marginBottom:8,textTransform:"uppercase"}}>Matriculados ({enrolled.length}/{c.capacity})</div>
                {enrolled.length===0?<div style={{fontSize:11,color:"var(--mu2)"}}>Nenhum ainda</div>:enrolled.map(st=>{const ed=(st.enrollmentDates||{})[c.id];return <div key={st.id} style={{fontSize:12,padding:"4px 0",borderBottom:"1px solid var(--b)",display:"flex",alignItems:"center",gap:6}}><span style={{color:"var(--gn)"}}>✅</span>{st.name}{ed&&<span style={{fontSize:9,color:"var(--mu2)",marginLeft:"auto"}}>{fmtDate(ed)}</span>}</div>;})}
              </div>
              <div>
                <div style={{fontSize:10,color:"var(--am)",fontWeight:600,letterSpacing:.5,marginBottom:8,textTransform:"uppercase"}}>Lista de Espera</div>
                {waitlist.length===0?<div style={{fontSize:11,color:"var(--mu2)"}}>Nenhuma</div>:waitlist.map(st=><div key={st.id} style={{display:"flex",alignItems:"center",gap:7,padding:"5px 0",borderBottom:"1px solid var(--b)"}}>
                  <span style={{fontSize:11,flex:1,color:"var(--am)",fontWeight:600}}>⏳ {st.name}</span>
                  <Btn sz="sm" v="green" onClick={()=>confirmFromWait(c.id,st.id)}>Confirmar</Btn>
                </div>)}
                {c.checklist?.length>0&&<><Divr/><div style={{fontSize:10,color:"var(--pu)",fontWeight:600,marginBottom:6}}>Checklist do curso</div>{c.checklist.map((it,idx)=>{const al=c.checklistDeadlines?.[it]?itemAlert(c.checklistDeadlines[it]):null;return <div key={idx} style={{fontSize:11,color:"var(--mu)",padding:"3px 0",display:"flex",alignItems:"center",gap:5}}>• {it}{al&&<Chip color={al.color} sm>{al.label}</Chip>}</div>;})}</>}
              </div>
            </div>
            <div style={{display:"flex",gap:7,marginTop:12}}>
              <Btn sz="sm" v="ghost" onClick={e=>{e.stopPropagation();setForm({...c,checklistDeadlines:c.checklistDeadlines||{}});setShowF(true);}}>Editar</Btn>
              <Btn sz="sm" v="danger" onClick={e=>{e.stopPropagation();setCourses(cs=>cs.filter(x=>x.id!==c.id));setSel(null);}}>Excluir</Btn>
            </div>
          </div>}
        </div>;})}
    </div>:(
      <div style={{background:"#fff",borderRadius:16,border:"1px solid var(--b)",overflow:"hidden",boxShadow:"var(--shadow)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"13px 18px",borderBottom:"1px solid var(--b)"}}>
          <button onClick={()=>setCalM(new Date(cy,cm-1,1))} style={{background:"#F7F9FC",border:"1.5px solid #DDE3EE",borderRadius:7,width:28,height:28,color:"var(--tx)",cursor:"pointer",fontSize:14}}>‹</button>
          <div style={{fontFamily:"Playfair Display",fontSize:18,fontWeight:700}}>{MNS[cm]} {cy}</div>
          <button onClick={()=>setCalM(new Date(cy,cm+1,1))} style={{background:"#F7F9FC",border:"1.5px solid #DDE3EE",borderRadius:7,width:28,height:28,color:"var(--tx)",cursor:"pointer",fontSize:14}}>›</button>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",borderBottom:"1px solid var(--b)"}}>{["D","S","T","Q","Q","S","S"].map((d,i)=><div key={i} style={{padding:"7px 0",textAlign:"center",fontSize:10,color:"var(--mu)",fontWeight:600}}>{d}</div>)}</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)"}}>
          {Array.from({length:fd}).map((_,i)=><div key={"e"+i} style={{borderRight:"1px solid var(--b)",borderBottom:"1px solid var(--b)",minHeight:65}}/>)}
          {Array.from({length:dm}).map((_,i)=>{const day=i+1,dcs=onDay(day);return <div key={day} style={{borderRight:"1px solid var(--b)",borderBottom:"1px solid var(--b)",minHeight:65,padding:5}}>
            <div style={{fontSize:10,fontWeight:600,color:"var(--mu)",marginBottom:2}}>{day}</div>
            {dcs.map(c=><div key={c.id} onClick={()=>setSel(p=>p?.id===c.id?null:c)} style={{background:`${KCL[c.type]||"#9AAAC0"}18`,borderLeft:`2px solid ${KCL[c.type]}`,borderRadius:3,padding:"2px 5px",fontSize:8,fontWeight:600,color:KCL[c.type],marginBottom:1,cursor:"pointer",overflow:"hidden",whiteSpace:"nowrap",textOverflow:"ellipsis"}}>{c.name.split("–")[0].trim()}</div>)}
          </div>;})}
        </div>
      </div>
    )}
    {showF&&<Modal title="Cadastrar / Editar Curso" onClose={()=>setShowF(false)} wide>
      <Inp label="Nome *" value={form.name} onChange={e=>f({name:e.target.value})}/>
      <Inp label="Descrição" value={form.desc} onChange={e=>f({desc:e.target.value})} rows={2}/>
      <div className="g2">
        <Sel label="Tipo" value={form.type} onChange={e=>f({type:e.target.value})} options={CTYPES}/>
        <Sel label="Modalidade" value={form.modality} onChange={e=>f({modality:e.target.value})} options={MODS}/>
        <Inp label="Data início" value={form.date} onChange={e=>f({date:e.target.value})} type="date"/>
        <Inp label="Data fim" value={form.end} onChange={e=>f({end:e.target.value})} type="date"/>
        <Inp label="Valor (R$)" value={form.value} onChange={e=>f({value:e.target.value})} type="number"/>
        <Inp label="Vagas" value={form.capacity} onChange={e=>f({capacity:+e.target.value})} type="number"/>
      </div>
      <Inp label="Instrutor(a)" value={form.instructor} onChange={e=>f({instructor:e.target.value})}/>
      <Lbl>Checklist do Curso + Prazos de Entrega (opcional por item)</Lbl>
      <div style={{display:"flex",gap:8,marginBottom:8}}>
        <input value={clInput} onChange={e=>setClInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addCLItem()} placeholder="Novo item de checklist..." style={{flex:1,background:"#F7F9FC",border:"1.5px solid #DDE3EE",borderRadius:9,padding:"8px 12px",color:"var(--tx)",fontSize:12,outline:"none",fontFamily:"DM Sans"}}/>
        <Btn sz="sm" onClick={addCLItem}>+</Btn>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:13}}>
        {(form.checklist||[]).map((it,i)=>{const al=form.checklistDeadlines?.[it]?itemAlert(form.checklistDeadlines[it]):null;return <div key={i} style={{display:"flex",alignItems:"center",gap:8,background:"#F7F9FC",borderRadius:9,padding:"7px 10px",border:"1px solid var(--b)"}}>
          <span style={{flex:1,fontSize:12,fontWeight:600,color:"var(--tx)"}}>{it}</span>
          <input type="date" value={form.checklistDeadlines?.[it]||""} onChange={e=>setItemDeadline(it,e.target.value)} title="Prazo de entrega (opcional)" style={{background:"#fff",border:`1.5px solid ${al?al.color:"#DDE3EE"}`,borderRadius:7,padding:"4px 8px",fontSize:11,color:"var(--mu)",outline:"none",fontFamily:"DM Sans"}}/>
          {al&&<Chip color={al.color} sm>{al.label}</Chip>}
          <button onClick={()=>removeCLItem(i)} style={{background:"transparent",border:"none",color:"var(--rd)",cursor:"pointer",fontSize:14}}>×</button>
        </div>;})}
        {!(form.checklist||[]).length&&<div style={{fontSize:11,color:"var(--mu2)"}}>Sem itens de checklist — alunos poderão receber certificado livremente.</div>}
      </div>
      {(form.checklist||[]).length>0&&<div style={{background:"#FFF7ED",borderRadius:9,padding:"8px 12px",fontSize:11,color:"var(--am)",marginBottom:13,fontWeight:600}}>⏰ Itens com prazo definido bloquearão a emissão de certificado até serem concluídos.</div>}
      <Btn style={{width:"100%"}} onClick={save}>{sel?.id?"Salvar":"Cadastrar"}</Btn>
    </Modal>}
  </div>;
}

/* ══════════════════════════════════════════════════
   FINANCEIRO — gráfico meta corrigido + inadimplentes
══════════════════════════════════════════════════ */
function FinancialPage({sales,setSales,courses,students}){
  const[tab,setTab]=useState("vendas");
  const[showAdd,setShowAdd]=useState(false);
  const[fT,setFT]=useState("Todos");
  const[fM,setFM]=useState("Todos");
  const[goals,setGoals]=useState({Curso:5000,Workshop:2000,Produto:1000,Atendimento:800});
  const[eG,setEG]=useState({});
  const[showGE,setShowGE]=useState(false);
  const[cF,setCF]=useState("Todos");
  const e={date:new Date().toISOString().slice(0,10),studentId:null,desc:"",value:"",payment:PAYS[0],type:"Curso",notes:""};
  const[form,setForm]=useState(e);const f=v=>setForm(p=>({...p,...v}));
  const months=[...new Set(sales.map(s=>s.date?.slice(0,7)).filter(Boolean))].sort().reverse();
  const filtered=sales.filter(s=>(fT==="Todos"||s.type===fT)&&(fM==="Todos"||s.date?.startsWith(fM)));
  const total=filtered.reduce((s,v)=>s+(+v.value||0),0);
  const tT=t=>sales.filter(s=>s.type===t).reduce((s,v)=>s+(+v.value||0),0);
  const gP=t=>Math.min(100,Math.round((tT(t)/(goals[t]||1))*100));
  const sName=id=>{const s=students.find(x=>x.id===id);return s?.name||"—";};
  const confirmed=confirmedRevenue(students);
  const monthMap={};
  sales.forEach(s=>{const m=s.date?.slice(0,7);if(!m)return;if(!monthMap[m])monthMap[m]={};monthMap[m][s.type]=(monthMap[m][s.type]||0)+(+s.value||0);});
  const monthlyGoal=cF==="Todos"?Object.values(goals).reduce((a,b)=>a+b,0):(goals[cF]||0);
  const chartData=Object.keys(monthMap).sort().slice(-8).map(m=>{
    const real=cF==="Todos"?STYPES.reduce((a,t)=>a+(monthMap[m][t]||0),0):(monthMap[m][cF]||0);
    return{mes:MOPT[parseInt(m.slice(5,7))-1],Real:real,Meta:monthlyGoal};
  });
  const inadimplentes=students.filter(isOverdue);
  async function save(){if(!form.desc||!form.value)return;const data={...form,value:+form.value};const saved=await db.sales.insert(data);setSales(ss=>[...ss,saved||{...data,id:Date.now()}]);setShowAdd(false);setForm(e);}
  return <div style={{animation:"up .4s ease"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
      <h1 style={{fontFamily:"Playfair Display",fontSize:24,fontWeight:700}}>Financeiro</h1>
      <div style={{display:"flex",gap:8}}>
        <BtnExport onClick={()=>{
          const rows = sales.map(s=>{
            const st=students.find(x=>x.id===s.studentId);
            return {
              "Data": s.date,
              "Descrição": s.desc,
              "Tipo": s.type,
              "Valor (R$)": (+(s.value||0)/100).toFixed(2),
              "Pagamento": s.payment,
              "Aluno": st?.name||"—",
              "Notas": s.notes,
            };
          });

          // Resumo por tipo
          const tipos = [...new Set(sales.map(s=>s.type))];
          const resumo = tipos.map(t=>({
            "Tipo": t,
            "Qtd vendas": sales.filter(s=>s.type===t).length,
            "Total (R$)": (sales.filter(s=>s.type===t).reduce((a,s)=>a+(+s.value||0),0)/100).toFixed(2),
          }));

          exportXLSX([
            { name: "Todas as Vendas", rows: rows.length?rows:[{"Info":"Nenhuma venda"}] },
            { name: "Resumo por Tipo", rows: resumo.length?resumo:[{"Info":"Sem dados"}] },
          ], "IOR_Financeiro");
        }}/>
        <Btn sz="sm" onClick={()=>setShowAdd(true)}>+ Registrar Venda</Btn>
      </div>
    </div>
    <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:12}}>
      {STYPES.map(t=><div key={t} style={{background:"#fff",borderRadius:14,padding:"12px 15px",flex:1,minWidth:110,border:"1px solid var(--b)",boxShadow:"var(--shadow)"}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}><span style={{fontSize:10,color:"var(--mu)",fontWeight:600,textTransform:"uppercase"}}>{t}</span><Dot color={TCL[t]} size={7}/></div>
        <div style={{fontFamily:"Playfair Display",fontSize:20,fontWeight:700,color:TCL[t]}}>R${tT(t).toLocaleString()}</div>
        <div style={{background:"#F0F4FA",borderRadius:99,height:4,marginTop:6,overflow:"hidden"}}><div style={{width:`${gP(t)}%`,height:"100%",background:TCL[t],borderRadius:99,transition:"width .8s ease"}}/></div>
        <div style={{fontSize:9,color:"var(--mu)",marginTop:2}}>{gP(t)}% · meta R${(goals[t]||0).toLocaleString()}/mês</div>
      </div>)}
    </div>
    <div style={{background:"#EEF4FF",borderRadius:12,padding:"12px 16px",marginBottom:16,border:"1px solid #C7D7F5",display:"flex",gap:16,alignItems:"center",flexWrap:"wrap"}}>
      <div><div style={{fontSize:10,color:"var(--bl)",fontWeight:600,textTransform:"uppercase",letterSpacing:.5}}>Receita Confirmada (alunos)</div><div style={{fontFamily:"Playfair Display",fontSize:22,fontWeight:700,color:"var(--gn)"}}>R${confirmed.toLocaleString()}</div><div style={{fontSize:10,color:"var(--mu)"}}>Pagamentos ticados no módulo Alunos</div></div>
      <div style={{borderLeft:"1px solid var(--b)",paddingLeft:16}}>
        <div style={{fontSize:10,color:"var(--rd)",fontWeight:600,textTransform:"uppercase"}}>Inadimplentes</div>
        <div style={{fontFamily:"Playfair Display",fontSize:22,fontWeight:700,color:"var(--rd)"}}>{inadimplentes.length}</div>
        <div style={{fontSize:10,color:"var(--mu)"}}>alunos com pagamento em atraso</div>
      </div>
    </div>
    <div style={{display:"flex",gap:0,borderBottom:"2px solid var(--b)",marginBottom:16}}>
      {[["vendas","◈ Vendas"],["grafico","▦ Gráfico"],["metas","❋ Metas"],["inadimplentes","⚠ Inadimplentes"]].map(([id,lbl])=><button key={id} onClick={()=>setTab(id)} style={{padding:"8px 15px",border:"none",background:"transparent",fontFamily:"DM Sans",fontSize:12,fontWeight:600,cursor:"pointer",color:tab===id?"var(--bl)":"var(--mu)",borderBottom:`2px solid ${tab===id?"var(--bl)":"transparent"}`,marginBottom:-2}}>{lbl}{id==="inadimplentes"&&inadimplentes.length>0&&<span style={{background:"var(--rd)",color:"#fff",borderRadius:99,padding:"1px 6px",fontSize:9,marginLeft:5,fontWeight:700}}>{inadimplentes.length}</span>}</button>)}
    </div>
    {tab==="vendas"&&<>
      <div style={{display:"flex",gap:8,marginBottom:11,flexWrap:"wrap"}}>
        <select value={fM} onChange={e=>setFM(e.target.value)} style={{background:"#fff",border:"1.5px solid #DDE3EE",borderRadius:9,padding:"7px 11px",color:"var(--mu)",fontSize:12,outline:"none",fontFamily:"DM Sans"}}>
          <option value="Todos">Todos os meses</option>{months.map(m=><option key={m}>{m}</option>)}
        </select>
        {["Todos",...STYPES].map(t=><button key={t} onClick={()=>setFT(t)} style={{background:fT===t?`${TCL[t]||"var(--bl)"}15`:"#fff",border:`1.5px solid ${fT===t?TCL[t]||"var(--bl)":"#DDE3EE"}`,color:fT===t?TCL[t]||"var(--bl)":"var(--mu)",borderRadius:99,padding:"6px 12px",fontSize:11,fontWeight:600,cursor:"pointer"}}>{t}</button>)}
      </div>
      <div className="tw"><div style={{background:"#fff",borderRadius:14,border:"1px solid var(--b)",overflow:"hidden",minWidth:460,boxShadow:"var(--shadow)"}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
          <thead><tr style={{background:"#F7F9FC",borderBottom:"1px solid var(--b)"}}>{["Data","Aluno","Descrição","Pagamento","Tipo","Valor"].map(h=><th key={h} style={{padding:"9px 12px",textAlign:"left",fontSize:10,color:"var(--mu)",fontWeight:600,letterSpacing:.4,textTransform:"uppercase",whiteSpace:"nowrap"}}>{h}</th>)}</tr></thead>
          <tbody>
            {filtered.map((s,i)=><tr key={s.id} style={{borderBottom:"1px solid var(--b)",animation:`sr .3s ease ${i*.04}s both`}}>
              <td style={{padding:"9px 12px",color:"var(--mu)",whiteSpace:"nowrap"}}>{fmtDate(s.date)}</td>
              <td style={{padding:"9px 12px",fontWeight:600,whiteSpace:"nowrap"}}>{sName(s.studentId)}</td>
              <td style={{padding:"9px 12px",color:"var(--mu)",maxWidth:150,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.desc}</td>
              <td style={{padding:"9px 12px",whiteSpace:"nowrap"}}><Chip color="var(--mu)" sm>{s.payment}</Chip></td>
              <td style={{padding:"9px 12px",whiteSpace:"nowrap"}}><Chip color={TCL[s.type]} sm>{s.type}</Chip></td>
              <td style={{padding:"9px 12px",fontWeight:700,color:"var(--bl)",whiteSpace:"nowrap"}}>R${(+s.value).toLocaleString()}</td>
            </tr>)}
            <tr style={{background:"#F7F9FC"}}><td colSpan={5} style={{padding:"9px 12px",fontWeight:700,textAlign:"right",color:"var(--mu)"}}>Total:</td><td style={{padding:"9px 12px",fontWeight:800,color:"var(--bl)",fontSize:14}}>R${total.toLocaleString()}</td></tr>
          </tbody>
        </table>
      </div></div>
    </>}
    {tab==="grafico"&&<>
      <div style={{display:"flex",gap:7,marginBottom:13,flexWrap:"wrap"}}>
        {["Todos",...STYPES].map(t=><button key={t} onClick={()=>setCF(t)} style={{background:cF===t?`${TCL[t]||"var(--bl)"}15`:"#fff",border:`1.5px solid ${cF===t?TCL[t]||"var(--bl)":"#DDE3EE"}`,color:cF===t?TCL[t]||"var(--bl)":"var(--mu)",borderRadius:99,padding:"6px 12px",fontSize:11,fontWeight:600,cursor:"pointer"}}>{t}</button>)}
      </div>
      <div style={{background:"#fff",borderRadius:16,padding:20,border:"1px solid var(--b)",boxShadow:"var(--shadow)"}}>
        <div style={{fontFamily:"Playfair Display",fontSize:16,fontWeight:600,marginBottom:3}}>Receita Real vs Meta Mensal</div>
        <div style={{fontSize:11,color:"var(--mu)",marginBottom:14}}>Meta: R${monthlyGoal.toLocaleString()}/mês · linha tracejada roxa</div>
        {chartData.length>0?<ResponsiveContainer width="100%" height={220}>
          <LineChart data={chartData} margin={{top:8,right:16,left:-15,bottom:0}}>
            <XAxis dataKey="mes" tick={{fontSize:10,fill:"#9AAAC0"}} axisLine={false} tickLine={false}/>
            <YAxis tick={{fontSize:9,fill:"#9AAAC0"}} axisLine={false} tickLine={false} tickFormatter={v=>v>=1000?`${(v/1000).toFixed(0)}k`:v}/>
            <Tooltip formatter={(val,name)=>[`R$${Number(val).toLocaleString("pt-BR")}`,name]} contentStyle={{background:"#fff",border:"1px solid #DDE3EE",borderRadius:8,fontSize:12,boxShadow:"0 4px 16px rgba(30,40,80,.12)"}}/>
            <CartesianGrid strokeDasharray="3 3" stroke="#EEF1F7" vertical={false}/>
            <Legend wrapperStyle={{fontSize:12,color:"#6B7A99",paddingTop:8}}/>
            <Line type="monotone" dataKey="Real" stroke="#3066BE" strokeWidth={3} dot={{fill:"#3066BE",r:5,strokeWidth:0}} activeDot={{r:7}}/>
            <Line type="monotone" dataKey="Meta" stroke="#6244B8" strokeWidth={2} strokeDasharray="8 4" dot={false}/>
          </LineChart>
        </ResponsiveContainer>:<div style={{textAlign:"center",padding:"32px 0",color:"var(--mu)",fontSize:12}}>Sem dados</div>}
      </div>
    </>}
    {tab==="metas"&&<>
      <div style={{background:"#fff",borderRadius:16,padding:20,border:"1px solid var(--b)",boxShadow:"var(--shadow)",marginBottom:13}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}><div style={{fontFamily:"Playfair Display",fontSize:16,fontWeight:600}}>Metas Mensais</div><Btn sz="sm" v="ghost" onClick={()=>{setEG({...goals});setShowGE(true);}}>✏️ Editar</Btn></div>
        {STYPES.map(t=>{const a=tT(t);const p=gP(t);return <div key={t} style={{marginBottom:16}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}><div style={{display:"flex",alignItems:"center",gap:8}}><Dot color={TCL[t]} size={9}/><span style={{fontWeight:600,fontSize:13}}>{t}</span></div><div style={{textAlign:"right"}}><span style={{fontWeight:700,color:TCL[t]}}>R${a.toLocaleString()}</span><span style={{color:"var(--mu)",fontSize:11}}> / R${(goals[t]||0).toLocaleString()}/mês</span></div></div>
          <div style={{background:"#F0F4FA",borderRadius:99,height:8,overflow:"hidden"}}><div style={{width:`${p}%`,height:"100%",background:TCL[t],borderRadius:99,transition:"width 1s ease"}}/></div>
          <div style={{fontSize:11,color:p>=100?"var(--gn)":p>=70?"var(--am)":"var(--rd)",marginTop:3,fontWeight:600}}>{p}% {p>=100?"✓ Atingida!":p>=70?"Quase lá!":"Precisa acelerar"}</div>
        </div>;})}
      </div>
      {showGE&&<div style={{background:"#fff",borderRadius:16,padding:20,border:"1px solid var(--b)",boxShadow:"var(--shadow)"}}>
        <div style={{fontFamily:"Playfair Display",fontSize:15,fontWeight:600,marginBottom:13}}>Editar Metas Mensais</div>
        {STYPES.map(t=><div key={t} style={{display:"flex",alignItems:"center",gap:11,marginBottom:10}}><Dot color={TCL[t]} size={8}/><span style={{fontSize:13,fontWeight:600,minWidth:95}}>{t}</span><input type="number" value={eG[t]||goals[t]||0} onChange={e=>setEG(g=>({...g,[t]:+e.target.value}))} style={{flex:1,background:"#F7F9FC",border:"1.5px solid #DDE3EE",borderRadius:9,padding:"8px 12px",color:"var(--tx)",fontSize:13,outline:"none",fontFamily:"DM Sans"}}/></div>)}
        <div style={{display:"flex",gap:8,marginTop:8}}><Btn style={{flex:1}} onClick={()=>{setGoals({...eG});setShowGE(false);}}>Salvar</Btn><Btn v="ghost" onClick={()=>setShowGE(false)}>Cancelar</Btn></div>
      </div>}
    </>}
    {tab==="inadimplentes"&&<div>
      <div style={{marginBottom:13,fontSize:12,color:"var(--mu)"}}>Alunos com pagamento pendente ou em atraso</div>
      {inadimplentes.length===0?<div style={{textAlign:"center",padding:"32px 0",color:"var(--gn)",fontSize:14,fontWeight:600}}>🎉 Nenhum inadimplente!</div>:inadimplentes.map((s,i)=>{
        const pendingVal=s.pType==="parcelado"?((s.installments||0)-(s.paidMonths||[]).length)*(+s.instValue||0):(+s.totalValue||0);
        return <div key={s.id} style={{background:"#fff",borderRadius:14,padding:"14px 16px",border:"1.5px solid #FECACA",marginBottom:9,animation:`sr .3s ease ${i*.05}s both`,boxShadow:"var(--shadow)"}}>
          <div style={{display:"flex",alignItems:"center",gap:11}}>
            <Av letter={s.name[0]} size={36} color="var(--rd)"/>
            <div style={{flex:1}}>
              <div style={{fontWeight:700,fontSize:13}}>{s.name}</div>
              <div style={{fontSize:11,color:"var(--mu)",marginTop:2}}>{s.email} · {s.phone}</div>
              <div style={{display:"flex",gap:6,marginTop:5,flexWrap:"wrap"}}>
                <Chip color="var(--rd)" sm>{s.pType==="parcelado"?`${(s.paidMonths||[]).length}/${s.installments} pagas`:"À vista — pendente"}</Chip>
                <Chip color="var(--am)" sm>Pendente: R${pendingVal.toLocaleString()}</Chip>
              </div>
            </div>
            {s.phone&&<a href={`https://wa.me/55${s.phone.replace(/\D/g,"")}?text=${encodeURIComponent("Olá "+s.name+"! Passando para confirmar sua presença no curso. Qualquer dúvida estamos à disposição! 🌿")}`} target="_blank" rel="noreferrer" style={{background:"linear-gradient(135deg,#25D366,#128C7E)",border:"none",borderRadius:9,padding:"8px 12px",color:"#fff",fontSize:11,fontWeight:700,textDecoration:"none",fontFamily:"DM Sans"}} title="Abrir WhatsApp com mensagem">💬 WA</a>}
          </div>
        </div>;
      })}
    </div>}
    {showAdd&&<Modal title="Registrar Venda Manual" onClose={()=>setShowAdd(false)}>
      <div className="g2"><Inp label="Data" value={form.date} onChange={e=>f({date:e.target.value})} type="date"/><Inp label="Descrição *" value={form.desc} onChange={e=>f({desc:e.target.value})}/></div>
      <Lbl>Aluno (opcional)</Lbl>
      <select value={form.studentId||""} onChange={e=>f({studentId:e.target.value?+e.target.value:null})} style={{width:"100%",background:"#F7F9FC",border:"1.5px solid #DDE3EE",borderRadius:10,padding:"10px 13px",color:"var(--tx)",fontSize:13,outline:"none",fontFamily:"DM Sans",marginBottom:13}}>
        <option value="">Selecionar aluno...</option>{students.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
      </select>
      <div className="g2"><Inp label="Valor (R$) *" value={form.value} onChange={e=>f({value:e.target.value})} type="number"/><Sel label="Pagamento" value={form.payment} onChange={e=>f({payment:e.target.value})} options={PAYS}/></div>
      <Lbl>Tipo</Lbl><div style={{display:"flex",gap:7,marginBottom:13,flexWrap:"wrap"}}>{STYPES.map(t=><button key={t} onClick={()=>f({type:t})} style={{flex:1,background:form.type===t?`${TCL[t]}15`:"#F7F9FC",border:`1.5px solid ${form.type===t?TCL[t]:"#DDE3EE"}`,color:form.type===t?TCL[t]:"var(--mu)",borderRadius:9,padding:"8px 0",fontSize:12,fontWeight:600,cursor:"pointer"}}>{t}</button>)}</div>
      <Btn style={{width:"100%"}} onClick={save}>Registrar</Btn>
    </Modal>}
  </div>;
}

/* ══════════════════════════════════════════════════
   CHECKLIST
══════════════════════════════════════════════════ */
function ChecklistPage({checks,setChecks}){
  const[nT,setNT]=useState("");const[nP,setNP]=useState("Média");const[nD,setND]=useState("");const[nA,setNA]=useState("");
  const[filter,setFilter]=useState("todas");const[showSLA,setShowSLA]=useState(false);const[editSLA,setEditSLA]=useState(null);
  const[slaConf,setSlaConf]=useState({Alta:{hours:6,notifyBefore:2},Média:{hours:24,notifyBefore:4},Baixa:{hours:48,notifyBefore:8}});
  const PC={Alta:"var(--rd)",Média:"var(--am)",Baixa:"var(--gn)"};
  const filtered=filter==="todas"?checks:filter==="feitas"?checks.filter(c=>c.done):checks.filter(c=>!c.done);
  async function add(){if(!nT.trim())return;const data={text:nT.trim(),done:false,priority:nP,due:nD,assignee:nA};const saved=await db.checks.insert(data);setChecks(cs=>[...cs,saved||{...data,id:Date.now(),createdAt:new Date().toISOString()}]);setNT("");setND("");setNA("");}
  async function toggle(id){let updated;setChecks(cs=>cs.map(c=>{if(c.id!==id)return c;updated={...c,done:!c.done};return updated;}));if(updated)await db.checks.update(id,updated);}
  async function remove(id){setChecks(cs=>cs.filter(c=>c.id!==id));await db.checks.delete(id);}
  function getSLA(c){if(c.done||!c.createdAt)return null;const conf=slaConf[c.priority]||slaConf.Média;const dl=new Date(new Date(c.createdAt).getTime()+conf.hours*3600000);const na=new Date(dl.getTime()-conf.notifyBefore*3600000);const now=new Date();const hl=Math.round((dl-now)/3600000);if(now>=dl)return{s:"vencido",label:`SLA vencido há ${Math.abs(hl)}h`,color:"var(--rd)"};if(now>=na)return{s:"alerta",label:`⚠️ ${hl}h restantes`,color:"var(--am)"};return{s:"ok",label:`${hl}h (SLA ${conf.hours}h)`,color:"var(--gn)"};}
  return <div style={{animation:"up .4s ease"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
      <div><h1 style={{fontFamily:"Playfair Display",fontSize:24,fontWeight:700}}>Checklist</h1><p style={{color:"var(--mu)",fontSize:11,marginTop:2}}>{checks.filter(c=>!c.done).length} pendente(s)</p></div>
      <Btn sz="sm" v="ghost" onClick={()=>setShowSLA(s=>!s)}>⚙️ SLA</Btn>
    </div>
    {showSLA&&<div style={{background:"#fff",borderRadius:14,padding:16,border:"1.5px solid var(--bl)",marginBottom:14,boxShadow:"var(--shadow)"}}>
      <div style={{fontFamily:"Playfair Display",fontSize:14,fontWeight:600,marginBottom:12}}>Configurar SLA por Prioridade</div>
      {PRIOS.map(p=>{const c=slaConf[p];const ed=editSLA===p;return <div key={p} style={{display:"flex",alignItems:"center",gap:11,padding:"9px 0",borderBottom:"1px solid var(--b)"}}>
        <Dot color={PC[p]} size={9}/><span style={{fontSize:13,fontWeight:600,minWidth:55,color:PC[p]}}>{p}</span>
        {ed?<div style={{display:"flex",gap:9,flex:1,flexWrap:"wrap",alignItems:"center"}}>
          <div style={{display:"flex",alignItems:"center",gap:5}}><span style={{fontSize:11,color:"var(--mu)"}}>Prazo:</span><input type="number" defaultValue={c.hours} min={1} id={"sh_"+p} style={{width:55,background:"#F7F9FC",border:"1.5px solid var(--bl)",borderRadius:7,padding:"5px 7px",color:"var(--tx)",fontSize:12,outline:"none",fontFamily:"DM Sans"}}/><span style={{fontSize:11,color:"var(--mu)"}}>h</span></div>
          <div style={{display:"flex",alignItems:"center",gap:5}}><span style={{fontSize:11,color:"var(--mu)"}}>Avisar:</span><input type="number" defaultValue={c.notifyBefore} min={1} id={"sn_"+p} style={{width:55,background:"#F7F9FC",border:"1.5px solid var(--bl)",borderRadius:7,padding:"5px 7px",color:"var(--tx)",fontSize:12,outline:"none",fontFamily:"DM Sans"}}/><span style={{fontSize:11,color:"var(--mu)"}}>h antes</span></div>
          <Btn sz="sm" onClick={()=>{const h=+document.getElementById("sh_"+p).value||c.hours;const n=+document.getElementById("sn_"+p).value||c.notifyBefore;setSlaConf(x=>({...x,[p]:{hours:h,notifyBefore:n}}));setEditSLA(null);}}>✓</Btn>
          <Btn sz="sm" v="ghost" onClick={()=>setEditSLA(null)}>✕</Btn>
        </div>:<div style={{flex:1,display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:12,color:"var(--mu)"}}>Prazo: <strong>{c.hours}h</strong> · Avisar <strong>{c.notifyBefore}h antes</strong></span><Btn sz="sm" v="ghost" onClick={()=>setEditSLA(p)}>✏️</Btn></div>}
      </div>;})}
    </div>}
    <div style={{background:"#fff",borderRadius:14,padding:16,border:"1px solid var(--b)",marginBottom:14,boxShadow:"var(--shadow)"}}>
      <Inp value={nT} onChange={e=>setNT(e.target.value)} placeholder="Nova tarefa..."/>
      <div style={{display:"flex",gap:9,flexWrap:"wrap"}}>
        <div style={{display:"flex",gap:5}}>{PRIOS.map(p=><button key={p} onClick={()=>setNP(p)} style={{background:nP===p?`${PC[p]}15`:"#F7F9FC",border:`1.5px solid ${nP===p?PC[p]:"#DDE3EE"}`,color:nP===p?PC[p]:"var(--mu)",borderRadius:99,padding:"5px 11px",fontSize:11,fontWeight:600,cursor:"pointer"}}>{p}</button>)}</div>
        <select value={nA} onChange={e=>setNA(e.target.value)} style={{background:"#F7F9FC",border:"1.5px solid #DDE3EE",borderRadius:9,padding:"5px 11px",color:nA?"var(--tx)":"var(--mu)",fontSize:12,outline:"none",fontFamily:"DM Sans"}}><option value="">Atribuir para...</option>{TEAM.map(t=><option key={t}>{t}</option>)}</select>
        <input type="date" value={nD} onChange={e=>setND(e.target.value)} style={{background:"#F7F9FC",border:"1.5px solid #DDE3EE",borderRadius:9,padding:"5px 11px",color:"var(--mu)",fontSize:12,outline:"none",fontFamily:"DM Sans"}}/>
        <Btn onClick={add}>+ Adicionar</Btn>
      </div>
    </div>
    <div style={{display:"flex",gap:7,marginBottom:12}}>{[["todas","Todas"],["pendentes","Pendentes"],["feitas","Concluídas"]].map(([v,l])=><button key={v} onClick={()=>setFilter(v)} style={{background:filter===v?"#EEF4FF":"#fff",border:`1.5px solid ${filter===v?"var(--bl)":"#DDE3EE"}`,color:filter===v?"var(--bl)":"var(--mu)",borderRadius:99,padding:"6px 14px",fontSize:12,fontWeight:600,cursor:"pointer",boxShadow:"var(--shadow)"}}>{l}</button>)}</div>
    <div style={{display:"flex",flexDirection:"column",gap:7}}>
      {filtered.map((c,i)=>{const sla=getSLA(c);return <div key={c.id} style={{background:"#fff",borderRadius:12,padding:"12px 14px",border:`1.5px solid ${sla?.s==="vencido"?"#FECACA":sla?.s==="alerta"?"#FDE68A":"#E5EAF3"}`,display:"flex",alignItems:"flex-start",gap:11,animation:`sr .3s ease ${i*.04}s both`,opacity:c.done?.6:1,borderLeft:`3px solid ${PC[c.priority]}`,boxShadow:"var(--shadow)"}}>
        <button onClick={()=>toggle(c.id)} style={{width:21,height:21,borderRadius:6,border:`2px solid ${c.done?"var(--gn)":PC[c.priority]}`,background:c.done?"var(--gn)":"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:1,fontSize:11,color:"#fff"}}>{c.done?"✓":""}</button>
        <div style={{flex:1}}>
          <div style={{fontSize:13,fontWeight:c.done?400:600,textDecoration:c.done?"line-through":"none",color:c.done?"var(--mu)":"var(--tx)",marginBottom:5}}>{c.text}</div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}><Chip color={PC[c.priority]} sm>{c.priority}</Chip>{c.assignee&&<Chip color="var(--bl)" sm>👤 {c.assignee}</Chip>}{c.due&&<Chip color="var(--mu)" sm>📅 {fmtDate(c.due)}</Chip>}</div>
          {sla&&<div style={{fontSize:10,color:sla.color,marginTop:4,fontWeight:600}}>⏱ {sla.label}</div>}
        </div>
        <button onClick={()=>remove(c.id)} style={{background:"transparent",border:"none",color:"#DDE3EE",cursor:"pointer",fontSize:15,padding:"0 3px",flexShrink:0}}>×</button>
      </div>;})}
      {!filtered.length&&<div style={{textAlign:"center",padding:"24px 0",color:"var(--mu)",fontSize:12}}>Nenhuma tarefa</div>}
    </div>
  </div>;
}

/* ══════════════════════════════════════════════════
   WHATSAPP LEMBRETES
══════════════════════════════════════════════════ */
function WhatsAppPage({leads,students,courses,templates,setTemplates}){
  const[mode,setMode]=useState("aluno");const[fC,setFC]=useState("");const[fS,setFS]=useState("");
  const[target,setTarget]=useState(null);const[msg,setMsg]=useState("");
  const[tab,setTab]=useState("enviar");const[showTM,setShowTM]=useState(false);const[nTN,setNTN]=useState("");
  const cN=[...new Set(courses.map(c=>c.name))];
  const espera=courses.filter(c=>!fC||c.name===fC).flatMap(c=>(c.waitlist||[]).map(sid=>{const st=students.find(s=>s.id===sid);return st?{...st,courseName:c.name,courseDate:c.date}:null;})).filter(Boolean);
  const inadimplentes=students.filter(isOverdue);
  const list=mode==="lead"?leads.filter(l=>(!fS||l.stage===fS)&&(!fC||courses.find(c=>c.id===l.courseId)?.name.toLowerCase().includes(fC.toLowerCase()))):mode==="aluno"?students:mode==="espera"?espera:inadimplentes;
  function applyTpl(t){const base=t.text;if(!target){setMsg(base);return;}const courseName=mode==="espera"?target.courseName:(target.courses||[]).map(cid=>courses.find(c=>c.id===cid)?.name||"").filter(Boolean)[0]||"";setMsg(base.replace("{nome}",target.name||"").replace("{curso}",courseName).replace("{data}",target.courseDate?fmtDate(target.courseDate):""));}
  async function saveTpl(){if(!nTN.trim()||!msg.trim())return;const data={name:nTN.trim(),text:msg};const saved=await db.templates.insert(data);setTemplates(ts=>[...ts,saved||{...data,id:Date.now()}]);setNTN("");setShowTM(false);}
  function openWA(){if(!target)return;if(!msg.trim())return;const p=(target.phone||"").replace(/\D/g,"");if(p)window.open(`https://wa.me/55${p}?text=${encodeURIComponent(msg)}`,"_blank");else navigator.clipboard.writeText(msg);}
  return <div style={{animation:"up .4s ease"}}>
    <div style={{marginBottom:16}}><h1 style={{fontFamily:"Playfair Display",fontSize:24,fontWeight:700}}>Lembretes WhatsApp</h1><p style={{color:"var(--mu)",fontSize:11,marginTop:2}}>Selecione · escreva ou use modelo · envie</p></div>
    <div style={{display:"flex",gap:0,borderBottom:"2px solid var(--b)",marginBottom:16}}>
      {[["enviar","💬 Enviar"],["modelos","📄 Modelos"]].map(([id,lbl])=><button key={id} onClick={()=>setTab(id)} style={{padding:"8px 15px",border:"none",background:"transparent",fontFamily:"DM Sans",fontSize:12,fontWeight:600,cursor:"pointer",color:tab===id?"var(--bl)":"var(--mu)",borderBottom:`2px solid ${tab===id?"var(--bl)":"transparent"}`,marginBottom:-2}}>{lbl}</button>)}
    </div>
    {tab==="modelos"&&<div style={{background:"#fff",borderRadius:14,padding:16,border:"1px solid var(--b)",boxShadow:"var(--shadow)"}}>
      <div style={{fontFamily:"Playfair Display",fontSize:15,fontWeight:600,marginBottom:13}}>Modelos Salvos</div>
      {templates.map(t=><div key={t.id} style={{background:"#F7F9FC",borderRadius:11,padding:13,marginBottom:9,border:"1px solid var(--b)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:7}}><span style={{fontWeight:700,fontSize:12}}>{t.name}</span><div style={{display:"flex",gap:6}}><Btn sz="sm" v="purple" onClick={()=>{applyTpl(t);setTab("enviar");}}>Usar</Btn><Btn sz="sm" v="danger" onClick={()=>setTemplates(ts=>ts.filter(x=>x.id!==t.id))}>×</Btn></div></div>
        <div style={{fontSize:12,color:"var(--mu)",lineHeight:1.5}}>{t.text}</div>
        <div style={{fontSize:10,color:"var(--mu2)",marginTop:5}}>Variáveis: {"{nome}"} {"{curso}"} {"{data}"}</div>
      </div>)}
      {!templates.length&&<div style={{textAlign:"center",padding:"14px 0",color:"var(--mu)",fontSize:12}}>Nenhum modelo</div>}
    </div>}
    {tab==="enviar"&&<div className="gwa">
      <div>
        <div style={{display:"flex",gap:6,marginBottom:11,flexWrap:"wrap"}}>
          {[["aluno","👩‍🎓 Alunos"],["lead","◈ Leads"],["espera","⏳ Espera"],["inadimplentes","⚠ Inadimplentes"]].map(([v,l])=><button key={v} onClick={()=>{setMode(v);setTarget(null);}} style={{background:mode===v?"#EEF4FF":"#fff",border:`1.5px solid ${mode===v?"var(--bl)":"#DDE3EE"}`,color:mode===v?"var(--bl)":"var(--mu)",borderRadius:9,padding:"8px 13px",fontSize:12,fontWeight:600,cursor:"pointer",boxShadow:"var(--shadow)"}}>{l}{v==="inadimplentes"&&inadimplentes.length>0&&<span style={{background:"var(--rd)",color:"#fff",borderRadius:99,padding:"1px 5px",fontSize:9,marginLeft:4}}>{inadimplentes.length}</span>}</button>)}
        </div>
        {(mode==="lead"||mode==="espera")&&<div style={{display:"flex",gap:7,marginBottom:10,flexWrap:"wrap"}}>
          {mode==="lead"&&<select value={fS} onChange={e=>setFS(e.target.value)} style={{background:"#fff",border:"1.5px solid #DDE3EE",borderRadius:9,padding:"7px 11px",color:"var(--mu)",fontSize:11,outline:"none",fontFamily:"DM Sans"}}><option value="">Todas etapas</option>{SCRM.map(s=><option key={s}>{s}</option>)}</select>}
          <select value={fC} onChange={e=>setFC(e.target.value)} style={{flex:1,background:"#fff",border:"1.5px solid #DDE3EE",borderRadius:9,padding:"7px 11px",color:"var(--mu)",fontSize:11,outline:"none",fontFamily:"DM Sans"}}><option value="">Todos os cursos</option>{cN.map(n=><option key={n}>{n}</option>)}</select>
        </div>}
        <div style={{display:"flex",flexDirection:"column",gap:6}}>
          {list.map((p,i)=>{const sel=target?.id===p.id;return <div key={(p.id||i)+(p.courseName||"")} onClick={()=>setTarget(sel?null:p)} style={{background:sel?"#EEF4FF":"#fff",borderRadius:12,padding:"11px 13px",border:`1.5px solid ${sel?"var(--bl)":"#DDE3EE"}`,display:"flex",alignItems:"center",gap:11,cursor:"pointer",transition:"all .15s",boxShadow:"var(--shadow)",animation:`sr .3s ease ${i*.04}s both`}}>
            <Av letter={p.name[0]} size={34} color={sel?"var(--bl)":mode==="inadimplentes"?"var(--rd)":mode==="lead"?(SCL[p.stage]||"var(--mu)"):"var(--te)"}/>
            <div style={{flex:1}}><div style={{fontWeight:sel?700:600,fontSize:12,color:sel?"var(--bl)":"var(--tx)"}}>{p.name}</div><div style={{fontSize:11,color:"var(--mu)"}}>{mode==="lead"?`${courses.find(c=>c.id===p.courseId)?.name||"—"} · ${p.stage}`:mode==="espera"?`⏳ ${p.courseName}`:mode==="inadimplentes"?"Pagamento pendente":p.email}</div></div>
            {sel&&<span style={{color:"var(--bl)",fontSize:16,fontWeight:700}}>✓</span>}
          </div>;})}
          {!list.length&&<div style={{textAlign:"center",padding:"18px 0",color:"var(--mu)",fontSize:11}}>Nenhum resultado</div>}
        </div>
      </div>
      <div style={{background:"#fff",borderRadius:17,padding:18,border:"1px solid var(--b)",height:"fit-content",position:"sticky",top:0,boxShadow:"var(--shadow)"}}>
        {target?<div style={{background:"#EEF4FF",borderRadius:9,padding:"8px 12px",marginBottom:11,fontSize:12,fontWeight:700,color:"var(--bl)"}}>Para: {target.name} · {(target.phone||"").slice(0,14)}</div>:<div style={{background:"#F7F9FC",borderRadius:9,padding:"8px 12px",marginBottom:11,fontSize:12,color:"var(--mu)"}}>← Selecione uma pessoa</div>}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:9}}>
          <div style={{fontSize:10,color:"var(--mu)",fontWeight:600,textTransform:"uppercase"}}>Mensagem</div>
          <select onChange={e=>{const t=templates.find(x=>x.id===+e.target.value);if(t){applyTpl(t);e.target.value="";}}} style={{background:"#F7F9FC",border:"1.5px solid #DDE3EE",borderRadius:8,padding:"4px 9px",color:"var(--mu)",fontSize:11,outline:"none",fontFamily:"DM Sans"}}>
            <option value="">Usar modelo...</option>{templates.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
        <div style={{background:"#F5FDF7",border:"1.5px solid #BBF7D0",borderRadius:10,padding:12,marginBottom:10}}>
          <textarea value={msg} onChange={e=>setMsg(e.target.value)} rows={6} placeholder="Escreva ou use modelo..." style={{width:"100%",background:"transparent",border:"none",outline:"none",color:"var(--tx)",fontSize:13,lineHeight:1.7,resize:"none",fontFamily:"DM Sans"}}/>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:7}}>
          {msg&&<button onClick={()=>setShowTM(true)} style={{background:"#F5F1FE",border:"1.5px solid #DDD0F7",borderRadius:9,padding:"8px 0",color:"var(--pu)",fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"DM Sans"}}>💾 Salvar como Modelo</button>}
          <button onClick={openWA} disabled={!msg||!target} style={{background:msg&&target?"linear-gradient(135deg,#25D366,#128C7E)":"#F7F9FC",border:"none",borderRadius:9,padding:"11px 0",color:msg&&target?"#fff":"var(--mu)",fontSize:13,fontWeight:700,cursor:msg&&target?"pointer":"default",fontFamily:"DM Sans",opacity:msg&&target?1:.5}}>{target?.phone?"✓ Enviar no WhatsApp":"📋 Copiar"}</button>
        </div>
      </div>
    </div>}
    {showTM&&<Modal title="Salvar Modelo" onClose={()=>setShowTM(false)}>
      <Inp label="Nome do modelo" value={nTN} onChange={e=>setNTN(e.target.value)} placeholder="Ex: Lembrete de pagamento"/>
      <div style={{background:"#F7F9FC",borderRadius:9,padding:11,fontSize:12,color:"var(--mu)",marginBottom:13,lineHeight:1.5}}>{msg}</div>
      <Btn style={{width:"100%"}} onClick={saveTpl}>Salvar Modelo</Btn>
    </Modal>}
  </div>;
}

/* ══════════════════════════════════════════════════
   PEDAGÓGICO — cert tick + prazos por item + bloqueio
══════════════════════════════════════════════════ */
function PedagogicoPage({students,setStudents,courses}){
  const[selSt,setSelSt]=useState(null);
  const[pedItems,setPedItems]=useState({});
  const[trackedCourses,setTrackedCourses]=useState(()=>courses.reduce((a,c)=>({...a,[c.id]:c.type==="Curso"||c.type==="Estágio"}),{}));
  const[selCourse,setSelCourse]=useState(null);
  const[savedFeedback,setSavedFeedback]=useState(false);

  /* Carrega pedItems do banco ao selecionar aluno */
  useEffect(()=>{
    if(selSt){
      const saved=(selSt.pedDocs||{})._checklist||{};
      setPedItems(p=>({...p,[selSt.id]:saved}));
    }
  },[selSt?.id]);

  function toggleItem(stId,item){setPedItems(p=>{const cur=p[stId]||{};return {...p,[stId]:{...cur,[item]:!cur[item]}};})}

  async function saveChecklist(){
    if(!selSt)return;
    const items=pedItems[selSt.id]||{};
    const updated={...selSt,pedDocs:{...(selSt.pedDocs||{}),_checklist:items}};
    setStudents(ss=>ss.map(s=>s.id!==selSt.id?s:updated));
    setSelSt(updated);
    await db.students.update(selSt.id,updated);
    setSavedFeedback(true);
    setTimeout(()=>setSavedFeedback(false),2000);
  }
  function getChecklist(student){
    const items=new Set();
    student.courses.filter(cid=>trackedCourses[cid]).forEach(cid=>{
      const c=courses.find(x=>x.id===cid);
      (c?.checklist||[]).forEach(it=>items.add(it));
    });
    return [...items];
  }

  function pct(st){
    const items=getChecklist(st);
    if(!items.length)return null;
    const done=items.filter(it=>(pedItems[st.id]||{})[it]).length;
    return Math.round((done/items.length)*100);
  }

  // Can cert be issued for a specific course? (all required deadline items must be done)
  function canIssueCert(student,courseId){
    const c=courses.find(x=>x.id===courseId);
    if(!c||!c.checklist?.length)return true;
    const deadlineItems=c.checklist.filter(it=>(c.checklistDeadlines||{})[it]);
    if(!deadlineItems.length)return true;
    return deadlineItems.every(it=>(pedItems[student.id]||{})[it]);
  }

  function toggleCert(stId,courseId){
    if(!canIssueCert(students.find(s=>s.id===stId),courseId)){
      alert("Não é possível emitir o certificado: há itens de checklist com prazo pendentes.");
      return;
    }
    setStudents(ss=>ss.map(s=>{if(s.id!==stId)return s;const cert=[...(s.certificate||[])];const idx=cert.indexOf(courseId);if(idx>=0)cert.splice(idx,1);else cert.push(courseId);return {...s,certificate:cert};}));
  }

  async function uploadPedDoc(stId,courseId,file){
    const f=await readFile(file);
    setStudents(ss=>ss.map(s=>{if(s.id!==stId)return s;const docs={...(s.pedDocs||{})};docs[courseId]=[...(docs[courseId]||[]),f];return {...s,pedDocs:docs};}));
  }

  function removePedDoc(stId,courseId,idx){
    setStudents(ss=>ss.map(s=>{if(s.id!==stId)return s;const docs={...(s.pedDocs||{})};docs[courseId]=(docs[courseId]||[]).filter((_,i)=>i!==idx);return {...s,pedDocs:docs};}));
  }

  const activeStudents=students.filter(s=>s.courses.some(cid=>trackedCourses[cid]));
  const displayStudents=selCourse?activeStudents.filter(s=>s.courses.includes(selCourse)):activeStudents;

  return <div style={{animation:"up .4s ease"}}>
    <div style={{marginBottom:16}}><h1 style={{fontFamily:"Playfair Display",fontSize:24,fontWeight:700}}>Painel Pedagógico</h1><p style={{color:"var(--mu)",fontSize:11,marginTop:2}}>Checklist por curso · certificado · upload de documentos</p></div>
    <div style={{background:"#fff",borderRadius:14,padding:15,border:"1px solid var(--b)",marginBottom:13,boxShadow:"var(--shadow)"}}>
      <div style={{fontFamily:"Playfair Display",fontSize:14,fontWeight:600,marginBottom:9}}>Cursos rastreados</div>
      <div style={{display:"flex",flexWrap:"wrap",gap:7}}>
        {courses.map(c=>{const on=!!trackedCourses[c.id];return <button key={c.id} onClick={()=>setTrackedCourses(t=>({...t,[c.id]:!t[c.id]}))} style={{display:"flex",alignItems:"center",gap:6,padding:"6px 11px",borderRadius:9,border:`1.5px solid ${on?"var(--bl)":"#DDE3EE"}`,background:on?"#EEF4FF":"#F7F9FC",cursor:"pointer"}}>
          <div style={{width:14,height:14,borderRadius:3,border:`2px solid ${on?"var(--bl)":"#DDE3EE"}`,background:on?"var(--bl)":"transparent",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,color:"#fff",fontWeight:700}}>{on?"✓":""}</div>
          <span style={{fontSize:11,color:on?"var(--bl)":"var(--mu)",fontWeight:on?700:400}}>{c.name.split("–")[0].trim()}</span>
          {c.checklist?.length>0&&<span style={{fontSize:9,color:"var(--pu)",fontWeight:600}}>📋{c.checklist.length}</span>}
        </button>;})}
      </div>
    </div>
    <div style={{display:"flex",gap:7,marginBottom:13,flexWrap:"wrap"}}>
      <button onClick={()=>setSelCourse(null)} style={{background:!selCourse?"#EEF4FF":"#fff",border:`1.5px solid ${!selCourse?"var(--bl)":"#DDE3EE"}`,color:!selCourse?"var(--bl)":"var(--mu)",borderRadius:99,padding:"5px 13px",fontSize:11,fontWeight:600,cursor:"pointer"}}>Todos</button>
      {courses.filter(c=>trackedCourses[c.id]).map(c=><button key={c.id} onClick={()=>setSelCourse(c.id)} style={{background:selCourse===c.id?"#EEF4FF":"#fff",border:`1.5px solid ${selCourse===c.id?"var(--bl)":"#DDE3EE"}`,color:selCourse===c.id?"var(--bl)":"var(--mu)",borderRadius:99,padding:"5px 13px",fontSize:11,fontWeight:600,cursor:"pointer"}}>{c.name.split("–")[0].trim()}</button>)}
    </div>
    <div style={{display:"flex",flexDirection:"column",gap:9}}>
      {displayStudents.map((s,i)=>{
        const ex=selSt?.id===s.id;const p=pct(s);
        const trackedCids=s.courses.filter(cid=>trackedCourses[cid]);
        return <div key={s.id} style={{background:"#fff",borderRadius:14,border:`1.5px solid ${ex?"var(--bl)":"#E5EAF3"}`,overflow:"hidden",animation:`sr .3s ease ${i*.04}s both`,boxShadow:"var(--shadow)"}}>
          <div onClick={()=>setSelSt(x=>x?.id===s.id?null:s)} style={{display:"flex",alignItems:"center",gap:11,padding:"12px 15px",cursor:"pointer"}}>
            <Av letter={s.name[0]} size={38} color="var(--pu)"/>
            <div style={{flex:1}}>
              <div style={{fontWeight:700,fontSize:13}}>{s.name}</div>
              <div style={{fontSize:11,color:"var(--mu)",marginTop:2}}>{trackedCids.map(cid=>courses.find(c=>c.id===cid)?.name.split("–")[0].trim()).filter(Boolean).join(" · ")||"—"}</div>
              {p!==null&&<div style={{background:"#F0F4FA",borderRadius:99,height:4,marginTop:5,overflow:"hidden"}}><div style={{width:`${p}%`,height:"100%",background:"linear-gradient(90deg,var(--pu),var(--bl))",borderRadius:99,transition:"width .8s ease"}}/></div>}
            </div>
            <div style={{textAlign:"right",display:"flex",flexDirection:"column",alignItems:"flex-end",gap:3}}>
              {p!==null&&<div style={{fontFamily:"Playfair Display",fontSize:20,fontWeight:700,color:p>=80?"var(--gn)":p>=50?"var(--am)":"var(--rd)"}}>{p}%</div>}
              <div style={{display:"flex",gap:4,flexWrap:"wrap",justifyContent:"flex-end"}}>
                {trackedCids.map(cid=>{const certOk=(s.certificate||[]).includes(cid);return certOk?<Chip key={cid} color="var(--gn)" sm>✓ Cert.</Chip>:null;})}
              </div>
            </div>
            <span style={{color:"var(--mu)",fontSize:11,marginLeft:3}}>{ex?"▲":"▼"}</span>
          </div>
          {ex&&<div style={{borderTop:"1.5px solid #E5EAF3",padding:"13px 15px",background:"#F7F9FC"}}>
            {/* Botão Salvar checklist */}
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
              <button onClick={()=>saveChecklist()} style={{background:"linear-gradient(135deg,var(--pu),var(--bl))",border:"none",borderRadius:9,padding:"9px 18px",color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"DM Sans",boxShadow:"0 2px 8px rgba(48,102,190,.25)"}}>
                💾 Salvar progresso
              </button>
              {savedFeedback&&<span style={{fontSize:12,color:"var(--gn)",fontWeight:600,animation:"fadeIn .3s ease"}}>✓ Salvo!</span>}
            </div>
            {trackedCids.map(cid=>{
              const c=courses.find(x=>x.id===cid);if(!c)return null;
              const courseChecklist=c.checklist||[];
              const deadlines=c.checklistDeadlines||{};
              const docs=(s.pedDocs||{})[cid]||[];
              const enrollDate=(s.enrollmentDates||{})[cid];
              const certDelivered=(s.certificate||[]).includes(cid);
              const canCert=canIssueCert(s,cid);
              return <div key={cid} style={{marginBottom:16,background:"#fff",borderRadius:11,padding:13,border:"1px solid var(--b)"}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
                  <Chip color={KCL[c.type]||"var(--bl)"}>{c.type}</Chip>
                  <span style={{fontWeight:700,fontSize:12,flex:1}}>{c.name}</span>
                  {enrollDate&&<span style={{fontSize:9,color:"var(--mu2)"}}>desde {fmtDate(enrollDate)}</span>}
                </div>
                {courseChecklist.length>0&&<>
                  <div style={{fontSize:10,color:"var(--pu)",fontWeight:600,textTransform:"uppercase",letterSpacing:.5,marginBottom:7}}>Checklist</div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:5,marginBottom:11}}>
                    {courseChecklist.map(item=>{
                      const done=(pedItems[s.id]||{})[item]||false;
                      const al=deadlines[item]?itemAlert(deadlines[item]):null;
                      const blocked=!done&&al&&al.sev>=2;
                      return <div key={item} onClick={()=>toggleItem(s.id,item)} style={{display:"flex",alignItems:"flex-start",gap:7,padding:"8px 10px",borderRadius:9,background:done?"#F0FDF4":blocked?"#FFF0F0":"#F7F9FC",border:`1.5px solid ${done?"#BBF7D0":blocked?"#FECACA":"#DDE3EE"}`,cursor:"pointer"}}>
                        <div style={{width:18,height:18,borderRadius:4,border:`2px solid ${done?"var(--gn)":"#DDE3EE"}`,background:done?"var(--gn)":"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:10,color:"#fff",fontWeight:700,marginTop:1}}>{done?"✓":""}</div>
                        <div style={{flex:1}}>
                          <span style={{fontSize:11,fontWeight:done?600:400,color:done?"var(--gn)":blocked?"var(--rd)":"var(--mu)"}}>{item}</span>
                          {al&&<div style={{fontSize:9,color:al.color,fontWeight:600,marginTop:2}}>⏰ {al.label}</div>}
                        </div>
                      </div>;
                    })}
                  </div>
                </>}
                <Divr/>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:9}}>
                  <div style={{fontSize:10,color:"var(--bl)",fontWeight:600,textTransform:"uppercase",letterSpacing:.5}}>Certificado</div>
                  {!canCert&&<Chip color="var(--rd)" sm>🔒 Bloqueado — itens pendentes</Chip>}
                </div>
                <div onClick={()=>toggleCert(s.id,cid)} style={{display:"flex",alignItems:"center",gap:9,padding:"9px 12px",borderRadius:10,background:certDelivered?"#F0FDF4":canCert?"#F7F9FC":"#FEF2F2",border:`1.5px solid ${certDelivered?"#BBF7D0":canCert?"#DDE3EE":"#FECACA"}`,cursor:canCert?"pointer":"not-allowed",marginBottom:9,userSelect:"none"}}>
                  <div style={{width:22,height:22,borderRadius:6,border:`2px solid ${certDelivered?"var(--gn)":canCert?"#DDE3EE":"var(--rd)"}`,background:certDelivered?"var(--gn)":"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:12,color:"#fff",fontWeight:700}}>{certDelivered?"✓":""}</div>
                  <span style={{fontSize:12,fontWeight:certDelivered?700:500,color:certDelivered?"var(--gn)":canCert?"var(--mu)":"var(--rd)"}}>{certDelivered?"✓ Certificado entregue":canCert?"Marcar certificado como entregue":"🔒 Conclua os itens primeiro"}</span>
                </div>
                <div style={{fontSize:10,color:"var(--bl)",fontWeight:600,textTransform:"uppercase",letterSpacing:.5,marginBottom:7}}>Documentos</div>
                <label style={{display:"inline-flex",alignItems:"center",gap:6,background:"#EEF4FF",border:"1.5px solid #C7D7F5",borderRadius:8,padding:"6px 12px",cursor:"pointer",fontSize:11,color:"var(--bl)",fontWeight:600,marginBottom:8}}>
                  📎 Subir documento
                  <input type="file" accept=".pdf,.jpg,.jpeg,.png" style={{display:"none"}} onChange={async e=>{if(e.target.files[0]){await uploadPedDoc(s.id,cid,e.target.files[0]);e.target.value="";}}}/>
                </label>
                {docs.map((d,di)=><div key={di} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 10px",borderRadius:8,background:"#F7F9FC",border:"1px solid var(--b)",marginBottom:5}}>
                  <span>📄</span><span style={{flex:1,fontSize:11,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{d.name}</span>
                  <a href={d.data} download={d.name} style={{fontSize:10,color:"var(--gn)",fontWeight:700,textDecoration:"none"}}>↓</a>
                  <button onClick={()=>removePedDoc(s.id,cid,di)} style={{background:"transparent",border:"none",color:"var(--rd)",cursor:"pointer",fontSize:13}}>×</button>
                </div>)}
                {!docs.length&&<div style={{fontSize:10,color:"var(--mu2)"}}>Nenhum documento</div>}
              </div>;
            })}
          </div>}
        </div>;})}
      {!displayStudents.length&&<div style={{textAlign:"center",padding:"28px 0",color:"var(--mu)",fontSize:12}}>Nenhum aluno com cursos rastreados</div>}
    </div>
  </div>;
}

/* ══════════════════════════════════════════════════
   SOCIAL MEDIA — calendário + posts + IA + métricas
══════════════════════════════════════════════════ */
function SocialPage({socialMetrics,setSocialMetrics}){
  const[posts,setPosts]=useState([]);
  const[tab,setTab]=useState("calendario");
  const[calM,setCalM]=useState(new Date());
  const[showForm,setShowForm]=useState(false);
  const[editing,setEditing]=useState(null);
  const[aiPrompt,setAiPrompt]=useState("");
  const[aiLoading,setAiLoading]=useState(false);
  const[aiResult,setAiResult]=useState(null);
  const[showMetricForm,setShowMetricForm]=useState(false);
  const[editingMetric,setEditingMetric]=useState(null);
  const eP={date:"",time:"12:00",category:SOCIAL_CATS[0],caption:"",hashtags:"",imageUrl:"",status:"Programado"};
  const[form,setForm]=useState(eP);const fp=v=>setForm(p=>({...p,...v}));
  const eM={month:new Date().toISOString().slice(0,7),totalViews:0,viewsNewFollowers:0,viewsFollowers:0,newFollowers:0,totalFollowers:0,interactions:0,interactionsNewFollowers:0,interactionsFollowers:0,reach:0,impressions:0};
  const[mForm,setMForm]=useState(eM);const fm=v=>setMForm(p=>({...p,...v}));
  const cy=calM.getFullYear(),cm=calM.getMonth();
  const fd=new Date(cy,cm,1).getDay(),dm=new Date(cy,cm+1,0).getDate();
  function postsOnDay(d){const ds=`${cy}-${String(cm+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;return posts.filter(p=>p.date===ds);}
  function savePost(){if(!form.date||!form.caption)return;if(editing)setPosts(ps=>ps.map(p=>p.id===editing.id?{...form,id:p.id}:p));else setPosts(ps=>[...ps,{...form,id:Date.now()}]);setShowForm(false);setEditing(null);setForm(eP);}
  async function saveMetric(){if(!mForm.month)return;if(editingMetric){setSocialMetrics(ms=>ms.map(m=>m.id===editingMetric.id?{...mForm,id:m.id}:m));await db.metrics.update(editingMetric.id,mForm);}else{const saved=await db.metrics.insert(mForm);setSocialMetrics(ms=>[...ms,saved||{...mForm,id:Date.now()}]);}setShowMetricForm(false);setEditingMetric(null);setMForm(eM);}
  const sortedMetrics=[...socialMetrics].sort((a,b)=>a.month.localeCompare(b.month));
  const metricsChart=sortedMetrics.slice(-8).map(m=>({mes:MOPT[parseInt(m.month.slice(5,7))-1]+" "+m.month.slice(2,4),Seguidores:+m.totalFollowers,Views:+m.totalViews,Interações:+m.interactions}));
  const IA_TEMPLATES={"Reflexologia":["🌿 Você sabia que a reflexologia pode aliviar tensões acumuladas no dia a dia? Nossos alunos aprendem técnicas que transformam vidas!\n\n#reflexologia #bemestar #saude #metodoIOR","✨ A reflexologia podal conecta corpo e mente. Cada ponto nos pés reflete um órgão, um sistema, uma emoção. Aprenda com referência!\n\n#reflexologiapodal #terapiasholisticas"],"Curso/Workshop":["🎓 Vagas abertas para nosso próximo curso de Reflexologia Podal! Aprenda o Método IOR com instrutoras especializadas.\n\n#cursoreflexologia #metodoIOR #terapia","📚 Quer transformar sua prática? Nosso workshop intensivo está chegando. Inscrições abertas!\n\n#workshop #reflexologiafacial #terapeutaholistica"],"Bem-estar":["💆 Cuidar de si é um ato de amor. A reflexologia equilibra energia, reduz estresse e promove bem-estar completo.\n\n#autocuidado #bemestar #reflexologia","🌸 Quando foi a última vez que você priorizou seu bem-estar? A reflexologia é um caminho gentil para se reconectar.\n\n#bemestar #saúde #reflexologia"],"Depoimento":["⭐ \"A reflexologia mudou minha relação com meu corpo. Aprendi a ouvir os sinais com mais consciência.\" – Aluna IOR\n\n#depoimento #transformacao #reflexologia","🙏 \"Depois do curso, minha prática ficou muito mais segura e eficiente.\" – Terapeuta formada pelo IOR\n\n#resultado #reflexologia #terapeutaholistica"],"Dica":["💡 Pressione suavemente o centro da planta do pé por 30 segundos. Esse ponto estimula energia e vitalidade!\n\n#dica #reflexologia #autocuidado","🌿 Massagear os dedos dos pés pode ajudar a aliviar dores de cabeça. A reflexologia tem respostas para o corpo inteiro!\n\n#dica #reflexologiapodal"],"Evento":["📅 Evento especial chegando! Marque na agenda e não perca essa oportunidade de aprendizado.\n\n#evento #reflexologia #crescimentoprofissional","🗓️ Nossa próxima turma está se formando! Se você sonha em trabalhar com terapias holísticas, esse é o momento.\n\n#turmanova #reflexologia"],"Bastidores":["📸 Bastidores do nosso último curso! Ver nossos alunos em ação é sempre gratificante.\n\n#bastidores #reflexologia #alunos","🎯 Nos preparando para mais uma turma incrível! Os materiais estão prontos, as instrutoras animadas.\n\n#bastidores #preparacao #reflexologia"]};
  async function gerarIA(){if(!aiPrompt.trim())return;setAiLoading(true);setAiResult(null);await new Promise(r=>setTimeout(r,1100));const cat=SOCIAL_CATS.find(c=>aiPrompt.toLowerCase().includes(c.toLowerCase()))||SOCIAL_CATS[Math.floor(Math.random()*SOCIAL_CATS.length)];const opts=IA_TEMPLATES[cat]||IA_TEMPLATES["Reflexologia"];const picked=opts[Math.floor(Math.random()*opts.length)];const [caption,...rest]=picked.split("\n\n");setAiResult({caption:caption.trim(),hashtags:rest.join("\n\n").trim(),category:cat});setAiLoading(false);}
  const CAT_C={"Reflexologia":"var(--te)","Bem-estar":"var(--gn)","Curso/Workshop":"var(--bl)","Depoimento":"var(--pu)","Dica":"var(--am)","Evento":"var(--rd)","Bastidores":"#9AAAC0"};
  const ST_C={"Programado":"var(--bl)","Publicado":"var(--gn)","Rascunho":"var(--am)"};
  return <div style={{animation:"up .4s ease"}}>
    <div style={{marginBottom:16}}><h1 style={{fontFamily:"Playfair Display",fontSize:24,fontWeight:700}}>Social Media</h1><p style={{color:"var(--mu)",fontSize:11,marginTop:2}}>Planeje postagens · sugestões IA · métricas mês a mês</p></div>
    <div style={{display:"flex",gap:0,borderBottom:"2px solid var(--b)",marginBottom:16,flexWrap:"wrap"}}>
      {[["calendario","📅 Calendário"],["posts","☰ Posts"],["ia","✦ IA"],["metricas","📊 Métricas"]].map(([id,lbl])=><button key={id} onClick={()=>setTab(id)} style={{padding:"8px 15px",border:"none",background:"transparent",fontFamily:"DM Sans",fontSize:12,fontWeight:600,cursor:"pointer",color:tab===id?"var(--bl)":"var(--mu)",borderBottom:`2px solid ${tab===id?"var(--bl)":"transparent"}`,marginBottom:-2}}>{lbl}</button>)}
      <div style={{flex:1}}/>
      <Btn sz="sm" onClick={()=>{setForm(eP);setEditing(null);setShowForm(true);}}>+ Postagem</Btn>
    </div>

    {tab==="calendario"&&<>
      <div style={{background:"#fff",borderRadius:16,border:"1px solid var(--b)",overflow:"hidden",boxShadow:"var(--shadow)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"13px 18px",borderBottom:"1px solid var(--b)"}}>
          <button onClick={()=>setCalM(new Date(cy,cm-1,1))} style={{background:"#F7F9FC",border:"1.5px solid #DDE3EE",borderRadius:7,width:28,height:28,cursor:"pointer",fontSize:14}}>‹</button>
          <div style={{fontFamily:"Playfair Display",fontSize:18,fontWeight:700}}>{MNS[cm]} {cy}</div>
          <button onClick={()=>setCalM(new Date(cy,cm+1,1))} style={{background:"#F7F9FC",border:"1.5px solid #DDE3EE",borderRadius:7,width:28,height:28,cursor:"pointer",fontSize:14}}>›</button>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",borderBottom:"1px solid var(--b)"}}>{["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"].map((d,i)=><div key={i} style={{padding:"7px 0",textAlign:"center",fontSize:10,color:"var(--mu)",fontWeight:600}}>{d}</div>)}</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)"}}>
          {Array.from({length:fd}).map((_,i)=><div key={"e"+i} style={{borderRight:"1px solid var(--b)",borderBottom:"1px solid var(--b)",minHeight:80}}/>)}
          {Array.from({length:dm}).map((_,i)=>{const day=i+1,dps=postsOnDay(day);const isToday=new Date().getDate()===day&&new Date().getMonth()===cm&&new Date().getFullYear()===cy;return <div key={day} style={{borderRight:"1px solid var(--b)",borderBottom:"1px solid var(--b)",minHeight:80,padding:5}}>
            <div style={{width:18,height:18,borderRadius:"50%",background:isToday?"var(--bl)":"transparent",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:600,color:isToday?"#fff":"var(--mu)",marginBottom:2}}>{day}</div>
            {dps.map(p=><div key={p.id} onClick={()=>{setForm({...p});setEditing(p);setShowForm(true);}} style={{background:`${CAT_C[p.category]||"#9AAAC0"}18`,borderLeft:`2px solid ${CAT_C[p.category]||"#9AAAC0"}`,borderRadius:3,padding:"2px 5px",fontSize:8,fontWeight:600,color:CAT_C[p.category]||"#9AAAC0",marginBottom:1,cursor:"pointer",overflow:"hidden",whiteSpace:"nowrap",textOverflow:"ellipsis"}}>{p.time} {p.caption?.slice(0,18)}</div>)}
            <div onClick={()=>{const ds=`${cy}-${String(cm+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;setForm({...eP,date:ds});setEditing(null);setShowForm(true);}} style={{textAlign:"center",fontSize:9,color:"var(--mu2)",cursor:"pointer",marginTop:2,opacity:.6}}>+</div>
          </div>;})}
        </div>
      </div>
      <div style={{display:"flex",gap:9,marginTop:11,flexWrap:"wrap"}}>{Object.entries(CAT_C).map(([t,c])=><div key={t} style={{display:"flex",alignItems:"center",gap:4}}><Dot color={c} size={7}/><span style={{fontSize:10,color:"var(--mu)"}}>{t}</span></div>)}</div>
    </>}

    {tab==="posts"&&<div style={{display:"flex",flexDirection:"column",gap:9}}>
      {posts.length===0&&<div style={{textAlign:"center",padding:"28px 0",color:"var(--mu)",fontSize:12}}>Nenhuma postagem. Crie sua primeira!</div>}
      {[...posts].sort((a,b)=>a.date.localeCompare(b.date)).map((p,i)=><div key={p.id} style={{background:"#fff",borderRadius:14,padding:"14px 16px",border:"1px solid var(--b)",boxShadow:"var(--shadow)",animation:`sr .3s ease ${i*.04}s both`}}>
        <div style={{display:"flex",gap:10,alignItems:"flex-start"}}>
          {p.imageUrl&&<img src={p.imageUrl} alt="" style={{width:64,height:64,borderRadius:8,objectFit:"cover",flexShrink:0}} onError={e=>e.target.style.display="none"}/>}
          <div style={{flex:1}}>
            <div style={{display:"flex",gap:6,marginBottom:6,flexWrap:"wrap"}}><Chip color={CAT_C[p.category]||"var(--mu)"}>{p.category}</Chip><Chip color={ST_C[p.status]||"var(--mu)"} sm>{p.status}</Chip><span style={{fontSize:11,color:"var(--mu)"}}>📅 {fmtDate(p.date)} {p.time}</span></div>
            <div style={{fontSize:13,color:"var(--tx)",lineHeight:1.5,marginBottom:6}}>{p.caption}</div>
            {p.hashtags&&<div style={{fontSize:11,color:"var(--bl)",fontWeight:600}}>{p.hashtags.slice(0,80)}{p.hashtags.length>80?"…":""}</div>}
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            <Btn sz="sm" v="ghost" onClick={()=>{setForm({...p});setEditing(p);setShowForm(true);}}>✏️</Btn>
            <button onClick={async()=>{try{await navigator.clipboard.writeText(p.caption+"\n\n"+p.hashtags);}catch{}if(p.imageUrl){try{const r=await fetch(p.imageUrl);const b=await r.blob();await navigator.clipboard.write([new ClipboardItem({[b.type]:b})]);}catch{try{await navigator.clipboard.writeText(p.imageUrl);}catch{}}}window.open("https://www.instagram.com/","_blank");}} style={{background:"linear-gradient(135deg,#E1306C,#833AB4,#405DE6)",border:"none",borderRadius:7,padding:"6px 10px",color:"#fff",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"DM Sans"}} title="Copia legenda + imagem e abre Instagram">📸 IG</button>
            <Btn sz="sm" v="danger" onClick={()=>setPosts(ps=>ps.filter(x=>x.id!==p.id))}>×</Btn>
          </div>
        </div>
      </div>)}
    </div>}

    {tab==="ia"&&<div>
      <div style={{background:"#fff",borderRadius:16,padding:20,border:"1px solid var(--b)",boxShadow:"var(--shadow)",marginBottom:14}}>
        <div style={{fontFamily:"Playfair Display",fontSize:16,fontWeight:600,marginBottom:4}}>Sugestão com IA</div>
        <div style={{fontSize:11,color:"var(--mu)",marginBottom:14}}>Descreva o tema e receba sugestão de legenda + hashtags</div>
        <div style={{display:"flex",gap:9}}>
          <input value={aiPrompt} onChange={e=>setAiPrompt(e.target.value)} onKeyDown={e=>e.key==="Enter"&&gerarIA()} placeholder="Ex: workshop de reflexologia facial, dica de bem-estar..." style={{flex:1,background:"#F7F9FC",border:"1.5px solid #DDE3EE",borderRadius:10,padding:"10px 14px",color:"var(--tx)",fontSize:13,outline:"none",fontFamily:"DM Sans"}}/>
          <Btn onClick={gerarIA} disabled={!aiPrompt.trim()||aiLoading}>{aiLoading?"...":"✦ Gerar"}</Btn>
        </div>
        <div style={{display:"flex",gap:7,marginTop:11,flexWrap:"wrap"}}>{SOCIAL_CATS.map(c=><button key={c} onClick={()=>setAiPrompt(c)} style={{background:"#F7F9FC",border:"1.5px solid #DDE3EE",borderRadius:99,padding:"4px 11px",fontSize:11,color:"var(--mu)",cursor:"pointer",fontFamily:"DM Sans"}}>{c}</button>)}</div>
      </div>
      {aiLoading&&<div style={{textAlign:"center",padding:"28px 0",color:"var(--pu)",fontSize:13,fontWeight:600}}>✦ Gerando…</div>}
      {aiResult&&<div style={{background:"linear-gradient(135deg,#F5F1FE,#EEF4FF)",borderRadius:16,padding:20,border:"1.5px solid #DDD0F7",boxShadow:"var(--shadow)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}><div style={{fontFamily:"Playfair Display",fontSize:15,fontWeight:600,color:"var(--pu)"}}>✦ Sugestão</div><Chip color={CAT_C[aiResult.category]||"var(--mu)"}>{aiResult.category}</Chip></div>
        <div style={{background:"#fff",borderRadius:11,padding:14,marginBottom:11,border:"1px solid #DDD0F7"}}><div style={{fontSize:10,color:"var(--pu)",fontWeight:600,textTransform:"uppercase",marginBottom:6}}>Legenda</div><div style={{fontSize:13,color:"var(--tx)",lineHeight:1.7,whiteSpace:"pre-wrap"}}>{aiResult.caption}</div></div>
        {aiResult.hashtags&&<div style={{background:"#fff",borderRadius:11,padding:14,marginBottom:14,border:"1px solid #DDD0F7"}}><div style={{fontSize:10,color:"var(--pu)",fontWeight:600,textTransform:"uppercase",marginBottom:6}}>Hashtags</div><div style={{fontSize:12,color:"var(--bl)",fontWeight:600,lineHeight:1.8}}>{aiResult.hashtags}</div></div>}
        <div style={{display:"flex",gap:9}}>
          <Btn v="purple" style={{flex:1}} onClick={()=>{setForm({...eP,caption:aiResult.caption,hashtags:aiResult.hashtags,category:aiResult.category});setEditing(null);setShowForm(true);setTab("calendario");}}>📅 Agendar</Btn>
          <Btn v="ghost" onClick={()=>navigator.clipboard.writeText(aiResult.caption+"\n\n"+aiResult.hashtags)}>📋 Copiar</Btn>
          <Btn v="ghost" onClick={gerarIA}>🔄 Nova</Btn>
        </div>
      </div>}
    </div>}

    {tab==="metricas"&&<div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
        <div style={{fontFamily:"Playfair Display",fontSize:16,fontWeight:600}}>Métricas Mensais</div>
        <Btn sz="sm" onClick={()=>{setMForm(eM);setEditingMetric(null);setShowMetricForm(true);}}>+ Adicionar mês</Btn>
      </div>
      {sortedMetrics.length>1&&<div style={{background:"#fff",borderRadius:16,padding:20,border:"1px solid var(--b)",boxShadow:"var(--shadow)",marginBottom:16}}>
        <div style={{fontFamily:"Playfair Display",fontSize:14,fontWeight:600,marginBottom:14}}>Evolução Mensal</div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={metricsChart} margin={{top:4,right:4,left:-20,bottom:0}}>
            <XAxis dataKey="mes" tick={{fontSize:9,fill:"#9AAAC0"}} axisLine={false} tickLine={false}/>
            <YAxis tick={{fontSize:8,fill:"#9AAAC0"}} axisLine={false} tickLine={false} tickFormatter={v=>v>=1000?`${(v/1000).toFixed(0)}k`:v}/>
            <Tooltip contentStyle={{background:"#fff",border:"1px solid #DDE3EE",borderRadius:8,fontSize:11}} formatter={v=>v.toLocaleString("pt-BR")}/>
            <Legend wrapperStyle={{fontSize:11,color:"#6B7A99",paddingTop:8}}/>
            <Bar dataKey="Seguidores" fill="#3066BE" radius={[3,3,0,0]}/>
            <Bar dataKey="Views" fill="#6244B8" radius={[3,3,0,0]}/>
            <Bar dataKey="Interações" fill="#2B9E98" radius={[3,3,0,0]}/>
          </BarChart>
        </ResponsiveContainer>
      </div>}
      {sortedMetrics.length===0&&<div style={{textAlign:"center",padding:"32px 0",color:"var(--mu)",fontSize:12}}>Adicione os dados mensais para visualizar a evolução.</div>}
      <div style={{display:"flex",flexDirection:"column",gap:9}}>
        {sortedMetrics.map((m,i)=>{
          const prev=sortedMetrics[i-1];
          const growthF=prev&&prev.totalFollowers>0?Math.round(((m.newFollowers)/(prev.totalFollowers||1))*100):null;
          return <div key={m.id} style={{background:"#fff",borderRadius:14,padding:"14px 16px",border:"1px solid var(--b)",boxShadow:"var(--shadow)"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
              <div style={{fontFamily:"Playfair Display",fontSize:15,fontWeight:700}}>{MOPT[parseInt(m.month.slice(5,7))-1]} {m.month.slice(0,4)}</div>
              <div style={{display:"flex",gap:7}}>
                {growthF!==null&&<Chip color={growthF>=0?"var(--gn)":"var(--rd)"} sm>{growthF>=0?"▲":"▼"} {Math.abs(growthF)}% seg.</Chip>}
                <Btn sz="sm" v="ghost" onClick={()=>{setMForm({...m});setEditingMetric(m);setShowMetricForm(true);}}>✏️</Btn>
                <Btn sz="sm" v="danger" onClick={()=>setSocialMetrics(ms=>ms.filter(x=>x.id!==m.id))}>×</Btn>
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
              {/* Views breakdown */}
              <div style={{background:"#EEF4FF",borderRadius:9,padding:"9px 11px",border:"1px solid #C7D7F5",gridColumn:"1/-1"}}><div style={{fontSize:9,fontWeight:700,color:"var(--bl)",textTransform:"uppercase",marginBottom:4}}>👁 Views</div><div style={{display:"flex",gap:10,flexWrap:"wrap"}}><span style={{fontSize:11}}><b style={{color:"var(--bl)"}}>{(+m.totalViews).toLocaleString()}</b> <span style={{color:"var(--mu)",fontSize:10}}>geral</span></span><span style={{fontSize:11}}><b style={{color:"var(--gn)"}}>{(+m.viewsNewFollowers||0).toLocaleString()}</b> <span style={{color:"var(--mu)",fontSize:10}}>novos seg.</span></span><span style={{fontSize:11}}><b style={{color:"var(--pu)"}}>{(+m.viewsFollowers||0).toLocaleString()}</b> <span style={{color:"var(--mu)",fontSize:10}}>seguidores</span></span></div></div>
              {/* Interactions breakdown */}
              <div style={{background:"#E6FAF4",borderRadius:9,padding:"9px 11px",border:"1px solid #A7F3D0",gridColumn:"1/-1"}}><div style={{fontSize:9,fontWeight:700,color:"var(--te)",textTransform:"uppercase",marginBottom:4}}>💬 Interações</div><div style={{display:"flex",gap:10,flexWrap:"wrap"}}><span style={{fontSize:11}}><b style={{color:"var(--te)"}}>{(+m.interactions).toLocaleString()}</b> <span style={{color:"var(--mu)",fontSize:10}}>geral</span></span><span style={{fontSize:11}}><b style={{color:"var(--gn)"}}>{(+m.interactionsNewFollowers||0).toLocaleString()}</b> <span style={{color:"var(--mu)",fontSize:10}}>novos seg.</span></span><span style={{fontSize:11}}><b style={{color:"var(--pu)"}}>{(+m.interactionsFollowers||0).toLocaleString()}</b> <span style={{color:"var(--mu)",fontSize:10}}>seguidores</span></span></div></div>
              {[["👥 Seguidores",m.totalFollowers,"var(--pu)"],["✨ Novos",m.newFollowers,"var(--gn)"],["📢 Alcance",m.reach,"var(--am)"],["🔢 Impressões",m.impressions,"var(--mu)"]].map(([l,v,c])=><div key={l} style={{background:"#F7F9FC",borderRadius:9,padding:"9px 11px",border:"1px solid var(--b)"}}>
                <div style={{fontSize:10,color:"var(--mu)",marginBottom:3}}>{l}</div>
                <div style={{fontFamily:"Playfair Display",fontSize:18,fontWeight:700,color:c}}>{(+v||0).toLocaleString()}</div>
              </div>)}
            </div>
          </div>;
        })}
      </div>
      {showMetricForm&&<Modal title={editingMetric?"Editar Mês":"Adicionar Mês"} onClose={()=>{setShowMetricForm(false);setEditingMetric(null);}}>
        <Inp label="Mês *" value={mForm.month} onChange={e=>fm({month:e.target.value})} type="month"/>
        <div className="g2">
          <div style={{gridColumn:"1/-1",fontSize:11,fontWeight:700,color:"var(--bl)",textTransform:"uppercase",letterSpacing:.5,marginTop:4}}>👁 Views</div>
          <Inp label="Views Totais (Geral)" value={mForm.totalViews} onChange={e=>fm({totalViews:e.target.value})} type="number"/>
          <Inp label="Views de Novos Seguidores" value={mForm.viewsNewFollowers} onChange={e=>fm({viewsNewFollowers:e.target.value})} type="number"/>
          <Inp label="Views de Seguidores" value={mForm.viewsFollowers} onChange={e=>fm({viewsFollowers:e.target.value})} type="number"/>
          <div style={{gridColumn:"1/-1",fontSize:11,fontWeight:700,color:"var(--te)",textTransform:"uppercase",letterSpacing:.5,marginTop:4}}>💬 Interações</div>
          <Inp label="Interações Totais (Geral)" value={mForm.interactions} onChange={e=>fm({interactions:e.target.value})} type="number"/>
          <Inp label="Interações Novos Seguidores" value={mForm.interactionsNewFollowers} onChange={e=>fm({interactionsNewFollowers:e.target.value})} type="number"/>
          <Inp label="Interações Seguidores" value={mForm.interactionsFollowers} onChange={e=>fm({interactionsFollowers:e.target.value})} type="number"/>
          <div style={{gridColumn:"1/-1",fontSize:11,fontWeight:700,color:"var(--mu)",textTransform:"uppercase",letterSpacing:.5,marginTop:4}}>📊 Alcance</div>
          <Inp label="Total Seguidores" value={mForm.totalFollowers} onChange={e=>fm({totalFollowers:e.target.value})} type="number"/>
          <Inp label="Novos Seguidores" value={mForm.newFollowers} onChange={e=>fm({newFollowers:e.target.value})} type="number"/>
          <Inp label="Alcance" value={mForm.reach} onChange={e=>fm({reach:e.target.value})} type="number"/>
          <Inp label="Impressões" value={mForm.impressions} onChange={e=>fm({impressions:e.target.value})} type="number"/>
        </div>
        <div style={{display:"flex",gap:8}}><Btn style={{flex:1}} onClick={saveMetric}>{editingMetric?"Salvar":"Adicionar"}</Btn></div>
      </Modal>}
    </div>}

    {showForm&&<Modal title={editing?"Editar Postagem":"Nova Postagem"} onClose={()=>{setShowForm(false);setEditing(null);}} wide>
      <div className="g2"><Inp label="Data *" value={form.date} onChange={e=>fp({date:e.target.value})} type="date"/><Inp label="Horário" value={form.time} onChange={e=>fp({time:e.target.value})} type="time"/></div>
      <Sel label="Categoria" value={form.category} onChange={e=>fp({category:e.target.value})} options={SOCIAL_CATS}/>
      <Lbl>Status</Lbl><div style={{display:"flex",gap:7,marginBottom:13}}>{["Rascunho","Programado","Publicado"].map(s=><button key={s} onClick={()=>fp({status:s})} style={{flex:1,background:form.status===s?`${ST_C[s]}15`:"#F7F9FC",border:`1.5px solid ${form.status===s?ST_C[s]:"#DDE3EE"}`,color:form.status===s?ST_C[s]:"var(--mu)",borderRadius:9,padding:"7px 0",fontSize:12,fontWeight:600,cursor:"pointer"}}>{s}</button>)}</div>
      <Inp label="Legenda *" value={form.caption} onChange={e=>fp({caption:e.target.value})} rows={4} placeholder="Texto da postagem..."/>
      <Inp label="Hashtags" value={form.hashtags} onChange={e=>fp({hashtags:e.target.value})} rows={2} placeholder="#reflexologia #bemestar..."/>
      <Inp label="URL da Imagem (opcional)" value={form.imageUrl} onChange={e=>fp({imageUrl:e.target.value})} placeholder="https://..."/>
      {form.imageUrl&&<img src={form.imageUrl} alt="preview" style={{width:"100%",maxHeight:180,objectFit:"cover",borderRadius:10,marginBottom:13}} onError={e=>e.target.style.display="none"}/>}
      <div style={{display:"flex",gap:9,marginBottom:13}}>
        {form.caption&&<button onClick={async()=>{try{await navigator.clipboard.writeText(form.caption+"\n\n"+form.hashtags);}catch{}if(form.imageUrl){try{const r=await fetch(form.imageUrl);const b=await r.blob();await navigator.clipboard.write([new ClipboardItem({[b.type]:b})]);}catch{try{await navigator.clipboard.writeText(form.imageUrl);}catch{}}}window.open("https://www.instagram.com/","_blank");}} style={{flex:1,background:"linear-gradient(135deg,#E1306C,#833AB4,#405DE6)",border:"none",borderRadius:9,padding:"10px 0",color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"DM Sans"}} title="Copia legenda + imagem e abre Instagram">📸 Copiar Legenda + Imagem e Abrir</button>}
      </div>
      <div style={{display:"flex",gap:8}}><Btn style={{flex:1}} onClick={savePost}>{editing?"Salvar":"Programar"}</Btn>{editing&&<Btn v="danger" onClick={()=>{setPosts(ps=>ps.filter(p=>p.id!==editing.id));setShowForm(false);setEditing(null);}}>Excluir</Btn>}</div>
    </Modal>}
  </div>;
}

/* ══════════════════════════════════════════════════
   PERMISSÕES
══════════════════════════════════════════════════ */
function PermissoesPage(){
  // ── State declarations (ordem importa — evita TDZ)
  const[perms,    setPerms]     = useState(IPERMS_INIT);
  const[roleNames,setRoleNames] = useState(()=>ROLES.reduce((a,r)=>({...a,[r]:r}),{}));
  const[selRole,  setSelRole]   = useState("Proprietária");
  const[editRole, setEditRole]  = useState(null);
  const[editRoleVal,setEditRoleVal] = useState("");
  const[saving,   setSaving]    = useState(false);
  const[saved,    setSaved]     = useState(false);
  const[saveErr,  setSaveErr]   = useState("");

  // ── Carrega permissões e nomes do banco ao abrir
  useEffect(()=>{
    Promise.all([
      supabase.from("settings").select("value").eq("id","permissions").single(),
      supabase.from("settings").select("value").eq("id","role_names").single(),
    ]).then(([r1,r2])=>{
      if(r1.data?.value) setPerms(()=>({...IPERMS_INIT,...r1.data.value}));
      if(r2.data?.value) setRoleNames(()=>({...ROLES.reduce((a,r)=>({...a,[r]:r}),{}),...r2.data.value}));
    });
  },[]);

  // ── Funções
  function toggle(role,mod){setPerms(p=>({...p,[role]:{...p[role],[mod]:!p[role][mod]}}))}
  function setAll(role,val){setPerms(p=>({...p,[role]:MODULES.reduce((a,m)=>({...a,[m]:val}),{})}))}
  function confirmRoleName(orig){
    if(!editRoleVal.trim()){setEditRole(null);return;}
    setRoleNames(r=>({...r,[orig]:editRoleVal.trim()}));
    setEditRole(null);
  }

  async function handleSave(){
    setSaving(true);setSaveErr("");
    try{
      const[r1,r2]=await Promise.all([
        supabase.from("settings").upsert({id:"permissions",tenant_id:"default",value:perms,updated_at:new Date().toISOString()}),
        supabase.from("settings").upsert({id:"role_names",tenant_id:"default",value:roleNames,updated_at:new Date().toISOString()}),
      ]);
      if(r1.error||r2.error) setSaveErr("Erro ao salvar. Tente novamente.");
      else{setSaved(true);setTimeout(()=>setSaved(false),3000);}
    }catch(e){setSaveErr(e.message||"Erro desconhecido.");}
    setSaving(false);
  }

  return <div style={{animation:"up .4s ease"}}>
    {/* Header com botão Salvar */}
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16,flexWrap:"wrap",gap:10}}>
      <div>
        <h1 style={{fontFamily:"Playfair Display",fontSize:24,fontWeight:700}}>Permissões</h1>
        <p style={{color:"var(--mu)",fontSize:11,marginTop:2}}>Edite os nomes dos perfis (✏️) e marque quais módulos cada perfil acessa</p>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:8}}>
        {saveErr&&<span style={{fontSize:12,color:"var(--rd)",fontWeight:600}}>{saveErr}</span>}
        {saved&&<span style={{fontSize:12,color:"var(--gn)",fontWeight:700}}>✓ Salvo com sucesso!</span>}
        <button onClick={handleSave} disabled={saving} style={{background:"linear-gradient(135deg,var(--pu),var(--bl))",border:"none",borderRadius:9,padding:"9px 20px",color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"DM Sans",opacity:saving?.7:1,boxShadow:"0 2px 8px rgba(48,102,190,.25)"}}>
          {saving?"Salvando…":"💾 Salvar tudo"}
        </button>
      </div>
    </div>
    {/* Seletor de perfis com edição de nome */}
    <div style={{display:"flex",gap:8,marginBottom:18,flexWrap:"wrap"}}>
      {ROLES.map(r=>{const ed=editRole===r;return <div key={r} style={{display:"flex",alignItems:"center",gap:5}}>
        {ed
          ? <div style={{display:"flex",gap:6,alignItems:"center"}}>
              <input value={editRoleVal} onChange={e=>setEditRoleVal(e.target.value)}
                onKeyDown={e=>e.key==="Enter"&&confirmRoleName(r)}
                autoFocus style={{background:"#F7F9FC",border:"1.5px solid var(--bl)",borderRadius:8,padding:"7px 11px",color:"var(--tx)",fontSize:12,outline:"none",fontFamily:"DM Sans",width:130}}/>
              <Btn sz="sm" onClick={()=>confirmRoleName(r)}>✓</Btn>
              <Btn sz="sm" v="ghost" onClick={()=>setEditRole(null)}>✕</Btn>
            </div>
          : <div style={{display:"flex",alignItems:"center",gap:4}}>
              <button onClick={()=>setSelRole(r)} style={{background:selRole===r?"#EEF4FF":"#fff",border:`1.5px solid ${selRole===r?"var(--bl)":"#DDE3EE"}`,color:selRole===r?"var(--bl)":"var(--mu)",borderRadius:9,padding:"8px 14px",fontSize:13,fontWeight:600,cursor:"pointer",boxShadow:"var(--shadow)"}}>
                {roleNames[r]||r}
              </button>
              <button onClick={()=>{setEditRole(r);setEditRoleVal(roleNames[r]||r);}}
                style={{background:"transparent",border:"none",color:"var(--mu2)",cursor:"pointer",fontSize:13,padding:"2px 4px"}} title="Renomear perfil">✏️</button>
            </div>}
      </div>;})}
    </div>
    <div style={{background:"#fff",borderRadius:16,padding:20,border:"1px solid var(--b)",marginBottom:16,boxShadow:"var(--shadow)"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <div style={{fontFamily:"Playfair Display",fontSize:16,fontWeight:600}}>Permissões: {roleNames[selRole]||selRole}</div>
        {selRole!=="Proprietária"&&<div style={{display:"flex",gap:7}}><Btn sz="sm" v="green" onClick={()=>setAll(selRole,true)}>✓ Liberar tudo</Btn><Btn sz="sm" v="danger" onClick={()=>setAll(selRole,false)}>✕ Bloquear</Btn></div>}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(190px,1fr))",gap:8}}>
        {MODULES.map(mod=>{const allowed=selRole==="Proprietária"?true:!!(perms[selRole]?.[mod]);const locked=selRole==="Proprietária";return <div key={mod} onClick={()=>!locked&&toggle(selRole,mod)} style={{display:"flex",alignItems:"center",gap:10,padding:"11px 14px",borderRadius:11,border:`1.5px solid ${allowed?"#C7D7F5":"#DDE3EE"}`,background:allowed?"#EEF4FF":"#F7F9FC",cursor:locked?"default":"pointer"}}>
          <div style={{width:20,height:20,borderRadius:5,border:`2px solid ${allowed?"var(--bl)":"#DDE3EE"}`,background:allowed?"var(--bl)":"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:11,color:"#fff",fontWeight:700}}>{allowed?"✓":""}</div>
          <div><div style={{fontSize:12,fontWeight:600,color:allowed?"var(--tx)":"var(--mu)"}}>{mod}</div>{locked&&<div style={{fontSize:9,color:"var(--bl)"}}>Acesso total</div>}</div>
        </div>;})}
      </div>
    </div>
    <div style={{background:"#fff",borderRadius:16,padding:20,border:"1px solid var(--b)",boxShadow:"var(--shadow)"}}>
      <div style={{fontFamily:"Playfair Display",fontSize:15,fontWeight:600,marginBottom:13}}>Resumo de Permissões</div>
      <div className="tw">
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:11,minWidth:500}}>
          <thead><tr style={{borderBottom:"1px solid var(--b)"}}><th style={{padding:"8px 11px",textAlign:"left",color:"var(--mu)",fontWeight:600,fontSize:10,textTransform:"uppercase",letterSpacing:.4,whiteSpace:"nowrap"}}>Módulo</th>{ROLES.map(r=><th key={r} style={{padding:"8px 11px",textAlign:"center",color:"var(--mu)",fontSize:10,fontWeight:600,textTransform:"uppercase",letterSpacing:.4,whiteSpace:"nowrap"}}>{roleNames[r]||r}</th>)}</tr></thead>
          <tbody>{MODULES.map(mod=><tr key={mod} style={{borderBottom:"1px solid var(--b)"}}>
            <td style={{padding:"7px 11px",fontWeight:600,whiteSpace:"nowrap"}}>{mod}</td>
            {ROLES.map(r=>{const ok=r==="Proprietária"?true:!!(perms[r]?.[mod]);return <td key={r} style={{padding:"7px 11px",textAlign:"center"}}><span style={{color:ok?"var(--gn)":"#DDE3EE",fontSize:14}}>{ok?"✓":"✕"}</span></td>;})}
          </tr>)}</tbody>
        </table>
      </div>
    </div>
  </div>;
}

/* ══════════════════════════════════════════════════
   SIDEBAR + NAV
══════════════════════════════════════════════════ */
const NAV=[
  {id:"dash",     icon:"⬡", lbl:"Dashboard"},
  {id:"crm",      icon:"◈", lbl:"CRM Leads"},
  {id:"produtos", icon:"▦", lbl:"Produtos"},
  {id:"alunos",   icon:"◉", lbl:"Alunos"},
  {id:"cursos",   icon:"❋", lbl:"Cursos"},
  {id:"fin",      icon:"◆", lbl:"Financeiro"},
  {id:"check",    icon:"✓", lbl:"Checklist"},
  {id:"wa",       icon:"◎", lbl:"WA Lembretes"},
  {id:"ped",      icon:"🎓",lbl:"Pedagógico"},
  {id:"social",   icon:"📸",lbl:"Social Media"},
  {id:"perms",    icon:"🔐",lbl:"Permissões"},
  {id:"users",    icon:"👥",lbl:"Usuários",adminOnly:true},
  {id:"suporte",  icon:"💬",lbl:"Suporte Dev",adminOnly:true},
  {id:"devpanel", icon:"🛠",lbl:"Dev Panel",devOnly:true},
];
const BOT=[{id:"dash",icon:"⬡",lbl:"Início"},{id:"crm",icon:"◈",lbl:"CRM"},{id:"cursos",icon:"❋",lbl:"Cursos"},{id:"fin",icon:"◆",lbl:"Financ."},{id:"__m__",icon:"☰",lbl:"Mais"}];

function SDDesk({active,setActive,students,courses,checks,nav=NAV,signOut}){
  const[col,setCol]=useState(false);
  return <div className={`sd ${col?"c":"e"}`}>
    <div style={{display:"flex",alignItems:"center",justifyContent:col?"center":"space-between",marginBottom:26}}>
      {!col&&<div><div style={{fontFamily:"Playfair Display",fontSize:10,color:"var(--mu)",letterSpacing:2,textTransform:"uppercase"}}>Instituto de</div><div style={{fontFamily:"Playfair Display",fontSize:18,fontWeight:700,color:"var(--bl)"}}>Reflexologia</div><div style={{fontFamily:"Playfair Display",fontSize:10,color:"var(--mu)"}}>& Pesquisa</div><div style={{width:22,height:2,background:"var(--bl)",marginTop:6,borderRadius:99}}/></div>}
      <div style={{display:"flex",alignItems:"center",gap:6}}>
        {!col&&<NotifBell students={students} courses={courses} checks={checks}/>}
        <button onClick={()=>setCol(c=>!c)} style={{background:"#F0F4FA",border:"none",borderRadius:7,width:26,height:26,color:"var(--mu)",cursor:"pointer",fontSize:12,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>{col?"›":"‹"}</button>
      </div>
    </div>
    <nav style={{display:"flex",flexDirection:"column",gap:1,flex:1,overflowY:"auto"}}>
      {nav.map(n=><button key={n.id} onClick={()=>setActive(n.id)} title={col?n.lbl:""} style={{display:"flex",alignItems:"center",gap:10,padding:col?"11px 0":"11px 12px",justifyContent:col?"center":"flex-start",borderRadius:9,border:"none",cursor:"pointer",background:active===n.id?"#EEF4FF":"transparent",color:active===n.id?"var(--bl)":"var(--mu)",fontFamily:"DM Sans",fontSize:13,fontWeight:active===n.id?700:400,borderLeft:`3px solid ${active===n.id?"var(--bl)":"transparent"}`,textAlign:"left",transition:"all .15s"}}>
        <span style={{fontSize:14,flexShrink:0}}>{n.icon}</span>{!col&&n.lbl}
      </button>)}
    </nav>
    {!col&&<div style={{borderTop:"1px solid var(--b)",paddingTop:11,paddingLeft:5}}>
      <div style={{fontSize:9,color:"var(--mu)",lineHeight:1.5}}>IOR · Gestão Pro<br/><span style={{color:"var(--bl)",fontWeight:600}}>v2025</span></div>
      <button onClick={()=>signOut?.()} style={{marginTop:8,background:"#FEF2F2",border:"1.5px solid #FECACA",borderRadius:8,padding:"5px 10px",fontSize:11,color:"var(--rd)",cursor:"pointer",fontFamily:"DM Sans",fontWeight:600,width:"100%"}}>Sair</button>
    </div>}
  </div>;
}

function SDMob({active,setActive,open,onClose,students,courses,checks,nav=NAV,signOut}){
  return <>
    <div className={`ov ${open?"op":""}`} onClick={onClose}/>
    <div className={`dr ${open?"op":""}`}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:22}}>
        <div><div style={{fontFamily:"Playfair Display",fontSize:10,color:"var(--mu)",letterSpacing:2,textTransform:"uppercase"}}>Instituto de</div><div style={{fontFamily:"Playfair Display",fontSize:19,fontWeight:700,color:"var(--bl)"}}>Reflexologia</div><div style={{fontFamily:"Playfair Display",fontSize:11,color:"var(--mu)"}}>& Pesquisa</div><div style={{width:22,height:2,background:"var(--bl)",marginTop:6,borderRadius:99}}/></div>
        <div style={{display:"flex",alignItems:"center",gap:8}}><NotifBell students={students} courses={courses} checks={checks}/><button onClick={onClose} style={{background:"#F7F9FC",border:"1.5px solid #DDE3EE",borderRadius:7,width:30,height:30,color:"var(--mu)",cursor:"pointer",fontSize:16,flexShrink:0}}>×</button></div>
      </div>
      <nav style={{display:"flex",flexDirection:"column",gap:1,flex:1,overflowY:"auto"}}>
        {nav.map(n=><button key={n.id} onClick={()=>{setActive(n.id);onClose();}} style={{display:"flex",alignItems:"center",gap:10,padding:"11px 12px",borderRadius:9,border:"none",cursor:"pointer",background:active===n.id?"#EEF4FF":"transparent",color:active===n.id?"var(--bl)":"var(--mu)",fontFamily:"DM Sans",fontSize:13,fontWeight:active===n.id?700:400,borderLeft:`3px solid ${active===n.id?"var(--bl)":"transparent"}`,textAlign:"left"}}>
          <span style={{fontSize:14}}>{n.icon}</span>{n.lbl}
        </button>)}
      </nav>
      <div style={{marginTop:"auto",paddingTop:16,borderTop:"1px solid var(--b)"}}>
        <button onClick={()=>signOut?.()} style={{width:"100%",background:"#FEF2F2",border:"1.5px solid #FECACA",borderRadius:9,padding:"11px",fontSize:13,color:"var(--rd)",cursor:"pointer",fontFamily:"DM Sans",fontWeight:700}}>
          Sair da conta
        </button>
      </div>
    </div>
  </>;
}

function BotNav({active,setActive,onMenu,nav=NAV}){
  return <nav className="bn">
    {BOT.map(n=><button key={n.id} className={`bni ${active===n.id?"a":""}`} onClick={()=>n.id==="__m__"?onMenu():setActive(n.id)}>
      <span style={{fontSize:17}}>{n.icon}</span><span style={{fontSize:9,fontWeight:600,letterSpacing:.3}}>{n.lbl}</span>
    </button>)}
  </nav>;
}

/* ══════════════════════════════════════════════════
   ROOT — SINGLE SOURCE OF TRUTH
   Dados carregados do banco via API — zero dados no JS
══════════════════════════════════════════════════ */
export default function IOR({ user, role = "Assistente", isAdmin = false, isDev = false, signOut }={}){  // auth from App.tsx
  const[page,setPage]  = useState("dash");
  const[courses,setCourses]   = useState([]);
  const[students,setStudents] = useState([]);
  const[leads,setLeads]       = useState([]);
  const[products,setProducts] = useState([]);
  const[sales,setSales]       = useState([]);
  const[checks,setChecks]     = useState([]);
  const[templates,setTemplates]=useState([]);
  const[socialMetrics,setSocialMetrics]=useState([]);
  const[drawer,setDrawer]     = useState(false);
  const[loading,setLoading]   = useState(true);
  const[loadErr,setLoadErr]   = useState(null);
  const curr=NAV.find(n=>n.id===page);

  /* ── Carregamento de dados quando autenticado */
  useEffect(()=>{
    if(!user?.id){ return; }
    setLoading(true);
    Promise.all([
      db.courses.list(), db.students.list(), db.leads.list(),
      db.products.list(), db.sales.list(), db.checks.list(),
      db.templates.list(), db.metrics.list(),
    ]).then(([c,st,l,pr,sa,ch,tp,mt])=>{
      setCourses(c||[]); setStudents(st||[]); setLeads(l||[]);
      setProducts(pr||[]); setSales(sa||[]); setChecks(ch||[]);
      setTemplates(tp||[]); setSocialMetrics(mt||[]);
      setLoading(false);
    }).catch(err=>{ setLoadErr(err.message); setLoading(false); });
  },[user?.id]);

  /* ── Tela de login — gerenciado pelo App.tsx */

  if(loading) return <div style={{height:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:"var(--bg)",fontFamily:"DM Sans",gap:14}}>
    <div style={{width:44,height:44,border:"3px solid var(--bl)",borderTopColor:"transparent",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>
    <div style={{fontFamily:"Playfair Display",fontSize:18,color:"var(--bl)"}}>Carregando dados…</div>
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
  </div>;

  if(loadErr) return <div style={{height:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:"var(--bg)",fontFamily:"DM Sans",gap:14,padding:24}}>
    <div style={{fontSize:32}}>⚠️</div>
    <div style={{fontFamily:"Playfair Display",fontSize:18,color:"var(--rd)"}}>Erro ao conectar com o servidor</div>
    <div style={{fontSize:13,color:"var(--mu)",maxWidth:380,textAlign:"center"}}>{loadErr}</div>
    <button onClick={()=>window.location.reload()} style={{background:"var(--bl)",color:"#fff",border:"none",borderRadius:9,padding:"10px 24px",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"DM Sans"}}>Tentar novamente</button>
  </div>;


  const pages={
    dash:    <DashPage     leads={leads} students={students} courses={courses} sales={sales}/>,
    crm:     <CRMPage      leads={leads} setLeads={setLeads} courses={courses} students={students} setStudents={setStudents} sales={sales} setSales={setSales}/>,
    produtos:<ProductsPage products={products} setProducts={setProducts} sales={sales} setSales={setSales}/>,
    alunos:  <StudentsPage students={students} setStudents={setStudents} courses={courses} sales={sales} setSales={setSales} templates={templates}/>,
    cursos:  <CoursesPage  courses={courses} setCourses={setCourses} students={students} setStudents={setStudents}/>,
    fin:     <FinancialPage sales={sales} setSales={setSales} courses={courses} students={students}/>,
    check:   <ChecklistPage checks={checks} setChecks={setChecks}/>,
    wa:      <WhatsAppPage  leads={leads} students={students} courses={courses} templates={templates} setTemplates={setTemplates}/>,
    ped:     <PedagogicoPage students={students} setStudents={setStudents} courses={courses}/>,
    social:  <SocialPage socialMetrics={socialMetrics} setSocialMetrics={setSocialMetrics}/>,
    perms:   <PermissoesPage/>,
    suporte: isAdmin||isDev ? <SupportPage user={user}/> : null,
    devpanel: isDev ? <DevPage/> : null,
    users:   isAdmin ? <UsersPage /> : <div style={{padding:24,color:"var(--rd)",fontFamily:"DM Sans"}}>Acesso restrito à Proprietária.</div>,
  };
  const visibleNav = NAV.filter(n => {
    if(n.devOnly) return isDev;
    if(n.adminOnly) return isAdmin || isDev;
    return true;
  });

  return <>
    <GS/>
    <div style={{display:"flex",height:"100vh",overflow:"hidden",background:"var(--bg)"}}>
      <SDDesk active={page} setActive={setPage} students={students} courses={courses} checks={checks} nav={visibleNav} signOut={signOut}/>
      <SDMob  active={page} setActive={setPage} open={drawer} onClose={()=>setDrawer(false)} students={students} courses={courses} checks={checks} nav={visibleNav} signOut={signOut}/>
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        <div className="mob" style={{flexShrink:0,height:48,background:"#fff",borderBottom:"1px solid var(--b)",alignItems:"center",justifyContent:"space-between",padding:"0 16px",boxShadow:"0 2px 8px rgba(30,40,80,.07)"}}>
          <button onClick={()=>setDrawer(true)} style={{background:"transparent",border:"none",color:"var(--mu)",fontSize:20,cursor:"pointer"}}>☰</button>
          <div style={{fontFamily:"Playfair Display",fontSize:14,fontWeight:700,color:"var(--bl)"}}>{curr?.icon} {curr?.lbl}</div>
          <div style={{width:30}}/>
        </div>
        <main className="mc" style={{flex:1,overflowY:"auto",padding:"24px 26px"}}>
          {pages[page]}
        </main>
      </div>
      <BotNav active={page} setActive={setPage} onMenu={()=>setDrawer(true)} nav={visibleNav}/>
    </div>
  </>;
}

/* ══════════════════════════════════════════════════
   GESTÃO DE USUÁRIOS — só Proprietária acessa
   Chama a Edge Function manage-users no Supabase
══════════════════════════════════════════════════ */
/* ══════════════════════════════════════════════════
   SUPORTE — Proprietária envia pedidos ao Dev
══════════════════════════════════════════════════ */
function SupportPage({user}){
  const[tickets,setTickets]=useState([]);
  const[loading,setLoading]=useState(true);
  const[showF,setShowF]=useState(false);
  const[saving,setSaving]=useState(false);
  const[success,setSuccess]=useState("");
  const e0={type:"Dúvida",title:"",message:""};
  const[form,setForm]=useState(e0);
  const ff=v=>setForm(p=>({...p,...v}));

  useEffect(()=>{
    supabase.from("support_tickets").select("*").order("created_at",{ascending:false})
      .then(({data})=>{setTickets(data||[]);setLoading(false);});
  },[]);

  async function send(){
    if(!form.title.trim()||!form.message.trim())return;
    setSaving(true);
    const{data,error}=await supabase.from("support_tickets").insert({
      tenant_id:"default",
      from_name:user?.user_metadata?.name||user?.email||"Proprietária",
      from_email:user?.email||"",
      type:form.type,title:form.title,message:form.message,
    }).select().single();
    if(!error){setTickets(t=>[data,...t]);setSuccess("✓ Enviado ao desenvolvedor!");setTimeout(()=>setSuccess(""),3000);setShowF(false);setForm(e0);}
    setSaving(false);
  }

  return <div style={{animation:"up .4s ease"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
      <div>
        <h1 style={{fontFamily:"Playfair Display",fontSize:24,fontWeight:700}}>Suporte ao Desenvolvedor</h1>
        <p style={{color:"var(--mu)",fontSize:11,marginTop:2}}>Envie bugs, pedidos de funcionalidade ou dúvidas diretamente ao dev</p>
      </div>
      <Btn sz="sm" onClick={()=>setShowF(true)}>+ Novo pedido</Btn>
    </div>

    {success&&<div style={{background:"#F0FDF4",border:"1.5px solid #BBF7D0",borderRadius:10,padding:"10px 14px",fontSize:13,color:"var(--gn)",marginBottom:14,fontWeight:600}}>{success}</div>}

    {loading?<div style={{textAlign:"center",padding:"40px 0",color:"var(--mu)"}}>Carregando…</div>:(
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {tickets.map((t,i)=><div key={t.id} style={{background:"#fff",borderRadius:14,padding:"14px 16px",border:"1.5px solid #E5EAF3",boxShadow:"var(--shadow)",animation:`sr .3s ease ${i*.05}s both`}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8,flexWrap:"wrap"}}>
            <div style={{flex:1}}>
              <div style={{display:"flex",alignItems:"center",gap:7,flexWrap:"wrap",marginBottom:4}}>
                <Chip color={TYPE_C[t.type]||"var(--mu)"} sm>{t.type}</Chip>
                <Chip color={STATUS_C[t.status]||"var(--mu)"} sm>{t.status}</Chip>
                <span style={{fontWeight:700,fontSize:14}}>{t.title}</span>
              </div>
              <p style={{fontSize:13,color:"var(--mu)",margin:"4px 0"}}>{t.message}</p>
              {t.dev_response&&<div style={{background:"#EEF4FF",borderRadius:9,padding:"8px 12px",marginTop:8,fontSize:13,color:"var(--bl)",borderLeft:"3px solid var(--bl)"}}>
                <div style={{fontSize:10,fontWeight:700,color:"var(--bl)",marginBottom:3}}>💬 RESPOSTA DO DEV</div>
                {t.dev_response}
              </div>}
            </div>
            <div style={{fontSize:10,color:"var(--mu2)",flexShrink:0}}>{new Date(t.created_at).toLocaleDateString("pt-BR")}</div>
          </div>
        </div>)}
        {!tickets.length&&<div style={{textAlign:"center",padding:"40px 0",color:"var(--mu)",fontSize:13}}>
          Nenhum ticket ainda. Clique em "+ Novo pedido" para falar com o dev! 🛠
        </div>}
      </div>
    )}

    {showF&&<Modal title="Novo Pedido" onClose={()=>{setShowF(false);setForm(e0);}}>
      <Lbl>Tipo</Lbl>
      <div style={{display:"flex",gap:6,marginBottom:14,flexWrap:"wrap"}}>
        {["Bug","Feature","Dúvida","Urgente"].map(t=><button key={t} onClick={()=>ff({type:t})} style={{background:form.type===t?`${TYPE_C[t]}22`:"#F7F9FC",border:`1.5px solid ${form.type===t?TYPE_C[t]:"#DDE3EE"}`,color:form.type===t?TYPE_C[t]:"var(--mu)",borderRadius:99,padding:"5px 12px",fontSize:12,fontWeight:600,cursor:"pointer"}}>{t}</button>)}
      </div>
      <Inp label="Título *" value={form.title} onChange={e=>ff({title:e.target.value})} placeholder="Ex: Botão de exportar não funciona"/>
      <div style={{marginBottom:14}}>
        <Lbl>Mensagem *</Lbl>
        <textarea value={form.message} onChange={e=>ff({message:e.target.value})} placeholder="Descreva com detalhes o que aconteceu ou o que precisa…" style={{width:"100%",minHeight:100,background:"#F7F9FC",border:"1.5px solid #DDE3EE",borderRadius:10,padding:"10px 12px",fontSize:13,fontFamily:"DM Sans",resize:"vertical",boxSizing:"border-box",color:"var(--tx)"}}/>
      </div>
      <Btn style={{width:"100%"}} onClick={send} disabled={saving}>{saving?"Enviando…":"💬 Enviar ao desenvolvedor"}</Btn>
    </Modal>}
  </div>;
}

/* ══════════════════════════════════════════════════
   PAINEL DO DESENVOLVEDOR — só Rodrigo acessa
══════════════════════════════════════════════════ */
function DevPage(){
  const[tickets,setTickets]=useState([]);
  const[loading,setLoading]=useState(true);
  const[responding,setResponding]=useState(null);
  const[resp,setResp]=useState("");
  const[filter,setFilter]=useState("Todos");

  useEffect(()=>{
    // Dev vê todos os tickets de todos os tenants via service role
    supabase.from("support_tickets").select("*").order("created_at",{ascending:false})
      .then(({data})=>{setTickets(data||[]);setLoading(false);});
  },[]);

  async function respond(ticket){
    if(!resp.trim())return;
    const{data}=await supabase.from("support_tickets").update({
      dev_response:resp,status:"Resolvido",responded_at:new Date().toISOString()
    }).eq("id",ticket.id).select().single();
    if(data){setTickets(ts=>ts.map(t=>t.id===ticket.id?data:t));}
    setResponding(null);setResp("");
  }

  async function setStatus(ticket,status){
    const{data}=await supabase.from("support_tickets").update({status}).eq("id",ticket.id).select().single();
    if(data)setTickets(ts=>ts.map(t=>t.id===ticket.id?data:t));
  }

  const filtered=filter==="Todos"?tickets:tickets.filter(t=>t.status===filter);
  const counts={Aberto:tickets.filter(t=>t.status==="Aberto").length,"Em andamento":tickets.filter(t=>t.status==="Em andamento").length,Resolvido:tickets.filter(t=>t.status==="Resolvido").length};

  return <div style={{animation:"up .4s ease"}}>
    <div style={{marginBottom:16}}>
      <h1 style={{fontFamily:"Playfair Display",fontSize:24,fontWeight:700}}>🛠 Painel do Desenvolvedor</h1>
      <p style={{color:"var(--mu)",fontSize:11,marginTop:2}}>Pedidos, bugs e solicitações de todos os clientes</p>
    </div>

    {/* Resumo */}
    <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:16}}>
      {[["Aberto","var(--am)","🔴"],["Em andamento","var(--bl)","🔵"],["Resolvido","var(--gn)","✅"]].map(([s,c,ic])=>(
        <div key={s} style={{background:"#fff",borderRadius:12,padding:"12px 14px",border:`1.5px solid ${c}22`,cursor:"pointer",boxShadow:"var(--shadow)"}} onClick={()=>setFilter(filter===s?"Todos":s)}>
          <div style={{fontSize:18}}>{ic}</div>
          <div style={{fontWeight:700,fontSize:20,color:c}}>{counts[s]||0}</div>
          <div style={{fontSize:11,color:"var(--mu)"}}>{s}</div>
        </div>
      ))}
    </div>

    {/* Lista */}
    {loading?<div style={{textAlign:"center",padding:"40px 0",color:"var(--mu)"}}>Carregando…</div>:(
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {filtered.map((t,i)=><div key={t.id} style={{background:"#fff",borderRadius:14,padding:"14px 16px",border:`1.5px solid ${t.status==="Aberto"?"#FDE68A":t.status==="Resolvido"?"#BBF7D0":"#C7D7F5"}`,boxShadow:"var(--shadow)",animation:`sr .3s ease ${i*.04}s both`}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8,flexWrap:"wrap"}}>
            <div style={{flex:1}}>
              <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap",marginBottom:4}}>
                <Chip color={TYPE_C[t.type]||"var(--mu)"} sm>{t.type}</Chip>
                <Chip color={STATUS_C[t.status]||"var(--mu)"} sm>{t.status}</Chip>
                <span style={{fontWeight:700,fontSize:14}}>{t.title}</span>
              </div>
              <div style={{fontSize:11,color:"var(--mu)",marginBottom:4}}>
                👤 {t.from_name} · {t.from_email} · tenant: {t.tenant_id}
              </div>
              <p style={{fontSize:13,color:"var(--tx)",margin:"4px 0",lineHeight:1.5}}>{t.message}</p>
              {t.dev_response&&<div style={{background:"#EEF4FF",borderRadius:9,padding:"8px 12px",marginTop:8,fontSize:13,color:"var(--bl)",borderLeft:"3px solid var(--bl)"}}>
                <div style={{fontSize:10,fontWeight:700,marginBottom:2}}>Sua resposta:</div>
                {t.dev_response}
              </div>}
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:5,alignItems:"flex-end",flexShrink:0}}>
              <div style={{fontSize:10,color:"var(--mu2)"}}>{new Date(t.created_at).toLocaleDateString("pt-BR")}</div>
              <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                {t.status!=="Em andamento"&&<button onClick={()=>setStatus(t,"Em andamento")} style={{background:"#EEF4FF",border:"1.5px solid #C7D7F5",borderRadius:7,padding:"4px 8px",fontSize:10,color:"var(--bl)",cursor:"pointer",fontWeight:600}}>Em andamento</button>}
                {t.status!=="Resolvido"&&<button onClick={()=>setStatus(t,"Resolvido")} style={{background:"#F0FDF4",border:"1.5px solid #BBF7D0",borderRadius:7,padding:"4px 8px",fontSize:10,color:"var(--gn)",cursor:"pointer",fontWeight:600}}>Resolver</button>}
                <Btn sz="sm" onClick={()=>{setResponding(t);setResp(t.dev_response||"");}}>💬 Responder</Btn>
              </div>
            </div>
          </div>

          {responding?.id===t.id&&<div style={{marginTop:12,borderTop:"1px solid var(--b)",paddingTop:10}}>
            <textarea value={resp} onChange={e=>setResp(e.target.value)} placeholder="Escreva sua resposta para o cliente…" style={{width:"100%",minHeight:80,background:"#F7F9FC",border:"1.5px solid var(--bl)",borderRadius:9,padding:"8px 12px",fontSize:13,fontFamily:"DM Sans",resize:"vertical",boxSizing:"border-box",color:"var(--tx)",marginBottom:8}}/>
            <div style={{display:"flex",gap:8}}>
              <Btn onClick={()=>respond(t)}>Enviar resposta</Btn>
              <Btn v="ghost" onClick={()=>setResponding(null)}>Cancelar</Btn>
            </div>
          </div>}
        </div>)}
        {!filtered.length&&<div style={{textAlign:"center",padding:"32px 0",color:"var(--mu)",fontSize:13}}>Nenhum ticket {filter!=="Todos"?`com status "${filter}"`:"ainda"}.</div>}
      </div>
    )}
  </div>;
}

function UsersPage(){
  const EDGE = "https://odegosowuketirxdgllb.supabase.co/functions/v1/manage-users";
  const[users,setUsers]=useState([]);
  const[loading,setLoading]=useState(true);
  const[roleNames,setRoleNames]=useState(()=>ROLES.reduce((a,r)=>({...a,[r]:r}),{}));

  // Carrega nomes customizados de perfis
  useEffect(()=>{
    supabase.from("settings").select("value").eq("id","role_names").single()
      .then(({data})=>{ if(data?.value) setRoleNames(p=>({...p,...data.value})); });
  },[]);
  const[showF,setShowF]=useState(false);
  const[editing,setEditing]=useState(null);
  const[err,setErr]=useState("");
  const[saving,setSaving]=useState(false);
  const[mode,setMode]=useState("invite"); // "invite" | "password"
  const[successMsg,setSuccessMsg]=useState("");
  const eF={name:"",email:"",password:"",role:ROLES[1]};
  const[form,setForm]=useState(eF);
  const ff=v=>setForm(p=>({...p,...v}));

  async function callEdge(body){
    const{data:{session}}=await supabase.auth.getSession();
    const res=await fetch(EDGE,{
      method:"POST",
      headers:{"Content-Type":"application/json","Authorization":`Bearer ${session?.access_token}`},
      body:JSON.stringify(body),
    });
    return res.json();
  }

  async function load(){
    setLoading(true);setErr("");
    const data=await callEdge({action:"list"});
    if(data.error)setErr(data.error);
    else setUsers(data.data||[]);
    setLoading(false);
  }
  useEffect(()=>{load();},[]);

  async function save(){
    if(!form.name.trim()||!form.email.trim()){setErr("Nome e e-mail são obrigatórios");return;}
    setSaving(true);setErr("");
    let data;
    if(editing){
      data=await callEdge({action:"update",userId:editing.id,name:form.name,userRole:form.role,...(form.password?{newPassword:form.password}:{})});
    } else if(mode==="invite"){
      data=await callEdge({action:"invite",email:form.email,name:form.name,userRole:form.role,redirectTo:window.location.origin+"/auth/callback"});
    } else {
      if(!form.password.trim()){setErr("Senha obrigatória");setSaving(false);return;}
      data=await callEdge({action:"create",email:form.email,password:form.password,name:form.name,userRole:form.role});
    }
    if(data.error){setErr(data.error);}
    else{
      setShowF(false);setEditing(null);setForm(eF);
      setSuccessMsg(mode==="invite"&&!editing?`✉ Convite enviado para ${form.email}!`:"✓ Usuário salvo com sucesso!");
      setTimeout(()=>setSuccessMsg(""),4000);
      await load();
    }
    setSaving(false);
  }

  async function resendInvite(u){
    setErr("");
    const data=await callEdge({action:"resend_invite",email:u.email,name:u.name,userRole:u.role,redirectTo:window.location.origin+"/auth/callback"});
    if(data.error)setErr(data.error);
    else{setSuccessMsg(`✉ Convite reenviado para ${u.email}!`);setTimeout(()=>setSuccessMsg(""),4000);}
  }

  async function toggleActive(u){
    setErr("");
    const data=await callEdge({action:u.active?"deactivate":"reactivate",userId:u.id});
    if(data.error)setErr(data.error);else await load();
  }

  const ROLE_C={"Proprietária":"var(--bl)","Financeiro":"var(--gn)","Secretaria":"var(--te)","Professor(a)":"var(--pu)","Assistente":"var(--mu)"};

  return <div style={{animation:"up .4s ease"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
      <div>
        <h1 style={{fontFamily:"Playfair Display",fontSize:24,fontWeight:700}}>Usuários</h1>
        <p style={{color:"var(--mu)",fontSize:11,marginTop:2}}>{users.length} conta{users.length!==1?"s":""} · gerenciado pela Proprietária</p>
      </div>
      <Btn sz="sm" onClick={()=>{setForm(eF);setEditing(null);setErr("");setMode("invite");setShowF(true);}}>+ Novo usuário</Btn>
    </div>

    {err&&<div style={{background:"#FEF2F2",border:"1.5px solid #FECACA",borderRadius:10,padding:"10px 14px",fontSize:13,color:"var(--rd)",marginBottom:14,fontWeight:600}}>⚠ {err}</div>}
    {successMsg&&<div style={{background:"#F0FDF4",border:"1.5px solid #BBF7D0",borderRadius:10,padding:"10px 14px",fontSize:13,color:"var(--gn)",marginBottom:14,fontWeight:600,animation:"fadeIn .3s ease"}}>{successMsg}</div>}

    {loading?<div style={{textAlign:"center",padding:"40px 0",color:"var(--mu)",fontSize:13}}>Carregando usuários…</div>:(
      <div style={{display:"flex",flexDirection:"column",gap:9}}>
        {users.map((u,i)=><div key={u.id} style={{background:"#fff",borderRadius:14,padding:"14px 16px",border:`1.5px solid ${!u.active?"#FECACA":u.invited?"#FEF3C7":"#E5EAF3"}`,display:"flex",alignItems:"center",gap:12,boxShadow:"var(--shadow)",animation:`sr .3s ease ${i*.05}s both`,opacity:u.active?1:.6}}>
          <Av letter={(u.name||"?")[0]} size={40} color={ROLE_C[u.role]||"var(--mu)"}/>
          <div style={{flex:1,minWidth:0}}>
            <div style={{display:"flex",alignItems:"center",gap:7,flexWrap:"wrap"}}>
              <span style={{fontWeight:700,fontSize:13}}>{u.name||"—"}</span>
              <Chip color={ROLE_C[u.role]||"var(--mu)"} sm>{roleNames[u.role]||u.role}</Chip>
              {u.invited&&<Chip color="var(--am)" sm>⏳ Convite pendente</Chip>}
              {!u.active&&<Chip color="var(--rd)" sm>Desativado</Chip>}
            </div>
            <div style={{fontSize:11,color:"var(--mu)",marginTop:2}}>{u.email}</div>
            <div style={{fontSize:10,color:"var(--mu2)",marginTop:2}}>
              {u.invited?"Aguardando aceite do convite":u.lastSignIn?`Último acesso: ${new Date(u.lastSignIn).toLocaleDateString("pt-BR")}`:"Nunca acessou"}
            </div>
          </div>
          <div style={{display:"flex",gap:6,flexShrink:0}}>
            {u.invited&&<button onClick={()=>resendInvite(u)} style={{background:"#FFFBEB",border:"1.5px solid #FDE68A",borderRadius:9,padding:"5px 10px",fontSize:11,color:"var(--am)",cursor:"pointer",fontFamily:"DM Sans",fontWeight:600}} title="Reenviar e-mail de convite">✉ Reenviar</button>}
            <Btn sz="sm" v="ghost" onClick={()=>{setForm({name:u.name,email:u.email,password:"",role:u.role});setEditing(u);setErr("");setShowF(true);}}>✏️</Btn>
            <button onClick={()=>toggleActive(u)} style={{background:u.active?"#FEF2F2":"#F0FDF4",border:`1.5px solid ${u.active?"#FECACA":"#BBF7D0"}`,borderRadius:9,padding:"5px 10px",fontSize:11,color:u.active?"var(--rd)":"var(--gn)",cursor:"pointer",fontFamily:"DM Sans",fontWeight:600}}>
              {u.active?"Desativar":"Reativar"}
            </button>
          </div>
        </div>)}
        {!users.length&&<div style={{textAlign:"center",padding:"32px 0",color:"var(--mu)",fontSize:12}}>Nenhum usuário encontrado.</div>}
      </div>
    )}

    {showF&&<Modal title={editing?"Editar Usuário":"Novo Usuário"} sub={editing?.email} onClose={()=>{setShowF(false);setEditing(null);setErr("");}}>
      {err&&<div style={{background:"#FEF2F2",border:"1.5px solid #FECACA",borderRadius:9,padding:"8px 12px",fontSize:12,color:"var(--rd)",marginBottom:11,fontWeight:600}}>⚠ {err}</div>}

      {/* Seletor de modo — só aparece ao criar */}
      {!editing&&<div style={{display:"flex",gap:8,marginBottom:14}}>
        <button onClick={()=>setMode("invite")} style={{flex:1,padding:"10px 0",borderRadius:10,border:`2px solid ${mode==="invite"?"var(--bl)":"#DDE3EE"}`,background:mode==="invite"?"#EEF4FF":"#F7F9FC",color:mode==="invite"?"var(--bl)":"var(--mu)",fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"DM Sans"}}>
          ✉ Enviar convite
        </button>
        <button onClick={()=>setMode("password")} style={{flex:1,padding:"10px 0",borderRadius:10,border:`2px solid ${mode==="password"?"var(--bl)":"#DDE3EE"}`,background:mode==="password"?"#EEF4FF":"#F7F9FC",color:mode==="password"?"var(--bl)":"var(--mu)",fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"DM Sans"}}>
          🔑 Criar com senha
        </button>
      </div>}

      {/* Descrição do modo */}
      {!editing&&<div style={{background:mode==="invite"?"#EEF4FF":"#F7F9FC",borderRadius:9,padding:"8px 12px",fontSize:11,color:mode==="invite"?"var(--bl)":"var(--mu)",marginBottom:12,lineHeight:1.5}}>
        {mode==="invite"
          ? "✉ A usuária receberá um e-mail com link para criar a própria senha. Mais seguro e profissional."
          : "🔑 Você define a senha agora. Lembre de comunicá-la à usuária com segurança."}
      </div>}

      <Inp label="Nome completo *" value={form.name} onChange={e=>ff({name:e.target.value})} placeholder="Ex: Ana Lima"/>
      {!editing&&<Inp label="E-mail *" value={form.email} onChange={e=>ff({email:e.target.value})} type="email" placeholder="ana@iorreflexologia.com"/>}
      {(mode==="password"||editing)&&<Inp label={editing?"Nova senha (deixe em branco para manter)":"Senha *"} value={form.password} onChange={e=>ff({password:e.target.value})} type="password" placeholder="Mínimo 8 caracteres"/>}

      <Lbl>Perfil de acesso</Lbl>
      <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:14}}>
        {ROLES.map(r=><button key={r} onClick={()=>ff({role:r})} style={{background:form.role===r?`${ROLE_C[r]||"var(--mu)"}15`:"#F7F9FC",border:`1.5px solid ${form.role===r?ROLE_C[r]||"var(--mu)":"#DDE3EE"}`,color:form.role===r?ROLE_C[r]||"var(--mu)":"var(--mu)",borderRadius:99,padding:"5px 12px",fontSize:12,fontWeight:600,cursor:"pointer"}}>{roleNames[r]||r}</button>)}
      </div>
      <div style={{background:"#EEF4FF",borderRadius:9,padding:"8px 12px",fontSize:11,color:"var(--bl)",marginBottom:14}}>
        ℹ As permissões de cada perfil são configuradas na aba <strong>Permissões</strong>.
      </div>
      <Btn style={{width:"100%"}} onClick={save} disabled={saving}>
        {saving?"Salvando…":editing?"Salvar alterações":mode==="invite"?"✉ Enviar convite":"🔑 Criar usuário"}
      </Btn>
    </Modal>}
  </div>;
}
