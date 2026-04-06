Revise as mudanças atuais no projeto Ebbing, roteando para o revisor especializado correto.

## Passo 1 — Identificar o escopo das mudanças

Execute:
```bash
git diff --stat HEAD
git diff --stat --cached
```

Se não houver diff (nada staged/unstaged), tente:
```bash
git diff --stat HEAD~1
```

## Passo 2 — Rotear para o agente correto

Com base nos arquivos alterados:

**Se mudanças em `frontend/`:** use o agente `revisor-frontend` para revisar cada arquivo alterado.

**Se mudanças em `backend/`:** use o agente `revisor-backend` para revisar cada arquivo alterado.

**Se mudanças em ambos:** execute o `revisor-frontend` primeiro (frontend tem mais riscos de regressão silenciosa), depois o `revisor-backend`.

**Se mudanças em `frontend/src/services/algorithm.ts`:** além do revisor-frontend, acione também o agente `especialista-fsrs` para validar o impacto no algoritmo de agendamento.

## Passo 3 — Apresentar resultado consolidado

Organize o resultado da revisão em seções:

```
### Frontend
[findings do revisor-frontend, ou "nenhuma mudança"]

### Backend
[findings do revisor-backend, ou "nenhuma mudança"]

### FSRS (se aplicável)
[findings do especialista-fsrs]

### Resumo
- Bloqueantes: [lista de problemas que devem ser resolvidos antes do commit]
- Avisos: [lista de pontos de atenção não bloqueantes]
- Aprovado: [sim/não]
```
