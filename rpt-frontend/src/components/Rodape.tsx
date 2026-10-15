/** Rodapé discreto: nome do projeto à esquerda, autoria e versão à direita. */
export function Rodape() {
  const ano = new Date().getFullYear()

  return (
    <footer className="mt-auto border-t border-gray-200 bg-white/60 px-16 py-6 dark:border-white/10 dark:bg-white/[0.02]">
      <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-3 text-[12px] text-gray-500 dark:text-gray-400">
        {/* Marca + copyright */}
        <div className="flex items-center">
          <span>© {ano} Consulta RPT. Projeto de portfólio.</span>
        </div>

        {/* Autoria + versão */}
        <div className="flex items-center gap-3">
          <span>
            Desenvolvido por{' '}
            <a
              href="https://github.com/cissamil"
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-gray-700 underline-offset-2 hover:underline dark:text-gray-200"
            >
              Clarissa
            </a>
          </span>
          <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-[11px] font-semibold tabular-nums text-gray-500 dark:bg-white/10 dark:text-gray-300">
            v1.0
          </span>
        </div>
      </div>
    </footer>
  )
}
