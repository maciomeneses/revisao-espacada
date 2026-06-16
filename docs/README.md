# Documentação — Ebbing

Toda a documentação do projeto vive aqui, em markdown. Esta pasta é a **fonte de verdade**; os adaptadores de IA na raiz e em `.claude/`, `.cursor/`, `.codex/`, `.github/` apenas apontam para cá.

## Por onde começar

| Sua tarefa                           | Leia                                                          |
| ------------------------------------ | ------------------------------------------------------------- |
| Entender o projeto                   | `analysis_results.md` (documento mestre)                      |
| Começar uma sessão de código         | `agent-playbook.md`                                           |
| Editar backend                       | `conventions/backend-java.md` + `database.md` + `security.md` |
| Editar frontend                      | `conventions/frontend-react.md` + `fsrs.md`                   |
| Escrever testes                      | `conventions/testing.md`                                      |
| Commit / PR                          | `conventions/gitflow.md`                                      |
| Entender o harness de IA             | `ai-harness.md`                                               |
| Decisões já tomadas                  | `adr/`                                                        |
| Operar (deploy, migration, rollback) | `runbooks/`                                                   |

## Convenções (fonte única das regras técnicas)

`backend-java.md` · `frontend-react.md` · `database.md` · `security.md` · `testing.md` · `fsrs.md` · `gitflow.md`

## Roteiro de manutenção

Toda mudança de feature dispara o roteiro obrigatório em `../AGENTS.md` — docs, adaptadores, ADR e migration/testes na **mesma PR**. O checklist está em `../.github/pull_request_template.md`.
