using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using CrystalReportsRptApi.Models;

namespace CrystalReportsRptApi.Services
{
    /// <summary>
    /// Implementação com dados de exemplo (os mesmos usados no mock do
    /// front-end, em src/data/mockRpt.ts) — assim as duas pontas mostram os
    /// mesmos dados enquanto o back-end de verdade não lê os .rpt.
    ///
    /// Lógica idêntica à versão .NET 8; só a sintaxe dos objetos (record →
    /// classe) mudou.
    /// </summary>
    public class MockRptService : IRptService
    {
        private static readonly List<ArquivoRpt> Arquivos = new List<ArquivoRpt>
        {
            new ArquivoRpt("RelatorioFreteMensal.rpt", new List<ObjetoRpt>
            {
                new ObjetoRpt(TipoObjeto.Tabela, "dbo.Fretes"),
                new ObjetoRpt(TipoObjeto.Tabela, "dbo.Transportadoras"),
                new ObjetoRpt(TipoObjeto.View, "vw_FreteConsolidado"),
                new ObjetoRpt(TipoObjeto.StoredProcedure, "sp_CalculaFreteMensal"),
            }),
            new ArquivoRpt("RelatorioEntregasCTe.rpt", new List<ObjetoRpt>
            {
                new ObjetoRpt(TipoObjeto.Tabela, "dbo.CTe"),
                new ObjetoRpt(TipoObjeto.Tabela, "dbo.Entregas"),
                new ObjetoRpt(TipoObjeto.View, "vw_EntregasPendentes"),
            }),
            new ArquivoRpt("RelatorioOcorrenciasTransporte.rpt", new List<ObjetoRpt>
            {
                new ObjetoRpt(TipoObjeto.Tabela, "dbo.Ocorrencias"),
                new ObjetoRpt(TipoObjeto.StoredProcedure, "sp_ListaOcorrenciasAbertas"),
                new ObjetoRpt(TipoObjeto.View, "vw_FreteConsolidado"),
            }),
            new ArquivoRpt("RelatorioIndicadoresSLA.rpt", new List<ObjetoRpt>
            {
                new ObjetoRpt(TipoObjeto.View, "vw_EntregasPendentes"),
                new ObjetoRpt(TipoObjeto.StoredProcedure, "sp_CalculaSLAEntrega"),
                new ObjetoRpt(TipoObjeto.Tabela, "dbo.Rotas"),
            }),
        };

        /// <summary>
        /// Simula a análise de um arquivo .rpt enviado pelo navegador.
        /// Como ainda não lemos o conteúdo de verdade (isso só existe na
        /// CrystalReportsRptService, quando o SDK estiver referenciado),
        /// aqui só "fingimos" o resultado:
        ///   - se o nome do arquivo bate com um dos 4 relatórios de
        ///     exemplo, devolvemos os objetos reais daquele relatório;
        ///   - senão, devolvemos um conjunto de objetos de exemplo
        ///     qualquer, só para o botão de upload ter algo para mostrar
        ///     durante o desenvolvimento do front-end.
        /// </summary>
        public Task<ArquivoRpt> AnalisarArquivoAsync(string nomeArquivo, Stream conteudo)
        {
            var conhecido = Arquivos.FirstOrDefault(a =>
                string.Equals(a.Nome, nomeArquivo, StringComparison.OrdinalIgnoreCase));

            if (conhecido != null)
            {
                return Task.FromResult(conhecido);
            }

            // Nome não reconhecido: escolhe um conjunto de objetos de
            // exemplo de forma determinística (baseado no nome do arquivo),
            // só para simular uma resposta variada.
            var indice = Math.Abs(nomeArquivo.GetHashCode()) % Arquivos.Count;
            var objetosDeExemplo = Arquivos[indice].Objetos;

            var resultado = new ArquivoRpt(nomeArquivo, objetosDeExemplo);
            return Task.FromResult(resultado);
        }
    }
}
