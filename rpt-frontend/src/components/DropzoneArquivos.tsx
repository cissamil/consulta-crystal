import { useEffect, useRef, useState } from 'react'

/** Andamento do envio: quantos arquivos já terminaram, o total e o arquivo em análise agora. */
export interface ProgressoEnvio {
  concluidos: number
  total: number
  arquivoAtual: string
  /** Quando o envio começou (ms, Date.now()). */
  inicio: number
  /** Quando o último arquivo terminou (ms); no 1º arquivo, igual a `inicio`. */
  ultimaConclusao: number
}

/** Aviso não-bloqueante: uma mensagem curta e, opcionalmente, a lista de arquivos envolvidos. */
export interface AvisoEnvio {
  mensagem: string
  detalhes?: { arquivo: string; rotulo: string; valor: string }[]
}

interface DropzoneArquivosProps {
  /** Chamado com a lista de arquivos assim que o usuário solta/seleciona. */
  aoSelecionarArquivos: (arquivos: File[]) => void
  /** true enquanto os arquivos selecionados estão sendo enviados/analisados. */
  enviando: boolean
  /** Mensagem de erro do último envio, se houver (null = sem erro). */
  erro: string | null
  /** Aviso não-bloqueante (ex.: arquivos ignorados por duplicidade). */
  aviso: AvisoEnvio | null
  /** Chamado ao clicar no "×" do aviso. */
  aoFecharAviso: () => void
  /** Progresso do envio em andamento (null = nada em andamento). */
  progresso: ProgressoEnvio | null
}

/** 75 -> "1 min 15 s"; 3700 -> "1 h 2 min". */
function formatarDuracao(segundos: number): string {
  const s = Math.max(0, Math.round(segundos))
  if (s < 60) return `${s} s`
  const min = Math.floor(s / 60)
  if (min < 60) return `${min} min ${String(s % 60).padStart(2, '0')} s`
  return `${Math.floor(min / 60)} h ${String(min % 60).padStart(2, '0')} min`
}

/**
 * Estimativa de tempo restante: média de tempo por arquivo já concluído ×
 * arquivos que faltam, descontando o tempo já gasto no arquivo atual.
 * Reavalia a cada segundo para a contagem andar sozinha. Sem nenhum arquivo
 * concluído ainda, não há base para estimar ("calculando").
 */
function useTempoRestante(progresso: ProgressoEnvio | null): string | null {
  const [agora, setAgora] = useState(() => Date.now())

  useEffect(() => {
    if (!progresso) return
    const id = window.setInterval(() => setAgora(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [progresso !== null])

  if (!progresso) return null
  if (progresso.concluidos === 0) return 'calculando…'

  const mediaPorArquivo = (progresso.ultimaConclusao - progresso.inicio) / progresso.concluidos
  const faltam = progresso.total - progresso.concluidos
  const gastoNoAtual = Math.max(0, agora - progresso.ultimaConclusao)
  const restanteMs = mediaPorArquivo * faltam - gastoNoAtual

  if (restanteMs <= 1000) return 'finalizando…'
  return `${formatarDuracao(restanteMs / 1000)} restantes`
}

/** Área para o usuário enviar novos arquivos .rpt — arrastar-e-soltar ou selecionar pelo botão. */
export function DropzoneArquivos({ aoSelecionarArquivos, enviando, erro, aviso, aoFecharAviso, progresso }: DropzoneArquivosProps) {
  const tempoRestante = useTempoRestante(enviando ? progresso : null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [arrastandoSobre, setArrastandoSobre] = useState(false)

  function abrirSeletorDeArquivos() {
    inputRef.current?.click()
  }

  function aoMudarInput(evento: React.ChangeEvent<HTMLInputElement>) {
    const arquivos = Array.from(evento.target.files ?? [])
    if (arquivos.length > 0) {
      aoSelecionarArquivos(arquivos)
    }
    // Limpa o valor para permitir selecionar o mesmo arquivo de novo depois.
    evento.target.value = ''
  }

  // Arrastar e soltar em QUALQUER lugar da página: enquanto o usuário arrasta
  // um arquivo sobre a janela, a caixa de envio se destaca; ao soltar, os
  // arquivos são enviados. Sem isso, soltar fora da caixa faria o navegador
  // abrir o arquivo e sair da página.
  const aoSelecionarRef = useRef(aoSelecionarArquivos)
  const enviandoRef = useRef(enviando)
  useEffect(() => {
    aoSelecionarRef.current = aoSelecionarArquivos
    enviandoRef.current = enviando
  })

  useEffect(() => {
    const temArquivos = (e: DragEvent) => Array.from(e.dataTransfer?.types ?? []).includes('Files')

    function aoArrastarSobre(e: DragEvent) {
      if (!temArquivos(e)) return
      e.preventDefault()
      setArrastandoSobre(true)
    }
    function aoSairDaJanela(e: DragEvent) {
      // relatedTarget nulo = o arquivo saiu da janela (e não só de um elemento para outro).
      if (e.relatedTarget === null) setArrastandoSobre(false)
    }
    function aoSoltarNaJanela(e: DragEvent) {
      if (!temArquivos(e)) return
      e.preventDefault()
      setArrastandoSobre(false)
      if (enviandoRef.current) return
      // Não filtra aqui: arquivos que não são .rpt chegam ao App, que avisa o usuário.
      const arquivos = Array.from(e.dataTransfer?.files ?? [])
      if (arquivos.length > 0) aoSelecionarRef.current(arquivos)
    }

    window.addEventListener('dragenter', aoArrastarSobre)
    window.addEventListener('dragover', aoArrastarSobre)
    window.addEventListener('dragleave', aoSairDaJanela)
    window.addEventListener('drop', aoSoltarNaJanela)
    return () => {
      window.removeEventListener('dragenter', aoArrastarSobre)
      window.removeEventListener('dragover', aoArrastarSobre)
      window.removeEventListener('dragleave', aoSairDaJanela)
      window.removeEventListener('drop', aoSoltarNaJanela)
    }
  }, [])

  return (
    <div className="mb-5">
      <div className="card-depth card-depth-hover relative overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-center justify-between gap-5 p-5 px-[22px]">
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-accent-light dark:bg-indigo-950/50">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4338ca" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </div>
            <div>
              <div className="text-[14px] font-semibold text-gray-900 dark:text-gray-50">
                {enviando && progresso
                  ? `Analisando ${progresso.concluidos + 1} de ${progresso.total}...`
                  : enviando
                    ? 'Analisando arquivo(s)...'
                    : 'Arraste e solte seus arquivos .rpt aqui'}
              </div>
              <div className="mt-0.5 text-[12.5px] text-gray-400 dark:text-gray-500">
                {enviando
                  ? 'Extraindo os objetos da fonte de dados de cada relatório.'
                  : 'Solte em qualquer parte da página, ou escolha no computador.'}
              </div>
            </div>
          </div>

          <input
            ref={inputRef}
            type="file"
            accept=".rpt"
            multiple
            className="hidden"
            onChange={aoMudarInput}
          />

          <div className="flex items-center gap-3">
            {!enviando && <span className="text-[12px] font-medium text-gray-400 dark:text-gray-500">ou</span>}
            <button
              type="button"
              onClick={abrirSeletorDeArquivos}
              disabled={enviando}
              className="whitespace-nowrap rounded-lg bg-accent px-[18px] py-2.5 text-[13.5px] font-semibold text-white shadow-[0_2px_6px_-1px_rgba(67,56,202,0.4)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_16px_-4px_rgba(67,56,202,0.55)] active:translate-y-0 active:shadow-[0_1px_3px_rgba(67,56,202,0.4)] disabled:pointer-events-none disabled:opacity-60"
            >
              {enviando ? 'Enviando...' : 'Selecionar arquivos'}
            </button>
          </div>
        </div>

        {/* Ao arrastar um arquivo sobre a página, o cartão inteiro vira uma "área de soltar" */}
        <div
          aria-hidden={!arrastandoSobre}
          className={`pointer-events-none absolute inset-0 flex items-center justify-center gap-3 bg-indigo-50/95 text-accent shadow-[inset_0_0_0_2px_rgba(67,56,202,0.35)] backdrop-blur-sm dark:bg-indigo-950/90 dark:text-indigo-200 dark:shadow-[inset_0_0_0_2px_rgba(129,140,248,0.45)] transition-opacity duration-200 ${
            arrastandoSobre ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={arrastandoSobre ? 'animate-bounce' : ''}>
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          <span className="text-[15px] font-semibold">Solte os arquivos .rpt para analisar</span>
        </div>

      {enviando && progresso && (
        <div
          className="border-t border-gray-100 px-[22px] py-3.5 dark:border-white/5"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={progresso.total}
          aria-valuenow={progresso.concluidos}
        >
          <div className="mb-2 flex items-center justify-between gap-3 text-[12.5px]">
            <span className="flex min-w-0 items-center gap-2 text-gray-700 dark:text-gray-300">
              <svg className="h-3.5 w-3.5 flex-shrink-0 animate-spin text-accent" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              </svg>
              <span className="truncate">{progresso.arquivoAtual}</span>
            </span>
            <span className="flex flex-shrink-0 items-center gap-2.5">
              {tempoRestante && (
                <span className="flex items-center gap-1.5 rounded-full bg-accent-light px-2.5 py-1 text-[11.5px] font-semibold tabular-nums text-accent dark:bg-indigo-950/50 dark:text-indigo-300">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="9" />
                    <polyline points="12 7 12 12 15.5 14" />
                  </svg>
                  {tempoRestante}
                </span>
              )}
            </span>
          </div>
          <div className="flex h-1 overflow-hidden rounded-full bg-gray-100 dark:bg-white/10">
            <div
              className="h-full bg-accent transition-all duration-300"
              style={{ width: `${(progresso.concluidos / progresso.total) * 100}%` }}
            />
            <div
              className="h-full animate-pulse bg-accent/50"
              style={{ width: `${(1 / progresso.total) * 100}%` }}
            />
          </div>
        </div>
      )}

      {aviso && <AvisoCompacto key={aviso.mensagem} aviso={aviso} aoFechar={aoFecharAviso} />}

      {erro && (
        <div className="whitespace-pre-line border-t border-red-100 bg-red-50/70 px-[22px] py-2.5 text-[12.5px] text-red-700 dark:border-red-900/30 dark:bg-red-950/20 dark:text-red-300">
          {erro}
        </div>
      )}
      </div>
    </div>
  )
}

/** Aviso minimalista: uma linha com ícone, "ver detalhes" opcional e botão de fechar. */
function AvisoCompacto({ aviso, aoFechar }: { aviso: AvisoEnvio; aoFechar: () => void }) {
  const [aberto, setAberto] = useState(false)
  const temDetalhes = (aviso.detalhes?.length ?? 0) > 0

  return (
    <div className="border-t border-gray-100 text-[12.5px] dark:border-white/5">
      <div className="flex items-center gap-2.5 px-[22px] py-2.5">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 text-amber-500">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <span className="flex-1 text-gray-700 dark:text-gray-300">{aviso.mensagem}</span>

        {temDetalhes && (
          <button
            type="button"
            onClick={() => setAberto((v) => !v)}
            aria-expanded={aberto}
            className="flex items-center gap-1 font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
          >
            {aberto ? 'Ocultar' : 'Ver detalhes'}
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform ${aberto ? 'rotate-180' : ''}`}>
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
        )}

        <button
          type="button"
          onClick={aoFechar}
          aria-label="Fechar aviso"
          className="flex h-5 w-5 items-center justify-center rounded text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-500 dark:hover:bg-gray-800 dark:hover:text-gray-200"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {aberto && temDetalhes && (
        <ul className="divide-y divide-gray-100 border-t border-gray-100 bg-gray-50/60 dark:divide-white/5 dark:border-white/5 dark:bg-black/10">
          {aviso.detalhes!.map((d, i) => (
            <li key={i} className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 px-[22px] py-2 font-mono text-[11.5px]">
              <span className="truncate text-gray-800 dark:text-gray-200" title={d.arquivo}>{d.arquivo}</span>
              <span className="text-gray-400 dark:text-gray-600">{d.rotulo}</span>
              <span className="truncate text-gray-500 dark:text-gray-400" title={d.valor}>{d.valor}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
