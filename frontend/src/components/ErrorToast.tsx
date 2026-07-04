interface ErrorToastProps {
  /** Mensagem de erro a exibir; null oculta o toast. */
  message: string | null;
  onDismiss: () => void;
}

/**
 * Toast fixo de erro de persistência. Antes dele, falhas de sincronização com o
 * backend (ex.: criar/salvar assunto) eram registradas no estado do hook mas
 * nunca exibidas — o rollback otimista acontecia em silêncio.
 */
export function ErrorToast({ message, onDismiss }: ErrorToastProps) {
  if (!message) return null;
  return (
    <div
      role="alert"
      className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-[300] flex items-center gap-3 bg-red-600 text-white px-5 py-3 rounded-2xl shadow-2xl max-w-[90vw]"
    >
      <span className="text-xs font-bold">{message}</span>
      <button
        onClick={onDismiss}
        aria-label="Fechar aviso de erro"
        className="p-1 text-white/70 hover:text-white transition-colors shrink-0"
      >
        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="3"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  );
}
