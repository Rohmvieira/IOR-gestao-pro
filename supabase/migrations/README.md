# Migrations IOR Gestão Pro

As migrations foram aplicadas diretamente via Supabase MCP.
Para recriar em um novo projeto:

```bash
supabase db push
```

Tabelas criadas:
- courses (cursos e workshops)
- students (alunos — CPF/email/phone criptografados)
- leads (CRM de leads)
- products (CRM de produtos)
- sales (financeiro)
- checks (checklist/tarefas)
- templates (modelos WhatsApp)
- social_metrics (métricas de redes sociais)
- audit_logs (auditoria LGPD — 90 dias retenção)
- api_logs (logs de API — 30 dias retenção)

Views:
- vw_system_health (dashboard de saúde do sistema)
- vw_overdue_students (alunos inadimplentes)
