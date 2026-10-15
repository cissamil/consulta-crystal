using System.Collections.Generic;
using System.IO;
using System.Threading.Tasks;
using CrystalReportsRptApi.Models;

namespace CrystalReportsRptApi.Services
{
    /// <summary>
    /// Contrato do serviço que lê os arquivos .rpt. Os Controllers dependem
    /// só desta interface — assim dá para trocar a implementação (mock →
    /// Crystal Reports de verdade) sem mexer em mais nada, o mesmo
    /// princípio usado no rptService.ts do front-end.
    /// </summary>
    public interface IRptService
    {
        /// <summary>
        /// Analisa um único arquivo .rpt enviado pelo navegador (upload),
        /// Usado pelo botão
        /// "Selecionar arquivos" / arrastar-e-soltar do front-end.
        /// </summary>
        /// <param name="nomeArquivo">Nome original do arquivo enviado (ex.: "RelatorioFreteMensal.rpt").</param>
        /// <param name="conteudo">Conteúdo binário do arquivo.</param>
        Task<ArquivoRpt> AnalisarArquivoAsync(string nomeArquivo, Stream conteudo);
    }
}
