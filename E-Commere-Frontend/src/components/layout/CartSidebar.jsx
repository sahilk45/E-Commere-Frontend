import React, { useEffect } from 'react'

export default function CartSidebar({ isOpen, onClose, items, onUpdateQty, onRemove, subtotal, appliedDiscount }) {
  const totalQty = items.reduce((n, i) => n + i.qty, 0)
  const rawTotal = items.reduce((n, i) => n + i.price * i.qty, 0)
  const displaySubtotal = typeof subtotal === 'number' ? subtotal : rawTotal

  // Lock body scroll when open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  // Escape key
  useEffect(() => {
    if (!isOpen) return
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  return (
    <>
      {/* ── Overlay ──────────────────────────────────────────────────────── */}
      <div
        className={`fixed inset-0 z-[100] bg-black/40 backdrop-blur-[2px] transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* ── Sidebar ──────────────────────────────────────────────────────── */}
      <aside
        className={`fixed top-0 right-0 z-[101] h-full w-[420px] max-w-full bg-white flex flex-col shadow-2xl transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-[#F0F0F0] shrink-0">
          <h2 className="text-[11px] uppercase tracking-[0.2em] text-[#0A0A0A] font-semibold font-inter">
            YOUR BAG ({totalQty})
          </h2>
          <button
            id="cart-close"
            onClick={onClose}
            aria-label="Close cart"
            className="text-[#9CA3AF] hover:text-[#0A0A0A] transition-colors hover:rotate-90 duration-300"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 24 }}>close</span>
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-8 py-2">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <span className="material-symbols-outlined text-[#D1D5DB]" style={{ fontSize: 52 }}>shopping_bag</span>
              <p className="text-[11px] uppercase tracking-widest text-[#9CA3AF] font-inter">Your bag is empty</p>
            </div>
          ) : (
            <ul className="divide-y divide-[#F5F5F5]">
              {items.map((item) => (
                <li key={item.id} className="py-7 flex gap-5 group">
                  {/* Thumbnail */}
                  <div className="w-[72px] h-[90px] bg-[#F5F5F5] shrink-0 overflow-hidden">
                    <img
                      src={item.images?.[0] ?? item.image}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex flex-col justify-between flex-1 min-w-0">
                    <div>
                      <div className="flex justify-between items-start gap-2">
                        <p className="text-[12px] uppercase tracking-wide font-semibold text-[#0A0A0A] leading-tight font-inter">
                          {item.name}
                        </p>
                        <span className="text-[14px] font-semibold text-[#0A0A0A] shrink-0 font-inter">
                          ${(item.price * item.qty).toFixed(2)}
                        </span>
                      </div>
                      <p className="text-[10px] uppercase tracking-widest text-[#9CA3AF] mt-1 font-semibold font-inter">
                        {item.brand}
                      </p>
                    </div>

                    {/* Qty controls — delta-based (+1 / -1) */}
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center border border-[#E5E5E5]">
                        <button
                          onClick={() => onUpdateQty(item.id, -1)}
                          className="w-8 h-8 flex items-center justify-center hover:bg-[#F5F5F5] transition-colors"
                          aria-label="Decrease quantity"
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>remove</span>
                        </button>
                        <span className="w-8 text-center text-[12px] font-semibold text-[#0A0A0A] font-inter">
                          {item.qty}
                        </span>
                        <button
                          onClick={() => onUpdateQty(item.id, +1)}
                          className="w-8 h-8 flex items-center justify-center hover:bg-[#F5F5F5] transition-colors"
                          aria-label="Increase quantity"
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
                        </button>
                      </div>
                      <button
                        onClick={() => onRemove(item.id)}
                        className="text-[10px] uppercase tracking-widest text-[#9CA3AF] border-b border-transparent hover:border-[#9CA3AF] hover:text-[#6B6B6B] transition-all font-inter"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* ── Sticky footer ────────────────────────────────────────────────── */}
        <div className="shrink-0 border-t border-[#F0F0F0] p-8 space-y-5">
          {/* Discount badge */}
          {appliedDiscount && (
            <div className="flex items-center justify-between px-3 py-2 bg-[#F9F9F9] border border-[#E5E5E5]">
              <span className="font-mono text-[12px] font-semibold text-[#0A0A0A] tracking-wide">
                {appliedDiscount.code}
              </span>
              <span className="text-[11px] text-[#16A34A] font-semibold font-inter">
                −{appliedDiscount.pct}% applied
              </span>
            </div>
          )}

          <div className="flex justify-between items-center">
            <span className="text-[11px] uppercase tracking-widest text-[#6B6B6B] font-semibold font-inter">
              {appliedDiscount ? 'DISCOUNTED TOTAL' : 'SUBTOTAL'}
            </span>
            <span className="text-[22px] font-semibold text-[#0A0A0A] font-inter">
              ${displaySubtotal.toFixed(2)}
            </span>
          </div>

          {appliedDiscount && (
            <p className="text-[11px] text-[#9CA3AF] line-through font-inter">
              Full price: ${rawTotal.toFixed(2)}
            </p>
          )}

          <p className="text-[12px] text-[#9CA3AF] leading-relaxed font-inter">
            Shipping, taxes, and discounts calculated at checkout.
          </p>

          <button
            id="checkout-btn"
            className="w-full h-12 bg-[#0A0A0A] text-white text-[11px] uppercase tracking-[0.2em] font-semibold font-inter hover:bg-[#262626] transition-colors active:scale-[0.99]"
          >
            PROCEED TO CHECKOUT
          </button>

          <div className="text-center">
            <button
              onClick={onClose}
              className="text-[11px] uppercase tracking-widest text-[#9CA3AF] hover:text-[#0A0A0A] transition-colors font-inter"
            >
              CONTINUE SHOPPING
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
