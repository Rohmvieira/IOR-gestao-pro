#!/bin/bash
echo "🔍 Verificando build antes do push..."
cd "$(git rev-parse --show-toplevel)"
CI=true pnpm --filter @workspace/ior-gestao run build 2>&1

if [ $? -eq 0 ]; then
  echo "✅ Build OK — push liberado"
  exit 0
else
  echo "❌ Build FALHOU — push bloqueado"
  echo "Corrija os erros antes de fazer push"
  exit 1
fi
