# Consulta RPT

Ferramenta que mostra **quais tabelas, views e stored procedures cada relatório Crystal Reports (`.rpt`) usa**, e o caminho inverso: **quais relatórios dependem de um determinado objeto do banco SQL Server**.

> Projeto desenvolvido por mim para uso interno em uma empresa de logística. Esta é uma versão de portfólio, sem dados, nomes ou marcas da empresa.

## O problema

Em empresas com dezenas de relatórios Crystal Reports, alterar uma view ou uma stored procedure no banco é arriscado: não existe um jeito fácil de saber quais relatórios vão quebrar. A alternativa era abrir cada `.rpt` no Crystal e conferir as fontes de dados uma por uma.

## A solução

1. O usuário arrasta os arquivos `.rpt` para a tela.
2. A API em C# abre cada relatório com o SDK do Crystal Reports e lê as fontes de dados declaradas nele (sem conectar no banco e sem executar o relatório).
3. A tela mostra duas visões:
   - **Arquivo → Objetos:** cada relatório com os objetos que ele usa.
   - **Objeto → Arquivos:** cada tabela, view ou procedure com os relatórios que dependem dela.

Exemplo: antes de alterar a view `vw_FreteConsolidado`, você descobre em segundos quais relatórios serão afetados.

## Funcionalidades

- **Arrastar e soltar** em qualquer parte da página, com barra de progresso e tempo restante estimado.
- **Sem duplicados:** o mesmo arquivo não é processado duas vezes, mesmo com nome diferente (hash do conteúdo e comparação do nome-base com os objetos encontrados).
- **Validação:** só aceita `.rpt` de verdade (assinatura binária OLE2) e com tamanho máximo configurável, no frontend e no backend.
- **Histórico salvo** no navegador: arquivos, aba, busca, filtro e posição da rolagem sobrevivem ao recarregar a página.
- **Busca e filtro** por tipo de objeto (tabela, view, procedure).
- **Tema claro e escuro.**
- **Executável único:** o `ConsultaRPT.exe` sobe a API e entrega a tela. O usuário final só dá dois cliques, sem instalar Node ou .NET SDK.

## Arquitetura

```
Navegador (React)  ──HTTP──▶  ConsultaRPT.exe (OWIN self-host)
                                 ├── /          → tela compilada (wwwroot)
                                 └── /api/...   → Web API 2 → SDK do Crystal Reports → lê o .rpt
```

**Decisões técnicas:**

| Decisão | Motivo |
|---|---|
| Backend em **.NET Framework 4.8** (e não .NET 8) | O SDK do Crystal Reports só existe para .NET Framework |
| **OWIN self-host** em vez de IIS | Roda como um `.exe` comum, sem instalar nem configurar IIS |
| A API **serve a própria tela** | Um único processo e um único endereço, sem CORS em produção e sem precisar de Node no computador do usuário |
| Tipo do objeto deduzido **pelo prefixo** | O SDK não informa se é tabela, view ou procedure. Regra: `VW_` é view, `SP_`/`USP_` é procedure, o resto é tabela |
| `index.html` com **`Cache-Control: no-cache`** | Garante que o navegador pegue a versão nova da tela após uma atualização |
| Porta com **fallback automático** | Se a 5000 estiver ocupada, tenta 5001 a 5009 sozinho |

## Tecnologias

**Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4.
**Backend:** C#, .NET Framework 4.8, ASP.NET Web API 2, OWIN, SAP Crystal Reports SDK.

## Como rodar

**Requisitos:** Windows 64 bits e o **SAP Crystal Reports runtime 64 bits** (o SDK precisa dele para abrir os `.rpt`), disponível no [site oficial do SAP Crystal Reports](https://www.sap.com/products/data-cloud/crystal-reports.html). Para compilar: [.NET SDK](https://dotnet.microsoft.com/download) e [Node.js](https://nodejs.org) 20 ou superior.

**Gerar o executável:** dê dois cliques em `publicar.bat`. Ele compila a tela e a API e gera a pasta `publicado/` e o `ConsultaRPT.zip`. Depois é só abrir `publicado/ConsultaRPT.exe`.

**Desenvolvimento:**

```bash
# backend: abra CrystalReportsRptApi no Visual Studio e execute (F5)

# frontend
cd rpt-frontend
copy .env.example .env
npm install
npm run dev
```

Sem o runtime do Crystal, dá para testar a tela trocando `new CrystalReportsRptService()` por `new MockRptService()` no `RptController`. O mock devolve relatórios de exemplo.

## API

| Método | Rota | O que faz |
|---|---|---|
| `POST` | `/api/rpt/upload` | Recebe os `.rpt` e devolve os objetos de cada um |

## Estrutura

```
├── CrystalReportsRptApi/   Backend C# (API + servidor da tela)
│   ├── Controllers/        Rotas da API
│   ├── Services/           Leitura dos .rpt (real e mock)
│   └── Models/
├── rpt-frontend/           Tela em React
│   └── src/components/     Componentes da interface
└── publicar.bat            Gera o executável e o zip
```

## Autora

Desenvolvido por **Clarissa**, estudante de Análise e Desenvolvimento de Sistemas. [github.com/cissamil](https://github.com/cissamil)
