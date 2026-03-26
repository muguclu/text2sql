'use client'

import { useState, useRef } from 'react'
import { SchemaInputMode, DbDialect, SchemaTable } from '@/lib/types'
import { parseCSVToSchema, schemaToSQL, extractTablesFromSQL } from '@/lib/schema-parser'

interface Props {
  schema: string
  dialect: DbDialect
  connectionString: string
  onSchemaChange: (schema: string) => void
  onDialectChange: (dialect: DbDialect) => void
  onConnectionStringChange: (cs: string) => void
}

const DIALECTS: { value: DbDialect; label: string }[] = [
  { value: 'postgresql', label: 'PostgreSQL' },
  { value: 'mysql',      label: 'MySQL' },
  { value: 'sqlite',     label: 'SQLite' },
]

const EXAMPLE_SCHEMA = `CREATE TABLE users (
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
);`

export default function SchemaInput({
  schema, dialect, connectionString,
  onSchemaChange, onDialectChange, onConnectionStringChange
}: Props) {
  const [mode, setMode] = useState<SchemaInputMode>('manual')
  const [csvTableName, setCsvTableName] = useState('my_table')
  const [csvError, setCsvError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setCsvError('')
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const content = ev.target?.result as string
        const table: SchemaTable = parseCSVToSchema(content, csvTableName || file.name.replace('.csv', ''))
        const sql = schemaToSQL([table], dialect)
        onSchemaChange(sql)
      } catch {
        setCsvError('Could not parse CSV. Make sure the first row is a header.')
      }
    }
    reader.readAsText(file)
  }

  const tables = schema ? extractTablesFromSQL(schema) : []

  return (
    <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between gap-4">
        <h2 className="font-semibold text-stone-900 text-sm">Database Schema</h2>
        <select
          value={dialect}
          onChange={e => onDialectChange(e.target.value as DbDialect)}
          className="text-xs border border-stone-200 rounded-lg px-2.5 py-1.5 bg-white text-stone-700 focus:outline-none focus:ring-2 focus:ring-violet-500/30"
        >
          {DIALECTS.map(d => (
            <option key={d.value} value={d.value}>{d.label}</option>
          ))}
        </select>
      </div>

      {/* Mode tabs */}
      <div className="flex border-b border-stone-100">
        {(['manual', 'csv', 'connection'] as SchemaInputMode[]).map(m => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`flex-1 py-2.5 text-xs font-medium transition-colors ${
              mode === m
                ? 'text-violet-600 border-b-2 border-violet-500 bg-violet-50/50'
                : 'text-stone-500 hover:text-stone-700'
            }`}
          >
            {m === 'manual' ? 'SQL Schema' : m === 'csv' ? 'CSV Upload' : 'Connection'}
          </button>
        ))}
      </div>

      <div className="p-4">
        {/* Manual mode */}
        {mode === 'manual' && (
          <div className="space-y-2">
            <textarea
              value={schema}
              onChange={e => onSchemaChange(e.target.value)}
              placeholder="Paste your CREATE TABLE statements here..."
              className="w-full h-52 font-mono text-xs text-stone-800 bg-stone-50 border border-stone-200 rounded-xl p-3 resize-none focus:outline-none focus:ring-2 focus:ring-violet-500/30 placeholder:text-stone-400"
              spellCheck={false}
            />
            <button
              onClick={() => onSchemaChange(EXAMPLE_SCHEMA)}
              className="text-xs text-violet-500 hover:text-violet-700 transition-colors"
            >
              Load example schema →
            </button>
          </div>
        )}

        {/* CSV mode */}
        {mode === 'csv' && (
          <div className="space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={csvTableName}
                onChange={e => setCsvTableName(e.target.value)}
                placeholder="Table name"
                className="flex-1 text-sm border border-stone-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500/30"
              />
            </div>
            <div
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-stone-200 rounded-xl p-8 text-center cursor-pointer hover:border-violet-300 hover:bg-violet-50/30 transition-colors"
            >
              <div className="text-2xl mb-2">📄</div>
              <div className="text-sm text-stone-600">Click to upload CSV</div>
              <div className="text-xs text-stone-400 mt-1">First row should be column headers</div>
            </div>
            <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleCSVUpload} />
            {csvError && <p className="text-xs text-red-500">{csvError}</p>}
            {schema && (
              <div className="bg-stone-50 rounded-xl p-3">
                <div className="text-xs font-medium text-stone-500 mb-1">Generated schema:</div>
                <pre className="text-xs text-stone-700 overflow-auto">{schema}</pre>
              </div>
            )}
          </div>
        )}

        {/* Connection mode */}
        {mode === 'connection' && (
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-stone-600 block mb-1.5">Connection string</label>
              <input
                type="password"
                value={connectionString}
                onChange={e => onConnectionStringChange(e.target.value)}
                placeholder={dialect === 'postgresql'
                  ? 'postgresql://user:password@host:5432/dbname'
                  : 'mysql://user:password@host:3306/dbname'}
                className="w-full text-sm font-mono border border-stone-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-500/30"
                spellCheck={false}
              />
            </div>
            <p className="text-xs text-stone-400">
              Connection is only used when &quot;Execute query&quot; is enabled. Schema is still required for SQL generation.
            </p>
            {schema && (
              <textarea
                value={schema}
                onChange={e => onSchemaChange(e.target.value)}
                placeholder="Paste your schema here too (needed for SQL generation)..."
                className="w-full h-36 font-mono text-xs text-stone-800 bg-stone-50 border border-stone-200 rounded-xl p-3 resize-none focus:outline-none focus:ring-2 focus:ring-violet-500/30"
                spellCheck={false}
              />
            )}
            {!schema && (
              <textarea
                onChange={e => onSchemaChange(e.target.value)}
                placeholder="Also paste your schema here (needed for SQL generation)..."
                className="w-full h-36 font-mono text-xs text-stone-800 bg-stone-50 border border-stone-200 rounded-xl p-3 resize-none focus:outline-none focus:ring-2 focus:ring-violet-500/30"
                spellCheck={false}
              />
            )}
          </div>
        )}

        {/* Table preview pills */}
        {tables.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {tables.map(t => (
              <span key={t.name} className="inline-flex items-center gap-1 text-xs bg-violet-50 text-violet-700 border border-violet-100 px-2 py-0.5 rounded-full">
                <span className="opacity-50">⊞</span> {t.name}
                <span className="text-violet-400">({t.columns.length})</span>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
