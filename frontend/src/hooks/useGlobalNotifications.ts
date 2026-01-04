import { useEffect, useRef } from 'react'
import { useNotificationStore } from '../store/notificationStore'
import { extractionApi } from '../services/api'
import type { Extraction } from '../types'

/**
 * Global hook to listen for extraction status changes and show notifications.
 * Polls for pending/processing extractions and shows notifications when they complete.
 * Only polls when there are pending/processing extractions to avoid unnecessary requests.
 */
export function useGlobalNotifications() {
  const addNotification = useNotificationStore((state) => state.addNotification)
  const pollingIntervalRef = useRef<number | null>(null)
  const processedExtractionsRef = useRef<Set<number>>(new Set())
  const trackedExtractionsRef = useRef<Map<number, string>>(new Map()) // extraction_id -> status

  useEffect(() => {
    let isMounted = true

    const pollExtractions = async () => {
      if (!isMounted) return

      try {
        const response = await extractionApi.list(1, 50, undefined, undefined)
        const pendingOrProcessing = response.items.filter(
          (extraction: Extraction) =>
            extraction.status === 'pending' || extraction.status === 'processing'
        )

        // If no pending/processing extractions, stop polling
        if (pendingOrProcessing.length === 0) {
          if (pollingIntervalRef.current !== null) {
            window.clearInterval(pollingIntervalRef.current)
            pollingIntervalRef.current = null
          }
          // Clean up tracked extractions
          trackedExtractionsRef.current.clear()
          processedExtractionsRef.current.clear()
          return
        }

        // Start polling if not already polling
        if (pollingIntervalRef.current === null) {
          pollingIntervalRef.current = window.setInterval(pollExtractions, 5000)
        }

        // Check each pending/processing extraction
        for (const extraction of pendingOrProcessing) {
          // Track this extraction
          const previousStatus = trackedExtractionsRef.current.get(extraction.id)
          trackedExtractionsRef.current.set(extraction.id, extraction.status)

          // Skip if we've already processed this extraction
          if (processedExtractionsRef.current.has(extraction.id)) {
            continue
          }

          // Only fetch latest status if we haven't tracked it before or status changed
          if (previousStatus && previousStatus === extraction.status) {
            // Status hasn't changed, no need to fetch
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
              trackedExtractionsRef.current.delete(latest.id)
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
              trackedExtractionsRef.current.delete(latest.id)
            } else {
              // Update tracked status
              trackedExtractionsRef.current.set(latest.id, latest.status)
            }
          } catch (error) {
            console.error(`Failed to check extraction ${extraction.id}:`, error)
          }
        }

        // Clean up tracked extractions that are no longer in the list
        const allIds = new Set(response.items.map((e: Extraction) => e.id))
        trackedExtractionsRef.current.forEach((id) => {
          if (!allIds.has(id)) {
            trackedExtractionsRef.current.delete(id)
            processedExtractionsRef.current.delete(id)
          }
        })
      } catch (error) {
        console.error('Failed to poll extractions:', error)
      }
    }

    // Initial poll
    pollExtractions()

    return () => {
      isMounted = false
      if (pollingIntervalRef.current !== null) {
        window.clearInterval(pollingIntervalRef.current)
        pollingIntervalRef.current = null
      }
    }
  }, [addNotification])
}

