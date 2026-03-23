'use client'

export default function Topbar() {
  return (
    <header className="h-13 flex-shrink-0 flex items-center px-4 gap-3 bg-white border-b border-gray-100 z-50">
      {/* Logo */}
      <div className="flex items-center gap-2.5 flex-shrink-0">
        <div className="w-7 h-7 rounded-lg bg-brand flex items-center justify-center">
          <GlobeIcon />
        </div>
        <span className="text-[13px] font-semibold text-gray-900 tracking-tight">
          Naviss SDM
        </span>
      </div>

      {/* Title — hides on small screens */}
      <span className="hidden sm:block text-[11px] text-gray-400 truncate flex-1 min-w-0">
        Kwara State Sustainable Development Monitor
      </span>

      {/* Right actions */}
      <div className="flex items-center gap-2 ml-auto flex-shrink-0">
        <span className="hidden sm:flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-full bg-brand-light text-brand">
          <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
          Live
        </span>

        {/* Notification bell */}
        <button className="w-8 h-8 rounded-lg border border-gray-100 flex items-center justify-center text-gray-400 hover:bg-gray-50 transition-colors">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 1.5a4 4 0 0 1 4 4v2.8l.8 1.2H2.2L3 8.3V5.5a4 4 0 0 1 4-4z" stroke="currentColor" strokeWidth="1.1" fill="none"/>
            <path d="M5.5 11.5a1.5 1.5 0 0 0 3 0" stroke="currentColor" strokeWidth="1.1" fill="none"/>
          </svg>
        </button>

        {/* Avatar */}
        <div className="w-7 h-7 rounded-full bg-brand flex items-center justify-center text-[10px] font-bold text-white select-none">
          NT
        </div>
      </div>
    </header>
  )
}

const GlobeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <circle cx="8" cy="8" r="5.5" stroke="white" strokeWidth="1.2"/>
    <line x1="8" y1="2" x2="8" y2="14" stroke="white" strokeWidth="0.9"/>
    <line x1="2" y1="8" x2="14" y2="8" stroke="white" strokeWidth="0.9"/>
    <ellipse cx="8" cy="8" rx="2.8" ry="5.5" stroke="white" strokeWidth="0.7"/>
  </svg>
)
