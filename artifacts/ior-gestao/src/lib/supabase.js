import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL || 'https://odegosowuketirxdgllb.supabase.co',
  import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_FoDiSdk9ynZ1yRDpJ1KDwg_B1c2S9E2'
);

/* ══════════════════════════════════════════════════
   Mapeamento DB (snake_case) ↔ Frontend (camelCase)
══════════════════════════════════════════════════ */
export const fromDB = {
  course:  c => c && ({ ...c, end: c.end_date, desc: c.description, checklistDeadlines: c.checklist_deadlines || {} }),
  student: s => s && ({ ...s, pType: s.p_type, pMethod: s.p_method, totalValue: s.total_value,
    installments: s.installments, instValue: s.inst_value, payDay: s.pay_day,
    startMonth: s.start_month, paidMonths: s.paid_months || [], enrollmentDates: s.enrollment_dates || {}, pedDocs: s.ped_docs || {} }),
  lead:    l => l && ({ ...l, courseId: l.course_id, lossReason: l.loss_reason }),
  product: p => p && p,
  sale:    s => s && ({ ...s, studentId: s.student_id, desc: s.description }),
  check:   c => c && ({ ...c, createdAt: c.created_at }),
  template:t => t && t,
  metric:  m => m && ({ ...m, totalViews: m.total_views, newFollowers: m.new_followers,
    totalFollowers: m.total_followers, interactions: m.interactions }),
};

export const toDB = {
  course:  c => ({ name: c.name, type: c.type, date: c.date, end_date: c.end,
    modality: c.modality, value: +c.value||0, capacity: +c.capacity||12,
    enrolled: c.enrolled||[], waitlist: c.waitlist||[], instructor: c.instructor||'',
    description: c.desc||'', checklist: c.checklist||[], checklist_deadlines: c.checklistDeadlines||{} }),
  student: s => ({ name: s.name, email: s.email||'', phone: s.phone||'', cpf: s.cpf||'',
    city: s.city||'', since: s.since||'', courses: s.courses||[], contract: !!s.contract,
    p_type: s.pType||'avista', p_method: s.pMethod||'PIX', total_value: +s.totalValue||0,
    installments: +s.installments||0, inst_value: +s.instValue||0, pay_day: s.payDay||null,
    start_month: s.startMonth||'', paid_months: s.paidMonths||[], paid: !!s.paid,
    certificate: s.certificate||[], interests: s.interests||[], notes: s.notes||'',
    enrollment_dates: s.enrollmentDates||{}, ped_docs: s.pedDocs||{} }),
  lead:    l => ({ name: l.name, phone: l.phone||'', email: l.email||'',
    course_id: l.courseId||null, stage: l.stage, source: l.source||'',
    payment: l.payment||'', loss_reason: l.lossReason||'', value: +l.value||0,
    type: l.type||'Curso', notes: l.notes||'', date: l.date }),
  product: p => ({ product: p.product, client: p.client||'', qty: +p.qty||1,
    value: +p.value||0, notes: p.notes||'', stage: p.stage, date: p.date, documents: p.documents||[] }),
  sale:    s => ({ date: s.date, student_id: s.studentId||null, description: s.desc,
    value: +s.value||0, payment: s.payment||'PIX', type: s.type||'Curso', notes: s.notes||'' }),
  check:   c => ({ text: c.text, done: !!c.done, priority: c.priority||'Média',
    due: c.due||'', assignee: c.assignee||'' }),
  template:t => ({ name: t.name, text: t.text }),
  metric:  m => ({ month: m.month, total_views: +m.totalViews||0, new_followers: +m.newFollowers||0,
    total_followers: +m.totalFollowers||0, interactions: +m.interactions||0,
    reach: +m.reach||0, impressions: +m.impressions||0 }),
};

/* ══════════════════════════════════════════════════
   CRUD genérico com tratamento de erro
══════════════════════════════════════════════════ */
async function sbInsert(table, data, mapFrom) {
  const { data: row, error } = await supabase.from(table).insert(data).select().single();
  if (error) { console.error(`Insert ${table}:`, error); return null; }
  return mapFrom ? mapFrom(row) : row;
}

async function sbUpdate(table, id, data) {
  const { error } = await supabase.from(table).update(data).eq('id', id);
  if (error) console.error(`Update ${table} ${id}:`, error);
  return !error;
}

async function sbDelete(table, id) {
  const { error } = await supabase.from(table).delete().eq('id', id);
  if (error) console.error(`Delete ${table} ${id}:`, error);
  return !error;
}

/* ══════════════════════════════════════════════════
   API do banco — usada no IOR.jsx
══════════════════════════════════════════════════ */
export const db = {
  courses: {
    list:   ()    => supabase.from('courses').select('*').order('date').then(r => (r.data||[]).map(fromDB.course)),
    insert: data  => sbInsert('courses', toDB.course(data), fromDB.course),
    update: (id,d)=> sbUpdate('courses', id, toDB.course(d)),
    delete: id    => sbDelete('courses', id),
  },
  students: {
    list:   ()    => supabase.from('students').select('*').order('name').then(r => (r.data||[]).map(fromDB.student)),
    insert: data  => sbInsert('students', toDB.student(data), fromDB.student),
    update: (id,d)=> sbUpdate('students', id, toDB.student(d)),
    delete: id    => sbDelete('students', id),
  },
  leads: {
    list:   ()    => supabase.from('leads').select('*').order('created_at', {ascending:false}).then(r => (r.data||[]).map(fromDB.lead)),
    insert: data  => sbInsert('leads', toDB.lead(data), fromDB.lead),
    update: (id,d)=> sbUpdate('leads', id, toDB.lead(d)),
    delete: id    => sbDelete('leads', id),
  },
  products: {
    list:   ()    => supabase.from('products').select('*').order('created_at', {ascending:false}).then(r => (r.data||[]).map(fromDB.product)),
    insert: data  => sbInsert('products', toDB.product(data), fromDB.product),
    update: (id,d)=> sbUpdate('products', id, toDB.product(d)),
    delete: id    => sbDelete('products', id),
  },
  sales: {
    list:   ()    => supabase.from('sales').select('*').order('date').then(r => (r.data||[]).map(fromDB.sale)),
    insert: data  => sbInsert('sales', toDB.sale(data), fromDB.sale),
    update: (id,d)=> sbUpdate('sales', id, toDB.sale(d)),
    delete: id    => sbDelete('sales', id),
  },
  checks: {
    list:   ()    => supabase.from('checks').select('*').order('created_at').then(r => (r.data||[]).map(fromDB.check)),
    insert: data  => sbInsert('checks', toDB.check(data), fromDB.check),
    update: (id,d)=> sbUpdate('checks', id, toDB.check(d)),
    delete: id    => sbDelete('checks', id),
  },
  templates: {
    list:   ()    => supabase.from('templates').select('*').order('name').then(r => (r.data||[]).map(fromDB.template)),
    insert: data  => sbInsert('templates', toDB.template(data), fromDB.template),
    update: (id,d)=> sbUpdate('templates', id, toDB.template(d)),
    delete: id    => sbDelete('templates', id),
  },
  metrics: {
    list:   ()    => supabase.from('social_metrics').select('*').order('month').then(r => (r.data||[]).map(fromDB.metric)),
    insert: data  => sbInsert('social_metrics', toDB.metric(data), fromDB.metric),
    update: (id,d)=> sbUpdate('social_metrics', id, toDB.metric(d)),
    delete: id    => sbDelete('social_metrics', id),
  },
};
