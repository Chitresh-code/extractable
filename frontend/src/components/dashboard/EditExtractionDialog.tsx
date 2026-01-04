import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Checkbox } from '../ui/checkbox'
import { extractionApi } from '../../services/api'
import type { Extraction } from '../../types'
import { useNotificationStore } from '../../store/notificationStore'

interface EditExtractionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  extraction: Extraction | null
  onSuccess: () => void
}

export function EditExtractionDialog({
  open,
  onOpenChange,
  extraction,
  onSuccess,
}: EditExtractionDialogProps) {
  const [name, setName] = useState('')
  const [multipleTables, setMultipleTables] = useState(false)
  const [loading, setLoading] = useState(false)
  const addNotification = useNotificationStore((state) => state.addNotification)

  useEffect(() => {
    if (extraction) {
      setName(extraction.input_filename || '')
      setMultipleTables(extraction.multiple_tables)
    }
  }, [extraction])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!extraction) return

    try {
      setLoading(true)
      await extractionApi.update(extraction.id, {
        input_filename: name || undefined,
        multiple_tables: multipleTables,
      })
      addNotification({
        title: 'Success',
        message: 'Extraction updated successfully',
        type: 'success',
      })
      onSuccess()
      onOpenChange(false)
    } catch (error) {
      addNotification({
        title: 'Error',
        message: 'Failed to update extraction',
        type: 'error',
      })
    } finally {
      setLoading(false)
    }
  }

  if (!extraction) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Extraction</DialogTitle>
          <DialogDescription>
            Update extraction metadata. You cannot edit extractions that are currently processing.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter extraction name"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="multiple_tables"
              checked={multipleTables}
              onCheckedChange={(checked) => setMultipleTables(checked === true)}
            />
            <Label htmlFor="multiple_tables" className="font-normal cursor-pointer">
              Multiple tables in input
            </Label>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

