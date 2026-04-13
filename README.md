# Dash Comparativo

Dashboard premium para comparar captação de leads de três lançamentos digitais com base em tempo relativo desde o início da captação.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Apache ECharts

## Rodando localmente

```bash
npm install
npm run dev
```

Abra `http://localhost:3000/dashboard`.

## Fonte de dados

Por padrão, a aplicação consulta `/api/dashboard`.

Essa rota suporta duas estratégias:

1. Ler uma planilha `.xlsx` local no servidor usando `SPREADSHEET_FILE_PATH`.
2. Ler a exportação `.xlsx` do próprio Google Sheets usando `GOOGLE_SHEETS_XLSX_URL`.
3. Repassar um JSON externo de Google Sheets/Apps Script usando `DASHBOARD_SOURCE_JSON_URL`.

Se nada for configurado, o projeto cai no mock local.

Para apontar para a API real do Google Sheets/Apps Script, ajuste:

```bash
DASHBOARD_SOURCE_JSON_URL=https://sua-url-json
```

Para usar a exportação XLSX do Google Sheets:

```bash
GOOGLE_SHEETS_XLSX_URL=https://docs.google.com/spreadsheets/d/<SHEET_ID>/export?format=xlsx
```

Para usar a planilha local anexada:

```bash
SPREADSHEET_FILE_PATH=/Users/johncintra/Downloads/Dash Comparativo (1).xlsx
```

## Rotas

- `/dashboard`
- `/dashboard/tv`
