import React, { useState, useEffect, useRef } from 'react'
import PRODUCTS from '../../data/products.js'

function formatTime(seconds) {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function ClockIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
}

// ── Copy Button ──────────────────────────────────────────────────────────────
function CopyButton({ code }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }).catch(() => {
      // Fallback for non-secure contexts
      const el = document.createElement('textarea')
      el.value = code
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <button
      onClick={handleCopy}
      style={{
        fontSize: '10px',
        fontFamily: 'Inter, sans-serif',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        color: copied ? '#16A34A' : '#6B6B6B',
        background: 'none',
        border: copied ? '1px solid #16A34A' : '1px solid #E5E5E5',
        padding: '4px 10px',
        cursor: 'pointer',
        transition: 'all 0.2s',
        whiteSpace: 'nowrap',
        alignSelf: 'center',
      }}
    >
      {copied ? 'COPIED ✓' : 'COPY'}
    </button>
  )
}

// ── Recent product chip ───────────────────────────────────────────────────────
function RecentProductChip({ productId }) {
  const product = PRODUCTS.find(p => p.id === productId)
  if (!product) return null

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      padding: '8px',
      border: '1px solid #F0F0F0',
      background: '#FAFAFA',
    }}>
      <img
        src={product.images[0]}
        alt={product.name}
        style={{ width: 36, height: 36, objectFit: 'cover', flexShrink: 0 }}
      />
      <div style={{ minWidth: 0 }}>
        <p style={{
          fontSize: '12px',
          fontFamily: 'Inter, sans-serif',
          fontWeight: 600,
          color: '#0A0A0A',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {product.name}
        </p>
        <p style={{ fontSize: '11px', fontFamily: 'Inter, sans-serif', color: '#6B6B6B', marginTop: '1px' }}>
          ${product.price.toFixed(2)}
        </p>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function DiscountNotification({ show, discountInfo, offerTimeRemaining, onDismiss, onApply }) {
  const recentProducts = discountInfo?.products?.slice(0, 3) ?? []

  return (
    <div
      role="dialog"
      aria-live="polite"
      id="discount-notification"
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 9999,
        width: '360px',
        background: '#FFFFFF',
        border: '1px solid #E5E5E5',
        borderRadius: 0,
        borderTop: '3px solid #D4A017',
        boxShadow: '0 8px 40px rgba(0,0,0,0.12)',
        transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.4s ease',
        transform: show ? 'translateY(0)' : 'translateY(calc(100% + 32px))',
        opacity: show ? 1 : 0,
        pointerEvents: show ? 'auto' : 'none',
      }}
    >
      <div style={{ padding: '20px' }}>

        {/* ── Close ─────────────────────────────────────────────────────── */}
        <button
          onClick={onDismiss}
          aria-label="Close offer"
          style={{
            position: 'absolute', top: '12px', right: '12px',
            width: '20px', height: '20px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#9CA3AF', background: 'none', border: 'none',
            cursor: 'pointer', padding: 0, transition: 'color 0.2s',
          }}
          onMouseOver={e => e.currentTarget.style.color = '#0A0A0A'}
          onMouseOut={e => e.currentTarget.style.color = '#9CA3AF'}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* ── Timer row ─────────────────────────────────────────────────── */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.12em',
          color: '#6B6B6B', fontFamily: 'Inter, sans-serif', fontWeight: 600,
        }}>
          <ClockIcon />
          <span>LIMITED TIME OFFER · {formatTime(offerTimeRemaining ?? 0)}</span>
        </div>

        {/* ── Heading ───────────────────────────────────────────────────── */}
        <p style={{
          fontFamily: "'Playfair Display', 'Noto Serif', serif",
          fontStyle: 'italic', fontSize: '20px', fontWeight: 400,
          color: '#0A0A0A', marginTop: '12px', lineHeight: '1.3',
        }}>
          You've unlocked a discount.
        </p>

        {/* ── Body ──────────────────────────────────────────────────────── */}
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#6B6B6B', marginTop: '8px', lineHeight: '1.6' }}>
          Based on your interest in{' '}
          <strong style={{ color: '#0A0A0A', fontWeight: 600 }}>
            {discountInfo?.label ?? 'your selection'}
          </strong>
          , here's an exclusive offer just for you.
        </p>

        {/* ── Offer box with copy button ─────────────────────────────────── */}
        <div style={{
          marginTop: '16px', background: '#F9F9F9',
          border: '1px solid #E5E5E5', padding: '14px 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px',
        }}>
          <div>
            <p style={{ fontFamily: "'IBM Plex Mono', 'Courier New', monospace", fontWeight: 700, fontSize: '24px', color: '#0A0A0A', letterSpacing: '0.06em' }}>
              {discountInfo?.code ?? 'NEXORA10'}
            </p>
            <p style={{ fontSize: '12px', color: '#6B6B6B', marginTop: '4px', fontFamily: 'Inter, sans-serif' }}>
              {discountInfo?.pct ?? 10}% off your entire cart — offer expires soon
            </p>
          </div>
          <CopyButton code={discountInfo?.code ?? 'NEXORA10'} />
        </div>

        {/* ── Recommended products ───────────────────────────────────────── */}
        {recentProducts.length > 0 && (
          <div style={{ marginTop: '16px' }}>
            <p style={{
              fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.12em',
              color: '#9CA3AF', fontFamily: 'Inter, sans-serif', fontWeight: 600, marginBottom: '8px',
            }}>
              Items you've been considering
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {recentProducts.map(id => <RecentProductChip key={id} productId={id} />)}
            </div>
          </div>
        )}

        {/* ── Apply button ──────────────────────────────────────────────── */}
        <button
          id="apply-discount-btn"
          onClick={onApply}
          style={{
            display: 'block', width: '100%', height: '48px', marginTop: '16px',
            background: '#0A0A0A', color: '#FFFFFF',
            fontSize: '12px', fontFamily: 'Inter, sans-serif', fontWeight: 600,
            textTransform: 'uppercase', letterSpacing: '0.12em',
            border: 'none', cursor: 'pointer', transition: 'background 0.2s',
          }}
          onMouseOver={e => e.currentTarget.style.background = '#262626'}
          onMouseOut={e => e.currentTarget.style.background = '#0A0A0A'}
        >
          APPLY TO CART
        </button>

        {/* ── Dismiss link ──────────────────────────────────────────────── */}
        <button
          onClick={onDismiss}
          style={{
            display: 'block', width: '100%', marginTop: '12px',
            fontSize: '11px', color: '#9CA3AF', fontFamily: 'Inter, sans-serif',
            textAlign: 'center', cursor: 'pointer', background: 'none',
            border: 'none', padding: 0, transition: 'color 0.2s',
          }}
          onMouseOver={e => e.currentTarget.style.color = '#6B6B6B'}
          onMouseOut={e => e.currentTarget.style.color = '#9CA3AF'}
        >
          No thanks, I'll pay full price
        </button>

      </div>
    </div>
  )
}
