# Documento Mestre — Ebbing (Revisão Espaçada)

Visão consolidada do produto e da arquitetura. Atualizar a cada feature (passo 1 do Roteiro de manutenção em `AGENTS.md`).

## 1. Produto

Plataforma de **revisão espaçada** para estudantes do ENEM, baseada no algoritmo **FSRS v6**. O aluno cadastra matérias (subjects), assiste aulas, faz fixação e revisões; o sistema agenda a próxima revisão respeitando a **rotina semanal** e os **dias permitidos** do usuário. Há perfil de usuário comum e de administrador.

## 2. Arquitetura

Monorepo com dois apps independentes (sem código compartilhado):

| App         | Stack                                                                                         | Deploy                    |
| ----------- | --------------------------------------------------------------------------------------------- | ------------------------- |
| `frontend/` | React 19, TypeScript 5.5, Vite 7, Tailwind 4, React Router 7, Recharts 3, Vitest 4            | GitHub Pages (`gh-pages`) |
| `backend/`  | Spring Boot 4.0.3, Java 25, PostgreSQL, Flyway, JWT (JJWT), Bucket4j, Caffeine, JaCoCo, OWASP | Railway                   |

Detalhes em `docs/conventions/backend-java.md` e `frontend-react.md`.

## 3. Modelo de dados

- **Subject** — PK `Long id`; chave de sync `clientId` (frontend). Campos FSRS (`stability`, `difficulty`, `reps`, `lapses`, `state`, `currentStage`, `nextReviewDate`, etc.), `relevancia`, flags (`aulaAssistida`, `preAulaFeita`, `flashcardsFeitos`).
- **ReviewStage** (enum): `aula`, `Learning`, `Review`, `Relearning`, `New`.
- **PerformanceLevel** (enum): `nao_classificada`, `ruim`, `medio`, `bom`, `excelente`.
- **ReviewEvent** — histórico de revisões (acurácia/performance).
- **User** (+ `email_verified`, V14) + **PasswordResetToken** + **EmailVerificationToken** — auth e auto-cadastro.
- **RoutineSlot** (`routine_slot`) — rotina semanal por usuário (`day` 0..6, `slot_type` study/other, `area`/`label`).
- **UserPreferences** (`user_preferences`) — `allowed_review_days SMALLINT[]` (dias 0..6, não vazio).

## 4. Algoritmo FSRS

Ver `docs/conventions/fsrs.md` (parâmetros congelados, mapeamento de rating, datas locais, `snapReviewDate`). Decisão em ADR-0002.

## 5. Contratos de API

- Erros: RFC 9457 ProblemDetail (campo `detail`). ADR-0003.
- `GET/PUT /api/routine` → `RoutineSlot[]` do usuário autenticado (PUT substitui a semana; valida `day` 0..6, `slot_type` ∈ {study, other}).
- `GET/PUT /api/preferences` → `{ allowedReviewDays: number[] }` (cada dia 0..6, array não vazio).
- Subjects/auth/reviewEvents/admin: ver `frontend-react.md` (API client).
- Frontend conhece apenas `clientId`; `id` (PK) não é exposto. ADR-0007.

## 6. Decisões arquiteturais (ADRs)

Ver `docs/adr/`. Principais: monorepo desacoplado (0001), FSRS congelado (0002), RFC 9457 (0003), deploy GH Pages + Railway (0004), cobertura agressiva (0005), Tailwind 4 sem config (0006), clientId vs PK (0007).

## 7. Roadmap (alto nível)

- [x] Auth + perfis (USER/ADMIN), reset de senha.
- [x] FSRS v6, fixação, revisões, reagendamento.
- [x] Rotina semanal (`routine_slot`) + dias permitidos (`user_preferences`).
- [x] Rate limit, cache, OWASP scan, cobertura agressiva.
- [x] Auto-cadastro público com verificação de e-mail (issue #59; kill switch `SIGNUP_ENABLED`).
- [ ] Próximas features: backlog completo no Kanban board (issues #47–#60); registrar aqui ao iniciar cada uma.

## 8. Perguntas em aberto

- Ativar dificuldade dinâmica no FSRS (`w[17] != 0`)? Hoje congelada por decisão (ADR-0002).
- Fallback de SPA routing no GitHub Pages (404.html) — validar necessidade.

## 9. Operação

Runbooks em `docs/runbooks/`: desenvolvimento local, deploy frontend/backend, nova migration, rollback.

**Validação local equivalente ao CI:** `npm run ci` (raiz) roda `scripts/ci-local.sh`, que espelha os dois jobs do GitHub Actions — backend (`./gradlew build --no-daemon`) e frontend (`npm ci && npm run test:coverage`), com os mesmos thresholds de cobertura. Útil quando os minutos do GitHub Actions estão esgotados. Aceita alvo (`backend`/`frontend`) e `FAST=1` para `npm install` em vez de `npm ci`.
