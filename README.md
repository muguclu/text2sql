# Text to SQL

Convert natural language questions into SQL queries using [Claude AI](https://www.anthropic.com/claude). Paste your database schema, ask a question in plain English, and get a formatted, syntax-highlighted SQL query with an explanation — instantly.

![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38bdf8?logo=tailwindcss)
![Claude](https://img.shields.io/badge/Claude-claude--sonnet--4-orange)

---

## Features

- **Natural language → SQL** — describe what you want in plain English and get a production-ready SQL query
- **Dialect support** — PostgreSQL, MySQL, and SQLite
- **Three schema input modes**
  - *SQL Schema* — paste `CREATE TABLE` statements directly
  - *CSV Upload* — upload a CSV file and the schema is inferred from the headers and sample values
  - *Connection* — provide a connection string to execute queries against a live database
- **Syntax highlighting** — generated SQL is rendered with full syntax highlighting via `react-syntax-highlighter`
- **Explanation panel** — each query comes with a plain-English description of what it does
- **Live query execution** — toggle "Execute query" to run the generated SQL against your database and see results in a table
- **Query history** — every successful generation is saved in-session; click any item to restore the question and result
- **Copy to clipboard** — one-click copy button on every SQL output
- **Table preview pills** — detected tables from the schema are shown as pills with column counts
- **Keyboard shortcut** — `⌘↵` (Mac) / `Ctrl↵` (Windows) to generate

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS |
| AI | Anthropic Claude (`claude-sonnet-4-20250514`) |
| SQL Highlighting | react-syntax-highlighter (Prism) |
| DB Drivers | `pg` (PostgreSQL), `mysql2` (MySQL) |
| CSV Parsing | `csv-parse` |
| Font | Inter (Google Fonts) |

---

## Project Structure

```
text-to-sql/
├── app/
│   ├── api/
│   │   └── generate/
│   │       └── route.ts        # POST /api/generate — Claude + optional DB execution
│   ├── globals.css             # Tailwind base styles
│   ├── layout.tsx              # Root layout (Inter font, metadata)
│   └── page.tsx                # Main page — wires all components together
│
├── components/
│   ├── SchemaInput.tsx         # Left panel: schema input with 3 modes + dialect selector
│   ├── SQLOutput.tsx           # Right panel: SQL display, explanation, results table
│   └── QueryHistory.tsx        # Session history list with restore on click
│
├── lib/
│   ├── schema-parser.ts        # CSV → schema, schema → SQL, SQL → table list
│   └── types.ts                # Shared TypeScript interfaces and types
│
├── .env.example                # Environment variable template
├── .env.local                  # Local secrets (git-ignored)
└── netlify.toml                # Netlify deployment config
```

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/your-username/text-to-sql.git
cd text-to-sql
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

```bash
cp .env.example .env.local
```

Open `.env.local` and add your Anthropic API key:

```env
ANTHROPIC_API_KEY=sk-ant-...
```

Get your key at [console.anthropic.com](https://console.anthropic.com) → **API Keys → Create Key**.

> The key is server-side only — it has no `NEXT_PUBLIC_` prefix and is never sent to the browser.

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## API Reference

### `POST /api/generate`

Generates a SQL query from a natural language question and optional executes it.

**Request body**

```ts
{
  question: string          // natural language question (required)
  schema: string            // CREATE TABLE statements (required)
  dialect: "postgresql" | "mysql" | "sqlite"
  connectionString?: string // only used when execute: true
  execute?: boolean         // run the query and return results
}
```

**Response**

```ts
{
  sql: string               // formatted SQL query
  explanation: string       // plain-English explanation
  executionResult?: {
    columns: string[]
    rows: Record<string, unknown>[]
    rowCount: number
    durationMs: number
    error?: string
  }
  error?: string
}
```

---

## How It Works

1. The user pastes a schema (or uploads a CSV / provides a connection string)
2. On submit, the client calls `POST /api/generate` with the question, schema, and dialect
3. The API route builds a structured prompt and sends it to Claude via `@anthropic-ai/sdk`
4. Claude returns a JSON object with `sql` and `explanation` fields
5. If "Execute query" is enabled and a connection string is provided, the route connects to the database using `pg` or `mysql2` and runs the query
6. The response is rendered in `SQLOutput` with syntax highlighting and (optionally) a results table

---

## Deployment

The app is deployed on Vercel. To deploy your own instance:

```bash
npx vercel        # preview deployment
npx vercel --prod # production deployment
```

After deploying, add `ANTHROPIC_API_KEY` in your Vercel project:

**Vercel Dashboard → Project → Settings → Environment Variables**

---

## Local Schema Example

The app ships with a built-in example schema you can load with one click:

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  total NUMERIC(10,2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id),
  product_name VARCHAR(200) NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price NUMERIC(10,2) NOT NULL
);
```

Example questions to try:
- *Show me all users who placed more than 3 orders*
- *What is the total revenue per month in 2024?*
- *List the top 5 products by total quantity sold*
- *Find users who have never placed an order*

---

## License

MIT
