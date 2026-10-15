using System;
using System.Collections.Generic;
using System.Configuration;
using System.IO;
using System.Net;
using System.Net.Http;
using System.Threading.Tasks;
using System.Web.Http;
using CrystalReportsRptApi.Models;
using CrystalReportsRptApi.Services;

namespace CrystalReportsRptApi.Controllers
{
    /// <summary>
    /// POST /api/rpt/upload: recebe os .rpt enviados pela tela e devolve os
    /// objetos que cada um usa. Corresponde a enviarArquivos() em rptService.ts.
    ///
    /// Agora usando a leitura real (CrystalReportsRptService) — o mock foi
    /// removido depois que confirmamos, com um .rpt de verdade, que a
    /// leitura e a classificação por prefixo estavam funcionando.
    /// </summary>
    [RoutePrefix("api/rpt")]
    public class RptController : ApiController
    {
        private readonly IRptService _rptService;

        public RptController()
        {
            _rptService = new CrystalReportsRptService();
        }

        /// <summary>Lê um limite em MB do App.config; usa o padrão se faltar ou for inválido.</summary>
        private static long LerLimiteEmBytes(string chave, int padraoMb)
        {
            int mb;
            if (!int.TryParse(ConfigurationManager.AppSettings[chave], out mb) || mb <= 0)
            {
                mb = padraoMb;
            }
            return (long)mb * 1024 * 1024;
        }

        /// <summary>
        /// Assinatura (primeiros 8 bytes) dos arquivos "OLE2 / Compound File",
        /// que é o formato dos .rpt do Crystal Reports. Um arquivo renomeado
        /// para .rpt (um .exe, .zip, .pdf...) não começa com esses bytes.
        /// </summary>
        private static readonly byte[] AssinaturaRpt = { 0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1 };

        private static bool ConteudoPareceRpt(Stream stream)
        {
            if (stream.Length < AssinaturaRpt.Length)
            {
                return false;
            }

            var cabecalho = new byte[AssinaturaRpt.Length];
            int lidos = 0;
            while (lidos < cabecalho.Length)
            {
                int n = stream.Read(cabecalho, lidos, cabecalho.Length - lidos);
                if (n <= 0)
                {
                    break;
                }
                lidos += n;
            }

            // Volta ao início para a análise ler o arquivo inteiro depois.
            stream.Position = 0;

            if (lidos < cabecalho.Length)
            {
                return false;
            }

            for (int i = 0; i < cabecalho.Length; i++)
            {
                if (cabecalho[i] != AssinaturaRpt[i])
                {
                    return false;
                }
            }
            return true;
        }

        private static string EmMb(long bytes)
        {
            return (bytes / 1024.0 / 1024.0).ToString("0.0") + " MB";
        }

        /// <summary>
        /// POST /api/rpt/upload — recebe um ou mais arquivos .rpt enviados
        /// pelo navegador (multipart/form-data) e devolve os objetos de
        /// cada um. Usado pelo botão "Selecionar arquivos" / arrastar-e-
        /// soltar do front-end (DropzoneArquivos.tsx).
        /// </summary>
        [Route("upload")]
        [HttpPost]
        public async Task<IHttpActionResult> Upload()
        {
            try
            {
                if (!Request.Content.IsMimeMultipartContent())
                {
                    return BadRequest("Envie o(s) arquivo(s) como multipart/form-data.");
                }

                // LIMITE DE MEMÓRIA: o MultipartMemoryStreamProvider carrega o
                // envio inteiro na RAM, então o tamanho é checado ANTES de ler
                // o corpo. Sem Content-Length não dá para saber o tamanho,
                // então essa requisição é recusada.
                long limiteArquivo = LerLimiteEmBytes("TamanhoMaximoArquivoMB", 30);
                long limiteRequisicao = LerLimiteEmBytes("TamanhoMaximoRequisicaoMB", 60);
                long? tamanhoRequisicao = Request.Content.Headers.ContentLength;

                if (tamanhoRequisicao == null)
                {
                    return Content(HttpStatusCode.LengthRequired,
                        new { message = "Não foi possível verificar o tamanho do envio." });
                }

                if (tamanhoRequisicao.Value > limiteRequisicao)
                {
                    return Content(HttpStatusCode.RequestEntityTooLarge,
                        new { message = "O envio tem " + EmMb(tamanhoRequisicao.Value) + " e o limite é " + EmMb(limiteRequisicao) + ". Envie menos arquivos por vez." });
                }

                var provedor = new MultipartMemoryStreamProvider();
                await Request.Content.ReadAsMultipartAsync(provedor);

                var resultado = new List<ArquivoRpt>();

                foreach (var parte in provedor.Contents)
                {
                    var nomeArquivo = parte.Headers.ContentDisposition?.FileName?.Trim('"');

                    if (string.IsNullOrWhiteSpace(nomeArquivo))
                    {
                        // Ignora campos do formulário que não são arquivo.
                        continue;
                    }

                    // VALIDAÇÃO 1: a extensão precisa ser .rpt.
                    if (!nomeArquivo.EndsWith(".rpt", StringComparison.OrdinalIgnoreCase))
                    {
                        return Content(HttpStatusCode.BadRequest,
                            new { message = "O arquivo \"" + nomeArquivo + "\" não é um .rpt (a extensão precisa ser .rpt)." });
                    }

                    using (var stream = await parte.ReadAsStreamAsync())
                    {
                        // VALIDAÇÃO 2: o conteúdo precisa ter cara de .rpt de verdade.
                        // Feita antes de entregar o arquivo ao Crystal, para o motor
                        // nunca tentar abrir algo que não é um relatório.
                        if (!ConteudoPareceRpt(stream))
                        {
                            return Content(HttpStatusCode.BadRequest,
                                new { message = "O arquivo \"" + nomeArquivo + "\" não é um relatório do Crystal Reports válido (o conteúdo não confere com um .rpt)." });
                        }

                        if (stream.Length > limiteArquivo)
                        {
                            return Content(HttpStatusCode.RequestEntityTooLarge,
                                new { message = "O arquivo \"" + nomeArquivo + "\" tem " + EmMb(stream.Length) + " e o limite é " + EmMb(limiteArquivo) + "." });
                        }

                        var arquivo = await _rptService.AnalisarArquivoAsync(nomeArquivo, stream);
                        resultado.Add(arquivo);
                    }
                }

                return Ok(resultado);
            }
            catch (Exception ex)
            {
                Console.WriteLine("========== ERRO em POST /api/rpt/upload ==========");
                Console.WriteLine("Tipo: " + ex.GetType().FullName);
                Console.WriteLine("Mensagem: " + ex.Message);
                Console.WriteLine("StackTrace: " + ex.StackTrace);
                if (ex.InnerException != null)
                {
                    Console.WriteLine("Inner: " + ex.InnerException.GetType().FullName + " - " + ex.InnerException.Message);
                }
                Console.WriteLine("====================================================");

                return Content(HttpStatusCode.InternalServerError,
                    new { message = "Não foi possível analisar o arquivo. Verifique se é um .rpt válido. Os detalhes estão no log do servidor." });
            }
        }
    }
}
