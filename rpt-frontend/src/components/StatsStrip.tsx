interface StatsStripProps {
  totalArquivos: number
  totalTabelas: number
  totalViews: number
  totalProcedures: number
}

interface CartaoProps {
  rotulo: string
  valor: number
  corFundoIcone: string
  icone: React.ReactNode
}

function Cartao({ rotulo, valor, corFundoIcone, icone }: CartaoProps) {
  return (
    <div className="card-depth card-depth-hover flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
      <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[11px] ring-1 ring-inset ${corFundoIcone}`}>
        {icone}
      </div>
      <div>
        <div className="text-[19px] font-extrabold leading-tight text-gray-900 dark:text-gray-50">{valor}</div>
        <div className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">{rotulo}</div>
      </div>
    </div>
  )
}

/** Faixa com os números-resumo: total de arquivos, tabelas, views e procedures. */
export function StatsStrip({ totalArquivos, totalTabelas, totalViews, totalProcedures }: StatsStripProps) {
  return (
    <div className="grid grid-cols-4 gap-3">
      <Cartao
        rotulo="arquivos .rpt"
        valor={totalArquivos}
        corFundoIcone="bg-gray-100 ring-gray-200 dark:bg-gray-600/40 dark:ring-gray-500/40"
        icone={
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-600 dark:text-gray-100" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
        }
      />
      <Cartao
        rotulo="tabelas"
        valor={totalTabelas}
        corFundoIcone="bg-accent-light ring-indigo-100 dark:bg-indigo-500/30 dark:ring-indigo-400/40"
        icone={
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-indigo-700 dark:text-indigo-200" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2.5" />
            <path d="M3 9h18" fill="none" />
            <rect x="3" y="3" width="18" height="6" rx="2.5" fill="currentColor" fillOpacity="0.25" />
            <line x1="3" y1="15" x2="21" y2="15" />
            <line x1="10" y1="9" x2="10" y2="21" />
          </svg>
        }
      />
      <Cartao
        rotulo="views"
        valor={totalViews}
        corFundoIcone="bg-emerald-50 ring-emerald-100 dark:bg-emerald-500/30 dark:ring-emerald-400/40"
        icone={
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-700 dark:text-emerald-300" strokeLinecap="round" strokeLinejoin="round">
            <ellipse cx="9" cy="5.5" rx="6" ry="2.5" />
            <path d="M3 5.5v11c0 1.4 2.7 2.5 6 2.5" />
            <path d="M3 11c0 1.4 2.7 2.5 6 2.5" />
            <path d="M15 5.5V9" />
            <circle cx="16" cy="15" r="4" />
            <line x1="19" y1="18" x2="22" y2="21" />
          </svg>
        }
      />
      <Cartao
        rotulo="procedures"
        valor={totalProcedures}
        corFundoIcone="bg-amber-50 ring-amber-100 dark:bg-amber-500/30 dark:ring-amber-400/40"
        icone={
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-700 dark:text-amber-300" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="16 18 22 12 16 6" />
            <polyline points="8 6 2 12 8 18" />
          </svg>
        }
      />
    </div>
  )
}
