import { SchemaTable } from './types'

export function parseCSVToSchema(csvContent: string, tableName: string): SchemaTable {
  const lines = csvContent.trim().split('\n')
  if (lines.length === 0) throw new Error('Empty CSV')

  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''))

  // Infer types from first data row if available
  const sampleRow = lines[1]?.split(',').map(v => v.trim().replace(/^"|"$/g, '')) ?? []

  const columns = headers.map((name, i) => {
    const sample = sampleRow[i] ?? ''
    let type = 'TEXT'
    if (/^\d+$/.test(sample)) type = 'INTEGER'
    else if (/^\d+\.\d+$/.test(sample)) type = 'NUMERIC'
    else if (/^\d{4}-\d{2}-\d{2}/.test(sample)) type = 'DATE'
    else if (/^(true|false)$/i.test(sample)) type = 'BOOLEAN'
    return { name, type }
  })

  return { name: tableName, columns }
}

export function schemaToSQL(tables: SchemaTable[], _dialect: string): string {
  return tables.map(table => {
    const cols = table.columns.map(c => {
      const pk = c.primaryKey ? ' PRIMARY KEY' : ''
      const nullable = c.nullable === false ? ' NOT NULL' : ''
      return `  ${c.name} ${c.type}${pk}${nullable}` 
    }).join(',\n')
    return `CREATE TABLE ${table.name} (\n${cols}\n);` 
  }).join('\n\n')
}

export function extractTablesFromSQL(sql: string): SchemaTable[] {
  const tables: SchemaTable[] = []
  const tableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?["'\`]?(\w+)["'\`]?\s*\(([^;]+)\)/gi
  let match

  while ((match = tableRegex.exec(sql)) !== null) {
    const tableName = match[1]
    const columnBlock = match[2]
    const columnLines = columnBlock.split(',').map(l => l.trim()).filter(Boolean)

    const columns = columnLines
      .filter(line => !/^(PRIMARY|FOREIGN|UNIQUE|INDEX|KEY|CHECK|CONSTRAINT)/i.test(line))
      .map(line => {
        const parts = line.trim().split(/\s+/)
        const name = parts[0].replace(/["'\`]/g, '')
        const type = parts[1] ?? 'TEXT'
        const primaryKey = /PRIMARY\s+KEY/i.test(line)
        const nullable = !/NOT\s+NULL/i.test(line)
        return { name, type, primaryKey, nullable }
      })
      .filter(c => c.name)

    if (columns.length > 0) {
      tables.push({ name: tableName, columns })
    }
  }

  return tables
}
