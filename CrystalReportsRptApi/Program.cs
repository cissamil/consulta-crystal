using System;
using System.Collections.Generic;
using System.Configuration;
using System.Diagnostics;
using System.Net;
using Microsoft.Owin.Hosting;

namespace CrystalReportsRptApi
{
    /// <summary>
    /// Ponto de entrada: um .exe de console que auto-hospeda a API (OWIN) e
    /// também serve a tela (pasta wwwroot). Ao abrir, ele já abre o navegador,
    /// então o usuário só precisa dar dois cliques no ConsultaRPT.exe.
    /// </summary>
    internal class Program
    {
        private static void Main(string[] args)
        {
            Console.Title = "Consulta RPT";

            // Endereço lido do App.config. O padrão (localhost) só aceita
            // acesso do próprio PC. Para liberar para a rede, use
            // http://+:5000/ (exige o comando netsh descrito no README).
            string endereco = ConfigurationManager.AppSettings["Endereco"];
            if (string.IsNullOrWhiteSpace(endereco)) endereco = "http://localhost:5000/";
            if (!endereco.EndsWith("/")) endereco += "/";

            Exception ultimoErro = null;

            // Se a porta estiver ocupada ou reservada por outro programa,
            // tenta as próximas (5001, 5002...). Como a tela usa o mesmo
            // endereço da API, a troca de porta é transparente.
            foreach (string tentativa in EnderecosParaTentar(endereco))
            {
                try
                {
                    Executar(tentativa);
                    return;
                }
                catch (Exception ex)
                {
                    if (EncontrarErroDeRede(ex) == null)
                    {
                        MostrarErroDeInicializacao(ex, tentativa);
                        return;
                    }
                    ultimoErro = ex;
                }
            }

            MostrarErroDeInicializacao(ultimoErro, endereco);
        }

        private static void Executar(string endereco)
        {
            using (WebApp.Start<Startup>(endereco))
            {
                string urlNavegador = endereco.Replace("+", "localhost").Replace("*", "localhost");

                Console.WriteLine("Consulta RPT em execução.");
                Console.WriteLine("Endereço: " + urlNavegador);
                Console.WriteLine();
                Console.WriteLine("Mantenha esta janela aberta enquanto usa o sistema (pode minimizar).");
                Console.WriteLine("Para encerrar, feche a janela ou pressione ENTER.");

                if (!string.Equals(ConfigurationManager.AppSettings["AbrirNavegador"], "false", StringComparison.OrdinalIgnoreCase))
                {
                    AbrirNoNavegador(urlNavegador);
                }

                Console.ReadLine();
            }
        }

        /// <summary>
        /// O endereço configurado primeiro; se for do tipo localhost, depois
        /// as 9 portas seguintes.
        /// </summary>
        private static IEnumerable<string> EnderecosParaTentar(string endereco)
        {
            yield return endereco;

            Uri uri;
            if (endereco.IndexOf("localhost", StringComparison.OrdinalIgnoreCase) >= 0
                && Uri.TryCreate(endereco, UriKind.Absolute, out uri))
            {
                for (int i = 1; i <= 9; i++)
                {
                    yield return uri.Scheme + "://localhost:" + (uri.Port + i) + "/";
                }
            }
        }

        private static HttpListenerException EncontrarErroDeRede(Exception ex)
        {
            for (Exception atual = ex; atual != null; atual = atual.InnerException)
            {
                HttpListenerException erroDeRede = atual as HttpListenerException;
                if (erroDeRede != null) return erroDeRede;
            }
            return null;
        }

        private static void AbrirNoNavegador(string url)
        {
            try
            {
                Process.Start(url);
            }
            catch (Exception)
            {
                Console.WriteLine("Não consegui abrir o navegador sozinho. Abra manualmente: " + url);
            }
        }

        /// <summary>
        /// Traduz os erros mais comuns de inicialização em mensagens que o
        /// usuário consegue resolver sozinho.
        /// </summary>
        private static void MostrarErroDeInicializacao(Exception ex, string endereco)
        {
            HttpListenerException erroDeRede = EncontrarErroDeRede(ex);

            Console.WriteLine();
            if (erroDeRede != null)
            {
                Console.WriteLine("Não foi possível iniciar em " + endereco + " (e nas portas seguintes).");
                Console.WriteLine("Código do Windows: " + erroDeRede.ErrorCode + " (" + erroDeRede.Message + ")");
                Console.WriteLine("Verifique se outra janela do Consulta RPT (ou o Visual Studio) já está aberta.");
            }
            else
            {
                Console.WriteLine("Erro ao iniciar: " + (ex == null ? "desconhecido" : ex.Message));
            }

            Console.WriteLine();
            Console.WriteLine("Pressione ENTER para fechar.");
            Console.ReadLine();
        }
    }
}
