Gere um arquivo de teste completo para o arquivo informado pelo usuário.

Arquivo alvo: $ARGUMENTS

## Passo 1 — Ler o arquivo alvo

Leia o arquivo especificado e identifique:
- Se é frontend (`.ts`, `.tsx`) ou backend (`.java`)
- Todas as funções/métodos públicos exportados
- Dependências externas (imports) que precisarão de mock
- Casos de borda e branches condicionais

## Passo 2 — Frontend (Vitest + Testing Library)

Se for arquivo frontend, crie o arquivo de teste em `{mesmo-diretorio}/{nome-arquivo}.test.ts` (ou `.test.tsx`).

**Boilerplate obrigatório:**

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
// Adicionar imports de Testing Library se for componente React:
// import { render, screen, fireEvent, waitFor } from '@testing-library/react'
// import userEvent from '@testing-library/user-event'
// import '@testing-library/jest-dom'
```

**Mock da API (sempre incluir se o arquivo usa `api`):**
```typescript
vi.mock('../services/api', () => ({
  api: {
    auth: {
      login: vi.fn(),
      forgotPassword: vi.fn(),
      resetPassword: vi.fn(),
    },
    subjects: {
      list: vi.fn().mockResolvedValue([]),
      sync: vi.fn().mockResolvedValue([]),
      upsert: vi.fn().mockResolvedValue({}),
      delete: vi.fn().mockResolvedValue(undefined),
    },
    reviewEvents: {
      list: vi.fn().mockResolvedValue([]),
      create: vi.fn().mockResolvedValue({ id: 1 }),
    },
    admin: { users: { list: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() } },
  },
}))
```

**Mock do localStorage (sempre incluir):**
```typescript
beforeEach(() => {
  localStorage.clear()
  vi.clearAllMocks()
  // Simular usuário logado se necessário:
  // localStorage.setItem('ebbing_session', JSON.stringify({
  //   email: 'test@test.com', token: 'fake-token', role: 'USER', timestamp: Date.now(),
  // }))
})
```

**Subject mock padrão:**
```typescript
const mockSubject = {
  id: 'test-id-001',
  modulo: 'Matemática',
  area: 'Álgebra',
  aulaPrincipal: 'Funções',
  relevancia: 'Alta',
  aulaAssistida: false,
  preAulaFeita: false,
  flashcardsFeitos: false,
  currentStage: 'aula' as const,
  nextReviewDate: null,
  lastReviewDate: null,
  lastPerformance: null,
  performanceLevel: 'nao_classificada',
}
```

**Para componentes com React Router v7:**
```typescript
import { MemoryRouter } from 'react-router-dom'
// Wrapper:
render(<MemoryRouter initialEntries={['/rota']}><Componente /></MemoryRouter>)
```

**Para hooks (`useSubjects`):**
```typescript
import { renderHook, act } from '@testing-library/react'
```

Gere casos de teste para: caminho feliz, entrada inválida, estado vazio, e os principais branches condicionais do arquivo.

## Passo 3 — Backend (JUnit 5 + Mockito)

Se for arquivo Java, crie o arquivo de teste em `backend/src/test/java/com/ebbin/api/{mesmo-pacote}/{NomeClasse}Test.java`.

**Boilerplate obrigatório:**
```java
package com.ebbin.api.{pacote};

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class {NomeClasse}Test {

    @InjectMocks
    private {NomeClasse} {nomeInstancia};

    // @Mock para cada dependência injetada

    @BeforeEach
    void setUp() { }
}
```

**Regras obrigatórias:**
- `@DisplayName` em português descrevendo o cenário
- Usar AssertJ (`assertThat`), nunca `assertEquals`
- Cobrir todos os branches: caminho feliz, recurso não encontrado, acesso negado, exceção

Gere `@Test` para cada método público da classe, cobrindo todos os branches condicionais identificados no Passo 1.

## Passo 4 — Confirmar

Após criar o arquivo, informe:
- Caminho completo do arquivo criado
- Quantos casos de teste foram gerados
- Quais branches ainda precisam de atenção manual (lógica complexa, integrações externas)
