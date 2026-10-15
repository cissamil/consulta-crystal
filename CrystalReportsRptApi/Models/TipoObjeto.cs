using Newtonsoft.Json;
using Newtonsoft.Json.Converters;

namespace CrystalReportsRptApi.Models
{
    /// <summary>
    /// Espelha o union type "TipoObjeto" do front-end (src/types/rpt.ts).
    /// O StringEnumConverter (Newtonsoft) faz o JSON sair como "Tabela",
    /// "View" ou "StoredProcedure" (texto) em vez de número — antes usávamos
    /// o JsonStringEnumConverter do System.Text.Json; a ideia é a mesma, só
    /// muda a biblioteca porque no .NET Framework o Web API clássico usa
    /// Newtonsoft.Json por padrão.
    /// </summary>
    [JsonConverter(typeof(StringEnumConverter))]
    public enum TipoObjeto
    {
        Tabela,
        View,
        StoredProcedure,
    }
}
