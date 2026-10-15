import type { ArquivoRpt } from '../types/rpt'
import { BadgeTipo } from './BadgeTipo'

interface TabelaArquivosProps {
  arquivos: ArquivoRpt[]
  /** Chamado ao clicar no "×" de uma linha, com o nome do arquivo. */
  aoRemover: (nome: string) => void
  /** Chamado ao clicar na lixeira do cabeçalho (apaga o histórico inteiro). */
  aoLimparTodos: () => void
  /** Desativa remover/limpar (ex.: durante um envio). */
  acoesDesabilitadas?: boolean
}

/** Modo "Arquivo → Objetos": uma linha por arquivo .rpt, com os objetos que ele usa. */
export function TabelaArquivos({ arquivos, aoRemover, aoLimparTodos, acoesDesabilitadas = false }: TabelaArquivosProps) {
  return (
    <div className="card-depth overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      <div className="grid grid-cols-[420px_1fr_90px_32px] items-center border-b border-gray-200 bg-gray-50 px-[22px] py-3 dark:border-gray-800 dark:bg-gray-900/60">
        <span className="pl-[25px] text-[11px] font-bold uppercase tracking-wide text-gray-400 dark:text-gray-500">Arquivo .rpt</span>
        <span className="pl-2.5 text-[11px] font-bold uppercase tracking-wide text-gray-400 dark:text-gray-500">Objetos utilizados</span>
        <span className="text-left text-[11px] font-bold uppercase tracking-wide text-gray-400 dark:text-gray-500">Total</span>
        <button
          type="button"
          onClick={aoLimparTodos}
          disabled={arquivos.length === 0 || acoesDesabilitadas}
          title="Limpar todos"
          aria-label="Limpar todos os arquivos do histórico"
          className="flex h-6 w-6 justify-self-center items-center justify-center rounded-md text-gray-400 hover:bg-red-50 hover:text-red-600 disabled:pointer-events-none disabled:opacity-40 dark:text-gray-500 dark:hover:bg-red-950/40 dark:hover:text-red-400"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
            <path d="M10 11v6M14 11v6" />
            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
          </svg>
        </button>
      </div>

      {arquivos.map((arquivo) => (
          <div
            key={arquivo.nome}
            className="grid grid-cols-[420px_1fr_90px_32px] items-center border-b border-gray-100 px-[22px] py-4 last:border-b-0 hover:bg-gray-50 dark:border-gray-800/60 dark:hover:bg-gray-800/40"
          >
            <div className="flex min-w-0 items-center gap-2.5 pr-8">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#98a2b3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              <span title={arquivo.nome} className="truncate font-mono text-[13px] font-semibold text-gray-900 dark:text-gray-50">{arquivo.nome}</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {arquivo.objetos.map((objeto) => (
                <BadgeTipo key={`${arquivo.nome}-${objeto.tipo}-${objeto.nome}`} tipo={objeto.tipo}>
                  {objeto.nome}
                </BadgeTipo>
              ))}
            </div>
            <span className="text-left text-[12.5px] tabular-nums text-gray-500 dark:text-gray-400">
              {arquivo.objetos.length} objeto{arquivo.objetos.length === 1 ? '' : 's'}
            </span>
            <button
              type="button"
              onClick={() => aoRemover(arquivo.nome)}
              disabled={acoesDesabilitadas}
              title="Remover do histórico"
              aria-label={`Remover ${arquivo.nome} do histórico`}
              className="flex h-6 w-6 justify-self-center items-center justify-center rounded-md text-gray-400 hover:bg-red-50 hover:text-red-600 disabled:pointer-events-none disabled:opacity-40 dark:text-gray-500 dark:hover:bg-red-950/40 dark:hover:text-red-400"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        ))}
    </div>
  )
}
