import { useState, useMemo, useCallback } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, Legend } from "recharts";

/* ══════════════════════════════════════════════════
   GLOBAL STYLES — LIGHT THEME
══════════════════════════════════════════════════ */
function GS() {
  return <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;0,900;1,400&family=DM+Sans:wght@300;400;500;600;700&display=swap');
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    ::-webkit-scrollbar{width:4px;height:4px}
    ::-webkit-scrollbar-thumb{background:rgba(61,133,200,.25);border-radius:99px}
    :root{
      --bg:#F4F7FB;
      --surf:#FFFFFF;
      --card:#FFFFFF;
      --card2:#F0F4FA;
      --b:rgba(61,133,200,.14);
      --bs:rgba(61,133,200,.35);
      --bl:#3066BE;
      --bl2:#4A85D8;
      --pu:#6244B8;
      --pu2:#8B6EE0;
      --te:#2B9E98;
      --am:#C07700;
      --rd:#D43030;
      --gn:#1E8A4C;
      --gl:rgba(48,102,190,.09);
      --pl:rgba(98,68,184,.09);
      --tx:#1A2540;
      --mu:#6B7A99;
      --mu2:#9AAAC0;
      --shadow:0 2px 14px rgba(30,40,80,.09);
      --shadow-md:0 4px 24px rgba(30,40,80,.13);
      --bnh:60px;
    }
    @keyframes up  {from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
    @keyframes sr  {from{opacity:0;transform:translateX(-10px)}to{opacity:1;transform:translateX(0)}}
    @keyframes su  {from{opacity:0;transform:translateY(100%)}to{opacity:1;transform:translateY(0)}}
    @keyframes sp  {to{transform:rotate(360deg)}}
    @keyframes ik  {from{transform:scaleX(0);transform-origin:left}to{transform:scaleX(1)}}
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
    @media(max-width:768px){
      .g2,.gdash,.gwa{grid-template-columns:1fr!important}
      .mob{display:flex!important}.dsk{display:none!important}
      .bn{display:flex!important}.sd{display:none!important}
      .mc{padding:13px!important;padding-bottom:calc(var(--bnh)+10px)!important}
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
const MODULES  = ["Dashboard","CRM Leads","CRM Produtos","Alunos","Cursos","Financeiro","Checklist","WA Lembretes","Pedagógico","Permissões"];
const ROLES    = ["Proprietária","Financeiro","Secretaria","Professor(a)","Assistente"];
const MOPT     = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
const MNS      = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

const SCL  = {"Leads Frios":"#9AAAC0","Negociação":"#C07700","Espera":"#3066BE","Fechado":"#1E8A4C","Perdido":"#D43030"};
const PCL  = {"Nota Fiscal":"#9AAAC0","Embalar":"#C07700","Pronto":"#2B9E98","Enviado":"#3066BE","Fechado":"#1E8A4C"};
const TCL  = {"Curso":"#3066BE","Workshop":"#6244B8","Produto":"#2B9E98","Atendimento":"#C07700"};
const KCL  = {"Curso":"#3066BE","Workshop":"#6244B8","Estágio":"#2B9E98","Ambulatório":"#C07700"};
const IPED = ["Apostila recebida","Material entregue","Avaliação teórica","Estágio concluído","Certificado emitido","Relatório entregue"];
const IPERMS_INIT = {
  "Proprietária": MODULES.reduce((a,m)=>({...a,[m]:true}),{}),
  "Financeiro":   MODULES.reduce((a,m)=>({...a,[m]:["Financeiro","Dashboard"].includes(m)}),{}),
  "Secretaria":   MODULES.reduce((a,m)=>({...a,[m]:["Dashboard","Alunos","Cursos","Checklist","WA Lembretes"].includes(m)}),{}),
  "Professor(a)": MODULES.reduce((a,m)=>({...a,[m]:["Dashboard","Alunos","Cursos","Checklist","Pedagógico"].includes(m)}),{}),
  "Assistente":   MODULES.reduce((a,m)=>({...a,[m]:["Dashboard","Alunos","Cursos"].includes(m)}),{}),
};

/* ══════════════════════════════════════════════════
   SEED DATA
══════════════════════════════════════════════════ */
const SEED_COURSES = [
  {id:101,name:"Reflexologia Podal – Módulo I",  type:"Curso",    date:"2025-03-15",end:"2025-03-16",modality:"Presencial",value:980, capacity:12,enrolled:[201,202,203],waitlist:[204],instructor:"Profa. Ana Lima",  desc:"Fundamentos da reflexologia podal pelo Método IOR."},
  {id:102,name:"Workshop Reflexologia Facial",   type:"Workshop", date:"2025-04-05",end:"2025-04-05",modality:"Presencial",value:450, capacity:8, enrolled:[202,205],  waitlist:[],    instructor:"Profa. Carla Reis",desc:"Técnicas reflexológicas aplicadas ao rosto."},
  {id:103,name:"Reflexologia Podal – Módulo II", type:"Curso",    date:"2025-05-10",end:"2025-05-11",modality:"Online",    value:1200,capacity:20,enrolled:[201],       waitlist:[203,206],instructor:"Profa. Ana Lima",  desc:"Aprofundamento: patologias e protocolos avançados."},
  {id:104,name:"Estágio Clínico – Turma A",      type:"Estágio",  date:"2025-04-12",end:"2025-05-12",modality:"Presencial",value:600, capacity:6, enrolled:[205,206],  waitlist:[],    instructor:"Profa. Ana Lima",  desc:"Prática supervisionada em clínica real."},
  {id:105,name:"Ambulatório de Pesquisa",         type:"Ambulatório",date:"2025-04-20",end:"2025-09-20",modality:"Presencial",value:0,capacity:10,enrolled:[202,203,204],waitlist:[],   instructor:"Coord. Pesquisa",  desc:"Programa de pesquisa aplicada."},
  {id:106,name:"Mapeamento Reflexológico",        type:"Workshop", date:"2025-06-07",end:"2025-06-08",modality:"Híbrido",  value:650, capacity:15,enrolled:[],           waitlist:[201,202,205],instructor:"Profa. Carla Reis",desc:"Workshop intensivo de leitura dos pontos reflexos."},
];

const SEED_STUDENTS = [
  {id:201,name:"Adriana Moura",   email:"adriana@mail.com", phone:"11991110001",cpf:"111.111.111-11",city:"São Paulo",    since:"2024-01",courses:[101,103],contract:true, pType:"parcelado",pMethod:"Cartão Crédito",totalValue:3180,installments:12,instValue:265,startMonth:"2024-01",paidMonths:[0,1,2,3,4,5,6,7,8,9],paid:false,certificate:[],interests:[102],notes:"Pontual"},
  {id:202,name:"Beatriz Nunes",   email:"beatriz@mail.com", phone:"11992220002",cpf:"222.222.222-22",city:"Campinas",     since:"2024-03",courses:[101,102,105],contract:true, pType:"parcelado",pMethod:"PIX",           totalValue:1430,installments:6, instValue:238,startMonth:"2024-03",paidMonths:[0,1,2,3,4,5],paid:false,certificate:[101],interests:[],notes:""},
  {id:203,name:"Carla Esteves",   email:"carla@mail.com",   phone:"11993330003",cpf:"333.333.333-33",city:"São Paulo",    since:"2023-09",courses:[101,105],contract:false,pType:"avista",   pMethod:"PIX",           totalValue:2600,installments:0, instValue:0,  startMonth:"",         paidMonths:[],paid:true, certificate:[],interests:[103],notes:"Sem contrato"},
  {id:204,name:"Diana Fonseca",   email:"diana@mail.com",   phone:"21994440004",cpf:"444.444.444-44",city:"Rio de Janeiro",since:"2024-06",courses:[],contract:false,pType:"parcelado",pMethod:"Boleto",        totalValue:980, installments:3, instValue:327,startMonth:"2024-06",paidMonths:[0,1],paid:false,certificate:[],interests:[101],notes:"1 parcela em aberto"},
  {id:205,name:"Elaine Guimarães",email:"elaine@mail.com",  phone:"11995550005",cpf:"555.555.555-55",city:"Guarulhos",    since:"2024-02",courses:[102,104],contract:true, pType:"avista",   pMethod:"Boleto",        totalValue:1050,installments:0, instValue:0,  startMonth:"",         paidMonths:[],paid:true, certificate:[102],interests:[],notes:""},
  {id:206,name:"Fernanda Rocha",  email:"fernanda@mail.com",phone:"11996660006",cpf:"666.666.666-66",city:"Sorocaba",     since:"2024-08",courses:[104],contract:true, pType:"parcelado",pMethod:"Boleto",        totalValue:600, installments:3, instValue:200,startMonth:"2024-08",paidMonths:[0],paid:false,certificate:[],interests:[],notes:""},
];

const SEED_LEADS = [
  {id:301,name:"Juliana Prado",  phone:"11990011111",email:"ju@mail.com", courseId:101,stage:"Negociação",source:"Instagram",payment:"PIX",           lossReason:"",         value:980, type:"Curso",  notes:"Pediu desconto",   date:"2025-01-20"},
  {id:302,name:"Mariana Costa",  phone:"11990022222",email:"ma@mail.com", courseId:102,stage:"Leads Frios",source:"WhatsApp",  payment:"",            lossReason:"",         value:450, type:"Workshop",notes:"",                 date:"2025-01-18"},
  {id:303,name:"Renata Silveira",phone:"11990044444",email:"re@mail.com", courseId:106,stage:"Espera",    source:"Site",      payment:"",            lossReason:"",         value:650, type:"Workshop",notes:"Aguarda turma",    date:"2025-01-22"},
  {id:304,name:"Sandra Lima",    phone:"11990055555",email:"sa@mail.com", courseId:102,stage:"Perdido",   source:"Google",    payment:"",            lossReason:"Preço alto",value:450, type:"Workshop",notes:"Achou caro",       date:"2025-01-10"},
  {id:305,name:"Tatiana Morais", phone:"31990066666",email:"ta@mail.com", courseId:101,stage:"Negociação",source:"Evento",    payment:"PIX",         lossReason:"",         value:980, type:"Curso",  notes:"Conheceu no evento",date:"2025-01-25"},
  {id:306,name:"Vanessa Porto",  phone:"11990077777",email:"va@mail.com", courseId:103,stage:"Leads Frios",source:"Instagram", payment:"",           lossReason:"",         value:1200,type:"Curso",  notes:"",                  date:"2025-01-29"},
];

const SEED_PRODUCTS = [
  {id:401,product:"Kit Básico Reflexologia",   client:"Adriana Moura",   qty:1,value:280,notes:"Inclui manual",stage:"Embalar",    date:"2025-01-26"},
  {id:402,product:"Livro IOR Método",          client:"Beatriz Nunes",   qty:2,value:150,notes:"",            stage:"Pronto",     date:"2025-01-25"},
  {id:403,product:"Bastão de Madeira Set",     client:"Carla Esteves",   qty:1,value:95, notes:"SEDEX",        stage:"Enviado",    date:"2025-01-20"},
  {id:404,product:"Kit Completo Profissional", client:"Diana Fonseca",   qty:1,value:580,notes:"NF pendente",  stage:"Nota Fiscal",date:"2025-01-28"},
];

const SEED_SALES = [
  // Julho 2024
  {id:501,date:"2024-07-10",studentId:203,desc:"Reflexologia Podal – Módulo I",  value:980, payment:"PIX",           type:"Curso",      notes:""},
  {id:502,date:"2024-07-15",studentId:null,desc:"Kit Básico Reflexologia",       value:280, payment:"PIX",           type:"Produto",    notes:""},
  {id:503,date:"2024-07-20",studentId:null,desc:"Atendimento Avulso",            value:180, payment:"PIX",           type:"Atendimento", notes:""},
  // Agosto 2024
  {id:504,date:"2024-08-05",studentId:205,desc:"Workshop Reflexologia Facial",   value:450, payment:"Boleto",        type:"Workshop",   notes:""},
  {id:505,date:"2024-08-12",studentId:null,desc:"Reflexologia Podal – Módulo I", value:980, payment:"PIX",           type:"Curso",      notes:""},
  {id:506,date:"2024-08-20",studentId:null,desc:"Kit Completo Profissional",     value:580, payment:"Cartão Crédito",type:"Produto",    notes:""},
  {id:507,date:"2024-08-25",studentId:null,desc:"Atendimento Avulso",            value:180, payment:"PIX",           type:"Atendimento", notes:""},
  // Setembro 2024
  {id:508,date:"2024-09-03",studentId:null,desc:"Reflexologia Podal – Módulo I", value:980, payment:"PIX",           type:"Curso",      notes:""},
  {id:509,date:"2024-09-10",studentId:null,desc:"Estágio Clínico – Turma A",     value:600, payment:"Boleto",        type:"Curso",      notes:""},
  {id:510,date:"2024-09-18",studentId:null,desc:"Apostila Digital+Impressa",     value:270, payment:"PIX",           type:"Produto",    notes:""},
  // Outubro 2024
  {id:511,date:"2024-10-05",studentId:null,desc:"Reflexologia Podal – Módulo II",value:1200,payment:"Cartão Crédito",type:"Curso",      notes:""},
  {id:512,date:"2024-10-12",studentId:null,desc:"Workshop Reflexologia Facial",   value:450, payment:"PIX",          type:"Workshop",   notes:""},
  {id:513,date:"2024-10-20",studentId:null,desc:"Reflexologia Podal – Módulo I", value:980, payment:"PIX",           type:"Curso",      notes:""},
  {id:514,date:"2024-10-25",studentId:null,desc:"Atendimento Avulso",            value:360, payment:"PIX",           type:"Atendimento", notes:""},
  {id:515,date:"2024-10-28",studentId:null,desc:"Kit Básico Reflexologia",       value:280, payment:"PIX",           type:"Produto",    notes:""},
  // Novembro 2024
  {id:516,date:"2024-11-04",studentId:null,desc:"Reflexologia Podal – Módulo I", value:980, payment:"PIX",           type:"Curso",      notes:""},
  {id:517,date:"2024-11-08",studentId:null,desc:"Reflexologia Podal – Módulo II",value:1200,payment:"Cartão Crédito",type:"Curso",      notes:""},
  {id:518,date:"2024-11-14",studentId:null,desc:"Estágio Clínico – Turma A",     value:600, payment:"Boleto",        type:"Curso",      notes:""},
  {id:519,date:"2024-11-18",studentId:null,desc:"Workshop Reflexologia Facial",   value:450, payment:"PIX",          type:"Workshop",   notes:""},
  {id:520,date:"2024-11-22",studentId:null,desc:"Mapeamento Reflexológico",       value:650, payment:"PIX",          type:"Workshop",   notes:""},
  {id:521,date:"2024-11-28",studentId:null,desc:"Kit Completo Profissional",     value:580, payment:"Cartão Crédito",type:"Produto",    notes:""},
  // Dezembro 2024
  {id:522,date:"2024-12-05",studentId:null,desc:"Reflexologia Podal – Módulo I", value:980, payment:"PIX",           type:"Curso",      notes:""},
  {id:523,date:"2024-12-10",studentId:null,desc:"Ambulatório de Pesquisa",       value:0,   payment:"N/A",           type:"Curso",      notes:"Gratuito"},
  {id:524,date:"2024-12-15",studentId:null,desc:"Workshop Reflexologia Facial",   value:450, payment:"PIX",          type:"Workshop",   notes:""},
  {id:525,date:"2024-12-20",studentId:null,desc:"Apostila Digital+Impressa",     value:270, payment:"PIX",           type:"Produto",    notes:""},
  // Janeiro 2025
  {id:526,date:"2025-01-06",studentId:201,desc:"Reflexologia Podal – Módulo I",  value:980, payment:"Cartão Crédito",type:"Curso",      notes:""},
  {id:527,date:"2025-01-10",studentId:202,desc:"Reflexologia Podal – Módulo I",  value:980, payment:"PIX",           type:"Curso",      notes:""},
  {id:528,date:"2025-01-15",studentId:203,desc:"Reflexologia Podal – Módulo I",  value:980, payment:"PIX",           type:"Curso",      notes:""},
  {id:529,date:"2025-01-18",studentId:202,desc:"Workshop Reflexologia Facial",   value:450, payment:"PIX",           type:"Workshop",   notes:""},
  {id:530,date:"2025-01-18",studentId:201,desc:"Kit Básico Reflexologia",        value:280, payment:"PIX",           type:"Produto",    notes:""},
  {id:531,date:"2025-01-20",studentId:205,desc:"Workshop Reflexologia Facial",   value:450, payment:"Boleto",        type:"Workshop",   notes:""},
  {id:532,date:"2025-01-21",studentId:205,desc:"Estágio Clínico – Turma A",      value:600, payment:"Boleto",        type:"Curso",      notes:""},
  {id:533,date:"2025-01-22",studentId:206,desc:"Estágio Clínico – Turma A",      value:600, payment:"Boleto",        type:"Curso",      notes:""},
  {id:534,date:"2025-01-25",studentId:201,desc:"Reflexologia Podal – Módulo II", value:1200,payment:"Cartão Crédito",type:"Curso",      notes:""},
  {id:535,date:"2025-01-28",studentId:null,desc:"Atendimento Avulso",            value:360, payment:"PIX",           type:"Atendimento", notes:""},
];

const SEED_CHECKS = [
  {id:601,text:"Enviar material do Módulo I para alunos",done:false,priority:"Alta", due:"2025-02-10",assignee:"Ana Lima",   createdAt:"2025-01-28T08:00:00"},
  {id:602,text:"Confirmar sala para Workshop de Abril",  done:false,priority:"Alta", due:"2025-02-15",assignee:"Carla Reis", createdAt:"2025-01-28T09:00:00"},
  {id:603,text:"Atualizar apostila digital Módulo II",   done:true, priority:"Média",due:"2025-01-30",assignee:"",           createdAt:"2025-01-20T10:00:00"},
  {id:604,text:"Ligar para leads frios de janeiro",      done:false,priority:"Média",due:"2025-02-05",assignee:"Ana Lima",   createdAt:"2025-01-28T11:00:00"},
  {id:605,text:"Emitir notas fiscais pendentes",         done:false,priority:"Alta", due:"2025-02-01",assignee:"Financeiro", createdAt:"2025-01-28T12:00:00"},
];

const SEED_TEMPLATES = [
  {id:701,name:"Lembrete Pagamento",  text:"Olá {nome}! Passando para lembrar o valor em aberto referente a {curso}. Regularize para manter seu acesso ativo. Qualquer dúvida estamos à disposição! 🌿"},
  {id:702,name:"Confirmação de Curso",text:"Olá {nome}! Confirmamos sua inscrição em {curso}. Em breve enviaremos mais detalhes! 🎓"},
  {id:703,name:"Lista de Espera",     text:"Olá {nome}! Abrimos vagas para {curso} em {data}. Você tem prioridade na lista de espera. Vamos confirmar? ✨"},
];

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
  return <div style={{background:"#fff",borderRadius:16,padding:"16px 18px",border:"1px solid var(--b)",flex:1,minWidth:130,boxShadow:"var(--shadow)",animation:`up .4s ease ${delay}s both`,transition:"transform .2s,box-shadow .2s"}}
    onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow="var(--shadow-md)";}}
    onMouseLeave={e=>{e.currentTarget.style.transform="";e.currentTarget.style.boxShadow="var(--shadow)";}}>
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
  };
  const SZ={sm:"6px 12px",md:"9px 18px",lg:"12px 24px"};
  return <button onClick={onClick} disabled={disabled} style={{...V[v],borderRadius:9,padding:SZ[sz],fontSize:sz==="sm"?11:13,fontFamily:"DM Sans",fontWeight:600,cursor:disabled?"default":"pointer",opacity:disabled?.5:1,transition:"all .15s",...(style||{})}}>{children}</button>;
}
function Modal({title,sub,onClose,children}){
  return <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(20,30,60,.3)",backdropFilter:"blur(6px)",zIndex:300,display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
    <div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:"20px 20px 0 0",padding:22,width:"100%",maxWidth:560,border:"1px solid var(--b)",borderBottom:"none",animation:"su .25s ease",maxHeight:"92vh",overflowY:"auto",boxShadow:"0 -8px 40px rgba(30,40,80,.18)"}}>
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

/* ══════════════════════════════════════════════════
   DASHBOARD
══════════════════════════════════════════════════ */
function DashPage({leads,students,courses,sales}){
  const revenue = sales.reduce((s,v)=>s+(+v.value||0),0);
  const open    = leads.filter(l=>!["Fechado","Perdido"].includes(l.stage)).length;
  const today   = new Date().toISOString().slice(0,10);
  const nxt     = [...courses].sort((a,b)=>a.date.localeCompare(b.date)).find(c=>c.date>=today);
  const byType  = STYPES.reduce((a,t)=>({...a,[t]:sales.filter(s=>s.type===t).reduce((x,v)=>x+(+v.value||0),0)}),{});

  // Monthly chart from sales
  const monthMap = {};
  sales.forEach(s=>{
    const m=s.date?.slice(0,7);
    if(!m)return;
    if(!monthMap[m])monthMap[m]={};
    monthMap[m][s.type]=(monthMap[m][s.type]||0)+(+s.value||0);
  });
  const chartData = Object.keys(monthMap).sort().slice(-7).map(m=>({
    mes:MOPT[parseInt(m.slice(5,7))-1], ...monthMap[m]
  }));

  const sStudent = id=>students.find(s=>s.id===id);

  return <div style={{animation:"up .4s ease"}}>
    <div style={{marginBottom:22,paddingBottom:18,borderBottom:"1px solid var(--b)"}}>
      <div style={{fontSize:11,color:"var(--bl)",fontWeight:600,letterSpacing:1.4,textTransform:"uppercase",marginBottom:5}}>IOR · Instituto de Reflexologia e Pesquisa</div>
      <h1 style={{fontFamily:"Playfair Display",fontSize:28,fontWeight:400,color:"var(--tx)"}}>Painel de <em style={{fontWeight:700}}>Controle</em></h1>
    </div>
    <div style={{display:"flex",gap:11,flexWrap:"wrap",marginBottom:20}}>
      <SC icon="💰" label="Receita total" value={`R$${revenue.toLocaleString()}`} color="var(--bl)"  delay={0}/>
      <SC icon="🎓" label="Alunos ativos" value={students.length}               color="var(--te)"  delay={.06}/>
      <SC icon="⚡" label="Leads em aberto" value={open}                         color="var(--pu)"  delay={.12}/>
      <SC icon="📅" label="Cursos previstos" value={courses.length}              color="var(--am)"  delay={.18}/>
    </div>
    <div className="gdash">
      <div style={{background:"#fff",borderRadius:16,padding:20,border:"1px solid var(--b)",boxShadow:"var(--shadow)"}}>
        <div style={{fontFamily:"Playfair Display",fontSize:17,fontWeight:600,marginBottom:3}}>Receita por Tipo</div>
        <div style={{fontSize:11,color:"var(--mu)",marginBottom:14}}>Últimos {chartData.length} meses · calculado das vendas</div>
        {chartData.length>0 ? <ResponsiveContainer width="100%" height={120}>
          <BarChart data={chartData} margin={{top:0,right:0,left:-22,bottom:0}}>
            <XAxis dataKey="mes" tick={{fontSize:9,fill:"#9AAAC0"}} axisLine={false} tickLine={false}/>
            <YAxis tick={{fontSize:8,fill:"#9AAAC0"}} axisLine={false} tickLine={false}/>
            <Tooltip contentStyle={{background:"#fff",border:"1px solid #DDE3EE",borderRadius:8,fontSize:11,boxShadow:"var(--shadow)"}}/>
            {STYPES.map(t=><Bar key={t} dataKey={t} fill={TCL[t]} radius={[3,3,0,0]}/>)}
          </BarChart>
        </ResponsiveContainer> : <div style={{textAlign:"center",padding:"24px 0",color:"var(--mu)",fontSize:12}}>Nenhuma venda ainda</div>}
        <div style={{display:"flex",gap:9,marginTop:8,flexWrap:"wrap"}}>
          {STYPES.map(t=><div key={t} style={{display:"flex",alignItems:"center",gap:4}}><Dot color={TCL[t]} size={7}/><span style={{fontSize:10,color:"var(--mu)"}}>{t}</span></div>)}
        </div>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:12}}>
        {nxt&&<div style={{background:"#fff",borderRadius:16,padding:18,border:"1px solid var(--b)",boxShadow:"var(--shadow)"}}>
          <div style={{fontFamily:"Playfair Display",fontSize:14,fontWeight:600,marginBottom:9}}>Próximo Evento</div>
          <div style={{fontWeight:700,fontSize:13,color:"var(--tx)"}}>{nxt.name}</div>
          <div style={{fontSize:11,color:"var(--mu)",marginTop:3}}>📅 {nxt.date} · {nxt.modality}</div>
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
      {sales.slice(-6).reverse().map((s,i)=>{
        const st=sStudent(s.studentId);
        return <div key={s.id} style={{display:"flex",alignItems:"center",gap:11,padding:"8px 0",borderBottom:"1px solid var(--b)",animation:`sr .3s ease ${i*.05}s both`}}>
          <Av letter={(st?.name||s.desc||"?")[0]} size={32} color={TCL[s.type]||"var(--bl)"}/>
          <div style={{flex:1}}><div style={{fontWeight:600,fontSize:13}}>{st?.name||"—"}</div><div style={{fontSize:11,color:"var(--mu)"}}>{s.desc}</div></div>
          <div style={{textAlign:"right"}}><div style={{fontWeight:700,color:"var(--bl)",fontSize:13}}>R${(+s.value).toLocaleString()}</div><Chip color={TCL[s.type]} sm>{s.type}</Chip></div>
        </div>;
      })}
    </div>
  </div>;
}

/* ══════════════════════════════════════════════════
   CRM LEADS — courses from state, auto-move to students
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
  const eL={name:"",phone:"",email:"",courseId:"",stage:stages[0],source:"",payment:"",lossReason:"",value:"",type:"Curso",notes:"",date:new Date().toISOString().slice(0,10)};
  const[form,setForm]=useState(eL);
  const f=v=>setForm(p=>({...p,...v}));

  const courseOptions = courses.map(c=>({id:c.id,label:c.name,value:c.value,type:c.type}));
  const getCourse = id=>courses.find(c=>c.id===+id);

  function save(){
    if(!form.name.trim())return;
    const course=getCourse(form.courseId);
    const finalForm={...form, courseId:+form.courseId||null};

    // If moving to Fechado → auto-create student + sales entry + enroll in course
    if(form.stage==="Fechado"&&(!editing||editing.stage!=="Fechado")){
      const existing=students.find(s=>s.email===form.email||s.phone===form.phone);
      if(!existing){
        const nsId=Date.now();
        const ns={
          id:nsId,name:form.name,email:form.email,phone:form.phone,cpf:"",city:"",
          since:new Date().toISOString().slice(0,7),
          courses:form.courseId?[+form.courseId]:[],
          contract:false,pType:"",pMethod:form.payment||"PIX",totalValue:+form.value||0,
          installments:0,instValue:0,startMonth:"",paidMonths:[],paid:false,
          certificate:[],interests:[],notes:form.notes
        };
        setStudents(ss=>[...ss,ns]);
        // Auto-add sale
        if(form.value&&+form.value>0){
          setSales(ss=>[...ss,{id:nsId+1,date:form.date,studentId:nsId,
            desc:course?.name||form.notes||"Lead convertido",
            value:+form.value,payment:form.payment||"PIX",type:form.type||"Curso",notes:"Lead convertido"}]);
        }
      } else {
        // Lead is existing student - just enroll them in the course if not yet
        if(form.courseId&&!existing.courses.includes(+form.courseId)){
          setStudents(ss=>ss.map(s=>s.id!==existing.id?s:{...s,courses:[...new Set([...s.courses,+form.courseId])]}));
          if(form.value&&+form.value>0){
            setSales(ss=>[...ss,{id:Date.now()+2,date:form.date,studentId:existing.id,
              desc:course?.name||"Lead convertido",
              value:+form.value,payment:form.payment||"PIX",type:form.type||"Curso",notes:"Lead convertido (já aluno)"}]);
          }
        }
      }
    }
    if(editing)setLeads(ls=>ls.map(l=>l.id===editing.id?{...finalForm,id:l.id}:l));
    else setLeads(ls=>[...ls,{...finalForm,id:Date.now()}]);
    setShowF(false);setEditing(null);setForm(eL);
  }
  function edit(l){setForm({...l,courseId:l.courseId||""});setEditing(l);setShowF(true);}
  function del(id){setLeads(ls=>ls.filter(l=>l.id!==id));setShowF(false);setEditing(null);}
  const filtered=leads.filter(l=>!search||(l.name.toLowerCase()+getCourse(l.courseId)?.name||"").toLowerCase().includes(search.toLowerCase()));

  return <div style={{animation:"up .4s ease"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
      <div><h1 style={{fontFamily:"Playfair Display",fontSize:24,fontWeight:700}}>CRM · Leads</h1><p style={{color:"var(--mu)",fontSize:11,marginTop:2}}>{leads.length} leads · {leads.filter(l=>l.stage==="Fechado").length} fechados → alunos</p></div>
      <div style={{display:"flex",gap:7}}>
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
          return <div key={stage} style={{minWidth:210,flex:"0 0 210px"}}>
            <div style={{background:"#fff",borderRadius:"11px 11px 0 0",padding:"9px 12px",border:"1px solid var(--b)",borderBottom:`3px solid ${SCL[stage]||"var(--mu2)"}`,boxShadow:"var(--shadow)"}}>
              <div style={{display:"flex",justifyContent:"space-between"}}><div style={{display:"flex",alignItems:"center",gap:6}}><Dot color={SCL[stage]||"#9AAAC0"}/><span style={{fontSize:12,fontWeight:700,color:"var(--tx)"}}>{stage}</span></div><span style={{background:"#F0F4FA",borderRadius:99,padding:"2px 8px",fontSize:11,fontWeight:700,color:"var(--mu)"}}>{cards.length}</span></div>
              {tot>0&&<div style={{fontSize:10,color:"var(--bl)",marginTop:2,fontWeight:600}}>R${tot.toLocaleString()}</div>}
            </div>
            <div style={{background:"#F7F9FC",borderRadius:"0 0 11px 11px",border:"1px solid var(--b)",borderTop:"none",padding:7,display:"flex",flexDirection:"column",gap:6,minHeight:80}}>
              {cards.map(lead=>{const c=getCourse(lead.courseId);return <div key={lead.id} onClick={()=>edit(lead)} style={{background:"#fff",borderRadius:9,padding:"10px 11px",cursor:"pointer",border:"1px solid var(--b)",borderLeft:`3px solid ${SCL[stage]||"#9AAAC0"}`,transition:"all .14s",boxShadow:"0 1px 4px rgba(30,40,80,.06)"}}
                onMouseEnter={e=>e.currentTarget.style.boxShadow="0 3px 12px rgba(30,40,80,.12)"}
                onMouseLeave={e=>e.currentTarget.style.boxShadow="0 1px 4px rgba(30,40,80,.06)"}>
                <div style={{fontWeight:600,fontSize:12,color:"var(--tx)"}}>{lead.name}</div>
                <div style={{fontSize:11,color:"var(--mu)",marginTop:2}}>{c?.name||"—"}</div>
                <div style={{display:"flex",justifyContent:"space-between",marginTop:5}}>
                  {lead.value?<span style={{fontSize:11,fontWeight:700,color:"var(--bl)"}}>R${(+lead.value).toLocaleString()}</span>:<span/>}
                  {lead.source&&<Chip color="var(--mu)" sm>{lead.source}</Chip>}
                </div>
                {stage==="Perdido"&&lead.lossReason&&<div style={{fontSize:10,color:"var(--rd)",marginTop:2}}>⚠ {lead.lossReason}</div>}
              </div>;})}
              {!cards.length&&<div style={{textAlign:"center",fontSize:11,color:"var(--mu2)",padding:"10px 0"}}>Sem leads</div>}
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
      <div className="tw">
        <div style={{background:"#fff",borderRadius:14,border:"1px solid var(--b)",overflow:"hidden",minWidth:560,boxShadow:"var(--shadow)"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
            <thead><tr style={{background:"#F7F9FC",borderBottom:"1px solid var(--b)"}}>{["Nome","Curso","Etapa","Tipo","Valor","Data"].map(h=><th key={h} style={{padding:"9px 12px",textAlign:"left",fontSize:10,color:"var(--mu)",fontWeight:600,letterSpacing:.5,textTransform:"uppercase",whiteSpace:"nowrap"}}>{h}</th>)}</tr></thead>
            <tbody>{filtered.map((l,i)=>{const c=getCourse(l.courseId);return <tr key={l.id} onClick={()=>edit(l)} style={{borderBottom:"1px solid var(--b)",cursor:"pointer",animation:`sr .3s ease ${i*.04}s both`}}
              onMouseEnter={e=>e.currentTarget.style.background="#F7F9FC"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
              <td style={{padding:"9px 12px",fontWeight:600}}>{l.name}</td>
              <td style={{padding:"9px 12px",color:"var(--mu)",maxWidth:150,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c?.name||"—"}</td>
              <td style={{padding:"9px 12px",whiteSpace:"nowrap"}}><Chip color={SCL[l.stage]||"var(--mu)"}>{l.stage}</Chip></td>
              <td style={{padding:"9px 12px",whiteSpace:"nowrap"}}><Chip color={TCL[l.type]||"var(--mu)"} sm>{l.type}</Chip></td>
              <td style={{padding:"9px 12px",fontWeight:700,color:"var(--bl)",whiteSpace:"nowrap"}}>{l.value?`R$${(+l.value).toLocaleString()}`:"—"}</td>
              <td style={{padding:"9px 12px",color:"var(--mu)",whiteSpace:"nowrap"}}>{l.date}</td>
            </tr>;})}
            </tbody>
          </table>
        </div>
      </div>
    )}
    {showF&&<Modal title={editing?"Editar Lead":"Novo Lead"} sub={editing?.name} onClose={()=>{setShowF(false);setEditing(null);}}>
      <div className="g2">
        <Inp label="Nome *" value={form.name} onChange={e=>f({name:e.target.value})}/>
        <Inp label="WhatsApp" value={form.phone} onChange={e=>f({phone:e.target.value})}/>
        <Inp label="E-mail" value={form.email} onChange={e=>f({email:e.target.value})}/>
        <Inp label="Valor (R$)" value={form.value} onChange={e=>f({value:e.target.value})} type="number"/>
      </div>
      <Lbl>Curso de Interesse</Lbl>
      <select value={form.courseId} onChange={e=>{const c=getCourse(+e.target.value);f({courseId:e.target.value,value:c?.value||form.value,type:c?.type||form.type});}} style={{width:"100%",background:"#F7F9FC",border:"1.5px solid #DDE3EE",borderRadius:10,padding:"10px 13px",color:"var(--tx)",fontSize:13,outline:"none",fontFamily:"DM Sans",marginBottom:13}}>
        <option value="">Selecionar curso...</option>
        {courseOptions.map(c=><option key={c.id} value={c.id}>{c.label} · R${c.value.toLocaleString()}</option>)}
      </select>
      <Lbl>Tipo</Lbl><div style={{display:"flex",gap:6,marginBottom:12,flexWrap:"wrap"}}>{STYPES.map(t=><button key={t} onClick={()=>f({type:t})} style={{background:form.type===t?`${TCL[t]}15`:"#F7F9FC",border:`1.5px solid ${form.type===t?TCL[t]:"#DDE3EE"}`,color:form.type===t?TCL[t]:"var(--mu)",borderRadius:99,padding:"5px 11px",fontSize:12,fontWeight:600,cursor:"pointer"}}>{t}</button>)}</div>
      <Lbl>Etapa</Lbl><div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:12}}>{stages.map(s=><button key={s} onClick={()=>f({stage:s})} style={{background:form.stage===s?`${SCL[s]||"#9AAAC0"}15`:"#F7F9FC",border:`1.5px solid ${form.stage===s?SCL[s]||"#9AAAC0":"#DDE3EE"}`,color:form.stage===s?SCL[s]||"#9AAAC0":"var(--mu)",borderRadius:99,padding:"5px 11px",fontSize:12,fontWeight:600,cursor:"pointer"}}>{s}</button>)}</div>
      <Lbl>Origem</Lbl><IAdder list={sources} selected={form.source} onSelect={v=>f({source:v})} onAdd={v=>setSources(s=>[...s,v])} placeholder="Nova origem..."/>
      <Lbl>Pagamento</Lbl><IAdder list={payments} selected={form.payment} onSelect={v=>f({payment:v})} onAdd={v=>setPayments(s=>[...s,v])} placeholder="Nova forma..."/>
      {form.stage==="Perdido"&&<><Lbl>Motivo da Perda</Lbl><IAdder list={losses} selected={form.lossReason} onSelect={v=>f({lossReason:v})} onAdd={v=>setLosses(s=>[...s,v])} placeholder="Novo motivo..."/></>}
      <Inp label="Observações" value={form.notes} onChange={e=>f({notes:e.target.value})} rows={2}/>
      {form.stage==="Fechado"&&<div style={{background:"#F0FDF4",border:"1.5px solid #BBF7D0",borderRadius:9,padding:"8px 12px",fontSize:12,color:"var(--gn)",marginBottom:11,fontWeight:600}}>✓ Será criado aluno + venda automaticamente</div>}
      <Inp label="Data" value={form.date} onChange={e=>f({date:e.target.value})} type="date"/>
      <div style={{display:"flex",gap:8}}><Btn style={{flex:1}} onClick={save}>{editing?"Salvar":"Cadastrar"}</Btn>{editing&&<Btn v="danger" onClick={()=>del(editing.id)}>Excluir</Btn>}</div>
    </Modal>}
  </div>;
}

/* ══════════════════════════════════════════════════
   CRM PRODUTOS
══════════════════════════════════════════════════ */
function ProductsPage({products,setProducts,sales,setSales}){
  const[showF,setShowF]=useState(false);const[editing,setEditing]=useState(null);
  const e={product:"",client:"",qty:1,value:"",notes:"",stage:PSTG[0],date:new Date().toISOString().slice(0,10)};
  const[form,setForm]=useState(e);
  function save(){
    if(!form.product.trim())return;
    const wasNotClosed=!editing||editing.stage!=="Fechado";
    const isClosing=form.stage==="Fechado"&&wasNotClosed;
    if(editing){
      setProducts(ps=>ps.map(p=>p.id===editing.id?{...form,id:p.id}:p));
    } else {
      const id=Date.now();setProducts(ps=>[...ps,{...form,id}]);
    }
    // Auto-add sale when status becomes Fechado
    if(isClosing&&form.value&&+form.value>0){
      setSales(ss=>[...ss,{id:Date.now()+1,date:form.date||new Date().toISOString().slice(0,10),studentId:null,desc:form.product,value:+form.value,payment:"PIX",type:"Produto",notes:form.client}]);
    }
    setShowF(false);setEditing(null);setForm(e);
  }
  function edit(p){setForm({...p});setEditing(p);setShowF(true);}
  // When product moves to Fechado, add sale
  function moveStage(prod,stage){
    setProducts(ps=>ps.map(p=>p.id===prod.id?{...p,stage}:p));
    if(stage==="Fechado"&&prod.stage!=="Fechado"&&prod.value&&+prod.value>0){
      setSales(ss=>[...ss,{id:Date.now(),date:new Date().toISOString().slice(0,10),studentId:null,desc:prod.product,value:+prod.value,payment:"PIX",type:"Produto",notes:prod.client}]);
    }
  }
  return <div style={{animation:"up .4s ease"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
      <div><h1 style={{fontFamily:"Playfair Display",fontSize:24,fontWeight:700}}>CRM · Produtos</h1><p style={{color:"var(--mu)",fontSize:11,marginTop:2}}>{products.length} pedidos · ao fechar → gera venda</p></div>
      <Btn sz="sm" onClick={()=>{setForm(e);setEditing(null);setShowF(true);}}>+ Novo</Btn>
    </div>
    <div style={{display:"flex",gap:10,overflowX:"auto",paddingBottom:10}}>
      {PSTG.map(stage=>{const cards=products.filter(p=>p.stage===stage);return <div key={stage} style={{minWidth:195,flex:"0 0 195px"}}>
        <div style={{background:"#fff",borderRadius:"11px 11px 0 0",padding:"9px 12px",border:"1px solid var(--b)",borderBottom:`3px solid ${PCL[stage]}`,boxShadow:"var(--shadow)"}}>
          <div style={{display:"flex",justifyContent:"space-between"}}><div style={{display:"flex",alignItems:"center",gap:6}}><Dot color={PCL[stage]}/><span style={{fontSize:12,fontWeight:700,color:"var(--tx)"}}>{stage}</span></div><span style={{background:"#F0F4FA",borderRadius:99,padding:"2px 7px",fontSize:11,fontWeight:700,color:"var(--mu)"}}>{cards.length}</span></div>
        </div>
        <div style={{background:"#F7F9FC",borderRadius:"0 0 11px 11px",border:"1px solid var(--b)",borderTop:"none",padding:7,display:"flex",flexDirection:"column",gap:6,minHeight:70}}>
          {cards.map(p=><div key={p.id} onClick={()=>edit(p)} style={{background:"#fff",borderRadius:9,padding:"10px 11px",cursor:"pointer",border:"1px solid var(--b)",borderLeft:`3px solid ${PCL[stage]}`,transition:"all .14s",boxShadow:"0 1px 4px rgba(30,40,80,.06)"}}
            onMouseEnter={e=>e.currentTarget.style.boxShadow="0 3px 12px rgba(30,40,80,.12)"}
            onMouseLeave={e=>e.currentTarget.style.boxShadow="0 1px 4px rgba(30,40,80,.06)"}>
            <div style={{fontWeight:600,fontSize:12,color:"var(--tx)"}}>{p.product}</div>
            <div style={{fontSize:11,color:"var(--mu)",marginTop:2}}>👤 {p.client}</div>
            <div style={{display:"flex",justifyContent:"space-between",marginTop:5}}><span style={{fontSize:11,color:"var(--mu)"}}>Qtd:{p.qty}</span><span style={{fontSize:11,fontWeight:700,color:"var(--bl)"}}>R${(+p.value||0).toLocaleString()}</span></div>
          </div>)}
          {!cards.length&&<div style={{textAlign:"center",fontSize:11,color:"var(--mu2)",padding:"10px 0"}}>Vazio</div>}
        </div>
      </div>;})}
    </div>
    {showF&&<Modal title={editing?"Editar":"Novo Pedido"} onClose={()=>{setShowF(false);setEditing(null);}}>
      <Inp label="Produto *" value={form.product} onChange={e=>setForm(f=>({...f,product:e.target.value}))}/>
      <Inp label="Cliente" value={form.client} onChange={e=>setForm(f=>({...f,client:e.target.value}))}/>
      <div className="g2"><Inp label="Qtd" value={form.qty} onChange={e=>setForm(f=>({...f,qty:e.target.value}))} type="number"/><Inp label="Valor (R$)" value={form.value} onChange={e=>setForm(f=>({...f,value:e.target.value}))} type="number"/></div>
      <Lbl>Etapa</Lbl><div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:12}}>{PSTG.map(s=><button key={s} onClick={()=>setForm(f=>({...f,stage:s}))} style={{background:form.stage===s?`${PCL[s]}15`:"#F7F9FC",border:`1.5px solid ${form.stage===s?PCL[s]:"#DDE3EE"}`,color:form.stage===s?PCL[s]:"var(--mu)",borderRadius:99,padding:"5px 11px",fontSize:12,fontWeight:600,cursor:"pointer"}}>{s}</button>)}</div>
      <Inp label="Notas" value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} rows={2}/>
      {form.stage==="Fechado"&&form.value>0&&<div style={{background:"#F0FDF4",border:"1.5px solid #BBF7D0",borderRadius:9,padding:"8px 12px",fontSize:12,color:"var(--gn)",marginBottom:11,fontWeight:600}}>✓ Ao salvar, gera venda automaticamente</div>}
      <div style={{display:"flex",gap:8}}><Btn style={{flex:1}} onClick={save}>{editing?"Salvar":"Adicionar"}</Btn>{editing&&<Btn v="danger" onClick={()=>{setProducts(ps=>ps.filter(p=>p.id!==editing.id));setShowF(false);setEditing(null);}}>Excluir</Btn>}</div>
    </Modal>}
  </div>;
}

/* ══════════════════════════════════════════════════
   ALUNOS — courses from state, connected enrollment
══════════════════════════════════════════════════ */
function StudentsPage({students,setStudents,courses,sales,setSales,templates}){
  const[search,setSearch]=useState("");
  const[sel,setSel]=useState(null);
  const[editingSt,setEditingSt]=useState(null);
  const[showF,setShowF]=useState(false);
  const[waM,setWaM]=useState(null);const[waMsg,setWaMsg]=useState("");
  const e={name:"",email:"",phone:"",cpf:"",city:"",since:new Date().toISOString().slice(0,7),courses:[],contract:false,pType:"avista",pMethod:"PIX",totalValue:"",installments:0,instValue:"",startMonth:"",paidMonths:[],paid:false,certificate:[],interests:[],notes:""};
  const[form,setForm]=useState(e);
  const ff=v=>setForm(p=>({...p,...v}));
  const ls=id=>students.find(s=>s.id===id)||null;

  const filtered=students.filter(s=>[s.name,s.email||"",s.city||"",s.cpf||"",(s.phone||"").replace(/\D/g,"")].some(x=>x.toLowerCase().includes(search.toLowerCase())));

  function save(){
    if(!form.name.trim())return;
    const target=editingSt?{...form,id:editingSt.id}:{...form,id:Date.now()};
    if(editingSt)setStudents(ss=>ss.map(s=>s.id===editingSt.id?target:s));
    else{
      setStudents(ss=>[...ss,target]);
      // Auto-add sales for each enrolled course
      target.courses.forEach(cid=>{
        const c=courses.find(x=>x.id===cid);
        if(c&&c.value>0){
          setSales(ss=>[...ss,{id:Date.now()+cid,date:target.since+"-01",studentId:target.id,desc:c.name,value:c.value,payment:target.pMethod||"PIX",type:c.type==="Workshop"?"Workshop":"Curso",notes:"Matrícula"}]);
        }
      });
    }
    setShowF(false);setEditingSt(null);setForm(e);
  }
  function togglePaid(stId,idx){setStudents(ss=>ss.map(s=>{if(s.id!==stId)return s;const pm=[...(s.paidMonths||[])];const pos=pm.indexOf(idx);if(pos>=0)pm.splice(pos,1);else pm.push(idx);return {...s,paidMonths:pm};}));}
  function toggleAVistaPaid(stId){setStudents(ss=>ss.map(s=>s.id!==stId?s:{...s,paid:!s.paid}));}
  function toggleContract(stId){setStudents(ss=>ss.map(s=>s.id!==stId?s:{...s,contract:!s.contract}));}
  function enrollCourse(stId,cid,enroll){
    // Update student.courses
    setStudents(ss=>ss.map(s=>{
      if(s.id!==stId)return s;
      const cs=enroll?[...new Set([...s.courses,cid])]:s.courses.filter(x=>x!==cid);
      return {...s,courses:cs};
    }));
    // Auto-add sale when enrolling
    if(enroll){
      const c=courses.find(x=>x.id===cid);
      if(c&&c.value>0){
        setSales(ss=>[...ss,{id:Date.now(),date:new Date().toISOString().slice(0,10),studentId:stId,desc:c.name,value:c.value,payment:"PIX",type:c.type==="Workshop"?"Workshop":"Curso",notes:"Matrícula direta"}]);
      }
    }
  }
  function openWA(st,msg){const p=(st.phone||"").replace(/\D/g,"");if(p)window.open(`https://wa.me/55${p}?text=${encodeURIComponent(msg)}`,"_blank");else navigator.clipboard.writeText(msg);}
  const hasOD=s=>(s.pType==="parcelado"&&(s.paidMonths||[]).length<(s.installments||0))||(s.pType==="avista"&&!s.paid);

  return <div style={{animation:"up .4s ease"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
      <div><h1 style={{fontFamily:"Playfair Display",fontSize:24,fontWeight:700}}>Alunos</h1><p style={{color:"var(--mu)",fontSize:11,marginTop:2}}>{students.length} cadastrados · {students.filter(hasOD).length} com pagamento pendente</p></div>
      <Btn sz="sm" onClick={()=>{setForm(e);setEditingSt(null);setShowF(true);}}>+ Cadastrar</Btn>
    </div>
    <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍  Nome, e-mail, CPF, telefone ou cidade..."
      style={{width:"100%",background:"#fff",border:"1.5px solid #DDE3EE",borderRadius:11,padding:"9px 14px",color:"var(--tx)",fontSize:13,outline:"none",fontFamily:"DM Sans",marginBottom:14,boxShadow:"var(--shadow)"}}/>
    <div style={{display:"flex",flexDirection:"column",gap:8}}>
      {filtered.map((s,i)=>{
        const live=ls(s.id)||s; const od=hasOD(live); const ex=sel===s.id;
        return <div key={s.id} style={{background:"#fff",borderRadius:14,border:`1.5px solid ${ex?"var(--bl)":od?"#FECACA":"#E5EAF3"}`,overflow:"hidden",animation:`sr .3s ease ${i*.04}s both`,boxShadow:"var(--shadow)"}}>
          <div onClick={()=>setSel(x=>x===s.id?null:s.id)} style={{display:"flex",alignItems:"center",gap:11,padding:"13px 16px",cursor:"pointer"}}>
            <Av letter={live.name[0]} size={38} color={od?"var(--rd)":"var(--bl)"}/>
            <div style={{flex:1}}>
              <div style={{display:"flex",alignItems:"center",gap:7,flexWrap:"wrap"}}>
                <span style={{fontWeight:700,fontSize:13,color:"var(--tx)"}}>{live.name}</span>
                {!live.contract&&<Chip color="var(--am)" sm>Sem contrato</Chip>}
                {od&&<Chip color="var(--rd)" sm>Pendente</Chip>}
              </div>
              <div style={{fontSize:11,color:"var(--mu)",marginTop:2}}>{live.email} · {live.city}</div>
            </div>
            <div style={{textAlign:"right"}}>
              <div style={{fontWeight:700,color:"var(--bl)",fontSize:13}}>R${(+live.totalValue||0).toLocaleString()}</div>
              <div style={{fontSize:11,color:"var(--mu)"}}>{live.courses.length} cursos</div>
            </div>
            <span style={{color:"var(--mu)",fontSize:11,marginLeft:3}}>{ex?"▲":"▼"}</span>
          </div>
          {ex&&<div style={{borderTop:"1.5px solid #E5EAF3",padding:"14px 16px",background:"#F7F9FC"}}>
            <div className="g2">
              <div>
                <div style={{fontSize:10,color:"var(--bl)",fontWeight:600,letterSpacing:.5,marginBottom:9,textTransform:"uppercase"}}>Informações</div>
                {[["📞",live.phone],["📧",live.email],["📍",live.city],["🪪",live.cpf],["📅","Desde "+live.since]].filter(([,v])=>v).map(([ic,val])=><div key={ic} style={{display:"flex",gap:7,padding:"4px 0",fontSize:11,borderBottom:"1px solid var(--b)"}}><span>{ic}</span><span style={{color:"var(--mu)"}}>{val}</span></div>)}
                <div onClick={()=>toggleContract(live.id)} style={{display:"flex",gap:8,padding:"7px 0",fontSize:11,borderBottom:"1px solid var(--b)",cursor:"pointer",userSelect:"none"}}>
                  <div style={{width:18,height:18,borderRadius:4,border:`2px solid ${live.contract?"var(--gn)":"#DDE3EE"}`,background:live.contract?"var(--gn)":"transparent",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:"#fff",fontWeight:700,flexShrink:0}}>{live.contract?"✓":""}</div>
                  <span style={{color:live.contract?"var(--gn)":"var(--mu)",fontWeight:live.contract?600:400}}>Contrato assinado</span>
                </div>
                <Divr/>
                <div style={{fontSize:10,color:"var(--bl)",fontWeight:600,letterSpacing:.5,marginBottom:9,textTransform:"uppercase"}}>Cursos — clique para matricular</div>
                {courses.map(c=>{const en=live.courses.includes(c.id);const ce=(live.certificate||[]).includes(c.id);const it=(live.interests||[]).includes(c.id);
                  const waitIdx=c.waitlist.indexOf(live.id);const inWait=waitIdx>=0;
                  return <div key={c.id} style={{display:"flex",alignItems:"center",gap:7,padding:"5px 0",borderBottom:"1px solid var(--b)",opacity:en||it||inWait?1:.4}}>
                    <button onClick={()=>enrollCourse(live.id,c.id,!en)} style={{width:18,height:18,borderRadius:4,border:`2px solid ${en?"var(--bl)":"#DDE3EE"}`,background:en?"var(--bl)":"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,cursor:"pointer",fontSize:10,color:"#fff",fontWeight:700}}>{en?"✓":""}</button>
                    <span style={{fontSize:11,flex:1,color:en?"var(--tx)":"var(--mu)",fontWeight:en?600:400}}>{c.name}</span>
                    {ce&&<Chip color="var(--te)" sm>Certificado</Chip>}
                    {inWait&&<Chip color="var(--am)" sm>⏳ Espera</Chip>}
                    {en&&c.value>0&&<span style={{fontSize:10,color:"var(--bl)",fontWeight:600}}>R${c.value.toLocaleString()}</span>}
                  </div>;})}
                {live.notes&&<div style={{marginTop:8,background:"#EEF4FF",borderRadius:8,padding:"6px 10px",fontSize:11,color:"var(--bl)"}}>💬 {live.notes}</div>}
              </div>
              <div>
                <div style={{fontSize:10,color:"var(--bl)",fontWeight:600,letterSpacing:.5,marginBottom:9,textTransform:"uppercase"}}>Pagamento</div>
                <div style={{background:"#fff",borderRadius:10,padding:11,marginBottom:10,border:"1px solid var(--b)",boxShadow:"0 1px 4px rgba(30,40,80,.05)"}}>
                  {[["Tipo",live.pType==="avista"?"À Vista":"Parcelado"],["Forma",live.pMethod],["Total","R$"+(+live.totalValue||0).toLocaleString()]].map(([k,v])=><div key={k} style={{display:"flex",justifyContent:"space-between",padding:"4px 0",borderBottom:"1px solid var(--b)",fontSize:11}}><span style={{color:"var(--mu)"}}>{k}</span><span style={{fontWeight:600}}>{v}</span></div>)}
                  {live.pType==="parcelado"&&<>
                    <div style={{display:"flex",justifyContent:"space-between",padding:"4px 0",fontSize:11}}><span style={{color:"var(--mu)"}}>Parcelas</span><span style={{fontWeight:600}}>{live.installments}x R${(+live.instValue||0).toLocaleString()}</span></div>
                    <div style={{display:"flex",justifyContent:"space-between",padding:"4px 0",fontSize:11}}><span style={{color:"var(--mu)"}}>Pagas</span><span style={{fontWeight:700,color:"var(--gn)"}}>{(live.paidMonths||[]).length}/{live.installments}</span></div>
                  </>}
                </div>
                {live.pType==="avista"&&<div onClick={()=>toggleAVistaPaid(live.id)} style={{display:"flex",alignItems:"center",gap:9,padding:"10px 12px",borderRadius:10,background:live.paid?"#F0FDF4":"#F7F9FC",border:`1.5px solid ${live.paid?"#BBF7D0":"#DDE3EE"}`,cursor:"pointer",userSelect:"none",marginBottom:10,transition:"all .15s"}}>
                  <div style={{width:22,height:22,borderRadius:6,border:`2px solid ${live.paid?"var(--gn)":"#DDE3EE"}`,background:live.paid?"var(--gn)":"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:12,color:"#fff",fontWeight:700}}>{live.paid?"✓":""}</div>
                  <span style={{fontSize:13,fontWeight:live.paid?700:500,color:live.paid?"var(--gn)":"var(--mu)"}}>{live.paid?"✓ Quitado":"Marcar como quitado"}</span>
                </div>}
                {live.pType==="parcelado"&&live.installments>0&&(()=>{
                  const pm=live.paidMonths||[];const allP=pm.length>=live.installments;
                  const now=new Date();const curIdx=live.startMonth?((now.getFullYear()-parseInt(live.startMonth.slice(0,4)))*12+(now.getMonth()-(parseInt(live.startMonth.slice(5,7))-1))):0;
                  const ci=Math.max(0,Math.min(curIdx,live.installments-1));
                  const curPaid=pm.includes(ci);const emDia=allP||curPaid;
                  return <div>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
                      <div style={{fontSize:10,color:"var(--mu)",fontWeight:600,textTransform:"uppercase"}}>Parcelas</div>
                      <Chip color={allP?"var(--gn)":emDia?"var(--bl)":"var(--rd)"} sm>{allP?"Quitado ✓":emDia?"Em dia":"Em atraso"}</Chip>
                    </div>
                    <div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:8}}>
                      {Array.from({length:live.installments},(_,idx)=>{
                        const paid=pm.includes(idx);const isCur=idx===ci;
                        const mo=live.startMonth?MOPT[((parseInt(live.startMonth.slice(5,7))-1)+idx)%12]:`P${idx+1}`;
                        return <button key={idx} onClick={()=>togglePaid(live.id,idx)} style={{width:34,height:34,borderRadius:7,border:`2px solid ${paid?"var(--gn)":isCur?"var(--bl)":"#DDE3EE"}`,background:paid?"#F0FDF4":isCur?"#EEF4FF":"#fff",color:paid?"var(--gn)":isCur?"var(--bl)":"var(--mu)",fontSize:9,fontWeight:700,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",position:"relative"}}>
                          {isCur&&!paid&&<div style={{position:"absolute",top:-3,right:-3,width:8,height:8,borderRadius:"50%",background:"var(--bl)"}}/>}
                          <span>{mo}</span><span>{paid?"✓":"—"}</span>
                        </button>;
                      })}
                    </div>
                    {allP&&<div style={{display:"flex",alignItems:"center",gap:7,padding:"8px 12px",borderRadius:9,background:"#F0FDF4",border:"1.5px solid #BBF7D0",marginBottom:8,fontSize:12,color:"var(--gn)",fontWeight:700}}>🎉 Todas pagas — quitado!</div>}
                  </div>;
                })()}
                <div style={{display:"flex",gap:7,marginTop:6}}>
                  <Btn sz="sm" v="ghost" onClick={()=>{setForm({...live});setEditingSt(live);setShowF(true);}}>✏️ Editar</Btn>
                  <button onClick={()=>{setWaM(live);setWaMsg("");}} style={{flex:1,background:"#F0FDF4",border:"1.5px solid #BBF7D0",borderRadius:9,padding:"7px 9px",color:"var(--gn)",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"DM Sans"}}>💬 WhatsApp</button>
                </div>
              </div>
            </div>
          </div>}
        </div>;
      })}
    </div>

    {/* WA Modal */}
    {waM&&<Modal title="Lembrete WhatsApp" sub={waM.name} onClose={()=>{setWaM(null);setWaMsg("");}}>
      <div style={{fontSize:11,color:"var(--bl)",fontWeight:700,marginBottom:9,background:"#EEF4FF",padding:"8px 12px",borderRadius:8}}>Para: {waM.name} · {(waM.phone||"").slice(0,14)||"sem telefone"}</div>
      {templates.length>0&&<><Lbl>Usar modelo salvo</Lbl>
        <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:13}}>
          {templates.map(t=><button key={t.id} onClick={()=>{
            const courseName=(waM.courses||[]).map(cid=>courses.find(c=>c.id===cid)?.name||"").filter(Boolean).join(", ")||"";
            setWaMsg(t.text.replace("{nome}",waM.name||"").replace("{curso}",courseName).replace("{data}",""));
          }} style={{background:"#F7F9FC",border:"1.5px solid #DDE3EE",borderRadius:8,padding:"6px 12px",fontSize:11,color:"var(--mu)",cursor:"pointer",fontFamily:"DM Sans",fontWeight:600}}>{t.name}</button>)}
        </div>
      </>}
      <div style={{background:"#F5FDF7",border:"1.5px solid #BBF7D0",borderRadius:11,padding:13,marginBottom:11}}>
        <textarea value={waMsg} onChange={e=>setWaMsg(e.target.value)} rows={5} placeholder="Escreva ou selecione um modelo acima..." style={{width:"100%",background:"transparent",border:"none",outline:"none",color:"var(--tx)",fontSize:13,lineHeight:1.7,resize:"none",fontFamily:"DM Sans"}}/>
      </div>
      <button onClick={()=>openWA(waM,waMsg)} disabled={!waMsg.trim()} style={{width:"100%",background:waMsg.trim()?"linear-gradient(135deg,#25D366,#128C7E)":"#F7F9FC",border:"none",borderRadius:9,padding:"11px 0",color:waMsg.trim()?"#fff":"var(--mu)",fontSize:13,fontWeight:700,cursor:waMsg.trim()?"pointer":"default",fontFamily:"DM Sans",opacity:waMsg.trim()?1:.5}}>
        {waM.phone?"✓ Enviar no WhatsApp":"📋 Copiar Mensagem"}
      </button>
    </Modal>}

    {/* Edit/Create modal */}
    {showF&&<Modal title={editingSt?"Editar Aluno":"Cadastrar Aluno"} onClose={()=>{setShowF(false);setEditingSt(null);}}>
      <div className="g2"><Inp label="Nome *" value={form.name} onChange={e=>ff({name:e.target.value})}/><Inp label="E-mail" value={form.email} onChange={e=>ff({email:e.target.value})} type="email"/><Inp label="WhatsApp" value={form.phone} onChange={e=>ff({phone:e.target.value})}/><Inp label="CPF" value={form.cpf} onChange={e=>ff({cpf:e.target.value})}/><Inp label="Cidade" value={form.city} onChange={e=>ff({city:e.target.value})}/><Inp label="Ingresso" value={form.since} onChange={e=>ff({since:e.target.value})} type="month"/></div>
      <Lbl>Cursos matriculados</Lbl>
      <div style={{display:"flex",flexWrap:"wrap",gap:7,marginBottom:13}}>
        {courses.map(c=>{const en=(form.courses||[]).includes(c.id);return <button key={c.id} onClick={()=>ff({courses:en?(form.courses||[]).filter(x=>x!==c.id):[...(form.courses||[]),c.id]})} style={{display:"flex",alignItems:"center",gap:6,padding:"5px 11px",borderRadius:9,border:`1.5px solid ${en?"var(--bl)":"#DDE3EE"}`,background:en?"#EEF4FF":"#F7F9FC",cursor:"pointer",transition:"all .15s"}}>
          <div style={{width:14,height:14,borderRadius:3,border:`2px solid ${en?"var(--bl)":"#DDE3EE"}`,background:en?"var(--bl)":"transparent",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,color:"#fff",fontWeight:700}}>{en?"✓":""}</div>
          <span style={{fontSize:11,color:en?"var(--bl)":"var(--mu)",fontWeight:en?700:400}}>{c.name.split("–")[0].trim()}</span>
          {c.value>0&&<span style={{fontSize:10,color:en?"var(--bl)":"var(--mu2)"}}>R${c.value.toLocaleString()}</span>}
        </button>;})}
      </div>
      <Divr/>
      <div className="g2">
        <div><Lbl>Pagamento</Lbl><div style={{display:"flex",gap:7,marginBottom:13}}>{["avista","parcelado"].map(t=><button key={t} onClick={()=>ff({pType:t})} style={{flex:1,background:form.pType===t?"#EEF4FF":"#F7F9FC",border:`1.5px solid ${form.pType===t?"var(--bl)":"#DDE3EE"}`,color:form.pType===t?"var(--bl)":"var(--mu)",borderRadius:9,padding:"8px 0",fontSize:12,fontWeight:600,cursor:"pointer"}}>{t==="avista"?"À Vista":"Parcelado"}</button>)}</div></div>
        <Sel label="Forma" value={form.pMethod} onChange={e=>ff({pMethod:e.target.value})} options={PAYS}/>
      </div>
      <div className="g2"><Inp label="Valor Total (R$)" value={form.totalValue} onChange={e=>ff({totalValue:e.target.value})} type="number"/>{form.pType==="parcelado"&&<Inp label="Nº Parcelas" value={form.installments} onChange={e=>ff({installments:+e.target.value})} type="number"/>}</div>
      {form.pType==="parcelado"&&<div className="g2"><Inp label="Valor Parcela (R$)" value={form.instValue} onChange={e=>ff({instValue:e.target.value})} type="number"/><Inp label="Início Parcelas" value={form.startMonth} onChange={e=>ff({startMonth:e.target.value})} type="month"/></div>}
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:13}}><input type="checkbox" id="ctr" checked={!!form.contract} onChange={e=>ff({contract:e.target.checked})} style={{width:15,height:15,accentColor:"var(--bl)"}}/><label htmlFor="ctr" style={{fontSize:13,color:"var(--mu)",cursor:"pointer"}}>Contrato assinado</label></div>
      <Inp label="Observações" value={form.notes} onChange={e=>ff({notes:e.target.value})} rows={2}/>
      {!editingSt&&(form.courses||[]).length>0&&<div style={{background:"#EEF4FF",border:"1.5px solid #C7D7F5",borderRadius:9,padding:"8px 12px",fontSize:12,color:"var(--bl)",marginBottom:11}}>✓ Vendas serão geradas automaticamente para os cursos selecionados</div>}
      <Btn style={{width:"100%"}} onClick={save}>{editingSt?"Salvar alterações":"Cadastrar Aluno"}</Btn>
    </Modal>}
  </div>;
}

/* ══════════════════════════════════════════════════
   CURSOS — shows linked students from state
══════════════════════════════════════════════════ */
function CoursesPage({courses,setCourses,students,setStudents}){
  const[sel,setSel]=useState(null);const[showF,setShowF]=useState(false);const[tab,setTab]=useState("lista");
  const[calM,setCalM]=useState(new Date(2025,2,1));
  const e={name:"",type:CTYPES[0],date:"",end:"",modality:MODS[0],value:"",capacity:12,enrolled:[],waitlist:[],instructor:"",desc:""};
  const[form,setForm]=useState(e);const f=v=>setForm(p=>({...p,...v}));
  function save(){if(!form.name.trim())return;if(sel?.id)setCourses(cs=>cs.map(c=>c.id===sel.id?{...form,id:c.id}:c));else setCourses(cs=>[...cs,{...form,id:Date.now()}]);setShowF(false);setSel(null);setForm(e);}
  const cy=calM.getFullYear(),cm=calM.getMonth();
  const fd=new Date(cy,cm,1).getDay(),dm=new Date(cy,cm+1,0).getDate();
  function onDay(d){const ds=`${cy}-${String(cm+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;return courses.filter(c=>c.date<=ds&&c.end>=ds);}
  // Get enrolled from students.courses (live) + course.enrolled (seed)
  function getEnrolled(courseId){
    const fromStudents=students.filter(s=>s.courses.includes(courseId));
    return fromStudents;
  }
  function getWaitlist(courseId){
    const c=courses.find(x=>x.id===courseId);
    return (c?.waitlist||[]).map(sid=>students.find(s=>s.id===sid)).filter(Boolean);
  }
  // Move from waitlist to enrolled
  function confirmFromWait(courseId,studentId){
    const course=courses.find(c=>c.id===courseId);
    const enrolled=getEnrolled(courseId);
    if(course&&enrolled.length>=course.capacity){alert("Turma já está com capacidade máxima!");return;}
    setCourses(cs=>cs.map(c=>c.id!==courseId?c:{...c,waitlist:(c.waitlist||[]).filter(x=>x!==studentId)}));
    setStudents(ss=>ss.map(s=>s.id!==studentId?s:{...s,courses:[...new Set([...(s.courses||[]),courseId])]}));
  }

  return <div style={{animation:"up .4s ease"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
      <div><h1 style={{fontFamily:"Playfair Display",fontSize:24,fontWeight:700}}>Cursos & Calendário</h1><p style={{color:"var(--mu)",fontSize:11}}>{courses.length} eventos</p></div>
      <div style={{display:"flex",gap:7}}><Btn v="ghost" sz="sm" onClick={()=>setTab(t=>t==="lista"?"cal":"lista")}>{tab==="lista"?"📅 Cal":"☰ Lista"}</Btn><Btn sz="sm" onClick={()=>{setForm(e);setSel(null);setShowF(true);}}>+ Novo</Btn></div>
    </div>
    {tab==="lista"?<div style={{display:"flex",flexDirection:"column",gap:9}}>
      {[...courses].sort((a,b)=>a.date.localeCompare(b.date)).map((c,i)=>{
        const enrolled=getEnrolled(c.id);const waitlist=getWaitlist(c.id);const ex=sel?.id===c.id;
        return <div key={c.id} style={{background:"#fff",borderRadius:14,border:`1.5px solid ${ex?"var(--bl)":"#E5EAF3"}`,borderLeft:`4px solid ${KCL[c.type]||"var(--mu)"}`,overflow:"hidden",animation:`sr .3s ease ${i*.05}s both`,boxShadow:"var(--shadow)"}}>
          <div onClick={()=>setSel(p=>p?.id===c.id?null:c)} style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",padding:"13px 16px",cursor:"pointer"}}>
            <div style={{flex:1}}>
              <div style={{display:"flex",gap:6,marginBottom:4}}><Chip color={KCL[c.type]}>{c.type}</Chip><Chip color={c.modality==="Online"?"var(--bl)":"var(--te)"}>{c.modality}</Chip></div>
              <div style={{fontWeight:700,fontSize:14,color:"var(--tx)"}}>{c.name}</div>
              <div style={{fontSize:11,color:"var(--mu)",marginTop:2}}>📅 {c.date}{c.end!==c.date?" → "+c.end:""} · ✦ {c.instructor}</div>
              {c.desc&&<div style={{fontSize:11,color:"var(--mu)",marginTop:3,lineHeight:1.5}}>{c.desc}</div>}
            </div>
            <div style={{textAlign:"right",marginLeft:11}}>
              {c.value>0&&<div style={{fontWeight:700,color:"var(--bl)",fontSize:14}}>R${(+c.value).toLocaleString()}</div>}
              <div style={{fontSize:11,color:enrolled.length>=c.capacity?"var(--rd)":"var(--gn)",marginTop:2,fontWeight:600}}>{enrolled.length}/{c.capacity} vagas</div>
              {waitlist.length>0&&<div style={{fontSize:10,color:"var(--am)",fontWeight:600}}>⏳ {waitlist.length} espera</div>}
            </div>
          </div>
          {ex&&<div style={{borderTop:"1.5px solid #E5EAF3",padding:"13px 16px",background:"#F7F9FC"}}>
            <div className="g2">
              <div>
                <div style={{fontSize:10,color:"var(--bl)",fontWeight:600,letterSpacing:.5,marginBottom:8,textTransform:"uppercase"}}>Matriculados ({enrolled.length})</div>
                {enrolled.length===0?<div style={{fontSize:11,color:"var(--mu2)"}}>Nenhum ainda</div>:enrolled.map(st=><div key={st.id} style={{fontSize:12,padding:"4px 0",borderBottom:"1px solid var(--b)",color:"var(--tx)",display:"flex",alignItems:"center",gap:6}}><span style={{color:"var(--gn)"}}>✅</span>{st.name}</div>)}
              </div>
              <div>
                <div style={{fontSize:10,color:"var(--am)",fontWeight:600,letterSpacing:.5,marginBottom:8,textTransform:"uppercase"}}>Lista de Espera ({waitlist.length})</div>
                {waitlist.length===0?<div style={{fontSize:11,color:"var(--mu2)"}}>Nenhuma</div>:waitlist.map(st=><div key={st.id} style={{display:"flex",alignItems:"center",gap:7,padding:"5px 0",borderBottom:"1px solid var(--b)"}}>
                  <span style={{fontSize:11,flex:1,color:"var(--am)",fontWeight:600}}>⏳ {st.name}</span>
                  <Btn sz="sm" v="green" onClick={()=>confirmFromWait(c.id,st.id)}>Confirmar</Btn>
                </div>)}
              </div>
            </div>
            <div style={{display:"flex",gap:7,marginTop:12}}>
              <Btn sz="sm" v="ghost" onClick={e=>{e.stopPropagation();setForm({...c});setShowF(true);}}>Editar</Btn>
              <Btn sz="sm" v="danger" onClick={e=>{e.stopPropagation();setCourses(cs=>cs.filter(x=>x.id!==c.id));setSel(null);}}>Excluir</Btn>
            </div>
          </div>}
        </div>;})}
    </div>:(
      <div style={{background:"#fff",borderRadius:16,border:"1px solid var(--b)",overflow:"hidden",boxShadow:"var(--shadow)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"13px 18px",borderBottom:"1px solid var(--b)"}}>
          <button onClick={()=>setCalM(new Date(cy,cm-1,1))} style={{background:"#F7F9FC",border:"1.5px solid #DDE3EE",borderRadius:7,width:28,height:28,color:"var(--tx)",cursor:"pointer",fontSize:14}}>‹</button>
          <div style={{fontFamily:"Playfair Display",fontSize:18,fontWeight:700,color:"var(--tx)"}}>{MNS[cm]} {cy}</div>
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
        <div style={{padding:"9px 18px",display:"flex",gap:11,borderTop:"1px solid var(--b)",flexWrap:"wrap"}}>{Object.entries(KCL).map(([t,c])=><div key={t} style={{display:"flex",alignItems:"center",gap:5}}><Dot color={c}/><span style={{fontSize:10,color:"var(--mu)"}}>{t}</span></div>)}</div>
      </div>
    )}
    {showF&&<Modal title="Cadastrar Evento" onClose={()=>setShowF(false)}>
      <Inp label="Nome *" value={form.name} onChange={e=>f({name:e.target.value})}/>
      <Inp label="Descrição" value={form.desc} onChange={e=>f({desc:e.target.value})} rows={2} placeholder="Conteúdo, pré-requisitos, objetivos..."/>
      <div className="g2"><Sel label="Tipo" value={form.type} onChange={e=>f({type:e.target.value})} options={CTYPES}/><Sel label="Modalidade" value={form.modality} onChange={e=>f({modality:e.target.value})} options={MODS}/><Inp label="Data início" value={form.date} onChange={e=>f({date:e.target.value})} type="date"/><Inp label="Data fim" value={form.end} onChange={e=>f({end:e.target.value})} type="date"/><Inp label="Valor (R$)" value={form.value} onChange={e=>f({value:e.target.value})} type="number"/><Inp label="Vagas" value={form.capacity} onChange={e=>f({capacity:+e.target.value})} type="number"/></div>
      <Inp label="Instrutor(a)" value={form.instructor} onChange={e=>f({instructor:e.target.value})}/>
      <Btn style={{width:"100%"}} onClick={save}>{sel?.id?"Salvar":"Cadastrar"}</Btn>
    </Modal>}
  </div>;
}

/* ══════════════════════════════════════════════════
   FINANCEIRO — reads from real sales state
══════════════════════════════════════════════════ */
function FinancialPage({sales,setSales,courses,students}){
  const[tab,setTab]=useState("vendas");
  const[showAdd,setShowAdd]=useState(false);
  const[fT,setFT]=useState("Todos");
  const[fM,setFM]=useState("Todos");
  const[goals,setGoals]=useState({Curso:10000,Workshop:3000,Produto:2000,Atendimento:1500});
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
  // Chart from actual sales
  const monthMap={};
  sales.forEach(s=>{const m=s.date?.slice(0,7);if(!m)return;if(!monthMap[m])monthMap[m]={};monthMap[m][s.type]=(monthMap[m][s.type]||0)+(+s.value||0);});
  const chartData=Object.keys(monthMap).sort().slice(-7).map(m=>{
    const row={mes:MOPT[parseInt(m.slice(5,7))-1]};
    if(cF==="Todos"){row.Real=STYPES.reduce((a,t)=>a+(monthMap[m][t]||0),0);row.Meta=Object.values(goals).reduce((a,b)=>a+b,0);}
    else{row.Real=monthMap[m][cF]||0;row.Meta=goals[cF]||0;}
    return row;
  });
  function save(){if(!form.desc||!form.value)return;setSales(ss=>[...ss,{...form,id:Date.now(),value:+form.value}]);setShowAdd(false);setForm(e);}
  return <div style={{animation:"up .4s ease"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
      <h1 style={{fontFamily:"Playfair Display",fontSize:24,fontWeight:700}}>Financeiro</h1>
      <Btn sz="sm" onClick={()=>setShowAdd(true)}>+ Registrar Venda</Btn>
    </div>
    <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:16}}>
      {STYPES.map(t=><div key={t} style={{background:"#fff",borderRadius:14,padding:"12px 15px",flex:1,minWidth:110,border:"1px solid var(--b)",boxShadow:"var(--shadow)"}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}><span style={{fontSize:10,color:"var(--mu)",fontWeight:600,textTransform:"uppercase",letterSpacing:.5}}>{t}</span><Dot color={TCL[t]} size={7}/></div>
        <div style={{fontFamily:"Playfair Display",fontSize:20,fontWeight:700,color:TCL[t]}}>R${tT(t).toLocaleString()}</div>
        <div style={{background:"#F0F4FA",borderRadius:99,height:4,marginTop:6,overflow:"hidden"}}><div style={{width:`${gP(t)}%`,height:"100%",background:TCL[t],borderRadius:99,transition:"width .8s ease"}}/></div>
        <div style={{fontSize:9,color:"var(--mu)",marginTop:2}}>{gP(t)}% · meta R${(goals[t]||0).toLocaleString()}</div>
      </div>)}
    </div>
    <div style={{display:"flex",gap:0,borderBottom:"2px solid var(--b)",marginBottom:16}}>
      {[["vendas","◈ Vendas"],["grafico","▦ Gráfico"],["metas","❋ Metas"]].map(([id,lbl])=><button key={id} onClick={()=>setTab(id)} style={{padding:"8px 15px",border:"none",background:"transparent",fontFamily:"DM Sans",fontSize:12,fontWeight:600,cursor:"pointer",color:tab===id?"var(--bl)":"var(--mu)",borderBottom:`2px solid ${tab===id?"var(--bl)":"transparent"}`,marginBottom:-2}}>{lbl}</button>)}
    </div>
    {tab==="vendas"&&<>
      <div style={{display:"flex",gap:8,marginBottom:11,flexWrap:"wrap"}}>
        <select value={fM} onChange={e=>setFM(e.target.value)} style={{background:"#fff",border:"1.5px solid #DDE3EE",borderRadius:9,padding:"7px 11px",color:"var(--mu)",fontSize:12,outline:"none",fontFamily:"DM Sans",boxShadow:"var(--shadow)"}}>
          <option value="Todos">Todos os meses</option>{months.map(m=><option key={m}>{m}</option>)}
        </select>
        {["Todos",...STYPES].map(t=><button key={t} onClick={()=>setFT(t)} style={{background:fT===t?`${TCL[t]||"var(--bl)"}15`:"#fff",border:`1.5px solid ${fT===t?TCL[t]||"var(--bl)":"#DDE3EE"}`,color:fT===t?TCL[t]||"var(--bl)":"var(--mu)",borderRadius:99,padding:"6px 12px",fontSize:11,fontWeight:600,cursor:"pointer",boxShadow:"var(--shadow)"}}>{t}</button>)}
      </div>
      <div className="tw">
        <div style={{background:"#fff",borderRadius:14,border:"1px solid var(--b)",overflow:"hidden",minWidth:460,boxShadow:"var(--shadow)"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
            <thead><tr style={{background:"#F7F9FC",borderBottom:"1px solid var(--b)"}}>{["Data","Aluno","Descrição","Pagamento","Tipo","Valor"].map(h=><th key={h} style={{padding:"9px 12px",textAlign:"left",fontSize:10,color:"var(--mu)",fontWeight:600,letterSpacing:.4,textTransform:"uppercase",whiteSpace:"nowrap"}}>{h}</th>)}</tr></thead>
            <tbody>
              {filtered.map((s,i)=><tr key={s.id} style={{borderBottom:"1px solid var(--b)",animation:`sr .3s ease ${i*.04}s both`}}>
                <td style={{padding:"9px 12px",color:"var(--mu)",whiteSpace:"nowrap"}}>{s.date}</td>
                <td style={{padding:"9px 12px",fontWeight:600,whiteSpace:"nowrap"}}>{sName(s.studentId)}</td>
                <td style={{padding:"9px 12px",color:"var(--mu)",maxWidth:150,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.desc}</td>
                <td style={{padding:"9px 12px",whiteSpace:"nowrap"}}><Chip color="var(--mu)" sm>{s.payment}</Chip></td>
                <td style={{padding:"9px 12px",whiteSpace:"nowrap"}}><Chip color={TCL[s.type]} sm>{s.type}</Chip></td>
                <td style={{padding:"9px 12px",fontWeight:700,color:"var(--bl)",whiteSpace:"nowrap"}}>R${(+s.value).toLocaleString()}</td>
              </tr>)}
              <tr style={{background:"#F7F9FC"}}><td colSpan={5} style={{padding:"9px 12px",fontWeight:700,textAlign:"right",color:"var(--mu)"}}>Total:</td><td style={{padding:"9px 12px",fontWeight:800,color:"var(--bl)",fontSize:14}}>R${total.toLocaleString()}</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </>}
    {tab==="grafico"&&<>
      <div style={{display:"flex",gap:7,marginBottom:13,flexWrap:"wrap"}}>
        {["Todos",...STYPES].map(t=><button key={t} onClick={()=>setCF(t)} style={{background:cF===t?`${TCL[t]||"var(--bl)"}15`:"#fff",border:`1.5px solid ${cF===t?TCL[t]||"var(--bl)":"#DDE3EE"}`,color:cF===t?TCL[t]||"var(--bl)":"var(--mu)",borderRadius:99,padding:"6px 12px",fontSize:11,fontWeight:600,cursor:"pointer"}}>{t}</button>)}
      </div>
      <div style={{background:"#fff",borderRadius:16,padding:20,border:"1px solid var(--b)",boxShadow:"var(--shadow)"}}>
        <div style={{fontFamily:"Playfair Display",fontSize:16,fontWeight:600,marginBottom:3}}>Receita Real vs Meta</div>
        <div style={{fontSize:11,color:"var(--mu)",marginBottom:16}}>Calculado das vendas reais</div>
        {chartData.length>0?<ResponsiveContainer width="100%" height={200}>
          <LineChart data={chartData} margin={{top:8,right:8,left:-20,bottom:0}}>
            <XAxis dataKey="mes" tick={{fontSize:10,fill:"#9AAAC0"}} axisLine={false} tickLine={false}/>
            <YAxis tick={{fontSize:9,fill:"#9AAAC0"}} axisLine={false} tickLine={false} tickFormatter={v=>v>=1000?`${(v/1000).toFixed(0)}k`:v}/>
            <Tooltip formatter={(val)=>`R$${val.toLocaleString("pt-BR")}`} contentStyle={{background:"#fff",border:"1px solid #DDE3EE",borderRadius:8,fontSize:12,boxShadow:"0 4px 16px rgba(30,40,80,.12)"}}/>
            <CartesianGrid strokeDasharray="3 3" stroke="#EEF1F7" vertical={false}/>
            <Legend wrapperStyle={{fontSize:12,color:"#6B7A99",paddingTop:8}}/>
            <Line type="monotone" dataKey="Real" name="Real" stroke="#3066BE" strokeWidth={3} dot={{fill:"#3066BE",r:5,strokeWidth:0}} activeDot={{r:7,fill:"#3066BE"}} isAnimationActive={true}/>
            <Line type="monotone" dataKey="Meta" name="Meta" stroke="#6244B8" strokeWidth={2} strokeDasharray="8 4" dot={{fill:"#6244B8",r:3,strokeWidth:0}} activeDot={{r:5}} isAnimationActive={true}/>
          </LineChart>
        </ResponsiveContainer>:<div style={{textAlign:"center",padding:"24px 0",color:"var(--mu)",fontSize:12}}>Sem dados ainda</div>}
      </div>
    </>}
    {tab==="metas"&&<>
      <div style={{background:"#fff",borderRadius:16,padding:20,border:"1px solid var(--b)",boxShadow:"var(--shadow)",marginBottom:13}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}><div style={{fontFamily:"Playfair Display",fontSize:16,fontWeight:600}}>Metas Mensais</div><Btn sz="sm" v="ghost" onClick={()=>{setEG({...goals});setShowGE(true);}}>✏️ Editar</Btn></div>
        {STYPES.map(t=>{const a=tT(t);const p=gP(t);return <div key={t} style={{marginBottom:16}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}><div style={{display:"flex",alignItems:"center",gap:8}}><Dot color={TCL[t]} size={9}/><span style={{fontWeight:600,fontSize:13,color:"var(--tx)"}}>{t}</span></div><div style={{textAlign:"right"}}><span style={{fontWeight:700,color:TCL[t]}}>R${a.toLocaleString()}</span><span style={{color:"var(--mu)",fontSize:11}}> / R${(goals[t]||0).toLocaleString()}</span></div></div>
          <div style={{background:"#F0F4FA",borderRadius:99,height:8,overflow:"hidden"}}><div style={{width:`${p}%`,height:"100%",background:`linear-gradient(90deg,${TCL[t]},${TCL[t]}aa)`,borderRadius:99,transition:"width 1s ease"}}/></div>
          <div style={{fontSize:11,color:p>=100?"var(--gn)":p>=70?"var(--am)":"var(--rd)",marginTop:3,fontWeight:600}}>{p}% {p>=100?"✓ Atingida!":p>=70?"Quase lá!":"Precisa acelerar"}</div>
        </div>;})}
      </div>
      {showGE&&<div style={{background:"#fff",borderRadius:16,padding:20,border:"1px solid var(--b)",boxShadow:"var(--shadow)"}}>
        <div style={{fontFamily:"Playfair Display",fontSize:15,fontWeight:600,marginBottom:13}}>Editar Metas</div>
        {STYPES.map(t=><div key={t} style={{display:"flex",alignItems:"center",gap:11,marginBottom:10}}><Dot color={TCL[t]} size={8}/><span style={{fontSize:13,fontWeight:600,minWidth:95,color:"var(--tx)"}}>{t}</span><input type="number" value={eG[t]||goals[t]||0} onChange={e=>setEG(g=>({...g,[t]:+e.target.value}))} style={{flex:1,background:"#F7F9FC",border:"1.5px solid #DDE3EE",borderRadius:9,padding:"8px 12px",color:"var(--tx)",fontSize:13,outline:"none",fontFamily:"DM Sans"}}/></div>)}
        <div style={{display:"flex",gap:8,marginTop:8}}><Btn style={{flex:1}} onClick={()=>{setGoals({...eG});setShowGE(false);}}>Salvar</Btn><Btn v="ghost" onClick={()=>setShowGE(false)}>Cancelar</Btn></div>
      </div>}
    </>}
    {showAdd&&<Modal title="Registrar Venda Manual" onClose={()=>setShowAdd(false)}>
      <div className="g2"><Inp label="Data" value={form.date} onChange={e=>f({date:e.target.value})} type="date"/><Inp label="Descrição *" value={form.desc} onChange={e=>f({desc:e.target.value})}/></div>
      <Lbl>Aluno (opcional)</Lbl>
      <select value={form.studentId||""} onChange={e=>f({studentId:e.target.value?+e.target.value:null})} style={{width:"100%",background:"#F7F9FC",border:"1.5px solid #DDE3EE",borderRadius:10,padding:"10px 13px",color:"var(--tx)",fontSize:13,outline:"none",fontFamily:"DM Sans",marginBottom:13}}>
        <option value="">Selecionar aluno...</option>
        {students.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
      </select>
      <div className="g2"><Inp label="Valor (R$) *" value={form.value} onChange={e=>f({value:e.target.value})} type="number"/><Sel label="Pagamento" value={form.payment} onChange={e=>f({payment:e.target.value})} options={PAYS}/></div>
      <Lbl>Tipo</Lbl><div style={{display:"flex",gap:7,marginBottom:13,flexWrap:"wrap"}}>{STYPES.map(t=><button key={t} onClick={()=>f({type:t})} style={{flex:1,background:form.type===t?`${TCL[t]}15`:"#F7F9FC",border:`1.5px solid ${form.type===t?TCL[t]:"#DDE3EE"}`,color:form.type===t?TCL[t]:"var(--mu)",borderRadius:9,padding:"8px 0",fontSize:12,fontWeight:600,cursor:"pointer"}}>{t}</button>)}</div>
      <Btn style={{width:"100%"}} onClick={save}>Registrar</Btn>
    </Modal>}
  </div>;
}

/* ══════════════════════════════════════════════════
   CHECKLIST with SLA
══════════════════════════════════════════════════ */
function ChecklistPage({checks,setChecks}){
  const[nT,setNT]=useState("");const[nP,setNP]=useState("Média");const[nD,setND]=useState("");const[nA,setNA]=useState("");
  const[filter,setFilter]=useState("todas");const[showSLA,setShowSLA]=useState(false);const[editSLA,setEditSLA]=useState(null);
  const[slaConf,setSlaConf]=useState({Alta:{hours:6,notifyBefore:2},Média:{hours:24,notifyBefore:4},Baixa:{hours:48,notifyBefore:8}});
  const PC={Alta:"var(--rd)",Média:"var(--am)",Baixa:"var(--gn)"};
  const filtered=filter==="todas"?checks:filter==="feitas"?checks.filter(c=>c.done):checks.filter(c=>!c.done);
  function add(){if(!nT.trim())return;setChecks(cs=>[...cs,{id:Date.now(),text:nT.trim(),done:false,priority:nP,due:nD,assignee:nA,createdAt:new Date().toISOString()}]);setNT("");setND("");setNA("");}
  function toggle(id){setChecks(cs=>cs.map(c=>c.id===id?{...c,done:!c.done}:c));}
  function remove(id){setChecks(cs=>cs.filter(c=>c.id!==id));}
  function getSLA(c){
    if(c.done||!c.createdAt)return null;
    const conf=slaConf[c.priority]||slaConf.Média;
    const dl=new Date(new Date(c.createdAt).getTime()+conf.hours*3600000);
    const na=new Date(dl.getTime()-conf.notifyBefore*3600000);
    const now=new Date();const hl=Math.round((dl-now)/3600000);
    if(now>=dl)return{s:"vencido",label:`SLA vencido há ${Math.abs(hl)}h`,color:"var(--rd)"};
    if(now>=na)return{s:"alerta",label:`⚠️ ${hl}h restantes`,color:"var(--am)"};
    return{s:"ok",label:`${hl}h restantes (SLA ${conf.hours}h)`,color:"var(--gn)"};
  }
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
          <Btn sz="sm" onClick={()=>{const h=+document.getElementById("sh_"+p).value||c.hours;const n=+document.getElementById("sn_"+p).value||c.notifyBefore;setSlaConf(x=>({...x,[p]:{hours:h,notifyBefore:n}}));setEditSLA(null);}}>✓ Salvar</Btn>
          <Btn sz="sm" v="ghost" onClick={()=>setEditSLA(null)}>✕</Btn>
        </div>:<div style={{flex:1,display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:12,color:"var(--mu)"}}>Prazo: <strong style={{color:"var(--tx)"}}>{c.hours}h</strong> · Notif. <strong style={{color:"var(--tx)"}}>{c.notifyBefore}h antes</strong></span><Btn sz="sm" v="ghost" onClick={()=>setEditSLA(p)}>✏️</Btn></div>}
      </div>;})}
    </div>}
    <div style={{background:"#fff",borderRadius:14,padding:16,border:"1px solid var(--b)",marginBottom:14,boxShadow:"var(--shadow)"}}>
      <Inp label="" value={nT} onChange={e=>setNT(e.target.value)} placeholder="Nova tarefa..."/>
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
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}><Chip color={PC[c.priority]} sm>{c.priority}</Chip>{c.assignee&&<Chip color="var(--bl)" sm>👤 {c.assignee}</Chip>}{c.due&&<Chip color="var(--mu)" sm>📅 {c.due}</Chip>}</div>
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
  const[mode,setMode]=useState("aluno");
  const[fC,setFC]=useState("");const[fS,setFS]=useState("");
  const[target,setTarget]=useState(null);const[msg,setMsg]=useState("");
  const[tab,setTab]=useState("enviar");const[showTM,setShowTM]=useState(false);const[nTN,setNTN]=useState("");
  const cN=[...new Set(courses.map(c=>c.name))];
  const espera=courses.filter(c=>!fC||c.name===fC).flatMap(c=>(c.waitlist||[]).map(sid=>{const st=students.find(s=>s.id===sid);return st?{...st,courseName:c.name,courseDate:c.date}:null;})).filter(Boolean);
  const list=mode==="lead"?leads.filter(l=>(!fS||l.stage===fS)&&(!fC||courses.find(c=>c.id===l.courseId)?.name.toLowerCase().includes(fC.toLowerCase()))):mode==="aluno"?students:espera;
  function applyTpl(t){const base=t.text;if(!target){setMsg(base);return;}const courseName=mode==="espera"?target.courseName:(target.courses||[]).map(cid=>courses.find(c=>c.id===cid)?.name||"").filter(Boolean)[0]||"";setMsg(base.replace("{nome}",target.name||"").replace("{curso}",courseName).replace("{data}",target.courseDate||""));}
  function saveTpl(){if(!nTN.trim()||!msg.trim())return;setTemplates(ts=>[...ts,{id:Date.now(),name:nTN.trim(),text:msg}]);setNTN("");setShowTM(false);}
  function openWA(){if(!target){alert("Selecione uma pessoa");return;}if(!msg.trim()){alert("Escreva uma mensagem");return;}const p=(target.phone||"").replace(/\D/g,"");if(p)window.open(`https://wa.me/55${p}?text=${encodeURIComponent(msg)}`,"_blank");else navigator.clipboard.writeText(msg);}
  return <div style={{animation:"up .4s ease"}}>
    <div style={{marginBottom:16}}><h1 style={{fontFamily:"Playfair Display",fontSize:24,fontWeight:700}}>Lembretes WhatsApp</h1><p style={{color:"var(--mu)",fontSize:11,marginTop:2}}>Selecione · escreva ou use modelo · envie</p></div>
    <div style={{display:"flex",gap:0,borderBottom:"2px solid var(--b)",marginBottom:16}}>
      {[["enviar","💬 Enviar"],["modelos","📄 Modelos"]].map(([id,lbl])=><button key={id} onClick={()=>setTab(id)} style={{padding:"8px 15px",border:"none",background:"transparent",fontFamily:"DM Sans",fontSize:12,fontWeight:600,cursor:"pointer",color:tab===id?"var(--bl)":"var(--mu)",borderBottom:`2px solid ${tab===id?"var(--bl)":"transparent"}`,marginBottom:-2}}>{lbl}</button>)}
    </div>
    {tab==="modelos"&&<div>
      <div style={{background:"#fff",borderRadius:14,padding:16,border:"1px solid var(--b)",boxShadow:"var(--shadow)"}}>
        <div style={{fontFamily:"Playfair Display",fontSize:15,fontWeight:600,marginBottom:13}}>Modelos Salvos</div>
        {templates.map(t=><div key={t.id} style={{background:"#F7F9FC",borderRadius:11,padding:13,marginBottom:9,border:"1px solid var(--b)"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:7}}><span style={{fontWeight:700,fontSize:12,color:"var(--tx)"}}>{t.name}</span><div style={{display:"flex",gap:6}}><Btn sz="sm" v="purple" onClick={()=>{applyTpl(t);setTab("enviar");}}>Usar</Btn><Btn sz="sm" v="danger" onClick={()=>setTemplates(ts=>ts.filter(x=>x.id!==t.id))}>×</Btn></div></div>
          <div style={{fontSize:12,color:"var(--mu)",lineHeight:1.5}}>{t.text}</div>
          <div style={{fontSize:10,color:"var(--mu2)",marginTop:5}}>Variáveis: {"{nome}"} {"{curso}"} {"{data}"}</div>
        </div>)}
        {!templates.length&&<div style={{textAlign:"center",padding:"14px 0",color:"var(--mu)",fontSize:12}}>Nenhum modelo</div>}
      </div>
    </div>}
    {tab==="enviar"&&<div className="gwa">
      <div>
        <div style={{display:"flex",gap:6,marginBottom:11,flexWrap:"wrap"}}>{[["aluno","Alunos"],["lead","Leads"],["espera","Lista Espera"]].map(([v,l])=><button key={v} onClick={()=>{setMode(v);setTarget(null);}} style={{background:mode===v?"#EEF4FF":"#fff",border:`1.5px solid ${mode===v?"var(--bl)":"#DDE3EE"}`,color:mode===v?"var(--bl)":"var(--mu)",borderRadius:9,padding:"8px 13px",fontSize:12,fontWeight:600,cursor:"pointer",boxShadow:"var(--shadow)"}}>{l}</button>)}</div>
        <div style={{display:"flex",gap:7,marginBottom:10,flexWrap:"wrap"}}>
          {mode==="lead"&&<select value={fS} onChange={e=>setFS(e.target.value)} style={{background:"#fff",border:"1.5px solid #DDE3EE",borderRadius:9,padding:"7px 11px",color:"var(--mu)",fontSize:11,outline:"none",fontFamily:"DM Sans"}}><option value="">Todas etapas</option>{SCRM.map(s=><option key={s}>{s}</option>)}</select>}
          {(mode==="lead"||mode==="espera")&&<select value={fC} onChange={e=>setFC(e.target.value)} style={{flex:1,background:"#fff",border:"1.5px solid #DDE3EE",borderRadius:9,padding:"7px 11px",color:"var(--mu)",fontSize:11,outline:"none",fontFamily:"DM Sans"}}><option value="">Todos os cursos</option>{cN.map(n=><option key={n}>{n}</option>)}</select>}
        </div>
        <div style={{fontSize:10,color:"var(--mu)",fontWeight:600,letterSpacing:.5,marginBottom:8,textTransform:"uppercase"}}>Toque para selecionar</div>
        <div style={{display:"flex",flexDirection:"column",gap:6}}>
          {list.map((p,i)=>{const sel=target?.id===p.id&&target?.courseName===p.courseName;return <div key={(p.id||i)+(p.courseName||"")} onClick={()=>setTarget(sel?null:p)} style={{background:sel?"#EEF4FF":"#fff",borderRadius:12,padding:"11px 13px",border:`1.5px solid ${sel?"var(--bl)":"#DDE3EE"}`,display:"flex",alignItems:"center",gap:11,cursor:"pointer",transition:"all .15s",boxShadow:"var(--shadow)",animation:`sr .3s ease ${i*.04}s both`}}>
            <Av letter={p.name[0]} size={34} color={sel?"var(--bl)":mode==="lead"?(SCL[p.stage]||"var(--mu)"):"var(--te)"}/>
            <div style={{flex:1}}><div style={{fontWeight:sel?700:600,fontSize:12,color:sel?"var(--bl)":"var(--tx)"}}>{p.name}</div><div style={{fontSize:11,color:"var(--mu)"}}>{mode==="lead"?`${courses.find(c=>c.id===p.courseId)?.name||"—"} · ${p.stage}`:mode==="espera"?`⏳ ${p.courseName}`:p.email}</div></div>
            {sel&&<span style={{color:"var(--bl)",fontSize:16,fontWeight:700}}>✓</span>}
          </div>;})}
          {!list.length&&<div style={{textAlign:"center",padding:"18px 0",color:"var(--mu)",fontSize:11}}>Nenhum resultado</div>}
        </div>
      </div>
      <div style={{background:"#fff",borderRadius:17,padding:18,border:"1px solid var(--b)",height:"fit-content",position:"sticky",top:0,boxShadow:"var(--shadow)"}}>
        {target?<div style={{background:"#EEF4FF",borderRadius:9,padding:"8px 12px",marginBottom:11,fontSize:12,fontWeight:700,color:"var(--bl)"}}>Para: {target.name} · {(target.phone||"").slice(0,14)}</div>:<div style={{background:"#F7F9FC",borderRadius:9,padding:"8px 12px",marginBottom:11,fontSize:12,color:"var(--mu)"}}>← Selecione uma pessoa</div>}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:9}}>
          <div style={{fontSize:10,color:"var(--mu)",fontWeight:600,letterSpacing:.5,textTransform:"uppercase"}}>Mensagem</div>
          <select onChange={e=>{const t=templates.find(x=>x.id===+e.target.value);if(t){applyTpl(t);e.target.value="";}}} style={{background:"#F7F9FC",border:"1.5px solid #DDE3EE",borderRadius:8,padding:"4px 9px",color:"var(--mu)",fontSize:11,outline:"none",fontFamily:"DM Sans"}}>
            <option value="">Usar modelo...</option>{templates.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
        <div style={{background:"#F5FDF7",border:"1.5px solid #BBF7D0",borderRadius:10,padding:12,marginBottom:10}}>
          <textarea value={msg} onChange={e=>setMsg(e.target.value)} rows={6} placeholder="Escreva ou use um modelo acima..." style={{width:"100%",background:"transparent",border:"none",outline:"none",color:"var(--tx)",fontSize:13,lineHeight:1.7,resize:"none",fontFamily:"DM Sans"}}/>
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
   PEDAGÓGICO
══════════════════════════════════════════════════ */
function PedagogicoPage({students,courses}){
  const[selSt,setSelSt]=useState(null);
  const[pedItems,setPedItems]=useState(()=>({}))
  const[newItem,setNewItem]=useState("");
  const[allItems,setAllItems]=useState(IPED);
  const[trackedCourses,setTrackedCourses]=useState(()=>courses.reduce((a,c)=>({...a,[c.id]:c.type==="Curso"||c.type==="Estágio"}),{}))
  const[stuCourseOvr,setStuCourseOvr]=useState({});
  const[selCourse,setSelCourse]=useState(null);
  function toggleItem(stId,item){setPedItems(p=>{const cur=p[stId]||{};return {...p,[stId]:{...cur,[item]:!cur[item]}};})}
  function pct(stId){const items=pedItems[stId]||{};const done=Object.values(items).filter(Boolean).length;return allItems.length?Math.round((done/allItems.length)*100):0;}
  const activeStudents=students.filter(s=>(s.courses||[]).some(cid=>{const ov=stuCourseOvr[s.id];return ov?ov[cid]:trackedCourses[cid];}));
  const displayStudents=selCourse?activeStudents.filter(s=>s.courses.includes(selCourse)):activeStudents;
  return <div style={{animation:"up .4s ease"}}>
    <div style={{marginBottom:16}}><h1 style={{fontFamily:"Playfair Display",fontSize:24,fontWeight:700}}>Painel Pedagógico</h1><p style={{color:"var(--mu)",fontSize:11,marginTop:2}}>Acompanhamento por aluno · estilo faculdade</p></div>
    <div style={{background:"#fff",borderRadius:14,padding:15,border:"1px solid var(--b)",marginBottom:13,boxShadow:"var(--shadow)"}}>
      <div style={{fontFamily:"Playfair Display",fontSize:14,fontWeight:600,marginBottom:9}}>Cursos com acompanhamento</div>
      <div style={{display:"flex",flexWrap:"wrap",gap:7}}>
        {courses.map(c=>{const on=!!trackedCourses[c.id];return <button key={c.id} onClick={()=>setTrackedCourses(t=>({...t,[c.id]:!t[c.id]}))} style={{display:"flex",alignItems:"center",gap:6,padding:"6px 11px",borderRadius:9,border:`1.5px solid ${on?"var(--bl)":"#DDE3EE"}`,background:on?"#EEF4FF":"#F7F9FC",cursor:"pointer",transition:"all .15s"}}>
          <div style={{width:14,height:14,borderRadius:3,border:`2px solid ${on?"var(--bl)":"#DDE3EE"}`,background:on?"var(--bl)":"transparent",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,color:"#fff",fontWeight:700}}>{on?"✓":""}</div>
          <span style={{fontSize:11,color:on?"var(--bl)":"var(--mu)",fontWeight:on?700:400}}>{c.name.split("–")[0].trim()}</span>
        </button>;})}
      </div>
    </div>
    <div style={{background:"#fff",borderRadius:14,padding:15,border:"1px solid var(--b)",marginBottom:13,boxShadow:"var(--shadow)"}}>
      <div style={{fontFamily:"Playfair Display",fontSize:14,fontWeight:600,marginBottom:9}}>Itens de Acompanhamento</div>
      <div style={{display:"flex",gap:8,marginBottom:10}}><input value={newItem} onChange={e=>setNewItem(e.target.value)} onKeyDown={e=>e.key==="Enter"&&newItem.trim()&&(setAllItems(a=>[...a,newItem.trim()]),setNewItem(""))} placeholder="+ Novo item..." style={{flex:1,background:"#F7F9FC",border:"1.5px solid #DDE3EE",borderRadius:9,padding:"7px 12px",color:"var(--tx)",fontSize:12,outline:"none",fontFamily:"DM Sans"}}/><Btn sz="sm" onClick={()=>{if(newItem.trim()){setAllItems(a=>[...a,newItem.trim()]);setNewItem("");}}}>+</Btn></div>
      <div style={{display:"flex",flexWrap:"wrap",gap:6}}>{allItems.map(it=><div key={it} style={{display:"flex",alignItems:"center",gap:5,background:"#EEF4FF",borderRadius:99,padding:"4px 10px",border:"1px solid #C7D7F5"}}><span style={{fontSize:11,color:"var(--bl)",fontWeight:600}}>{it}</span><button onClick={()=>setAllItems(a=>a.filter(x=>x!==it))} style={{background:"transparent",border:"none",color:"var(--mu2)",cursor:"pointer",fontSize:13,lineHeight:1}}>×</button></div>)}</div>
    </div>
    <div style={{display:"flex",gap:7,marginBottom:13,flexWrap:"wrap"}}>
      <button onClick={()=>setSelCourse(null)} style={{background:!selCourse?"#EEF4FF":"#fff",border:`1.5px solid ${!selCourse?"var(--bl)":"#DDE3EE"}`,color:!selCourse?"var(--bl)":"var(--mu)",borderRadius:99,padding:"5px 13px",fontSize:11,fontWeight:600,cursor:"pointer"}}>Todos</button>
      {courses.filter(c=>trackedCourses[c.id]).map(c=><button key={c.id} onClick={()=>setSelCourse(c.id)} style={{background:selCourse===c.id?"#EEF4FF":"#fff",border:`1.5px solid ${selCourse===c.id?"var(--bl)":"#DDE3EE"}`,color:selCourse===c.id?"var(--bl)":"var(--mu)",borderRadius:99,padding:"5px 13px",fontSize:11,fontWeight:600,cursor:"pointer"}}>{c.name.split("–")[0].trim()}</button>)}
    </div>
    <div style={{display:"flex",flexDirection:"column",gap:9}}>
      {displayStudents.map((s,i)=>{const ex=selSt===s.id;const p=pct(s.id);return <div key={s.id} style={{background:"#fff",borderRadius:14,border:`1.5px solid ${ex?"var(--bl)":"#E5EAF3"}`,overflow:"hidden",animation:`sr .3s ease ${i*.04}s both`,boxShadow:"var(--shadow)"}}>
        <div onClick={()=>setSelSt(x=>x===s.id?null:s.id)} style={{display:"flex",alignItems:"center",gap:11,padding:"12px 15px",cursor:"pointer"}}>
          <Av letter={s.name[0]} size={38} color="var(--pu)"/>
          <div style={{flex:1}}>
            <div style={{fontWeight:700,fontSize:13,color:"var(--tx)"}}>{s.name}</div>
            <div style={{fontSize:11,color:"var(--mu)",marginTop:2}}>{(s.courses||[]).filter(cid=>trackedCourses[cid]).map(cid=>courses.find(c=>c.id===cid)?.name.split("–")[0].trim()).filter(Boolean).join(" · ")||"Sem cursos rastreados"}</div>
            <div style={{background:"#F0F4FA",borderRadius:99,height:4,marginTop:5,overflow:"hidden"}}><div style={{width:`${p}%`,height:"100%",background:"linear-gradient(90deg,var(--pu),var(--bl))",borderRadius:99,transition:"width .8s ease"}}/></div>
          </div>
          <div style={{textAlign:"right"}}><div style={{fontFamily:"Playfair Display",fontSize:20,fontWeight:700,color:p>=80?"var(--gn)":p>=50?"var(--am)":"var(--rd)"}}>{p}%</div><div style={{fontSize:10,color:"var(--mu)"}}>{pedItems[s.id]?Object.values(pedItems[s.id]).filter(Boolean).length:0}/{allItems.length}</div></div>
          <span style={{color:"var(--mu)",fontSize:11,marginLeft:3}}>{ex?"▲":"▼"}</span>
        </div>
        {ex&&<div style={{borderTop:"1.5px solid #E5EAF3",padding:"13px 15px",background:"#F7F9FC"}}>
          <div style={{fontSize:10,color:"var(--bl)",fontWeight:600,letterSpacing:.5,marginBottom:8,textTransform:"uppercase"}}>Cursos — ativar acompanhamento</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:13}}>
            {(s.courses||[]).map(cid=>{const c=courses.find(x=>x.id===cid);if(!c)return null;const on=stuCourseOvr[s.id]?.[cid]!==undefined?stuCourseOvr[s.id][cid]:trackedCourses[cid];return <button key={cid} onClick={()=>setStuCourseOvr(p=>({...p,[s.id]:{...(p[s.id]||{}),[cid]:!on}}))} style={{display:"flex",alignItems:"center",gap:6,padding:"5px 10px",borderRadius:9,border:`1.5px solid ${on?"var(--pu)":"#DDE3EE"}`,background:on?"#F5F1FE":"#fff",cursor:"pointer",transition:"all .15s"}}>
              <div style={{width:14,height:14,borderRadius:3,border:`2px solid ${on?"var(--pu)":"#DDE3EE"}`,background:on?"var(--pu)":"transparent",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,color:"#fff",fontWeight:700}}>{on?"✓":""}</div>
              <span style={{fontSize:11,color:on?"var(--pu)":"var(--mu)",fontWeight:on?700:400}}>{c.name.split("–")[0].trim()}</span>
            </button>;})}
          </div>
          <div style={{fontSize:10,color:"var(--pu)",fontWeight:600,letterSpacing:.5,marginBottom:9,textTransform:"uppercase"}}>Checklist</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7}}>
            {allItems.map(item=>{const done=(pedItems[s.id]||{})[item]||false;return <div key={item} onClick={()=>toggleItem(s.id,item)} style={{display:"flex",alignItems:"center",gap:9,padding:"9px 12px",borderRadius:10,background:done?"#F0FDF4":"#F7F9FC",border:`1.5px solid ${done?"#BBF7D0":"#DDE3EE"}`,cursor:"pointer",transition:"all .15s"}}>
              <div style={{width:20,height:20,borderRadius:5,border:`2px solid ${done?"var(--gn)":"#DDE3EE"}`,background:done?"var(--gn)":"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:11,color:"#fff",fontWeight:700}}>{done?"✓":""}</div>
              <span style={{fontSize:12,fontWeight:done?600:400,color:done?"var(--gn)":"var(--mu)"}}>{item}</span>
            </div>;})}
          </div>
        </div>}
      </div>;})}
      {!displayStudents.length&&<div style={{textAlign:"center",padding:"28px 0",color:"var(--mu)",fontSize:12}}>Nenhum aluno com cursos rastreados</div>}
    </div>
  </div>;
}

/* ══════════════════════════════════════════════════
   PERMISSÕES
══════════════════════════════════════════════════ */
function PermissoesPage(){
  const[perms,setPerms]=useState(IPERMS_INIT);
  const[roleNames,setRoleNames]=useState(()=>ROLES.reduce((a,r)=>({...a,[r]:r}),{}));
  const[editRole,setEditRole]=useState(null);const[editRoleVal,setEditRoleVal]=useState("");
  const[linkedUsers,setLinkedUsers]=useState(()=>ROLES.reduce((a,r)=>({...a,[r]:[]}),{}));
  const[editUsers,setEditUsers]=useState(null);const[newUser,setNewUser]=useState("");
  const[selRole,setSelRole]=useState("Proprietária");
  function toggle(role,mod){setPerms(p=>({...p,[role]:{...p[role],[mod]:!p[role][mod]}}))}
  function setAll(role,val){setPerms(p=>({...p,[role]:MODULES.reduce((a,m)=>({...a,[m]:val}),{})}))}
  function saveRoleName(orig){if(!editRoleVal.trim())return;setRoleNames(r=>({...r,[orig]:editRoleVal.trim()}));setEditRole(null);}
  return <div style={{animation:"up .4s ease"}}>
    <div style={{marginBottom:16}}><h1 style={{fontFamily:"Playfair Display",fontSize:24,fontWeight:700}}>Permissões</h1><p style={{color:"var(--mu)",fontSize:11,marginTop:2}}>Controle de acesso por perfil</p></div>
    <div style={{display:"flex",gap:8,marginBottom:18,flexWrap:"wrap"}}>
      {ROLES.map(r=>{const ed=editRole===r;return <div key={r} style={{display:"flex",alignItems:"center",gap:5}}>
        {ed?<div style={{display:"flex",gap:6,alignItems:"center"}}>
          <input value={editRoleVal} onChange={e=>setEditRoleVal(e.target.value)} autoFocus style={{background:"#F7F9FC",border:"1.5px solid var(--bl)",borderRadius:8,padding:"7px 11px",color:"var(--tx)",fontSize:12,outline:"none",fontFamily:"DM Sans",width:130}} onKeyDown={e=>e.key==="Enter"&&saveRoleName(r)}/>
          <Btn sz="sm" onClick={()=>saveRoleName(r)}>✓</Btn><Btn sz="sm" v="ghost" onClick={()=>setEditRole(null)}>✕</Btn>
        </div>:<div style={{display:"flex",alignItems:"center",gap:4}}>
          <button onClick={()=>setSelRole(r)} style={{background:selRole===r?"#EEF4FF":"#fff",border:`1.5px solid ${selRole===r?"var(--bl)":"#DDE3EE"}`,color:selRole===r?"var(--bl)":"var(--mu)",borderRadius:9,padding:"8px 14px",fontSize:13,fontWeight:600,cursor:"pointer",boxShadow:"var(--shadow)"}}>{roleNames[r]}</button>
          <button onClick={()=>{setEditRole(r);setEditRoleVal(roleNames[r]);}} style={{background:"transparent",border:"none",color:"var(--mu2)",cursor:"pointer",fontSize:13,padding:"2px 4px"}} title="Renomear">✏️</button>
        </div>}
      </div>;})}
    </div>
    <div style={{background:"#fff",borderRadius:16,padding:20,border:"1px solid var(--b)",marginBottom:16,boxShadow:"var(--shadow)"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <div style={{fontFamily:"Playfair Display",fontSize:16,fontWeight:600}}>Permissões: {roleNames[selRole]||selRole}</div>
        {selRole!=="Proprietária"&&<div style={{display:"flex",gap:7}}><Btn sz="sm" v="green" onClick={()=>setAll(selRole,true)}>✓ Liberar tudo</Btn><Btn sz="sm" v="danger" onClick={()=>setAll(selRole,false)}>✕ Bloquear tudo</Btn></div>}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(190px,1fr))",gap:8}}>
        {MODULES.map(mod=>{const allowed=selRole==="Proprietária"?true:!!(perms[selRole]?.[mod]);const locked=selRole==="Proprietária";return <div key={mod} onClick={()=>!locked&&toggle(selRole,mod)} style={{display:"flex",alignItems:"center",gap:10,padding:"11px 14px",borderRadius:11,border:`1.5px solid ${allowed?"#C7D7F5":"#DDE3EE"}`,background:allowed?"#EEF4FF":"#F7F9FC",cursor:locked?"default":"pointer",transition:"all .15s"}}>
          <div style={{width:20,height:20,borderRadius:5,border:`2px solid ${allowed?"var(--bl)":"#DDE3EE"}`,background:allowed?"var(--bl)":"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:11,color:"#fff",fontWeight:700}}>{allowed?"✓":""}</div>
          <div><div style={{fontSize:12,fontWeight:600,color:allowed?"var(--tx)":"var(--mu)"}}>{mod}</div>{locked&&<div style={{fontSize:9,color:"var(--bl)"}}>Acesso total</div>}</div>
        </div>;})}
      </div>
    </div>
    <div style={{background:"#fff",borderRadius:16,padding:20,border:"1px solid var(--b)",marginBottom:16,boxShadow:"var(--shadow)"}}>
      <div style={{fontFamily:"Playfair Display",fontSize:15,fontWeight:600,marginBottom:4}}>Usuárias Vinculadas</div>
      <div style={{fontSize:11,color:"var(--mu)",marginBottom:14}}>Vincule cada perfil com a pessoa que terá acesso</div>
      <div style={{display:"flex",flexDirection:"column",gap:9}}>
        {ROLES.map(r=>{const users=linkedUsers[r]||[];const ed=editUsers===r;return <div key={r} style={{background:"#F7F9FC",borderRadius:12,padding:"12px 15px",border:"1px solid var(--b)"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:users.length>0||ed?9:0}}>
            <div style={{display:"flex",alignItems:"center",gap:9}}><Dot color={r==="Proprietária"?"var(--bl)":"var(--mu)"} size={8}/><span style={{fontWeight:700,fontSize:13,color:"var(--tx)"}}>{roleNames[r]||r}</span>{users.length>0&&<Chip color="var(--bl)" sm>{users.length}</Chip>}</div>
            {r!=="Proprietária"&&<Btn sz="sm" v="ghost" onClick={()=>setEditUsers(x=>x===r?null:r)}>{ed?"✕ Fechar":"+ Vincular"}</Btn>}
          </div>
          {users.length>0&&<div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:ed?8:0}}>{users.map((u,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:5,background:"#EEF4FF",borderRadius:99,padding:"3px 10px",border:"1px solid #C7D7F5"}}><span style={{fontSize:11,color:"var(--bl)",fontWeight:600}}>{u}</span><button onClick={()=>setLinkedUsers(p=>({...p,[r]:p[r].filter((_,j)=>j!==i)}))} style={{background:"transparent",border:"none",color:"var(--mu2)",cursor:"pointer",fontSize:13,lineHeight:1}}>×</button></div>)}</div>}
          {ed&&<div style={{display:"flex",gap:7}}>
            <input value={newUser} onChange={e=>setNewUser(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&newUser.trim()){setLinkedUsers(p=>({...p,[r]:[...(p[r]||[]),newUser.trim()]}));setNewUser("");}}} placeholder="Nome ou e-mail..." style={{flex:1,background:"#fff",border:"1.5px solid var(--bl)",borderRadius:9,padding:"7px 11px",color:"var(--tx)",fontSize:12,outline:"none",fontFamily:"DM Sans"}}/>
            <Btn sz="sm" onClick={()=>{if(newUser.trim()){setLinkedUsers(p=>({...p,[r]:[...(p[r]||[]),newUser.trim()]}));setNewUser("");}}}>+ Adicionar</Btn>
          </div>}
        </div>;})}
      </div>
    </div>
    <div style={{background:"#fff",borderRadius:16,padding:18,border:"1px solid var(--b)",boxShadow:"var(--shadow)"}}>
      <div style={{fontFamily:"Playfair Display",fontSize:15,fontWeight:600,marginBottom:13}}>Resumo de Permissões</div>
      <div className="tw">
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:11,minWidth:500}}>
          <thead><tr style={{borderBottom:"1px solid var(--b)"}}><th style={{padding:"8px 11px",textAlign:"left",color:"var(--mu)",fontWeight:600,fontSize:10,textTransform:"uppercase",letterSpacing:.4,whiteSpace:"nowrap"}}>Módulo</th>{ROLES.map(r=><th key={r} style={{padding:"8px 11px",textAlign:"center",color:"var(--mu)",fontSize:10,fontWeight:600,textTransform:"uppercase",letterSpacing:.4,whiteSpace:"nowrap"}}>{roleNames[r]||r}</th>)}</tr></thead>
          <tbody>{MODULES.map(mod=><tr key={mod} style={{borderBottom:"1px solid var(--b)"}}>
            <td style={{padding:"7px 11px",fontWeight:600,whiteSpace:"nowrap",color:"var(--tx)"}}>{mod}</td>
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
  {id:"perms",    icon:"🔐",lbl:"Permissões"},
];
const BOT=[{id:"dash",icon:"⬡",lbl:"Início"},{id:"crm",icon:"◈",lbl:"CRM"},{id:"cursos",icon:"❋",lbl:"Cursos"},{id:"fin",icon:"◆",lbl:"Financ."},{id:"__m__",icon:"☰",lbl:"Mais"}];

function SDDesk({active,setActive}){
  const[col,setCol]=useState(false);
  return <div className={`sd ${col?"c":"e"}`}>
    <div style={{display:"flex",alignItems:"center",justifyContent:col?"center":"space-between",marginBottom:26}}>
      {!col&&<div><div style={{fontFamily:"Playfair Display",fontSize:10,color:"var(--mu)",letterSpacing:2,textTransform:"uppercase"}}>Instituto de</div><div style={{fontFamily:"Playfair Display",fontSize:18,fontWeight:700,color:"var(--bl)"}}>Reflexologia</div><div style={{fontFamily:"Playfair Display",fontSize:11,color:"var(--mu)"}}>& Pesquisa</div><div style={{width:26,height:2,background:"var(--bl)",marginTop:7,borderRadius:99,animation:"ik .8s ease"}}/></div>}
      <button onClick={()=>setCol(c=>!c)} style={{background:"#F7F9FC",border:"1.5px solid #DDE3EE",borderRadius:7,width:26,height:26,color:"var(--mu)",cursor:"pointer",fontSize:13,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{col?"›":"‹"}</button>
    </div>
    <nav style={{display:"flex",flexDirection:"column",gap:1,flex:1}}>
      {NAV.map(n=><button key={n.id} onClick={()=>setActive(n.id)} title={col?n.lbl:""} style={{display:"flex",alignItems:"center",gap:col?0:9,padding:col?"9px 0":"9px 11px",justifyContent:col?"center":"flex-start",borderRadius:9,border:"none",cursor:"pointer",background:active===n.id?"#EEF4FF":"transparent",color:active===n.id?"var(--bl)":"var(--mu)",fontFamily:"DM Sans",fontSize:12,fontWeight:active===n.id?700:400,borderLeft:col?"none":`3px solid ${active===n.id?"var(--bl)":"transparent"}`,transition:"all .15s",textAlign:"left",width:"100%"}}>
        <span style={{fontSize:col?15:13,flexShrink:0}}>{n.icon}</span>{!col&&<span style={{whiteSpace:"nowrap",overflow:"hidden"}}>{n.lbl}</span>}
      </button>)}
    </nav>
    {!col&&<div style={{borderTop:"1px solid var(--b)",paddingTop:11,paddingLeft:5}}><div style={{fontSize:9,color:"var(--mu)",lineHeight:1.5}}>IOR · Gestão Pro<br/><span style={{color:"var(--bl)",fontWeight:600}}>v2025</span></div></div>}
  </div>;
}
function SDMob({active,setActive,open,onClose}){
  return <>
    <div className={`ov ${open?"op":""}`} onClick={onClose}/>
    <div className={`dr ${open?"op":""}`}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:22}}>
        <div><div style={{fontFamily:"Playfair Display",fontSize:10,color:"var(--mu)",letterSpacing:2,textTransform:"uppercase"}}>Instituto de</div><div style={{fontFamily:"Playfair Display",fontSize:19,fontWeight:700,color:"var(--bl)"}}>Reflexologia</div><div style={{fontFamily:"Playfair Display",fontSize:11,color:"var(--mu)"}}>& Pesquisa</div><div style={{width:22,height:2,background:"var(--bl)",marginTop:6,borderRadius:99}}/></div>
        <button onClick={onClose} style={{background:"#F7F9FC",border:"1.5px solid #DDE3EE",borderRadius:7,width:30,height:30,color:"var(--mu)",cursor:"pointer",fontSize:16,flexShrink:0}}>×</button>
      </div>
      <nav style={{display:"flex",flexDirection:"column",gap:1}}>
        {NAV.map(n=><button key={n.id} onClick={()=>{setActive(n.id);onClose();}} style={{display:"flex",alignItems:"center",gap:10,padding:"11px 12px",borderRadius:9,border:"none",cursor:"pointer",background:active===n.id?"#EEF4FF":"transparent",color:active===n.id?"var(--bl)":"var(--mu)",fontFamily:"DM Sans",fontSize:13,fontWeight:active===n.id?700:400,borderLeft:`3px solid ${active===n.id?"var(--bl)":"transparent"}`,textAlign:"left"}}>
          <span style={{fontSize:14}}>{n.icon}</span>{n.lbl}
        </button>)}
      </nav>
    </div>
  </>;
}
function BotNav({active,setActive,onMenu}){
  return <nav className="bn">
    {BOT.map(n=><button key={n.id} className={`bni ${active===n.id?"a":""}`} onClick={()=>n.id==="__m__"?onMenu():setActive(n.id)}>
      <span style={{fontSize:17}}>{n.icon}</span><span style={{fontSize:9,fontWeight:600,letterSpacing:.3}}>{n.lbl}</span>
    </button>)}
  </nav>;
}

/* ══════════════════════════════════════════════════
   ROOT — SINGLE SOURCE OF TRUTH
══════════════════════════════════════════════════ */
export default function IOR(){
  const[page,setPage]  = useState("dash");
  const[courses,setCourses]   = useState(SEED_COURSES);
  const[students,setStudents] = useState(SEED_STUDENTS);
  const[leads,setLeads]       = useState(SEED_LEADS);
  const[products,setProducts] = useState(SEED_PRODUCTS);
  const[sales,setSales]       = useState(SEED_SALES);
  const[checks,setChecks]     = useState(SEED_CHECKS);
  const[templates,setTemplates]=useState(SEED_TEMPLATES);
  const[drawer,setDrawer]     = useState(false);
  const curr=NAV.find(n=>n.id===page);

  const shared={courses,students,leads,sales,templates};

  const pages={
    dash:    <DashPage     leads={leads} students={students} courses={courses} sales={sales}/>,
    crm:     <CRMPage      leads={leads} setLeads={setLeads} courses={courses} students={students} setStudents={setStudents} sales={sales} setSales={setSales}/>,
    produtos:<ProductsPage products={products} setProducts={setProducts} sales={sales} setSales={setSales}/>,
    alunos:  <StudentsPage students={students} setStudents={setStudents} courses={courses} sales={sales} setSales={setSales} templates={templates}/>,
    cursos:  <CoursesPage  courses={courses} setCourses={setCourses} students={students} setStudents={setStudents}/>,
    fin:     <FinancialPage sales={sales} setSales={setSales} courses={courses} students={students}/>,
    check:   <ChecklistPage checks={checks} setChecks={setChecks}/>,
    wa:      <WhatsAppPage  leads={leads} students={students} courses={courses} templates={templates} setTemplates={setTemplates}/>,
    ped:     <PedagogicoPage students={students} courses={courses}/>,
    perms:   <PermissoesPage/>,
  };

  return <>
    <GS/>
    <div style={{display:"flex",height:"100vh",overflow:"hidden",background:"var(--bg)"}}>
      <SDDesk active={page} setActive={setPage}/>
      <SDMob  active={page} setActive={setPage} open={drawer} onClose={()=>setDrawer(false)}/>
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
      <BotNav active={page} setActive={setPage} onMenu={()=>setDrawer(true)}/>
    </div>
  </>;
}
