import { useTema } from '../hooks/useTema'
import { ThemeToggle } from './ThemeToggle'

/** Barra superior fixa: título à esquerda, seletor de tema à direita. */
export function TopBar() {
  const { tema, alternarTema } = useTema()

  return (
    <div className="flex items-center gap-3.5 border-b border-gray-200 bg-white px-16 py-3.5 dark:border-white/10 dark:bg-[#222836] dark:shadow-[0_1px_0_0_rgba(255,255,255,0.04)]">
      <div className="flex flex-col">
        <span className="text-[17px] font-bold leading-tight tracking-tight text-gray-900 dark:text-[#f5f5f6]">Consulta RPT</span>
        <span className="text-[12px] font-medium text-gray-500 dark:text-[#9aa1b4]">SQL Server x Crystal Reports</span>
      </div>

      <div className="flex-1" />

      <ThemeToggle tema={tema} aoAlternar={alternarTema} />
    </div>
  )
}
