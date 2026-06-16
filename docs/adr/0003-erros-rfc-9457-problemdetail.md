# 0003 — Erros de API via RFC 9457 ProblemDetail

- Status: aceito
- Data: 2026-06-16

## Contexto

Frontend e backend são desacoplados e precisam de um contrato de erro estável.

## Decisão

O backend retorna **ProblemDetail** (RFC 9457). A mensagem fica no campo **`detail`** (não `message`). O frontend lê `body.detail ?? body.message`.

## Consequências

- Contrato consistente; o campo `detail` é a fonte da mensagem de erro.
- Qualquer handler novo deve usar `ProblemDetail` com `detail`. Mudar isso quebra o tratamento de erro do frontend.
