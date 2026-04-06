Execute o checklist de validação pré-deploy do projeto Ebbing. Siga cada passo em ordem e reporte o resultado.

## 1. TypeScript — Frontend

Execute no terminal:
```bash
cd frontend && npx tsc -b --noEmit
```

- Se houver erros: liste cada um com arquivo e linha. **PARE aqui** — build vai falhar.
- Se passar: confirme "TypeScript OK".

## 2. Build Vite — Frontend

Execute:
```bash
cd frontend && npm run build
```

- Confirme que `frontend/dist/` foi gerado
- Reporte warnings de chunk size (>500KB)
- Se falhar: mostre o erro completo

## 3. Variáveis de ambiente — Frontend

Leia `frontend/src/services/api.ts` e todos os arquivos em `frontend/src/` que contenham `import.meta.env.VITE_`.

- Liste todas as variáveis `VITE_*` usadas no código
- Compare com o que está em `frontend/.env` (se existir)
- Alerte sobre qualquer `VITE_*` usada no código mas não documentada no CLAUDE.md ou sem correspondência no `.env`

## 4. Migrations pendentes — Backend

Execute:
```bash
ls backend/src/main/resources/db/migration/
```

Depois leia os arquivos em `backend/src/main/java/com/ebbin/api/model/` e compare com o último `git diff HEAD~5 -- backend/src/main/java/com/ebbin/api/model/`.

- Alerte se houve mudança em algum model sem migration correspondente

## 5. Testes backend

Execute:
```bash
cd backend && ./gradlew test 2>&1 | tail -20
```

- Confirme que todos os testes passaram
- Se falhar: mostre quais testes falharam

## 6. Resumo Final

Ao final, mostre um resumo com:

```
✅ TypeScript: OK
✅ Build Vite: OK
⚠️  Env vars: VITE_NOVA_VAR usada mas não documentada
✅ Migrations: nenhuma pendente
✅ Testes backend: 47/47 passaram

Red flags: [lista ou "nenhum"]
```

Só recomende o push se não houver red flags bloqueantes (erros de TypeScript, build falhando, testes falhando).
