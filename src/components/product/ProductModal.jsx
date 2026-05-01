import React, { useState, useEffect, useRef } from 'react'
import useTracker from '../../hooks/useTracker.jsx'

const RE_ENGAGEMENT_THRESHOLD = 8000  // ms — re-fire trackView after 8s open

export default function ProductModal({ product, isOpen, onClose, onAddToCart }) {
  const [activeImg, setActiveImg] = useState(0)
  const { trackView, trackCart } = useTracker()

  // ── Open timestamp ref — for time-on-product tracking ───────────────────
  const openedAtRef = useRef(null)

  // ── Track view on every open; start timer ───────────────────────────────
  useEffect(() => {
    if (isOpen && product) {
      setActiveImg(0)
      trackView(product)
      openedAtRef.current = Date.now()
    }
  }, [isOpen, product])

  // ── On close: re-fire trackView if engaged > 8s (deep re-engagement) ────
  const handleClose = () => {
    if (openedAtRef.current !== null && product) {
      const timeOpen = Date.now() - openedAtRef.current
      if (timeOpen >= RE_ENGAGEMENT_THRESHOLD) {
        trackView(product)   // second signal — boosts view weight in model
        console.info(`[NEXORA tracker] Re-engagement view: ${product.name} (${(timeOpen / 1000).toFixed(1)}s)`)
      }
      openedAtRef.current = null
    }
    onClose()
  }

  // ── Escape key ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return
    const onKey = (e) => { if (e.key === 'Escape') handleClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, product])   // eslint-disable-line react-hooks/exhaustive-deps

  if (!isOpen || !product) return null

  const hasSale = product.originalPrice !== null && product.originalPrice > product.price

  const handleAddToCart = () => {
    trackCart(product)
    onAddToCart(product)
    openedAtRef.current = null
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleClose} />

      {/* Panel */}
      <div className="relative bg-white w-full max-w-[960px] mx-4 max-h-[92vh] overflow-y-auto flex flex-col lg:flex-row shadow-2xl">

        {/* Close */}
        <button
          onClick={handleClose}
          aria-label="Close"
          className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center text-[#9CA3AF] hover:text-[#0A0A0A] transition-colors"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 22 }}>close</span>
        </button>

        {/* ── Gallery (55%) ───────────────────────────────────────────── */}
        <section className="lg:w-[55%] p-8 flex flex-col gap-4 shrink-0">
          <div className="bg-[#F5F5F5] aspect-square overflow-hidden flex items-center justify-center">
            <img
              key={activeImg}
              src={product.images[activeImg]}
              alt={product.name}
              className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
            />
          </div>
          {product.images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImg(i)}
                  className={`aspect-square bg-[#F5F5F5] overflow-hidden border transition-colors ${
                    i === activeImg ? 'border-[#0A0A0A]' : 'border-transparent hover:border-[#D1D5DB]'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </section>

        {/* ── Details (45%) ───────────────────────────────────────────── */}
        <section className="lg:w-[45%] p-8 flex flex-col gap-6 border-l border-[#F0F0F0]">
          <div>
            <p className="text-[11px] uppercase tracking-widest text-[#6B6B6B] mb-2 font-inter">{product.brand}</p>
            <h2 className="text-[28px] font-semibold text-[#0A0A0A] leading-tight tracking-tight font-inter">{product.name}</h2>
            <div className="flex items-baseline gap-3 mt-3">
              {hasSale ? (
                <>
                  <span className="text-[24px] font-bold text-[#DC2626] font-inter">${product.price.toFixed(2)}</span>
                  <span className="text-[18px] text-[#9CA3AF] line-through font-inter">${product.originalPrice.toFixed(2)}</span>
                </>
              ) : (
                <span className="text-[24px] font-bold text-[#0A0A0A] font-inter">${product.price.toFixed(2)}</span>
              )}
            </div>
          </div>

          <p className="text-[14px] text-[#6B6B6B] leading-relaxed font-inter">{product.description}</p>

          {/* Specs */}
          <div className="border-t border-[#F0F0F0] pt-5">
            <p className="text-[11px] uppercase tracking-widest text-[#0A0A0A] mb-4 font-semibold font-inter">Specifications</p>
            <dl className="space-y-2">
              {Object.entries(product.specs).map(([key, val]) => (
                <div key={key} className="flex justify-between items-start text-[12px] border-b border-[#F5F5F5] pb-2">
                  <dt className="uppercase tracking-wider text-[#9CA3AF] font-medium font-inter">{key}</dt>
                  <dd className="text-[#0A0A0A] text-right max-w-[55%] font-medium font-inter">{val}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* CTAs */}
          <div className="flex flex-col gap-3 mt-auto">
            <button
              id={`modal-add-${product.id}`}
              onClick={handleAddToCart}
              className="w-full h-12 bg-[#0A0A0A] text-white text-[12px] uppercase tracking-widest font-semibold font-inter hover:bg-neutral-800 transition-colors active:scale-[0.99]"
            >
              ADD TO CART
            </button>
            <button className="w-full h-12 border border-[#0A0A0A] text-[#0A0A0A] text-[12px] uppercase tracking-widest font-semibold font-inter hover:bg-[#F9F9F9] transition-colors">
              SAVE TO WISHLIST
            </button>
          </div>

          {/* Shipping note */}
          <div className="flex items-center gap-3 p-4 bg-[#F9F9F9] border border-[#F0F0F0]">
            <span className="material-symbols-outlined text-[#6B6B6B]" style={{ fontSize: 20 }}>local_shipping</span>
            <span className="text-[13px] text-[#6B6B6B] font-inter">Free delivery on orders over $75</span>
          </div>
        </section>
      </div>
    </div>
  )
}
