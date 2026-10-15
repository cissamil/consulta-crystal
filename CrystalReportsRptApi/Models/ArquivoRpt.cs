using System.Collections.Generic;

namespace CrystalReportsRptApi.Models
{
    /// <summary>Um arquivo .rpt e os objetos do banco que ele utiliza.</summary>
    public class ArquivoRpt
    {
        public string Nome { get; set; }
        public List<ObjetoRpt> Objetos { get; set; }

        public ArquivoRpt()
        {
        }

        public ArquivoRpt(string nome, List<ObjetoRpt> objetos)
        {
            Nome = nome;
            Objetos = objetos;
        }
    }
}
