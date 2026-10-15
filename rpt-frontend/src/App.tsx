import { useEffect, useMemo, useRef, useState } from 'react'
import { TopBar } from './components/TopBar'
import { Rodape } from './components/Rodape'
import { StatsStrip } from './components/StatsStrip'
import { ModeToggle } from './components/ModeToggle'
import { DropzoneArquivos, type AvisoEnvio, type ProgressoEnvio } from './components/DropzoneArquivos'
import { TabelaArquivos } from './components/TabelaArquivos'
import { BuscaObjeto } from './components/BuscaObjeto'
import { TabelaObjetos } from './components/TabelaObjetos'
import {
  TAMANHO_MAXIMO_ARQUIVO_MB,
  construirIndiceObjetos,
  enviarArquivos,
  formatarTamanho,
  pareceArquivoRpt,
} from './services/rptService'
import type { ArquivoRpt, ModoBusca, ObjetoComArquivos, TipoObjeto } from './types/rpt'

// ---- Histórico (salvo no navegador, via localStorage) ----
const CHAVE_HISTORICO = 'consulta-rpt-historico'

interface Historico {
  arquivos: ArquivoRpt[]
  assinaturas: [string, string][]
}

function lerHistorico(): Historico {
  try {
    const bruto = localStorage.getItem(CHAVE_HISTORICO)
    if (bruto) {
      const dados = JSON.parse(bruto) as Historico
      if (Array.isArray(dados.arquivos) && Array.isArray(dados.assinaturas)) return dados
    }
  } catch {
    // localStorage indisponível ou JSON corrompido: começa sem histórico.
  }
  return { arquivos: [], assinaturas: [] }
}

function salvarHistorico(historico: Historico) {
  try {
    localStorage.setItem(CHAVE_HISTORICO, JSON.stringify(historico))
  } catch {
    // Sem espaço/bloqueado: o sistema continua funcionando, só não guarda.
  }
}

// ---- Estado da tela (aba, busca, filtro e rolagem), para sobreviver ao F5 ----
const CHAVE_TELA = 'consulta-rpt-tela'

interface EstadoTela {
  modo: ModoBusca
  consulta: string
  filtroTipo: TipoObjeto | 'Todos'
  rolagem: number
}

function lerEstadoTela(): EstadoTela {
  const padrao: EstadoTela = { modo: 'arquivoParaObjetos', consulta: '', filtroTipo: 'Todos', rolagem: 0 }
  try {
    const bruto = localStorage.getItem(CHAVE_TELA)
    if (!bruto) return padrao
    const d = JSON.parse(bruto) as Partial<EstadoTela>
    return {
      modo: d.modo === 'objetoParaArquivos' ? 'objetoParaArquivos' : 'arquivoParaObjetos',
      consulta: typeof d.consulta === 'string' ? d.consulta : '',
      filtroTipo: ['Tabela', 'View', 'StoredProcedure'].includes(d.filtroTipo as string)
        ? (d.filtroTipo as TipoObjeto)
        : 'Todos',
      rolagem: typeof d.rolagem === 'number' ? d.rolagem : 0,
    }
  } catch {
    return padrao
  }
}

function salvarEstadoTela(estado: EstadoTela) {
  try {
    localStorage.setItem(CHAVE_TELA, JSON.stringify(estado))
  } catch {
    // Sem armazenamento: só não lembra a posição.
  }
}

/**
 * Hash rápido (cyrb53) dos bytes do arquivo. Não usamos crypto.subtle porque
 * ele só existe em páginas HTTPS/localhost — e o sistema roda em http://IP-do-servidor.
 */
async function assinaturaDeConteudo(arquivo: File): Promise<string> {
  const bytes = new Uint8Array(await arquivo.arrayBuffer())
  let h1 = 0xdeadbeef
  let h2 = 0x41c6ce57
  for (let i = 0; i < bytes.length; i++) {
    h1 = Math.imul(h1 ^ bytes[i], 2654435761)
    h2 = Math.imul(h2 ^ bytes[i], 1597334677)
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909)
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909)
  return `${arquivo.size}-${(h2 >>> 0).toString(16)}${(h1 >>> 0).toString(16)}`
}

/** Nome "base" do relatório: sem extensão, sem números/datas/versões e sem símbolos. */
function nomeBase(nome: string): string {
  return nome.toLowerCase().replace(/\.rpt$/, '').replace(/[^a-z]/g, '')
}

/** Conjunto de objetos do relatório, ordenado — igual = mesma fonte de dados. */
function assinaturaDeObjetos(arquivo: ArquivoRpt): string {
  return arquivo.objetos.map((o) => `${o.tipo}::${o.nome}`.toLowerCase()).sort().join('|')
}

/** Arquivo que não foi processado, com o motivo (conteúdo repetido ou tamanho acima do limite). */
interface ArquivoIgnorado {
  arquivo: string
  motivo: 'duplicado' | 'tamanho' | 'invalido'
  rotulo: string
  valor: string
}

function montarAvisoIgnorados(ignorados: ArquivoIgnorado[]): AvisoEnvio {
  const n = ignorados.length
  const plural = n === 1 ? '' : 's'
  const todosSao = (motivo: ArquivoIgnorado['motivo']) => ignorados.every((i) => i.motivo === motivo)

  let mensagem: string
  if (todosSao('duplicado')) {
    mensagem = `${n} arquivo${plural} ignorado${plural} por já ${n === 1 ? 'estar' : 'estarem'} no histórico`
  } else if (todosSao('tamanho')) {
    mensagem = `${n} arquivo${plural} acima do limite de ${TAMANHO_MAXIMO_ARQUIVO_MB} MB não ${n === 1 ? 'foi enviado' : 'foram enviados'}`
  } else if (todosSao('invalido')) {
    mensagem = `${n} arquivo${plural} não ${n === 1 ? 'é um' : 'são'} .rpt válido${plural} do Crystal Reports`
  } else {
    mensagem = `${n} arquivos não foram enviados (repetidos, grandes demais ou inválidos)`
  }

  return { mensagem, detalhes: ignorados.map(({ arquivo, rotulo, valor }) => ({ arquivo, rotulo, valor })) }
}

function App() {
  const [telaInicial] = useState(lerEstadoTela)
  const [modo, setModo] = useState<ModoBusca>(telaInicial.modo)
  const [historicoInicial] = useState(lerHistorico)
  const [arquivos, setArquivos] = useState<ArquivoRpt[]>(historicoInicial.arquivos)
  const [objetos, setObjetos] = useState<ObjetoComArquivos[]>(() => construirIndiceObjetos(historicoInicial.arquivos))
  const [consulta, setConsulta] = useState(telaInicial.consulta)
  const [filtroTipo, setFiltroTipo] = useState<TipoObjeto | 'Todos'>(telaInicial.filtroTipo)
  const [enviandoArquivos, setEnviandoArquivos] = useState(false)
  const [erroEnvio, setErroEnvio] = useState<string | null>(null)
  const [avisoEnvio, setAvisoEnvio] = useState<AvisoEnvio | null>(null)
  const [progresso, setProgresso] = useState<ProgressoEnvio | null>(null)
  // Trava síncrona (state é assíncrono): impede um segundo envio começar
  // enquanto o primeiro ainda está rodando (ex.: duplo clique/soltar 2x).
  const enviandoRef = useRef(false)
  // Espelho síncrono da lista de arquivos (o state só atualiza no próximo render).
  const arquivosRef = useRef<ArquivoRpt[]>(historicoInicial.arquivos)

  /** Única porta de entrada para mudar a lista: mantém ref, state e índice de objetos juntos. */
  function aplicarArquivos(lista: ArquivoRpt[]) {
    arquivosRef.current = lista
    setArquivos(lista)
    setObjetos(construirIndiceObjetos(lista))
  }
  // Assinaturas de CONTEÚDO (tamanho + hash dos bytes) dos arquivos já
  // processados com sucesso nesta sessão, apontando para o nome com que
  // foram processados. O nome NÃO entra na assinatura: relatórios exportados
  // várias vezes costumam ter nomes diferentes (ex.: com data/hora no fim)
  // mas conteúdo idêntico, e é isso que não queremos reprocessar.
  const processadosRef = useRef<Map<string, string>>(new Map(historicoInicial.assinaturas))

  // Salva o histórico sempre que a lista de arquivos muda.
  useEffect(() => {
    salvarHistorico({ arquivos, assinaturas: Array.from(processadosRef.current.entries()) })
  }, [arquivos])

  // Lembra aba, busca e filtro a cada mudança (a rolagem é salva no efeito abaixo).
  useEffect(() => {
    salvarEstadoTela({ modo, consulta, filtroTipo, rolagem: window.scrollY })
  }, [modo, consulta, filtroTipo])

  // Rolagem: salva enquanto o usuário rola e restaura uma vez ao abrir a página.
  useEffect(() => {
    const alvo = telaInicial.rolagem
    if (alvo > 0) {
      requestAnimationFrame(() => window.scrollTo(0, alvo))
    }

    let agendado = 0
    function aoRolar() {
      window.clearTimeout(agendado)
      agendado = window.setTimeout(() => {
        const atual = lerEstadoTela()
        salvarEstadoTela({ ...atual, rolagem: window.scrollY })
      }, 150)
    }
    window.addEventListener('scroll', aoRolar, { passive: true })
    return () => {
      window.clearTimeout(agendado)
      window.removeEventListener('scroll', aoRolar)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function limparHistorico() {
    if (!window.confirm('Apagar todo o histórico de arquivos analisados neste navegador?')) return
    processadosRef.current.clear()
    aplicarArquivos([])
    setAvisoEnvio(null)
    setErroEnvio(null)
  }

  /** Remove um arquivo do histórico (e libera o conteúdo dele para ser enviado de novo). */
  function removerArquivo(nome: string) {
    for (const [assinatura, nomeProcessado] of processadosRef.current) {
      if (nomeProcessado === nome) processadosRef.current.delete(assinatura)
    }
    aplicarArquivos(arquivosRef.current.filter((a) => a.nome !== nome))
  }

  const stats = useMemo(
    () => ({
      totalArquivos: arquivos.length,
      totalTabelas: objetos.filter((o) => o.tipo === 'Tabela').length,
      totalViews: objetos.filter((o) => o.tipo === 'View').length,
      totalProcedures: objetos.filter((o) => o.tipo === 'StoredProcedure').length,
    }),
    [arquivos, objetos],
  )

  /**
   * Recebe os arquivos que o usuário arrastou/selecionou e os envia à API
   * UM DE CADA VEZ (também é mais seguro para o SDK do Crystal), mostrando
   * o progresso "n de total".
   *
   * Regras para não processar o mesmo arquivo várias vezes:
   *  1. Se já há um envio em andamento, a nova seleção é ignorada.
   *  2. Arquivos repetidos dentro da mesma seleção são processados só uma vez.
   *  3. A comparação é pelo CONTEÚDO (tamanho + hash dos bytes), não pelo
   *     nome: arquivo com nome diferente mas conteúdo idêntico também é
   *     ignorado, e o usuário é avisado.
   *  4. Se o nome é o mesmo mas o conteúdo mudou, é reprocessado e
   *     substitui o resultado antigo.
   */
  async function aoReceberArquivos(arquivosSelecionados: File[]) {
    if (enviandoRef.current) {
      setAvisoEnvio({ mensagem: 'Já existe um envio em andamento. Aguarde terminar.' })
      return
    }

    // Trava já aqui: calcular a assinatura também leva um instante.
    enviandoRef.current = true
    setEnviandoArquivos(true)
    setErroEnvio(null)
    setAvisoEnvio(null)

    const erros: string[] = []

    try {
      const vistosNaSelecao = new Map<string, string>()
      const novos: { arquivo: File; assinatura: string }[] = []
      const ignorados: ArquivoIgnorado[] = []

      for (const arquivo of arquivosSelecionados) {
        // Limite de tamanho: checado ANTES de ler o conteúdo, para nunca
        // carregar um arquivo gigante na memória do navegador.
        if (arquivo.size > TAMANHO_MAXIMO_ARQUIVO_MB * 1024 * 1024) {
          ignorados.push({
            arquivo: arquivo.name,
            motivo: 'tamanho',
            rotulo: `acima de ${TAMANHO_MAXIMO_ARQUIVO_MB} MB`,
            valor: formatarTamanho(arquivo.size),
          })
          continue
        }

        // Só aceita .rpt de verdade (extensão + primeiros bytes do arquivo).
        if (!(await pareceArquivoRpt(arquivo))) {
          ignorados.push({
            arquivo: arquivo.name,
            motivo: 'invalido',
            rotulo: 'não é .rpt',
            valor: arquivo.name.toLowerCase().endsWith('.rpt') ? 'conteúdo inválido' : 'extensão inválida',
          })
          continue
        }

        const assinatura = await assinaturaDeConteudo(arquivo)
        const igualA = vistosNaSelecao.get(assinatura) ?? processadosRef.current.get(assinatura)

        if (igualA !== undefined) {
          ignorados.push({ arquivo: arquivo.name, motivo: 'duplicado', rotulo: 'igual a', valor: igualA })
        } else {
          vistosNaSelecao.set(assinatura, arquivo.name)
          novos.push({ arquivo, assinatura })
        }
      }

      if (ignorados.length > 0) {
        setAvisoEnvio(montarAvisoIgnorados(ignorados))
      }

      // Marca de tempo do início do envio (depois do cálculo das assinaturas):
      // base da estimativa de tempo restante mostrada na barra de progresso.
      const inicioLote = Date.now()

      for (let i = 0; i < novos.length; i++) {
        const { arquivo, assinatura } = novos[i]
        setProgresso({
          concluidos: i,
          total: novos.length,
          arquivoAtual: arquivo.name,
          inicio: inicioLote,
          // O arquivo anterior acabou de terminar (ou, no 1º, o envio acabou de começar).
          ultimaConclusao: Date.now(),
        })

        try {
          const [analisado] = await enviarArquivos([arquivo])
          processadosRef.current.set(assinatura, arquivo.name)

          // Regra extra: mesmo relatório exportado de novo com outro nome
          // (ex.: data diferente no fim) costuma ter bytes diferentes, então o
          // hash não pega. Se o nome-base E o conjunto de objetos forem iguais
          // aos de um arquivo já listado, é a mesma coisa: não duplica.
          const repetido = arquivosRef.current.find(
            (a) =>
              a.nome !== analisado.nome &&
              nomeBase(a.nome) === nomeBase(analisado.nome) &&
              assinaturaDeObjetos(a) === assinaturaDeObjetos(analisado),
          )

          if (repetido) {
            ignorados.push({ arquivo: arquivo.name, motivo: 'duplicado', rotulo: 'igual a', valor: repetido.nome })
            setAvisoEnvio(montarAvisoIgnorados(ignorados))
            continue
          }

          // Mesmo nome substitui; nome novo é adicionado.
          const atualizados = [...arquivosRef.current]
          const indice = atualizados.findIndex((a) => a.nome === analisado.nome)
          if (indice >= 0) atualizados[indice] = analisado
          else atualizados.push(analisado)
          aplicarArquivos(atualizados)
        } catch (erro) {
          erros.push(`${arquivo.name}: ${erro instanceof Error ? erro.message : 'falha ao enviar.'}`)
        }
      }

      if (erros.length > 0) setErroEnvio(erros.join('\n'))
    } finally {
      enviandoRef.current = false
      setEnviandoArquivos(false)
      setProgresso(null)
    }
  }

  const objetosFiltrados = useMemo(() => {
    const termo = consulta.trim().toLowerCase()
    return objetos.filter((objeto) => {
      const bateTipo = filtroTipo === 'Todos' || objeto.tipo === filtroTipo
      const bateConsulta = termo === '' || objeto.nome.toLowerCase().includes(termo)
      return bateTipo && bateConsulta
    })
  }, [objetos, consulta, filtroTipo])

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-[#171b24]">
      <TopBar />

      <div className="px-16 pt-8">
        {/* Título só para leitores de tela (invisível na tela). */}
        <h1 className="sr-only">Consulte objetos dos Arquivos .rpt</h1>
        <StatsStrip {...stats} />


        <ModeToggle modo={modo} aoAlterar={setModo} />
      </div>

      {modo === 'arquivoParaObjetos' && (
        <div className="px-16 py-5 pb-16">
          <DropzoneArquivos
            aoSelecionarArquivos={aoReceberArquivos}
            enviando={enviandoArquivos}
            erro={erroEnvio}
            aviso={avisoEnvio}
            aoFecharAviso={() => setAvisoEnvio(null)}
            progresso={progresso}
          />
          <TabelaArquivos
            arquivos={arquivos}
            aoRemover={removerArquivo}
            aoLimparTodos={limparHistorico}
            acoesDesabilitadas={enviandoArquivos}
          />
        </div>
      )}

      {modo === 'objetoParaArquivos' && (
        <div className="px-16 py-5 pb-16">
          <BuscaObjeto
            consulta={consulta}
            aoMudarConsulta={setConsulta}
            filtroTipo={filtroTipo}
            aoMudarFiltro={setFiltroTipo}
          />
          <TabelaObjetos objetos={objetosFiltrados} consulta={consulta} />
        </div>
      )}

      <Rodape />
    </div>
  )
}

export default App
