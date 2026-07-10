Crie uma nova migration Flyway para o projeto Ebbing.

O argumento fornecido pelo usuário descreve o que a migration deve fazer: $ARGUMENTS

## Passo 1 — Identificar o próximo número de versão

Liste os arquivos existentes:

```bash
ls backend/src/main/resources/db/migration/
```

As migrations seguem o padrão `V{n}__descricao.sql`. Identifique o maior `n` existente e use `n+1`.

## Passo 2 — Definir o nome do arquivo

Converta a descrição do usuário para snake_case. Exemplos (usando `V{n}` como o próximo número livre identificado no Passo 1):

- "criar tabela de notificações" → `V{n}__criar_tabela_de_notificacoes.sql`
- "adicionar coluna created_at em subjects" → `V{n}__adicionar_coluna_created_at_em_subjects.sql`
- "criar índice em review_events" → `V{n}__criar_indice_em_review_events.sql`

## Passo 3 — Analisar se SQL é necessário

Antes de criar a migration, leia os arquivos relevantes em `backend/src/main/java/com/ebbin/api/model/` para entender o modelo atual e garantir que o SQL está correto.

## Passo 4 — Criar o arquivo de migration

Crie o arquivo em `backend/src/main/resources/db/migration/` com o SQL apropriado.

**Boas práticas obrigatórias:**

- Use `IF NOT EXISTS` em `CREATE TABLE` e `CREATE INDEX`
- Use `IF EXISTS` em `DROP TABLE` e `DROP INDEX`
- Para colunas novas em tabelas existentes: adicione `DEFAULT` se a coluna for `NOT NULL`
- Nunca use `DROP TABLE` ou `DELETE FROM` sem `WHERE` explícito — alerte o usuário se a operação não for reversível

## Passo 5 — Alertas

Após criar o arquivo, informe:

- O nome exato do arquivo criado
- Se a migration é **reversível** (pode ser desfeita sem perda de dados) ou **irreversível**
- Se há dependências (ex: foreign keys, índices que afetam queries existentes)
- Lembre que Flyway só executa em produção (profile `prod`) — em desenvolvimento o schema é gerenciado pelo `spring.jpa.hibernate.ddl-auto`
