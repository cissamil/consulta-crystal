import type { Tema } from '../hooks/useTema'

interface ThemeToggleProps {
  tema: Tema
  aoAlternar: () => void
}

/**
 * Interruptor claro/escuro da barra superior (ver hook useTema).
 * Mostra sol e lua dentro de uma "pílula" com uma bolinha deslizante, para
 * ficar óbvio que é um controle clicável e não só um desenho.
 */
export function ThemeToggle({ tema, aoAlternar }: ThemeToggleProps) {
  const escuro = tema === 'dark'
  const rotulo = escuro ? 'Mudar para tema claro' : 'Mudar para tema escuro'

  return (
    <button
      type="button"
      role="switch"
      aria-checked={escuro}
      onClick={aoAlternar}
      title={rotulo}
      aria-label={rotulo}
      className="relative inline-flex h-7 w-14 flex-shrink-0 cursor-pointer items-center rounded-full border border-gray-300 bg-gray-100 transition-colors hover:border-gray-400 hover:bg-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 dark:border-white/15 dark:bg-white/10 dark:hover:border-white/30 dark:hover:bg-white/15"
    >
      {/* Bolinha que desliza para o lado do tema ativo */}
      <span
        className={`absolute left-0.5 top-0.5 h-[22px] w-[22px] rounded-full shadow-sm transition-all duration-200 ${
          escuro ? 'translate-x-7 bg-accent' : 'translate-x-0 bg-white'
        }`}
      />

      {/* Sol (esquerda) */}
      <svg
        width="13"
        height="13"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`pointer-events-none absolute left-[7px] transition-colors ${escuro ? 'text-gray-400' : 'text-amber-500'}`}
      >
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
      </svg>

      {/* Lua (direita) */}
      <svg
        width="13"
        height="13"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`pointer-events-none absolute right-[7px] transition-colors ${escuro ? 'text-white' : 'text-gray-400'}`}
      >
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
      </svg>
    </button>
  )
}
