'use client'

import { useState, useCallback } from 'react'
import { DbDialect, QueryHistoryItem, GenerateResponse } from '@/lib/types'
import SchemaInput from '@/components/SchemaInput'
import SQLOutput from '@/components/SQLOutput'
import QueryHistory from '@/components/QueryHistory'

export default function TextToSQL() {
  const [schema, setSchema] = useState('')
  const [dialect, setDialect] = useState<DbDialect>('postgresql')
  const [connectionString, setConnectionString] = useState('')
  const [question, setQuestion] = useState('')
  const [executeQuery, setExecuteQuery] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<GenerateResponse | null>(null)
  const [history, setHistory] = useState<QueryHistoryItem[]>([])

  const generate = useCallback(async () => {
    if (!question.trim() || !schema.trim() || isLoading) return

    setIsLoading(true)
    setResult(null)

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          schema,
          dialect,
          connectionString: executeQuery ? connectionString : undefined,
          execute: executeQuery && !!connectionString,
        }),
      })

      const data: GenerateResponse = await res.json()
      setResult(data)

      if (data.sql && !data.error) {
        const historyItem: QueryHistoryItem = {
          id: crypto.randomUUID(),
          question,
          sql: data.sql,
          dialect,
          timestamp: new Date(),
          executionResult: data.executionResult,
        }
        setHistory(prev => [...prev, historyItem])
      }
    } catch (err) {
      console.error(err)
      setResult({ sql: '', explanation: '', error: 'Network error. Please try again.' })
    } finally {
      setIsLoading(false)
    }
  }, [question, schema, dialect, connectionString, executeQuery, isLoading])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      generate()
    }
  }

  const loadFromHistory = (item: QueryHistoryItem) => {
    setQuestion(item.question)
    setDialect(item.dialect)
    setResult({ sql: item.sql, explanation: '', executionResult: item.executionResult })
  }

  return (
    <div className="min-h-screen bg-[#fafaf8]">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-stone-200/80 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
              ⚡
            </div>
            <div>
              <h1 className="text-base font-semibold text-stone-900 leading-none">Text to SQL</h1>
              <p className="text-xs text-stone-400 mt-0.5">Natural language → SQL query</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-stone-400">Powered by</span>
            <span className="text-xs font-medium text-stone-600 bg-stone-100 px-2 py-1 rounded-lg">Claude</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-5 py-8">
        <div className="grid lg:grid-cols-[380px_1fr] gap-6">
          {/* Left: Schema input */}
          <div className="space-y-4">
            <SchemaInput
              schema={schema}
              dialect={dialect}
              connectionString={connectionString}
              onSchemaChange={setSchema}
              onDialectChange={setDialect}
              onConnectionStringChange={setConnectionString}
            />
            <QueryHistory
              history={history}
              onSelect={loadFromHistory}
              onClear={() => setHistory([])}
            />
          </div>

          {/* Right: Question + output */}
          <div className="space-y-4">
            {/* Question input */}
            <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
              <div className="px-5 pt-4 pb-2">
                <label className="text-xs font-semibold text-stone-500 uppercase tracking-wide block mb-2">
                  Ask a question
                </label>
                <textarea
                  value={question}
                  onChange={e => setQuestion(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="e.g. Show me the top 10 customers by total order value in the last 30 days"
                  className="w-full h-24 text-sm text-stone-800 bg-transparent resize-none focus:outline-none placeholder:text-stone-300"
                  spellCheck={false}
                />
              </div>
              <div className="px-4 py-3 bg-stone-50/80 border-t border-stone-100 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <div
                      onClick={() => setExecuteQuery(v => !v)}
                      className={`relative w-9 h-5 rounded-full transition-colors ${
                        executeQuery ? 'bg-violet-500' : 'bg-stone-200'
                      }`}
                    >
                      <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${
                        executeQuery ? 'translate-x-4' : ''
                      }`} />
                    </div>
                    <span className="text-xs text-stone-500">Execute query</span>
                  </label>
                  {executeQuery && !connectionString && (
                    <span className="text-xs text-amber-500">↑ Add connection string</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-stone-300">⌘↵</span>
                  <button
                    onClick={generate}
                    disabled={!question.trim() || !schema.trim() || isLoading}
                    className="px-4 py-2 text-sm font-medium rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Generate SQL
                  </button>
                </div>
              </div>
            </div>

            {/* Result */}
            {result?.error ? (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
                <div className="text-sm font-medium text-red-600 mb-1">Error</div>
                <div className="text-sm text-red-500">{result.error}</div>
              </div>
            ) : (
              <SQLOutput
                sql={result?.sql ?? ''}
                explanation={result?.explanation ?? ''}
                executionResult={result?.executionResult}
                isLoading={isLoading}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
