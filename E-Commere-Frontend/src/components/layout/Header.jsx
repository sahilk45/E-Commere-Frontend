import React, { useState, useEffect, useRef } from 'react'

const NAV_LINKS = ['NEW ARRIVALS', 'ELECTRONICS', 'WEARABLES', 'AUDIO', 'COMPUTERS', 'LIFESTYLE']

export default function Header({ cartCount = 0, onCartOpen }) {
  const [scrolled, setScrolled] = useState(false)

  // ── Cart bounce animation state ──────────────────────────────────────────
  const [cartBounce, setCartBounce] = useState(false)
  const prevCountRef = useRef(cartCount)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Trigger bounce when cartCount increases
  useEffect(() => {
    if (cartCount > prevCountRef.current) {
      setCartBounce(true)
      const t = setTimeout(() => setCartBounce(false), 650)
      return () => clearTimeout(t)
    }
    prevCountRef.current = cartCount
  }, [cartCount])

  return (
    <>
      {/* ── Keyframe styles (injected once) ────────────────────────────── */}
      <style>{`
        @keyframes nexora-cart-bounce {
          0%   { transform: scale(1); }
          30%  { transform: scale(1.25); }
          55%  { transform: scale(0.92); }
          75%  { transform: scale(1.10); }
          100% { transform: scale(1); }
        }
        @keyframes nexora-ring-flash {
          0%   { box-shadow: 0 0 0 0px rgba(212,160,23,0.6); }
          60%  { box-shadow: 0 0 0 7px rgba(212,160,23,0); }
          100% { box-shadow: 0 0 0 0px rgba(212,160,23,0); }
        }
        .cart-bounce {
          animation: nexora-cart-bounce 0.65s cubic-bezier(0.36, 0.07, 0.19, 0.97);
        }
        .cart-ring {
          border-radius: 50%;
          animation: nexora-ring-flash 0.65s ease-out;
        }
      `}</style>

      <header
        className={`fixed top-0 left-0 right-0 z-50 h-[72px] flex items-center justify-between px-10 border-b border-[#E5E5E5] transition-all duration-300 ${
          scrolled ? 'bg-white/95 backdrop-blur-md' : 'bg-white'
        }`}
      >
        {/* ── Wordmark ─────────────────────────────────────────────────── */}
        <div
          className="text-[22px] font-black tracking-tighter text-[#0A0A0A] cursor-pointer select-none"
          style={{ fontFamily: "'Playfair Display', 'Noto Serif', serif", fontStyle: 'italic' }}
        >
          NEXORA
        </div>

        {/* ── Nav ──────────────────────────────────────────────────────── */}
        <nav className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((link, i) => (
            <span
              key={link}
              className={`font-inter text-[11px] uppercase tracking-[0.12em] cursor-pointer transition-colors duration-200 ${
                i === 0
                  ? 'text-[#0A0A0A] border-b border-[#0A0A0A] pb-0.5'
                  : 'text-[#6B6B6B] hover:text-[#0A0A0A]'
              }`}
            >
              {link}
            </span>
          ))}
        </nav>

        {/* ── Actions ──────────────────────────────────────────────────── */}
        <div className="flex items-center gap-5">
          <button aria-label="Search" className="text-[#0A0A0A] hover:text-[#6B6B6B] transition-colors">
            <span className="material-symbols-outlined" style={{ fontSize: 22 }}>search</span>
          </button>
          <button aria-label="Wishlist" className="text-[#0A0A0A] hover:text-[#6B6B6B] transition-colors">
            <span className="material-symbols-outlined" style={{ fontSize: 22 }}>favorite</span>
          </button>

          {/* Cart button with bounce + ring animation */}
          <button
            id="cart-toggle"
            aria-label="Shopping bag"
            onClick={onCartOpen}
            className={`relative text-[#0A0A0A] hover:text-[#6B6B6B] transition-colors ${cartBounce ? 'cart-ring' : ''}`}
          >
            <span
              className={`material-symbols-outlined ${cartBounce ? 'cart-bounce' : ''}`}
              style={{ fontSize: 22, display: 'inline-block' }}
            >
              shopping_bag
            </span>
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-[#0A0A0A] text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center leading-none font-inter">
                {cartCount > 9 ? '9+' : cartCount}
              </span>
            )}
          </button>
        </div>
      </header>
    </>
  )
}
