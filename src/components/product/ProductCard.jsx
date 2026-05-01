import React, { useState, useEffect, useRef } from 'react'
import useTracker from '../../hooks/useTracker.jsx'

// ── Deterministic social proof (consistent per product, not random per render)
const SOCIAL_PROOFS = [
  { text: '12 people viewing now', color: '#6B6B6B' },
  { text: 'Only 3 left in stock',  color: '#DC2626' },
  { text: 'Bestseller this week',   color: '#6B6B6B' },
  null,
  null,
  { text: '8 people viewing now',  color: '#6B6B6B' },
  { text: 'Only 5 left in stock',  color: '#DC2626' },
  null,
]

function getSocialProof(product) {
  const hash = product.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  return SOCIAL_PROOFS[hash % SOCIAL_PROOFS.length]
}

const TAG_STYLE = {
  NEW:        'bg-white/80 text-[#0A0A0A]',
  SALE:       'bg-[#DC2626]/90 text-white',
  BESTSELLER: 'bg-white/80 text-[#0A0A0A]',
}

export default function ProductCard({ product, onView, onQuickAdd }) {
  const [hovered, setHovered] = useState(false)
  const { trackView, trackCart } = useTracker()
  const cardRef = useRef(null)
  const scrollTrackedRef = useRef(false)   // fire only once per mount

  // ── Intersection Observer — passive scroll impression ───────────────────
  useEffect(() => {
    const el = cardRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !scrollTrackedRef.current) {
          scrollTrackedRef.current = true
          trackView(product)   // soft "scroll_view" signal
        }
      },
      { threshold: 0.5 }     // 50% visible triggers impression
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [product, trackView])

  const handleCardClick = () => {
    trackView(product)
    onView(product)
  }

  const handleQuickAdd = (e) => {
    e.stopPropagation()
    trackCart(product)
    onQuickAdd(product)
  }

  const tag       = product.tags?.[0]
  const hasSale   = product.originalPrice !== null && product.originalPrice > product.price
  const proof     = getSocialProof(product)

  return (
    <article
      ref={cardRef}
      className="flex flex-col cursor-pointer group"
      onClick={handleCardClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* ── Image container ─────────────────────────────────────────────── */}
      <div className="relative aspect-[4/5] bg-[#F5F5F5] overflow-hidden">
        <img
          src={product.images[0]}
          alt={product.name}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Tag badge */}
        {tag && (
          <span className={`absolute top-3 left-3 text-[10px] uppercase tracking-widest font-semibold px-2 py-1 backdrop-blur-sm ${TAG_STYLE[tag] ?? 'bg-white/80 text-[#0A0A0A]'}`}>
            {tag}
          </span>
        )}

        {/* Quick Add pill */}
        <div className={`absolute bottom-4 left-1/2 -translate-x-1/2 transition-all duration-300 ${
          hovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'
        }`}>
          <button
            id={`quick-add-${product.id}`}
            onClick={handleQuickAdd}
            className="bg-black text-white text-[11px] uppercase tracking-widest px-5 py-2 whitespace-nowrap hover:bg-neutral-800 transition-colors"
          >
            QUICK ADD
          </button>
        </div>
      </div>

      {/* ── Info ────────────────────────────────────────────────────────── */}
      <div className="mt-3 flex flex-col gap-0.5">
        <p className="text-[11px] uppercase tracking-widest text-[#6B6B6B] font-inter">{product.brand}</p>
        <p className="text-[15px] font-medium text-[#0A0A0A] leading-snug font-inter">{product.name}</p>

        {/* Price */}
        <div className="flex items-baseline gap-2 mt-0.5">
          {hasSale ? (
            <>
              <span className="text-[14px] font-semibold text-[#DC2626] font-inter">${product.price.toFixed(2)}</span>
              <span className="text-[13px] text-[#9CA3AF] line-through font-inter">${product.originalPrice.toFixed(2)}</span>
            </>
          ) : (
            <span className="text-[14px] text-[#0A0A0A] font-inter">${product.price.toFixed(2)}</span>
          )}
        </div>

        {/* Social proof micro-copy */}
        {proof && (
          <p className="text-[11px] mt-1 font-inter font-medium" style={{ color: proof.color }}>
            {proof.text}
          </p>
        )}
      </div>
    </article>
  )
}
