using System;
using System.IO;
using System.Web.Http;
using Microsoft.Owin.Cors;
using Microsoft.Owin.FileSystems;
using Microsoft.Owin.StaticFiles;
using Newtonsoft.Json.Serialization;
using Owin;

namespace CrystalReportsRptApi
{
    /// <summary>
    /// Configuração do OWIN — equivalente ao antigo Program.cs do .NET 8
    /// (registro de rotas, CORS, formato do JSON). Chamada automaticamente
    /// pelo WebApp.Start&lt;Startup&gt;() em Program.cs.
    /// </summary>
    public class Startup
    {
        public void Configuration(IAppBuilder app)
        {
            // CORS: libera o front-end React (Vite), que roda em outra porta
            // (localhost:5173) durante o desenvolvimento. Simplificado para
            // "permitir tudo" por enquanto — dá para restringir à origem
            // exata depois, igual fazíamos no .NET 8.
            app.UseCors(CorsOptions.AllowAll);

            // Serve a tela (React) a partir da pasta "wwwroot" ao lado do .exe.
            // Assim a API e a tela ficam no mesmo endereço e o usuário não
            // precisa rodar npm. Se a pasta não existir (modo desenvolvimento,
            // com npm run dev), esta parte simplesmente é ignorada.
            string pastaSite = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "wwwroot");
            if (Directory.Exists(pastaSite))
            {
                var opcoesSite = new FileServerOptions
                {
                    FileSystem = new PhysicalFileSystem(pastaSite),
                    EnableDefaultFiles = true,
                    EnableDirectoryBrowsing = false
                };

                // O index.html nunca deve ficar guardado em cache: é ele que
                // aponta para os arquivos novos (index-XXXX.js/.css) depois de
                // um publicar.bat. Sem isso o navegador continua mostrando a
                // versão antiga da tela.
                opcoesSite.StaticFileOptions.OnPrepareResponse = contexto =>
                {
                    if (string.Equals(contexto.File.Name, "index.html", StringComparison.OrdinalIgnoreCase))
                    {
                        contexto.OwinContext.Response.Headers.Set("Cache-Control", "no-cache, no-store, must-revalidate");
                    }
                };

                app.UseFileServer(opcoesSite);
            }

            var config = new HttpConfiguration();

            // SEGURANÇA: não devolve a mensagem/stack trace da exceção ao
            // navegador (isso revelaria caminhos de pastas e detalhes
            // internos). O erro completo continua sendo escrito no terminal
            // do servidor (Console.WriteLine nos controllers) e o cliente
            // recebe só uma mensagem amigável.
            config.IncludeErrorDetailPolicy = IncludeErrorDetailPolicy.Never;

            config.MapHttpAttributeRoutes();

            // JSON em camelCase (arquivoNome, tipoObjeto...), igual ao
            // System.Text.Json padrão do .NET 8 — mantém o front-end
            // funcionando sem precisar mudar nada lá.
            config.Formatters.JsonFormatter.SerializerSettings.ContractResolver =
                new CamelCasePropertyNamesContractResolver();

            // Só JSON — remove o formatter XML padrão do Web API.
            config.Formatters.Remove(config.Formatters.XmlFormatter);

            app.UseWebApi(config);
        }
    }
}
