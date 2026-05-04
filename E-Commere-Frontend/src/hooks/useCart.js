import { useState, useMemo } from 'react'

/**
 * useCart — cart state with discount support.
 * cartItems: { ...product, qty, addedAt }
 * updateQty uses a delta (+1 / -1); removes item when qty reaches 0.
 */
export function useCart() {
  const [cartItems, setCartItems] = useState([])
  const [appliedDiscount, setAppliedDiscount] = useState(null) // { code, pct } | null

  // ── Mutations ─────────────────────────────────────────────────────────────
  const addToCart = (product) => {
    setCartItems((prev) => {
      const existing = prev.find((i) => i.id === product.id)
      if (existing) {
        return prev.map((i) =>
          i.id === product.id ? { ...i, qty: i.qty + 1 } : i
        )
      }
      return [...prev, { ...product, qty: 1, addedAt: Date.now() }]
    })
  }

  const removeFromCart = (productId) => {
    setCartItems((prev) => prev.filter((i) => i.id !== productId))
  }

  // delta = +1 or -1; removes item if resulting qty <= 0
  const updateQty = (productId, delta) => {
    setCartItems((prev) =>
      prev
        .map((i) => (i.id === productId ? { ...i, qty: i.qty + delta } : i))
        .filter((i) => i.qty > 0)
    )
  }

  const applyDiscount = (code, pct) => {
    setAppliedDiscount({ code, pct })
  }

  const clearDiscount = () => setAppliedDiscount(null)

  // ── Derived ───────────────────────────────────────────────────────────────
  const subtotal = useMemo(() => {
    const raw = cartItems.reduce((sum, i) => sum + i.price * i.qty, 0)
    if (!appliedDiscount) return raw
    return raw * (1 - appliedDiscount.pct / 100)
  }, [cartItems, appliedDiscount])

  return {
    cartItems,
    addToCart,
    removeFromCart,
    updateQty,
    applyDiscount,
    clearDiscount,
    appliedDiscount,
    subtotal,
  }
}

// Default export for backwards-compat
export default useCart
