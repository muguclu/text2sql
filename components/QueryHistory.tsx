'use client'

import { QueryHistoryItem } from '@/lib/types'

interface Props {
  history: QueryHistoryItem[]
  onSelect: (item: QueryHistoryItem) => void
  onClear: () => void
}

export default function QueryHistory({ history, onSelect, onClear }: Props) {
  if (history.length === 0) return null

  return (
    <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-stone-100">
        <span className="text-xs font-semibold text-stone-500 uppercase tracking-wide">
          History ({history.length})
        </span>
        <button
          onClick={onClear}
          className="text-xs text-stone-400 hover:text-red-400 transition-colors"
        >
          Clear
        </button>
      </div>
      <div className="divide-y divide-stone-100 max-h-72 overflow-y-auto">
        {[...history].reverse().map(item => (
          <button
            key={item.id}
            onClick={() => onSelect(item)}
            className="w-full text-left px-5 py-3 hover:bg-stone-50 transition-colors group"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="text-sm text-stone-800 truncate group-hover:text-violet-700 transition-colors">
                  {item.question}
                </div>
                <div className="text-xs text-stone-400 font-mono mt-0.5 truncate">
                  {item.sql.split('\n')[0]}…
                </div>
              </div>
              <div className="shrink-0 flex items-center gap-2">
                <span className="text-xs bg-stone-100 text-stone-500 px-1.5 py-0.5 rounded">
                  {item.dialect}
                </span>
                {item.executionResult && !item.executionResult.error && (
                  <span className="text-xs bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded">
                    {item.executionResult.rowCount}r
                  </span>
                )}
              </div>
            </div>
            <div className="text-xs text-stone-300 mt-1">
              {new Date(item.timestamp).toLocaleTimeString()}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
