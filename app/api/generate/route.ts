import Anthropic from '@anthropic-ai/sdk'
import { NextResponse } from 'next/server'
import { GenerateRequest, ExecutionResult } from '@/lib/types'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: Request) {
  try {
    const body: GenerateRequest = await req.json()
    const { question, schema, dialect, connectionString, execute } = body

    if (!question?.trim()) {
      return NextResponse.json({ error: 'Question is required' }, { status: 400 })
    }
    if (!schema?.trim()) {
      return NextResponse.json({ error: 'Schema is required' }, { status: 400 })
    }

    const systemPrompt = `You are an expert SQL assistant. Given a database schema and a natural language question, generate the most accurate and efficient SQL query.

Rules:
- Output ONLY a JSON object with exactly two fields: "sql" and "explanation"
- "sql": the complete SQL query, properly formatted with newlines and indentation
- "explanation": a brief 1-2 sentence plain English explanation of what the query does
- Use ${dialect} syntax specifically
- Use proper quoting for identifiers when needed
- Do not include markdown code fences in the sql field
- If the question cannot be answered with the given schema, set sql to empty string and explain why in explanation

Example output format:
{"sql": "SELECT *\nFROM users\nWHERE active = true;", "explanation": "Retrieves all columns for users who are currently active."}`

    const userMessage = `Database schema (${dialect}):
\`\`\`sql
${schema}
\`\`\`

Question: ${question}

Generate the SQL query.`

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    })

    const rawText = message.content[0].type === 'text' ? message.content[0].text : ''

    let sql = ''
    let explanation = ''

    try {
      const cleaned = rawText.replace(/```json\n?|\n?```/g, '').trim()
      const parsed = JSON.parse(cleaned)
      sql = parsed.sql ?? ''
      explanation = parsed.explanation ?? ''
    } catch {
      // Fallback: try to extract SQL from raw text
      sql = rawText
      explanation = 'Query generated.'
    }

    // Optionally execute against DB
    let executionResult: ExecutionResult | undefined

    if (execute && connectionString && sql) {
      executionResult = await executeQuery(sql, connectionString, dialect)
    }

    return NextResponse.json({ sql, explanation, executionResult })
  } catch (err: unknown) {
    console.error('Generate error:', err)
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

async function executeQuery(
  sql: string,
  connectionString: string,
  dialect: string
): Promise<ExecutionResult> {
  const start = Date.now()

  try {
    if (dialect === 'postgresql') {
      const { Client } = await import('pg')
      const client = new Client({ connectionString, connectionTimeoutMillis: 5000 })
      await client.connect()
      try {
        const result = await client.query(sql)
        return {
          columns: result.fields.map(f => f.name),
          rows: result.rows,
          rowCount: result.rowCount ?? result.rows.length,
          durationMs: Date.now() - start,
        }
      } finally {
        await client.end()
      }
    }

    if (dialect === 'mysql') {
      const mysql = await import('mysql2/promise')
      const conn = await mysql.createConnection(connectionString)
      try {
        const [rows, fields] = await conn.execute(sql)
        const columns = Array.isArray(fields) ? fields.map((f: { name: string }) => f.name) : []
        const rowArray = Array.isArray(rows) ? rows as Record<string, unknown>[] : []
        return {
          columns,
          rows: rowArray,
          rowCount: rowArray.length,
          durationMs: Date.now() - start,
        }
      } finally {
        await conn.end()
      }
    }

    return { columns: [], rows: [], rowCount: 0, error: `Dialect "${dialect}" execution not supported in this environment.` }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Query execution failed'
    return { columns: [], rows: [], rowCount: 0, error: message, durationMs: Date.now() - start }
  }
}
