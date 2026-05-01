import React, { useState } from 'react'
import { TrackerProvider, useTrackerContext } from './hooks/useTracker.jsx'
import { useCart } from './hooks/useCart.js'
import { useSnapshots } from './hooks/useSnapshots.js'
import Header from './components/layout/Header.jsx'
import Footer from './components/layout/Footer.jsx'
import ProductGrid from './components/product/ProductGrid.jsx'
import ProductModal from './components/product/ProductModal.jsx'
import CartSidebar from './components/layout/CartSidebar.jsx'
import DiscountNotification from './components/ui/DiscountNotification.jsx'
import PRODUCTS from './data/products.js'

// ─── Hero Section ─────────────────────────────────────────────────────────────
function HeroSection() {
  const hero = PRODUCTS[0]
  return (
    <section className="w-full min-h-[calc(100vh-72px)] grid grid-cols-1 md:grid-cols-2 bg-[#FAFAFA]">
      {/* Left */}
      <div className="flex flex-col justify-center px-8 md:px-16 lg:px-24 py-20 gap-8">
        <span className="text-[11px] uppercase tracking-[0.25em] text-[#6B6B6B] font-semibold font-inter">
          NEW SEASON — 2024
        </span>
        <h1 className="font-playfair italic text-[52px] md:text-[64px] leading-[1.08] tracking-tight text-[#0A0A0A] font-normal">
          The art of intelligent living.
        </h1>
        <p className="text-[17px] text-[#6B6B6B] leading-relaxed max-w-[420px] font-inter font-light">
          Precision-engineered products. Thoughtfully curated for the modern architectural home.
        </p>
        <div className="flex flex-wrap gap-4 pt-2">
          <button className="px-10 py-4 bg-[#0A0A0A] text-white text-[11px] uppercase tracking-[0.15em] font-semibold font-inter hover:bg-[#262626] transition-colors">
            SHOP NOW
          </button>
          <button className="px-10 py-4 border border-[#0A0A0A] text-[#0A0A0A] text-[11px] uppercase tracking-[0.15em] font-semibold font-inter hover:bg-[#0A0A0A] hover:text-white transition-colors">
            VIEW LOOKBOOK
          </button>
        </div>
      </div>

      {/* Right — hero image */}
      <div className="relative bg-[#EFEFEF] overflow-hidden flex items-center justify-center min-h-[400px]">
        <img
          src={hero.images[0]}
          alt={hero.name}
          className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700"
          style={{ mixBlendMode: 'multiply' }}
        />
        {/* Floating label */}
        <div className="absolute bottom-8 left-8 bg-white/80 backdrop-blur-sm px-4 py-3 border border-[#E5E5E5]">
          <p className="text-[10px] uppercase tracking-widest text-[#6B6B6B] font-inter font-semibold">
            Featured
          </p>
          <p className="text-[14px] font-semibold text-[#0A0A0A] font-inter mt-0.5">
            {hero.name}
          </p>
        </div>
      </div>
    </section>
  )
}

// ─── Inner app (has access to TrackerContext) ─────────────────────────────────
function AppInner() {
  const { tracker, trackView, trackCart } = useTrackerContext()
  const { cartItems, addToCart, removeFromCart, updateQty, applyDiscount, subtotal, appliedDiscount } = useCart()
  const { showDiscount, discountInfo, offerTimeRemaining, dismissDiscount } = useSnapshots({ tracker })

  const [selectedProduct, setSelectedProduct] = useState(null)
  const [cartOpen, setCartOpen] = useState(false)

  // ── Handlers ────────────────────────────────────────────────────────────
  const handleProductView = (product) => {
    trackView(product)
    setSelectedProduct(product)
  }

  const handleAddToCart = (product) => {
    addToCart(product)
    trackCart(product)
    setSelectedProduct(null)
    setCartOpen(true)
  }

  const handleQuickAdd = (product) => {
    addToCart(product)
    trackCart(product)
    setCartOpen(true)
  }

  const handleApplyDiscount = () => {
    if (discountInfo?.code) applyDiscount(discountInfo.code, discountInfo.pct)
    dismissDiscount()
    setCartOpen(true)
  }

  const cartCount = cartItems.reduce((n, i) => n + i.qty, 0)

  return (
    <div className="min-h-screen bg-[#FAFAFA] font-inter">
      {/* ── Header ────────────────────────────────────────────────────── */}
      <Header cartCount={cartCount} onCartOpen={() => setCartOpen(true)} />

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <HeroSection />

      {/* ── Product Grid ──────────────────────────────────────────────── */}
      <section className="max-w-[1400px] mx-auto px-6 py-20">
        <ProductGrid
          products={PRODUCTS}
          onProductView={handleProductView}
          onQuickAdd={handleQuickAdd}
        />
      </section>

      {/* ── Footer ────────────────────────────────────────────────────── */}
      <Footer />

      {/* ── Overlays (portals over everything) ────────────────────────── */}
      <ProductModal
        product={selectedProduct}
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={handleAddToCart}
      />

      <CartSidebar
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        items={cartItems}
        onUpdateQty={updateQty}
        onRemove={removeFromCart}
        subtotal={subtotal}
        appliedDiscount={appliedDiscount}
      />

      <DiscountNotification
        show={showDiscount}
        discountInfo={discountInfo}
        offerTimeRemaining={offerTimeRemaining}
        onDismiss={dismissDiscount}
        onApply={handleApplyDiscount}
      />
    </div>
  )
}

// ─── Root (owns TrackerProvider) ─────────────────────────────────────────────
export default function App() {
  return (
    <TrackerProvider>
      <AppInner />
    </TrackerProvider>
  )
}
