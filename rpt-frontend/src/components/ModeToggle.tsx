import type { ModoBusca } from '../types/rpt'

interface ModeToggleProps {
  modo: ModoBusca
  aoAlterar: (modo: ModoBusca) => void
}

/** Alternador entre os dois modos de busca: por arquivo ou por objeto. */
export function ModeToggle({ modo, aoAlterar }: ModeToggleProps) {
  const botaoBase =
    'inline-flex items-center rounded-lg px-4 py-2.5 text-[13px] font-semibold transition-colors'
  const ativo = 'bg-white text-gray-900 shadow-sm dark:bg-gray-900 dark:text-gray-50'
  const inativo = 'bg-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'

  return (
    <div className="mt-7 inline-flex gap-0.5 rounded-[10px] bg-gray-100 p-[3px] dark:bg-gray-800/60">
      <button
        type="button"
        onClick={() => aoAlterar('arquivoParaObjetos')}
        className={`${botaoBase} ${modo === 'arquivoParaObjetos' ? ativo : inativo}`}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1.5">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
        Arquivo → Objetos
      </button>
      <button
        type="button"
        onClick={() => aoAlterar('objetoParaArquivos')}
        className={`${botaoBase} ${modo === 'objetoParaArquivos' ? ativo : inativo}`}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1.5">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        Objeto → Arquivos
      </button>
    </div>
  )
}
