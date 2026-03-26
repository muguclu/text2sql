'use client'

import { useState } from 'react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { ExecutionResult } from '@/lib/types'

interface Props {
  sql: string
  explanation: string
  executionResult?: ExecutionResult
  isLoading: boolean
}

export default function SQLOutput({ sql, explanation, executionResult, isLoading }: Props) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    await navigator.clipboard.writeText(sql)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-8 flex items-center justify-center gap-3">
        <div className="flex gap-1">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className="w-2 h-2 bg-violet-400 rounded-full animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
        <span className="text-sm text-stone-500">Generating SQL…</span>
      </div>
    )
  }

  if (!sql) {
    return (
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-8 text-center">
        <div className="text-3xl mb-3">⚡</div>
        <div className="text-sm font-medium text-stone-700">SQL will appear here</div>
        <div className="text-xs text-stone-400 mt-1">Enter your schema and ask a question</div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* SQL block */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-stone-100">
          <span className="text-xs font-semibold text-stone-500 uppercase tracking-wide">Generated SQL</span>
          <button
            onClick={copy}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
              copied
                ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                : 'bg-white border-stone-200 text-stone-500 hover:bg-stone-50'
            }`}
          >
            {copied ? '✓ Copied' : 'Copy'}
          </button>
        </div>
        <div className="overflow-x-auto">
          <SyntaxHighlighter
            language="sql"
            style={oneLight}
            customStyle={{
              margin: 0,
              padding: '1.25rem',
              background: '#fafaf8',
              fontSize: '0.8rem',
              lineHeight: '1.6',
            }}
          >
            {sql}
          </SyntaxHighlighter>
        </div>
      </div>

      {/* Explanation */}
      {explanation && (
        <div className="bg-violet-50/60 border border-violet-100 rounded-2xl px-5 py-3.5">
          <div className="text-xs font-semibold text-violet-500 mb-1">Explanation</div>
          <div className="text-sm text-stone-700 leading-relaxed">{explanation}</div>
        </div>
      )}

      {/* Execution result */}
      {executionResult && (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-stone-100">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wide">
              Query Result
            </span>
            <div className="flex items-center gap-3">
              {executionResult.durationMs !== undefined && (
                <span className="text-xs text-stone-400">{executionResult.durationMs}ms</span>
              )}
              {!executionResult.error && (
                <span className="text-xs bg-emerald-50 text-emerald-600 border border-emerald-100 px-2 py-0.5 rounded-full">
                  {executionResult.rowCount} row{executionResult.rowCount !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>

          {executionResult.error ? (
            <div className="p-4 bg-red-50">
              <div className="text-xs font-semibold text-red-500 mb-1">Execution Error</div>
              <pre className="text-xs text-red-700 whitespace-pre-wrap">{executionResult.error}</pre>
            </div>
          ) : executionResult.rows.length === 0 ? (
            <div className="p-6 text-center text-sm text-stone-400">No rows returned</div>
          ) : (
            <div className="overflow-x-auto max-h-80">
              <table className="w-full text-xs">
                <thead className="bg-stone-50 sticky top-0">
                  <tr>
                    {executionResult.columns.map(col => (
                      <th key={col} className="text-left px-4 py-2.5 font-semibold text-stone-600 border-b border-stone-100 whitespace-nowrap">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {executionResult.rows.map((row, i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-stone-50/50'}>
                      {executionResult.columns.map(col => (
                        <td key={col} className="px-4 py-2.5 text-stone-700 border-b border-stone-100/60 whitespace-nowrap max-w-xs truncate">
                          {row[col] === null ? (
                            <span className="text-stone-300 italic">null</span>
                          ) : String(row[col])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
