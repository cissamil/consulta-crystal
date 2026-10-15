using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using CrystalDecisions.CrystalReports.Engine;
using CrystalReportsRptApi.Models;

namespace CrystalReportsRptApi.Services
{
    /// <summary>
    /// Implementação real: lê os arquivos .rpt usando o SDK do Crystal
    /// Reports. Só compila em Windows, com o SDK referenciado (ver
    /// comentário no .csproj).
    ///
    /// CLASSIFICAÇÃO DE TIPO: testamos com um .rpt real e confirmamos que
    /// o SDK não diz se um objeto é tabela/view/procedure — só devolve o
    /// nome (Name/Location saem idênticos). Por decisão consciente (não é
    /// 100% preciso, mas é suficiente para o que você precisa agora),
    /// classificamos pelo prefixo do nome: "VW_"/"vw_" → View,
    /// "SP_"/"sp_"/"USP_"/"usp_" → StoredProcedure, qualquer outro nome →
    /// Tabela. Um objeto sem esses prefixos mas que na verdade é view ou
    /// procedure vai aparecer como "Tabela" — se isso incomodar depois,
    /// dá para revisitar com uma consulta ao banco (ver conversa anterior).
    /// </summary>
    public class CrystalReportsRptService : IRptService
    {
        private ArquivoRpt LerObjetosDoArquivo(string caminho)
        {
            using (var report = new ReportDocument())
            {
                report.Load(caminho);

                var objetos = new List<ObjetoRpt>();

                foreach (Table tabela in report.Database.Tables)
                {
                    // "Location" costuma trazer o nome qualificado do objeto de
                    // origem (ex.: "dbo.Fretes"); em alguns casos vem vazio e o
                    // "Name" é o que sobra. Nos testes reais, os dois vieram
                    // iguais na maioria dos casos.
                    var origem = string.IsNullOrWhiteSpace(tabela.Location) ? tabela.Name : tabela.Location;

                    if (!objetos.Any(o => string.Equals(o.Nome, origem, StringComparison.OrdinalIgnoreCase)))
                    {
                        objetos.Add(new ObjetoRpt(ClassificarTipo(origem), origem));
                    }
                }

                // TODO (próximo passo, se necessário): repetir esse laço para
                // report.Subreports, caso os relatórios da empresa usem
                // subrelatórios — ainda não implementado nesta versão de
                // diagnóstico para não arriscar erro de compilação numa API
                // do SDK que eu não consegui testar aqui.

                return new ArquivoRpt(Path.GetFileName(caminho), objetos);
            }
        }

        /// <summary>
        /// Classificação por prefixo do nome — ver nota na classe sobre a
        /// limitação disso (nem todo objeto segue a convenção).
        /// </summary>
        private static TipoObjeto ClassificarTipo(string nomeObjeto)
        {
            if (nomeObjeto.StartsWith("VW_", StringComparison.OrdinalIgnoreCase))
            {
                return TipoObjeto.View;
            }

            if (nomeObjeto.StartsWith("SP_", StringComparison.OrdinalIgnoreCase) ||
                nomeObjeto.StartsWith("USP_", StringComparison.OrdinalIgnoreCase))
            {
                return TipoObjeto.StoredProcedure;
            }

            return TipoObjeto.Tabela;
        }

        /// <summary>
        /// Analisa um arquivo enviado pelo navegador (upload): grava o
        /// conteúdo recebido num arquivo temporário e reaproveita a mesma
        /// leitura usada para os arquivos da pasta configurada.
        /// </summary>
        public async Task<ArquivoRpt> AnalisarArquivoAsync(string nomeArquivo, Stream conteudo)
        {
            var caminhoTemporario = Path.Combine(Path.GetTempPath(), Guid.NewGuid() + ".rpt");

            try
            {
                using (var arquivoTemporario = File.Create(caminhoTemporario))
                {
                    await conteudo.CopyToAsync(arquivoTemporario);
                }

                var arquivoLido = LerObjetosDoArquivo(caminhoTemporario);

                // Devolve com o nome original enviado pelo navegador, não o
                // nome temporário gerado no servidor.
                return new ArquivoRpt(nomeArquivo, arquivoLido.Objetos);
            }
            finally
            {
                if (File.Exists(caminhoTemporario))
                {
                    File.Delete(caminhoTemporario);
                }
            }
        }
    }
}
