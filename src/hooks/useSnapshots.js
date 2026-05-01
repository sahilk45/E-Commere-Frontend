import { useState, useEffect, useRef, useCallback } from 'react'
import { predictIntent } from '../lib/api.js'

// ─── Constants ────────────────────────────────────────────────────────────────
const SNAPSHOT_TIMES   = [84, 165, 296, 611, 1084]
const INTENT_THRESHOLD = 0.536
const OFFER_DURATION   = 900   // 15 minutes

const DISCOUNT_MAP = {
  electronics: { code: 'NEXORA10', pct: 10, label: 'Electronics' },
  computers:   { code: 'NEXORA08', pct: 8,  label: 'Computers'   },
  apparel:     { code: 'NEXORA15', pct: 15, label: 'Apparel'     },
}

// ─── Hook (named + default export) ───────────────────────────────────────────
export function useSnapshots({ tracker }) {
  const [snapshotResults,      setSnapshotResults]      = useState([])
  const [isLoading,            setIsLoading]            = useState(false)
  const [showDiscount,         setShowDiscount]         = useState(false)
  const [discountInfo,         setDiscountInfo]         = useState(null)
  const [offerTimeRemaining,   setOfferTimeRemaining]   = useState(0)
  const [currentSnapshotIndex, setCurrentSnapshotIndex] = useState(0)
  const [nextSnapshotIn,       setNextSnapshotIn]       = useState(null)

  // Refs — read inside the interval without stale closures
  const firedSnapshots  = useRef(new Set())
  const showDiscountRef = useRef(false)
  const offerStartRef   = useRef(null)
  const isLoadingRef    = useRef(false)

  const dismissDiscount = useCallback(() => {
    setShowDiscount(false)
    showDiscountRef.current = false
  }, [])

  useEffect(() => {
    const id = setInterval(async () => {
      if (!tracker.hasStarted) return

      const elapsed = tracker.elapsedSeconds

      // ── Navigation state ────────────────────────────────────────────────
      const nextIdx = SNAPSHOT_TIMES.findIndex((_, i) => !firedSnapshots.current.has(i))
      setCurrentSnapshotIndex(nextIdx === -1 ? SNAPSHOT_TIMES.length : nextIdx)
      setNextSnapshotIn(
        nextIdx !== -1 ? Math.max(0, Math.round(SNAPSHOT_TIMES[nextIdx] - elapsed)) : null
      )

      // ── Offer countdown ─────────────────────────────────────────────────
      if (showDiscountRef.current && offerStartRef.current !== null) {
        const remaining = Math.max(0, Math.round(OFFER_DURATION - (Date.now() - offerStartRef.current) / 1000))
        setOfferTimeRemaining(remaining)
        if (remaining === 0) { setShowDiscount(false); showDiscountRef.current = false }
      }

      // ── Snapshot check ──────────────────────────────────────────────────
      for (let i = 0; i < SNAPSHOT_TIMES.length; i++) {
        const snapshotTime = SNAPSHOT_TIMES[i]
        if (firedSnapshots.current.has(i)) continue
        if (elapsed < snapshotTime)        continue
        if (isLoadingRef.current)          break

        firedSnapshots.current.add(i)
        const features = tracker.computeTabularFeatures(snapshotTime)
        if (!features) break

        isLoadingRef.current = true
        setIsLoading(true)
        try {
          const result = await predictIntent({ ...features })
          const { probability, prediction } = result.data
          const mock = result.mock ?? false

          setSnapshotResults(prev => [...prev, { snapshotTime, probability, prediction, mock }])

          if (probability >= INTENT_THRESHOLD && !showDiscountRef.current) {
            const cat      = features._dominantCat1 ?? ''
            const template = DISCOUNT_MAP[cat] ?? { code: 'NEXORA10', pct: 10, label: 'your selection' }
            setDiscountInfo({
              category: cat,
              code:     template.code,
              pct:      template.pct,
              label:    template.label,
              products: features._recentProducts ?? [],
              probability,
            })
            showDiscountRef.current = true
            offerStartRef.current   = Date.now()
            setShowDiscount(true)
            setOfferTimeRemaining(OFFER_DURATION)
          }
        } catch (err) {
          console.error('[useSnapshots] error at snapshot', snapshotTime, err)
        } finally {
          isLoadingRef.current = false
          setIsLoading(false)
        }
        break // one per tick
      }
    }, 1000)

    return () => clearInterval(id)
  }, [tracker])

  return {
    snapshotResults,
    showDiscount,
    discountInfo,
    offerTimeRemaining,
    dismissDiscount,
    isLoading,
    currentSnapshotIndex,
    nextSnapshotIn,
  }
}

export default useSnapshots
