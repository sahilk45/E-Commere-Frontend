import React, { useState, useEffect } from 'react'
import ProductCard from './ProductCard.jsx'
import SkeletonCard from '../ui/SkeletonCard.jsx'

export default function ProductGrid({ products = [], onProductView, onQuickAdd }) {
  // ── 800ms simulated API latency on first mount ───────────────────────────
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 800)
    return () => clearTimeout(t)
  }, [])

  return (
    <section>
      {/* ── Section header ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-6 mb-12">
        <div className="flex-1 h-px bg-[#E5E5E5]" />
        <h2 className="text-[11px] uppercase tracking-[0.3em] text-[#0A0A0A] font-semibold whitespace-nowrap font-inter">
          FEATURED SELECTION
        </h2>
        <div className="flex-1 h-px bg-[#E5E5E5]" />
      </div>

      {/* ── Grid ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-12">
        {loading
          ? Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
          : products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onView={onProductView}
                onQuickAdd={onQuickAdd}
              />
            ))}
      </div>
    </section>
  )
}
