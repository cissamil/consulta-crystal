using System.Collections.Generic;

namespace CrystalReportsRptApi.Models
{
    /// <summary>
    /// Um objeto do banco e a lista de arquivos .rpt que o utilizam (índice
    /// inverso).
    /// </summary>
    public class ObjetoComArquivos
    {
        public TipoObjeto Tipo { get; set; }
        public string Nome { get; set; }
        public List<string> Arquivos { get; set; }

        public ObjetoComArquivos()
        {
        }

        public ObjetoComArquivos(TipoObjeto tipo, string nome, List<string> arquivos)
        {
            Tipo = tipo;
            Nome = nome;
            Arquivos = arquivos;
        }
    }
}
