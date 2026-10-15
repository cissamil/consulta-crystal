import type { TipoObjeto } from '../types/rpt'

const estilos: Record<TipoObjeto, string> = {
  Tabela: 'bg-accent-light text-accent dark:bg-indigo-950/40 dark:text-indigo-300',
  View: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
  StoredProcedure: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
}

const rotulos: Record<TipoObjeto, string> = {
  Tabela: 'Tabela',
  View: 'View',
  StoredProcedure: 'Stored Procedure',
}

interface BadgeTipoProps {
  tipo: TipoObjeto
  className?: string
  /** Texto a exibir no lugar do rótulo do tipo — por ex. o nome do objeto (dbo.Fretes). */
  children?: React.ReactNode
}

/** Selo colorido que identifica o tipo de objeto do banco (tabela, view ou stored procedure). */
export function BadgeTipo({ tipo, className = '', children }: BadgeTipoProps) {
  const caixa = children ? '' : 'uppercase'
  return (
    <span
      className={`inline-block whitespace-nowrap rounded-full px-2.5 py-1 font-mono text-[11px] font-semibold tracking-wide ${caixa} ${estilos[tipo]} ${className}`}
    >
      {children ?? rotulos[tipo]}
    </span>
  )
}
