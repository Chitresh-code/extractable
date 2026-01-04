import { useEffect, useRef } from 'react'
import { useNotificationStore } from '../store/notificationStore'
import { extractionApi } from '../services/api'
import type { Extraction } from '../types'

/**
 * Global hook to listen for extraction status changes and show notifications.
 * Polls for pending/processing extractions and shows notifications when they complete.
 */
export function useGlobalNotifications() {
  const addNotification = useNotificationStore((state) => state.addNotification)
  const pollingIntervalRef = useRef<number | null>(null)
  const processedExtractionsRef = useRef<Set<number>>(new Set())

  useEffect(() => {
    // Poll for pending/processing extractions every 5 seconds
    const pollExtractions = async () => {
      try {
        const response = await extractionApi.list(1, 50, undefined, undefined)
        const pendingOrProcessing = response.items.filter(
          (extraction: Extraction) =>
            extraction.status === 'pending' || extraction.status === 'processing'
        )

        // Check each pending/processing extraction
        for (const extraction of pendingOrProcessing) {
          // Skip if we've already processed this extraction
          if (processedExtractionsRef.current.has(extraction.id)) {
            continue
          }

          // Fetch latest status
          try {
            const latest = await extractionApi.get(extraction.id)
            
            // If status changed to completed/failed, show notification
            if (
              latest.status === 'completed' &&
              (extraction.status === 'pending' || extraction.status === 'processing')
            ) {
              addNotification({
                title: 'Extraction Completed',
                message: `Extraction #${latest.id} has been completed successfully`,
                type: 'success',
              })
              processedExtractionsRef.current.add(latest.id)
            } else if (
              latest.status === 'failed' &&
              (extraction.status === 'pending' || extraction.status === 'processing')
            ) {
              addNotification({
                title: 'Extraction Failed',
                message: `Extraction #${latest.id} has failed`,
                type: 'error',
              })
              processedExtractionsRef.current.add(latest.id)
            }
          } catch (error) {
            console.error(`Failed to check extraction ${extraction.id}:`, error)
          }
        }

        // Clean up processed extractions that are no longer pending/processing
        const allIds = new Set(response.items.map((e: Extraction) => e.id))
        processedExtractionsRef.current.forEach((id) => {
          if (!allIds.has(id)) {
            processedExtractionsRef.current.delete(id)
          }
        })
      } catch (error) {
        console.error('Failed to poll extractions:', error)
      }
    }

    // Poll immediately, then every 5 seconds
    pollExtractions()
    pollingIntervalRef.current = window.setInterval(pollExtractions, 5000)

    return () => {
      if (pollingIntervalRef.current !== null) {
        window.clearInterval(pollingIntervalRef.current)
      }
    }
  }, [addNotification])
}

