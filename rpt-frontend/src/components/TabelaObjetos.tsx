import type { ObjetoComArquivos } from '../types/rpt'
import { BadgeTipo } from './BadgeTipo'

interface TabelaObjetosProps {
  objetos: ObjetoComArquivos[]
  consulta: string
}

/** Modo "Objeto → Arquivos": uma linha por objeto do banco, com os .rpt que o utilizam. */
export function TabelaObjetos({ objetos, consulta }: TabelaObjetosProps) {
  return (
    <div className="card-depth overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      <div className="grid grid-cols-[200px_1fr_1.4fr_90px] border-b border-gray-200 bg-gray-50 px-[22px] py-3 dark:border-gray-800 dark:bg-gray-900/60">
        <span className="pl-2.5 text-[11px] font-bold uppercase tracking-wide text-gray-400 dark:text-gray-500">Tipo</span>
        <span className="text-[11px] font-bold uppercase tracking-wide text-gray-400 dark:text-gray-500">Objeto</span>
        <span className="pl-2.5 text-[11px] font-bold uppercase tracking-wide text-gray-400 dark:text-gray-500">Arquivos que utilizam</span>
        <span className="text-left text-[11px] font-bold uppercase tracking-wide text-gray-400 dark:text-gray-500">Usos</span>
      </div>

      {objetos.map((objeto) => (
          <div
            key={`${objeto.tipo}-${objeto.nome}`}
            className="grid grid-cols-[200px_1fr_1.4fr_90px] items-center border-b border-gray-100 px-[22px] py-[15px] last:border-b-0 hover:bg-gray-50 dark:border-gray-800/60 dark:hover:bg-gray-800/40"
          >
            <BadgeTipo tipo={objeto.tipo} className="w-fit" />
            <span className="font-mono text-[13px] font-semibold text-gray-900 dark:text-gray-50">{objeto.nome}</span>
            <div className="flex flex-wrap gap-1.5">
              {objeto.arquivos.map((nomeArquivo) => (
                <span
                  key={nomeArquivo}
                  title={nomeArquivo}
                  className="rounded-md bg-accent-light px-2.5 py-1 font-mono text-[11.5px] text-accent dark:bg-indigo-950/40 dark:text-indigo-300"
                >
                  {nomeArquivo}
                </span>
              ))}
            </div>
            <span className="text-left text-[12.5px] tabular-nums text-gray-500 dark:text-gray-400">
              {objeto.arquivos.length} relatório{objeto.arquivos.length === 1 ? '' : 's'}
            </span>
          </div>
        ))}

      {objetos.length === 0 && (
        <div className="px-[22px] py-14 text-center text-[13.5px] text-gray-400 dark:text-gray-500">
          Nenhum objeto encontrado para "{consulta}".
        </div>
      )}
    </div>
  )
}
