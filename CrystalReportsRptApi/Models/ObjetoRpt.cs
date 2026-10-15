namespace CrystalReportsRptApi.Models
{
    /// <summary>
    /// Um objeto do banco (tabela, view ou stored procedure) usado por um
    /// relatório. Antes era um "record" (C# 9) — viramos uma classe comum
    /// porque é a forma mais segura/compatível em .NET Framework 4.8 (evita
    /// depender do polyfill "IsExternalInit" que os records exigem fora do
    /// .NET 5+). O comportamento é o mesmo.
    /// </summary>
    public class ObjetoRpt
    {
        public TipoObjeto Tipo { get; set; }
        public string Nome { get; set; }

        public ObjetoRpt()
        {
        }

        public ObjetoRpt(TipoObjeto tipo, string nome)
        {
            Tipo = tipo;
            Nome = nome;
        }
    }
}
