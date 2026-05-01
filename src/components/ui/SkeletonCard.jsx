import React from 'react'

// Inject shimmer keyframes once (avoids a separate CSS file)
const SHIMMER_STYLE = `
@keyframes nexora-shimmer {
  0%   { background-position: -600px 0; }
  100% { background-position:  600px 0; }
}
.nexora-shimmer {
  background: linear-gradient(90deg, #F0F0F0 25%, #E5E5E5 50%, #F0F0F0 75%);
  background-size: 1200px 100%;
  animation: nexora-shimmer 1.6s infinite linear;
}
`

let injected = false
function injectStyles() {
  if (injected || typeof document === 'undefined') return
  const el = document.createElement('style')
  el.textContent = SHIMMER_STYLE
  document.head.appendChild(el)
  injected = true
}

export default function SkeletonCard() {
  injectStyles()

  return (
    <div className="flex flex-col">
      {/* Image placeholder — matches ProductCard aspect-[4/5] */}
      <div className="nexora-shimmer aspect-[4/5] w-full" />

      {/* Brand line */}
      <div className="mt-3 space-y-2">
        <div className="nexora-shimmer h-2.5 w-1/4" />
        {/* Name line */}
        <div className="nexora-shimmer h-3.5 w-3/4" />
        {/* Price line */}
        <div className="nexora-shimmer h-3 w-1/3" />
      </div>
    </div>
  )
}
