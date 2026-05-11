#!/bin/bash
# ══════════════════════════════════════════════════
# IOR Gestão Pro — Script de Auditoria de Segurança
# Execute: chmod +x scripts/security-audit.sh && ./scripts/security-audit.sh
# ══════════════════════════════════════════════════
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
PASS=0; FAIL=0; WARN=0

check() { local label=$1 result=$2 severity=${3:-FAIL}
  if [ "$result" = "ok" ]; then echo -e "${GREEN}✓ PASS${NC} $label"; ((PASS++))
  elif [ "$severity" = "WARN" ]; then echo -e "${YELLOW}⚠ WARN${NC} $label"; ((WARN++))
  else echo -e "${RED}✗ FAIL${NC} $label"; ((FAIL++)); fi
}

echo -e "\n${BLUE}══ IOR Gestão Pro — Auditoria de Segurança ══${NC}\n"

# 1. Variáveis de ambiente
echo -e "${BLUE}[1/6] Variáveis de Ambiente${NC}"
[ -f ".env" ] && check ".env existe localmente (não commitado)" ok || check ".env não encontrado — crie a partir de .env.example" FAIL
grep -q "^\.env$" .gitignore 2>/dev/null && check ".env está no .gitignore" ok || check ".env NÃO está no .gitignore — CRÍTICO!" FAIL
[ -n "$ENCRYPTION_KEY" ] && [ ${#ENCRYPTION_KEY} -eq 64 ] && check "ENCRYPTION_KEY definida com 64 chars" ok || check "ENCRYPTION_KEY não definida ou inválida" WARN

# 2. Secrets hardcodados no código
echo -e "\n${BLUE}[2/6] Secrets Hardcodados${NC}"
HARDCODED=$(grep -r --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" \
  -E "(password|secret|api_key|apikey)\s*=\s*['\"][^'\"]{8,}" . \
  --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=.git 2>/dev/null | grep -v ".env\|example\|test\|spec" | wc -l)
[ "$HARDCODED" -eq 0 ] && check "Sem secrets hardcodados no código" ok || check "$HARDCODED ocorrências suspeitas encontradas" FAIL

# 3. Dependências vulneráveis
echo -e "\n${BLUE}[3/6] Dependências${NC}"
if command -v pnpm &>/dev/null; then
  AUDIT_RESULT=$(pnpm audit --audit-level=high 2>&1)
  echo "$AUDIT_RESULT" | grep -q "found 0" && check "Sem vulnerabilidades críticas em dependências" ok || check "Vulnerabilidades encontradas — execute: pnpm audit --fix" WARN
else
  check "pnpm não encontrado — não foi possível auditar dependências" WARN
fi

# 4. Configuração do app.ts
echo -e "\n${BLUE}[4/6] Configuração Express${NC}"
grep -q "ALLOWED_ORIGINS" artifacts/api-server/src/app.ts 2>/dev/null && check "CORS restrito por variável de ambiente" ok || check "CORS não está restrito" FAIL
grep -q "rateLimit" artifacts/api-server/src/app.ts 2>/dev/null && check "Rate limiting configurado" ok || check "Rate limiting ausente" FAIL
grep -q "X-Frame-Options" artifacts/api-server/src/app.ts 2>/dev/null && check "Headers de segurança configurados" ok || check "Headers de segurança ausentes" FAIL
grep -q 'limit.*kb\|limit.*mb' artifacts/api-server/src/app.ts 2>/dev/null && check "Body size limitado" ok || check "Body size sem limite" WARN

# 5. Docker
echo -e "\n${BLUE}[5/6] Containers${NC}"
[ -f "docker/Dockerfile.api" ] && check "Dockerfile da API encontrado" ok || check "Dockerfile da API ausente" WARN
grep -q "adduser\|USER" docker/Dockerfile.api 2>/dev/null && check "API roda como usuário não-root" ok || check "API pode estar rodando como root" FAIL
[ -f "docker-compose.yml" ] && check "docker-compose.yml encontrado" ok || check "docker-compose ausente" WARN

# 6. Criptografia
echo -e "\n${BLUE}[6/6] Criptografia LGPD${NC}"
[ -f "lib/crypto/src/index.ts" ] && check "Módulo de criptografia AES-256-GCM presente" ok || check "Criptografia de dados sensíveis ausente" WARN
grep -q "encrypt\|SENSITIVE_FIELDS" artifacts/api-server/src/routes/crud-factory.ts 2>/dev/null && check "Criptografia aplicada nas rotas" ok || check "Criptografia não aplicada nas rotas ainda" WARN

# Resumo
echo -e "\n${BLUE}══ Resumo ══${NC}"
echo -e "${GREEN}Aprovado: $PASS${NC} | ${YELLOW}Avisos: $WARN${NC} | ${RED}Falhas: $FAIL${NC}"
[ $FAIL -eq 0 ] && echo -e "${GREEN}✓ Sistema seguro para deploy!${NC}" || echo -e "${RED}✗ Corrija as $FAIL falha(s) antes do deploy em produção.${NC}"
