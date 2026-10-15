import { useEffect, useState } from 'react'

export type Tema = 'light' | 'dark'

const CHAVE_ARMAZENAMENTO = 'consulta-rpt-tema'

function obterTemaInicial(): Tema {
  if (typeof window === 'undefined') {
    return 'light'
  }

  const salvo = window.localStorage.getItem(CHAVE_ARMAZENAMENTO)
  if (salvo === 'light' || salvo === 'dark') {
    return salvo
  }

  // Sem preferência salva ainda (primeira visita): respeita o tema do
  // sistema operacional/navegador da usuária.
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

/**
 * Controla o tema claro/escuro da aplicação inteira: liga/desliga a classe
 * "dark" no <html> (é o que ativa as classes dark:algo do Tailwind em todos
 * os componentes) e lembra a escolha da usuária no localStorage, para
 * persistir entre acessos.
 */
export function useTema() {
  const [tema, setTema] = useState<Tema>(obterTemaInicial)

  useEffect(() => {
    const raiz = document.documentElement
    if (tema === 'dark') {
      raiz.classList.add('dark')
    } else {
      raiz.classList.remove('dark')
    }

    try {
      window.localStorage.setItem(CHAVE_ARMAZENAMENTO, tema)
    } catch {
      // Navegador pode bloquear localStorage (modo privado, política da
      // empresa etc.) — não é crítico, só não lembra a preferência da
      // próxima vez.
    }
  }, [tema])

  function alternarTema() {
    setTema((atual) => (atual === 'dark' ? 'light' : 'dark'))
  }

  return { tema, alternarTema }
}
