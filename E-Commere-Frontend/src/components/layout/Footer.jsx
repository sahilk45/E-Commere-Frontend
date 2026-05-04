import React from 'react'

export default function Footer() {
  return (
    <footer className="bg-neutral-950 text-neutral-50 w-full pt-20 pb-10 px-12 border-t border-neutral-800">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-12 max-w-[1440px] mx-auto mb-20">
        {/* Brand */}
        <div className="flex flex-col gap-6">
          <div className="text-xl font-black text-neutral-50">NEXORA</div>
          <p className="text-neutral-400 text-sm max-w-xs leading-relaxed">
            Pioneering the intersection of architectural design and consumer technology. Each piece is an artifact of functional beauty.
          </p>
        </div>

        {/* Shop */}
        <div className="flex flex-col gap-4">
          <span className="font-label-sm text-[10px] uppercase tracking-widest text-neutral-500 mb-2">SHOP</span>
          <a href="#" className="text-neutral-400 hover:text-white transition-colors text-sm">New Arrivals</a>
          <a href="#" className="text-neutral-400 hover:text-white transition-colors text-sm">Audio Systems</a>
          <a href="#" className="text-neutral-400 hover:text-white transition-colors text-sm">Computing</a>
          <a href="#" className="text-neutral-400 hover:text-white transition-colors text-sm">Smart Home</a>
        </div>

        {/* Support */}
        <div className="flex flex-col gap-4">
          <span className="font-label-sm text-[10px] uppercase tracking-widest text-neutral-500 mb-2">SUPPORT</span>
          <a href="#" className="text-neutral-400 hover:text-white transition-colors text-sm">Shipping &amp; Returns</a>
          <a href="#" className="text-neutral-400 hover:text-white transition-colors text-sm">Warranty</a>
          <a href="#" className="text-neutral-400 hover:text-white transition-colors text-sm">Product Care</a>
          <a href="#" className="text-neutral-400 hover:text-white transition-colors text-sm">Contact Us</a>
        </div>

        {/* Follow */}
        <div className="flex flex-col gap-4">
          <span className="font-label-sm text-[10px] uppercase tracking-widest text-neutral-500 mb-2">FOLLOW</span>
          <a href="#" className="text-neutral-400 hover:text-white transition-colors text-sm">Instagram</a>
          <a href="#" className="text-neutral-400 hover:text-white transition-colors text-sm">LinkedIn</a>
          <a href="#" className="text-neutral-400 hover:text-white transition-colors text-sm">Journal</a>
          <a href="#" className="text-neutral-400 hover:text-white transition-colors text-sm">Showroom</a>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="max-w-[1440px] mx-auto pt-10 border-t border-neutral-900 flex flex-col md:flex-row justify-between items-center gap-6">
        <span className="text-neutral-500 text-[10px] tracking-widest uppercase">© 2024 NEXORA PREMIUM ELECTRONICS</span>
        <div className="flex gap-8 text-[10px] tracking-widest text-neutral-500 uppercase">
          <a href="#">Privacy Policy</a>
          <a href="#">Terms of Service</a>
          <a href="#">Cookie Settings</a>
        </div>
      </div>
    </footer>
  )
}
