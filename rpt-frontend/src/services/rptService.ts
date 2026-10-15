import type { ArquivoRpt, ObjetoComArquivos } from '../types/rpt'

// URL base da API em C# (ASP.NET Framework + OWIN).
// - No app publicado, a própria API serve a tela, então o padrão "/api"
//   (mesmo endereço da página) funciona sem configurar nada.
// - No desenvolvimento (npm run dev), a tela roda em outra porta e precisa do
//   endereço completo da API em rpt-frontend/.env (ver .env.example).
export const API_BASE_URL: string = (import.meta.env.VITE_API_BASE_URL as string | undefined) || '/api'

/**
 * Tamanho máximo por arquivo .rpt (em MB). Deve ser igual (ou menor) ao
 * limite do backend (TamanhoMaximoArquivoMB em App.config): arquivos acima
 * disso nem são enviados, o que poupa rede e memória do servidor.
 */
export const TAMANHO_MAXIMO_ARQUIVO_MB = 30

/** 1_572_864 -> "1,5 MB". */
export function formatarTamanho(bytes: number): string {
  const mb = bytes / (1024 * 1024)
  return mb >= 1 ? `${mb.toFixed(1).replace('.', ',')} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`
}

/** Primeiros 8 bytes dos .rpt do Crystal Reports (formato OLE2 / Compound File). */
const ASSINATURA_RPT = [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]

/**
 * Confere se o arquivo parece mesmo um .rpt: extensão .rpt E primeiros bytes
 * iguais à assinatura acima. Lê só 8 bytes, então é instantâneo mesmo em
 * arquivos grandes. O backend refaz essa checagem (a do navegador existe só
 * para avisar o usuário mais rápido, não para segurança).
 */
export async function pareceArquivoRpt(arquivo: File): Promise<boolean> {
  if (!arquivo.name.toLowerCase().endsWith('.rpt')) return false
  if (arquivo.size < ASSINATURA_RPT.length) return false

  const cabecalho = new Uint8Array(await arquivo.slice(0, ASSINATURA_RPT.length).arrayBuffer())
  return ASSINATURA_RPT.every((byte, i) => cabecalho[i] === byte)
}

function exigirApiBaseUrl(): string {
  return API_BASE_URL
}

/**
 * Quando a API responde com erro (status >= 400), o Web API (com
 * IncludeErrorDetailPolicy.Always, configurado no Startup.cs) devolve um
 * JSON com a mensagem real da exceção em vez de só o texto genérico
 * "Internal Server Error". Esta função tenta extrair essa mensagem para
 * mostrar algo útil na tela, e cai no texto padrão se não conseguir.
 */
async function extrairMensagemDeErro(resposta: Response, padrao: string): Promise<string> {
  try {
    const corpo = await resposta.clone().json()
    const mensagem = corpo?.ExceptionMessage ?? corpo?.Message ?? corpo?.exceptionMessage ?? corpo?.message
    if (mensagem) {
      return `${padrao}: ${mensagem}`
    }
  } catch {
    // Corpo não era JSON (ou veio vazio) — usa só o texto padrão.
  }
  return padrao
}

/**
 * Monta o índice inverso (objeto → arquivos que o usam) a partir de uma
 * lista de arquivos. Extraído como função separada para poder ser
 * reaplicado no navegador logo após um upload (ver enviarArquivos), sem
 * precisar de mais uma chamada de rede só para recalcular esse índice.
 */
export function construirIndiceObjetos(arquivos: ArquivoRpt[]): ObjetoComArquivos[] {
  const indice = new Map<string, ObjetoComArquivos>()

  for (const arquivo of arquivos) {
    for (const objeto of arquivo.objetos) {
      const chave = `${objeto.tipo}::${objeto.nome}`
      const existente = indice.get(chave)

      if (existente) {
        if (!existente.arquivos.includes(arquivo.nome)) {
          existente.arquivos.push(arquivo.nome)
        }
      } else {
        indice.set(chave, {
          tipo: objeto.tipo,
          nome: objeto.nome,
          arquivos: [arquivo.nome],
        })
      }
    }
  }

  return Array.from(indice.values()).sort((a, b) => a.nome.localeCompare(b.nome))
}

/**
 * Envia um ou mais arquivos .rpt selecionados/arrastados pelo usuário para
 * a API analisar, e devolve os objetos (tabelas/views/procedures) que cada
 * um usa.
 *
 * Diferente de listarArquivos()/listarObjetos(), esta função já é "real"
 * desde já — não existe uma versão mockada equivalente, porque enviar um
 * arquivo de verdade só faz sentido conversando com a API. Por isso ela
 * depende de VITE_API_BASE_URL estar configurada (ver .env.example).
 */
export async function enviarArquivos(arquivos: File[]): Promise<ArquivoRpt[]> {
  const formData = new FormData()
  for (const arquivo of arquivos) {
    // O terceiro argumento garante que o nome original do arquivo (ex.:
    // "RelatorioFreteMensal.rpt") chegue até o back-end.
    formData.append('arquivos', arquivo, arquivo.name)
  }

  const resposta = await fetch(`${exigirApiBaseUrl()}/rpt/upload`, {
    method: 'POST',
    body: formData,
  })

  if (!resposta.ok) {
    throw new Error(
      await extrairMensagemDeErro(resposta, `Falha ao enviar arquivo(s): a API respondeu com status ${resposta.status}`),
    )
  }

  return (await resposta.json()) as ArquivoRpt[]
}
