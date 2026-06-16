# Ebbing — Plataforma de Revisão Espaçada para o ENEM

Aplicação web para estudantes do ENEM organizarem seus estudos com **revisões agendadas pelo algoritmo FSRS v6**. Cada assunto evolui automaticamente entre os estágios `aula → Learning → Review → Relearning` conforme o desempenho real do aluno, e o agendamento respeita tanto a **rotina semanal** quanto os **dias permitidos** configurados por usuário — duas restrições compostas em `snapReviewDate(...)`.

## Visão geral

- **FSRS v6** com parâmetros ajustados para crescimento mais rápido de estabilidade (`frontend/src/services/algorithm.ts`).
- **Rotina semanal** persistida no backend por usuário (`/api/routine`), com cache otimista por `userEmail` no frontend.
- **Dias permitidos** (`allowed_review_days`) como restrição forte: revisão só agendada em dias selecionados pelo aluno (`/api/preferences`).
- **Multi-perfil**: usuário comum vê dashboard + cronograma + espião estratégico; admin tem painel próprio para gestão de usuários.

## Stack

- **Frontend**: React 19 + TypeScript + Vite 7 + Tailwind CSS 4 + React Router 7 + Recharts 3 + Vitest. Deploy via **GitHub Pages**.
- **Backend**: Spring Boot 4.0.3 + Java 25 + PostgreSQL + Flyway + JWT (JJWT 0.12.6) + Bucket4j (rate limiting) + Caffeine (cache) + JaCoCo. Deploy via **Railway**.

## Como rodar

Instalar dependências do frontend:

```bash
cd frontend && npm install
```

A partir da raiz do monorepo:

```bash
npm run dev              # Vite dev server (porta 5173)
npm run test             # Vitest single run
npm run backend:run      # Spring Boot na porta 8080
npm run backend:test     # ./gradlew test
```

Antes de commitar (na raiz):

```bash
npm install              # husky + commitlint + prettier (uma vez)
npm run format:check     # Prettier
npm run lint             # ESLint do frontend
```

Para rodar o **conjunto completo de validações localmente, equivalente ao CI** do GitHub Actions (útil quando os minutos do Actions estão esgotados):

```bash
npm run ci               # backend (./gradlew build) + frontend (npm ci + test:coverage)
npm run ci backend       # só o job de backend
npm run ci frontend      # só o job de frontend
```

Para o conjunto completo de comandos, variáveis de ambiente e particularidades de deploy, consulte [`CLAUDE.md`](./CLAUDE.md).

## Documentação e harness de IA

Toda a documentação vive em [`docs/`](./docs/) e é a **fonte de verdade**:

- [`AGENTS.md`](./AGENTS.md) — contrato canônico para qualquer ferramenta de IA + roteiro de manutenção.
- [`docs/README.md`](./docs/README.md) — índice (guia de leitura por tarefa).
- [`docs/analysis_results.md`](./docs/analysis_results.md) — documento mestre.
- [`docs/conventions/`](./docs/conventions/) — regras técnicas (fonte única).
- [`docs/adr/`](./docs/adr/) — decisões arquiteturais · [`docs/runbooks/`](./docs/runbooks/) — operação.
- [`docs/ai-harness.md`](./docs/ai-harness.md) — padrão "canônico + adaptadores" (Claude, Codex, Cursor, Gemini, Copilot).

## Estrutura do monorepo

- `frontend/` — app React (Vite + TypeScript). Testes em `frontend/tests/` (não co-localizados).
- `backend/` — API Spring Boot (Gradle, Java 25 local / Java 21 no CI).
- `.github/workflows/` — CI do backend e deploy do frontend para GitHub Pages.
- `.claude/agents/` — agentes especializados de revisão (backend, frontend, testes, FSRS, deploy).
- `CLAUDE.md` — guia operacional detalhado (arquitetura, contratos de API, regras).

## Contribuição

- **Conventional Commits**: `feat:`, `fix:`, `test:`, `chore:`, `refactor:`, `docs:`.
- **Cobertura mínima por arquivo/classe**: **90% instruction, 85% branch, 90% line** — JaCoCo no backend (regra agregada e per-class) e Vitest no frontend (`perFile: true`). `npm run test:coverage` no frontend e `./gradlew build` no backend falham se algum arquivo/classe ficar abaixo.
- **Migrations Flyway** nunca modificam o passado — próxima é `V13__...`. Mudança em `backend/src/main/java/com/ebbin/api/model/` exige nova migration.
- **Erros de API** seguem RFC 9457 ProblemDetail (campo `detail`, não `message`).
- **Frontend** usa `clientId` (gerado no cliente) para subjects; o `id` (PK do banco) não é exposto.
