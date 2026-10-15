import type { TipoObjeto } from '../types/rpt'

interface FiltroOpcao {
  valor: TipoObjeto | 'Todos'
  rotulo: string
}

const opcoes: FiltroOpcao[] = [
  { valor: 'Todos', rotulo: 'Todos' },
  { valor: 'Tabela', rotulo: 'Tabelas' },
  { valor: 'View', rotulo: 'Views' },
  { valor: 'StoredProcedure', rotulo: 'Stored Procedures' },
]

interface BuscaObjetoProps {
  consulta: string
  aoMudarConsulta: (valor: string) => void
  filtroTipo: TipoObjeto | 'Todos'
  aoMudarFiltro: (valor: TipoObjeto | 'Todos') => void
}

/** Campo de busca por nome de objeto + filtro por tipo (usado no modo "Objeto → Arquivos"). */
export function BuscaObjeto({ consulta, aoMudarConsulta, filtroTipo, aoMudarFiltro }: BuscaObjetoProps) {
  return (
    <div className="card-depth mb-5 rounded-xl border border-gray-200 bg-white p-4 px-5 dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-center gap-3">
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#98a2b3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          value={consulta}
          onChange={(e) => aoMudarConsulta(e.target.value)}
          placeholder="Buscar por nome de tabela, view ou stored procedure"
          className="flex-1 border-none bg-transparent text-[13.5px] text-gray-900 outline-none placeholder:text-gray-400 dark:text-gray-50 dark:placeholder:text-gray-500"
        />
      </div>
      <div className="mt-3.5 flex flex-wrap gap-2">
        {opcoes.map((opcao) => {
          const ativo = filtroTipo === opcao.valor
          return (
            <button
              key={opcao.valor}
              type="button"
              onClick={() => aoMudarFiltro(opcao.valor)}
              className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                ativo
                  ? 'border-accent bg-accent-light text-accent dark:border-indigo-500 dark:bg-indigo-950/40 dark:text-indigo-300'
                  : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400 dark:hover:border-gray-600'
              }`}
            >
              {opcao.rotulo}
            </button>
          )
        })}
      </div>
    </div>
  )
}
