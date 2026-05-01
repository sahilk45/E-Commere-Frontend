import React, { createContext, useContext, useRef, useCallback } from 'react'
import { SessionTracker } from '../lib/tracker.js'

// ─── Context ─────────────────────────────────────────────────────────────────
export const TrackerContext = createContext(null)

/**
 * TrackerProvider — one SessionTracker instance for the entire app.
 * Place at the top of the tree (or inside App itself).
 */
export function TrackerProvider({ children }) {
  const trackerRef = useRef(null)
  if (trackerRef.current === null) {
    trackerRef.current = new SessionTracker()
  }

  const trackView = useCallback((product) => {
    trackerRef.current.recordView(product)
  }, [])

  const trackCart = useCallback((product) => {
    trackerRef.current.recordCart(product)
  }, [])

  const resetTracker = useCallback(() => {
    trackerRef.current.reset()
  }, [])

  const value = {
    tracker: trackerRef.current,
    trackView,
    trackCart,
    resetTracker,
  }

  return (
    <TrackerContext.Provider value={value}>
      {children}
    </TrackerContext.Provider>
  )
}

/**
 * useTrackerContext — primary hook for components.
 * Returns: { tracker, trackView, trackCart, resetTracker }
 */
export function useTrackerContext() {
  const ctx = useContext(TrackerContext)
  if (ctx === null) {
    throw new Error('useTrackerContext must be used inside <TrackerProvider>')
  }
  return ctx
}

/**
 * useTracker — alias kept for backwards compatibility.
 */
export default function useTracker() {
  return useTrackerContext()
}
