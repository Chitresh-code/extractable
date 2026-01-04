import { useState } from 'react'
import { extractionApi } from '../../services/api'
import type { Extraction } from '../../types'

interface ExtractionFormProps {
  onSuccess: (extraction: Extraction) => void
}

export const ExtractionForm: React.FC<ExtractionFormProps> = ({ onSuccess }) => {
  const [file, setFile] = useState<File | null>(null)
  const [columns, setColumns] = useState('')
  const [multipleTables, setMultipleTables] = useState(false)
  const [complexity, setComplexity] = useState<'simple' | 'regular' | 'complex'>('regular')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) {
      setError('Please select a file')
      return
    }

    setError('')
    setLoading(true)

    try {
      const extraction = await extractionApi.create(
        file,
        columns || undefined,
        multipleTables,
        complexity
      )
      onSuccess(extraction)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create extraction')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-card p-6 rounded-lg border">
      <h2 className="text-xl font-bold mb-4">New Extraction</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm">
            {error}
          </div>
        )}
        <div>
          <label htmlFor="file" className="block text-sm font-medium mb-2">
            File (PDF or Images)
          </label>
          <input
            id="file"
            type="file"
            accept=".pdf,.png,.jpg,.jpeg"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            required
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>
        <div>
          <label htmlFor="columns" className="block text-sm font-medium mb-2">
            Columns (optional, comma-separated)
          </label>
          <input
            id="columns"
            type="text"
            value={columns}
            onChange={(e) => setColumns(e.target.value)}
            placeholder="column1, column2, column3"
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>
        <div className="flex items-center gap-2">
          <input
            id="multiple_tables"
            type="checkbox"
            checked={multipleTables}
            onChange={(e) => setMultipleTables(e.target.checked)}
            className="w-4 h-4"
          />
          <label htmlFor="multiple_tables" className="text-sm">
            Multiple tables in input
          </label>
        </div>
        <div>
          <label htmlFor="complexity" className="block text-sm font-medium mb-2">
            Pipeline Complexity
          </label>
          <select
            id="complexity"
            value={complexity}
            onChange={(e) => setComplexity(e.target.value as 'simple' | 'regular' | 'complex')}
            className="w-full px-3 py-2 border rounded-md"
          >
            <option value="simple">Simple - Fast, basic extraction</option>
            <option value="regular">Regular - Balanced speed and accuracy</option>
            <option value="complex">Complex - Highest accuracy, slower</option>
          </select>
        </div>
        <button
          type="submit"
          disabled={loading || !file}
          className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
        >
          {loading ? 'Processing...' : 'Extract Tables'}
        </button>
      </form>
    </div>
  )
}

