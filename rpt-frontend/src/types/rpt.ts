// Tipos que espelham o contrato que a API em C# (ASP.NET Core) vai expor.
// Mantendo esses tipos centralizados aqui, o resto do app não precisa mudar
// quando trocarmos os dados mockados pela chamada HTTP de verdade.

export type TipoObjeto = 'Tabela' | 'View' | 'StoredProcedure'

export interface ObjetoRpt {
  tipo: TipoObjeto
  nome: string
}

export interface ArquivoRpt {
  nome: string
  objetos: ObjetoRpt[]
}

export interface ObjetoComArquivos {
  tipo: TipoObjeto
  nome: string
  arquivos: string[]
}

export type ModoBusca = 'arquivoParaObjetos' | 'objetoParaArquivos'
