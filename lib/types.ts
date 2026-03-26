export type SchemaInputMode = 'manual' | 'csv' | 'connection'
export type DbDialect = 'postgresql' | 'mysql' | 'sqlite'

export interface SchemaTable {
  name: string
  columns: { name: string; type: string; nullable?: boolean; primaryKey?: boolean }[]
}

export interface QueryHistoryItem {
  id: string
  question: string
  sql: string
  dialect: DbDialect
  timestamp: Date
  executionResult?: ExecutionResult
}

export interface ExecutionResult {
  columns: string[]
  rows: Record<string, unknown>[]
  rowCount: number
  error?: string
  durationMs?: number
}

export interface GenerateRequest {
  question: string
  schema: string
  dialect: DbDialect
  connectionString?: string
  execute?: boolean
}

export interface GenerateResponse {
  sql: string
  explanation: string
  executionResult?: ExecutionResult
  error?: string
}
