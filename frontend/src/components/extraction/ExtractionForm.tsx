import { useState } from 'react'
import { extractionApi } from '../../services/api'
import type { Extraction } from '../../types'
import { Button } from '../ui/button'

interface ExtractionFormProps {
  onSuccess: (extraction: Extraction) => void
  onCancel?: () => void
}

export const ExtractionForm: React.FC<ExtractionFormProps> = ({ onSuccess, onCancel }) => {
  const [file, setFile] = useState<File | null>(null)
  const [name, setName] = useState('')
  const [columns, setColumns] = useState('')
  const [multipleTables, setMultipleTables] = useState(false)
  const [complexity, setComplexity] = useState<'simple' | 'regular' | 'complex'>('regular')
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('medium')
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
        complexity,
        priority
      )
      
      // Update extraction name if provided
      if (name.trim()) {
        await extractionApi.update(extraction.id, {
          input_filename: name.trim(),
        })
        // Update the extraction object with the new name
        extraction.input_filename = name.trim()
      }
      
      onSuccess(extraction)
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } }
      setError(error.response?.data?.detail || 'Failed to create extraction')
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
            onChange={(e) => {
              const selectedFile = e.target.files?.[0] || null
              setFile(selectedFile)
              // Auto-fill name with filename if name is empty
              if (selectedFile && !name.trim()) {
                setName(selectedFile.name)
              }
            }}
            required
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-2">
            Extraction Name (optional)
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={file ? file.name : "Leave blank to use file name"}
            className="w-full px-3 py-2 border rounded-md"
          />
          <p className="text-xs text-muted-foreground mt-1">
            {file ? `Default: ${file.name}` : 'Enter a custom name or leave blank to use file name'}
          </p>
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
        <div>
          <label htmlFor="priority" className="block text-sm font-medium mb-2">
            Priority
          </label>
          <select
            id="priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value as 'high' | 'medium' | 'low')}
            className="w-full px-3 py-2 border rounded-md"
          >
            <option value="high">High - Process next (jumps queue)</option>
            <option value="medium">Medium - Normal queue position</option>
            <option value="low">Low - Process last</option>
          </select>
        </div>
        <div className="flex gap-2">
          {onCancel && (
            <Button
              type="button"
              variant="secondary"
              onClick={onCancel}
              disabled={loading}
              className="flex-1"
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            disabled={loading || !file}
            className="flex-1"
          >
            {loading ? 'Processing...' : 'Extract Tables'}
          </Button>
        </div>
      </form>
    </div>
  )
}

