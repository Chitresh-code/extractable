import { useEffect, useState } from 'react'
import { extractionApi } from '../../services/api'
import type { Extraction, ExtractionListResponse } from '../../types'

interface HistoryProps {
  onViewExtraction?: (extraction: Extraction) => void
}

export const History: React.FC<HistoryProps> = ({ onViewExtraction }) => {
  const [extractions, setExtractions] = useState<Extraction[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [downloading, setDownloading] = useState<number | null>(null)
  const [downloadFormat, setDownloadFormat] = useState<Record<number, 'json' | 'csv' | 'excel'>>({})

  useEffect(() => {
    loadExtractions()
  }, [page])

  const loadExtractions = async () => {
    setLoading(true)
    try {
      const response: ExtractionListResponse = await extractionApi.list(page, 20)
      setExtractions(response.items)
      setTotal(response.total)
    } catch (err) {
      console.error('Failed to load extractions:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this extraction?')) return
    try {
      await extractionApi.delete(id)
      loadExtractions()
    } catch (err) {
      console.error('Failed to delete extraction:', err)
    }
  }

  const handleView = async (extraction: Extraction) => {
    if (onViewExtraction) {
      // Fetch full extraction data to ensure we have table_data
      try {
        const fullExtraction = await extractionApi.get(extraction.id)
        onViewExtraction(fullExtraction)
        // Scroll to ResultsDisplay
        setTimeout(() => {
          const resultsElement = document.getElementById('extraction-results')
          if (resultsElement) {
            resultsElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }
        }, 100)
      } catch (err) {
        console.error('Failed to fetch extraction:', err)
        // Fallback to using the extraction from list
        onViewExtraction(extraction)
      }
    }
  }

  const handleDownload = async (extraction: Extraction, format: 'json' | 'csv' | 'excel') => {
    if (!extraction.table_data) {
      // Fetch full extraction if table_data is not available
      try {
        const fullExtraction = await extractionApi.get(extraction.id)
        if (!fullExtraction.table_data) {
          alert('No data available for download')
          return
        }
        extraction = fullExtraction
      } catch (err) {
        console.error('Failed to fetch extraction:', err)
        alert('Failed to download extraction')
        return
      }
    }

    setDownloading(extraction.id)
    try {
      const blob = await extractionApi.download(extraction.id, format)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const extension = format === 'excel' ? 'xlsx' : format
      a.download = `extraction_${extraction.id}.${extension}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      console.error('Download failed:', err)
      alert('Failed to download extraction')
    } finally {
      setDownloading(null)
    }
  }

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div className="bg-card p-6 rounded-lg border">
      <h2 className="text-xl font-bold mb-4">Extraction History</h2>
      {extractions.length === 0 ? (
        <p className="text-muted-foreground">No extractions yet.</p>
      ) : (
        <div className="space-y-4">
          {extractions.map((extraction) => (
            <div key={extraction.id} className="border rounded-md p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="font-medium">ID: {extraction.id}</div>
                  {extraction.input_filename && (
                    <div className="text-sm text-muted-foreground">{extraction.input_filename}</div>
                  )}
                  <div className="text-sm">
                    Status: <span className={`${
                      extraction.status === 'completed' ? 'text-green-600' :
                      extraction.status === 'failed' ? 'text-red-600' :
                      'text-yellow-600'
                    }`}>{extraction.status}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Created: {new Date(extraction.created_at).toLocaleString()}
                  </div>
                </div>
                <div className="flex gap-2 items-start">
                  {extraction.status === 'completed' && (
                    <>
                      <div className="flex flex-col gap-1">
                        <select
                          value={downloadFormat[extraction.id] || 'json'}
                          onChange={(e) => setDownloadFormat({
                            ...downloadFormat,
                            [extraction.id]: e.target.value as 'json' | 'csv' | 'excel'
                          })}
                          className="px-2 py-1 text-xs border rounded-md"
                          title="Select download format"
                          aria-label="Download format"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <option value="json">JSON</option>
                          <option value="csv">CSV</option>
                          <option value="excel">Excel</option>
                        </select>
                        <button
                          onClick={() => handleDownload(extraction, downloadFormat[extraction.id] || 'json')}
                          disabled={downloading === extraction.id}
                          className="px-3 py-1 text-xs bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
                          title="Download extraction"
                        >
                          {downloading === extraction.id ? 'Downloading...' : 'Download'}
                        </button>
                      </div>
                      <button
                        onClick={() => handleView(extraction)}
                        className="px-3 py-1 text-xs bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90"
                        title="View extraction details"
                      >
                        View
                      </button>
                    </>
                  )}
                  {extraction.status !== 'completed' && (
                    <button
                      onClick={() => handleView(extraction)}
                      className="px-3 py-1 text-xs bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90"
                      title="View extraction details"
                    >
                      View
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(extraction.id)}
                    className="px-3 py-1 text-xs bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90"
                    title="Delete extraction"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
          <div className="flex justify-between items-center mt-4">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 border rounded-md disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm text-muted-foreground">
              Page {page} of {Math.ceil(total / 20)}
            </span>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={page * 20 >= total}
              className="px-4 py-2 border rounded-md disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

