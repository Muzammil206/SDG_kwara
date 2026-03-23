'use client'
import { useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import LayerPanel from '@/components/panels/LayerPanel'
import StatsPanel from '@/components/panels/StatsPanel'
import MobileDrawer, { type DrawerTab } from '@/components/panels/MobileDrawer'
import type { AmenityType } from '@/types'
import type { BasemapKey } from '@/components/map/SDMMap'

const SDMMap = dynamic(() => import('@/components/map/SDMMap'), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center bg-[#e8eee8]">
      <div className="text-sm text-gray-400 animate-pulse">Loading map…</div>
    </div>
  ),
})

type VizMode = 'markers' | 'heatmap' | 'choropleth'
type MobileTab = 'map' | 'layers' | 'stats' | 'filter'

const BASEMAPS: { key: BasemapKey; label: string }[] = [
  { key: 'streets',  label: 'Streets'  },
  { key: 'positron', label: 'Light'    },
  { key: 'fiord',    label: 'Dark'     },
]

export default function MapShell() {
  const [activeLayers, setActiveLayers] = useState<AmenityType[]>(['health', 'power', 'water'])
  const [vizMode, setVizMode]           = useState<VizMode>('markers')
  const [basemap, setBasemap]           = useState<BasemapKey>('streets')
  const [leftOpen, setLeftOpen]         = useState(true)
  const [rightOpen, setRightOpen]       = useState(true)
  const [selectedAmenity, setSelectedAmenity] = useState<Record<string, unknown> | null>(null)
  const [mobileTab, setMobileTab]       = useState<MobileTab>('map')
  const [drawerTab, setDrawerTab]       = useState<DrawerTab>('layers')

  const toggleLayer = useCallback((type: AmenityType) => {
    setActiveLayers(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    )
  }, [])

  const handleMobileNav = (tab: MobileTab) => {
    setMobileTab(tab)
    if (tab !== 'map') {
      setDrawerTab(tab as DrawerTab)
    }
  }

  return (
    <div className="relative flex-1 overflow-hidden min-h-0">

      {/* ── Map (always full-size underneath) ─────────────────────────── */}
      <div className="absolute inset-0">
        <SDMMap
          activeLayers={activeLayers}
          vizMode={vizMode}
          basemap={basemap}
          onAmenityClick={setSelectedAmenity}
        />
      </div>

      {/* ── Basemap switcher ──────────────────────────────────────────── */}
      <div className="absolute bottom-4 left-4 z-10 flex gap-1.5 md:bottom-5">
        {BASEMAPS.map(b => (
          <button
            key={b.key}
            onClick={() => setBasemap(b.key)}
            className={`px-2.5 py-1 text-[10px] font-medium rounded-md border shadow-sm transition-all ${
              basemap === b.key
                ? 'bg-brand text-white border-brand'
                : 'bg-white/90 backdrop-blur-sm text-gray-600 border-white/60 hover:bg-white'
            }`}
          >
            {b.label}
          </button>
        ))}
      </div>

      {/* ── DESKTOP: FAB toggles ──────────────────────────────────────── */}
      <div className="hidden md:flex absolute top-3 left-3 z-20 gap-2">
        <FabButton
          active={leftOpen}
          onClick={() => setLeftOpen(v => !v)}
          icon={<LayersIcon />}
          label="Layers"
        />
      </div>
      <div className="hidden md:flex absolute top-3 right-3 z-20">
        <FabButton
          active={rightOpen}
          onClick={() => setRightOpen(v => !v)}
          icon={<StatsIcon />}
          label="Stats"
        />
      </div>

      {/* ── DESKTOP: Left panel (floats over map) ─────────────────────── */}
      <aside
        className={`
          hidden md:flex flex-col
          absolute top-0 left-0 bottom-0 w-[240px]
          bg-white border-r border-gray-100/80 z-30
          overflow-hidden
          transition-transform duration-200 ease-out will-change-transform
          ${leftOpen ? 'translate-x-0 shadow-[4px_0_24px_rgba(0,0,0,0.07)]' : '-translate-x-full'}
        `}
      >
        <LayerPanel
          activeLayers={activeLayers}
          onToggle={toggleLayer}
          vizMode={vizMode}
          onVizChange={v => setVizMode(v)}
          onClose={() => setLeftOpen(false)}
        />
      </aside>

      {/* ── DESKTOP: Right panel (floats over map) ────────────────────── */}
      <aside
        className={`
          hidden md:flex flex-col
          absolute top-0 right-0 bottom-0 w-[272px]
          bg-white border-l border-gray-100/80 z-30
          overflow-hidden
          transition-transform duration-200 ease-out will-change-transform
          ${rightOpen ? 'translate-x-0 shadow-[-4px_0_24px_rgba(0,0,0,0.07)]' : 'translate-x-full'}
        `}
      >
        <StatsPanel
          activeLayers={activeLayers}
          selectedAmenity={selectedAmenity}
          onClose={() => setRightOpen(false)}
        />
      </aside>

      {/* ── MOBILE: Bottom drawer ─────────────────────────────────────── */}
      <MobileDrawer
        open={mobileTab !== 'map'}
        activeTab={drawerTab}
        onTabChange={setDrawerTab}
        activeLayers={activeLayers}
        onToggle={toggleLayer}
        vizMode={vizMode}
        onVizChange={v => setVizMode(v)}
        onClose={() => setMobileTab('map')}
      />

      {/* ── MOBILE: Bottom nav bar ────────────────────────────────────── */}
      <nav className="md:hidden absolute bottom-0 left-0 right-0 z-40 flex items-center bg-white border-t border-gray-100 h-14 px-1 safe-area-pb">
        {(
          [
            { key: 'map',    label: 'Map',    icon: <MapIcon />    },
            { key: 'layers', label: 'Layers', icon: <LayersIcon /> },
            { key: 'stats',  label: 'Stats',  icon: <StatsIcon />  },
            { key: 'filter', label: 'Filter', icon: <FilterIcon /> },
          ] as { key: MobileTab; label: string; icon: React.ReactNode }[]
        ).map(item => (
          <button
            key={item.key}
            onClick={() => handleMobileNav(item.key)}
            className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-1.5 rounded-xl text-[10px] font-medium transition-colors ${
              mobileTab === item.key ? 'text-brand' : 'text-gray-400'
            }`}
          >
            <span className={`w-5 h-5 flex items-center justify-center transition-transform ${mobileTab === item.key ? 'scale-110' : ''}`}>
              {item.icon}
            </span>
            {item.label}
          </button>
        ))}
      </nav>
    </div>
  )
}

// ─── Shared FAB button ────────────────────────────────────────────────────────
function FabButton({ active, onClick, icon, label }: {
  active: boolean; onClick: () => void; icon: React.ReactNode; label: string
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 h-8 text-[11px] font-medium rounded-lg border shadow-sm transition-all ${
        active
          ? 'bg-brand text-white border-brand shadow-brand/20'
          : 'bg-white/90 backdrop-blur-sm text-gray-600 border-white/60 hover:bg-white'
      }`}
    >
      <span className="flex-shrink-0">{icon}</span>
      {label}
    </button>
  )
}

// ─── Icons ────────────────────────────────────────────────────────────────────
const MapIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.3"/>
    <line x1="8" y1="2" x2="8" y2="14" stroke="currentColor" strokeWidth="0.9"/>
    <line x1="2" y1="8" x2="14" y2="8" stroke="currentColor" strokeWidth="0.9"/>
    <ellipse cx="8" cy="8" rx="2.5" ry="5.5" stroke="currentColor" strokeWidth="0.7"/>
  </svg>
)
const LayersIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <rect x="1" y="2" width="12" height="2.5" rx="1" fill="currentColor" opacity=".9"/>
    <rect x="1" y="5.7" width="12" height="2.5" rx="1" fill="currentColor" opacity=".55"/>
    <rect x="1" y="9.5" width="12" height="2.5" rx="1" fill="currentColor" opacity=".25"/>
  </svg>
)
const StatsIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <rect x="1" y="8"  width="3.5" height="5" rx="1" fill="currentColor"/>
    <rect x="5.3" y="5" width="3.5" height="8" rx="1" fill="currentColor"/>
    <rect x="9.5" y="1" width="3.5" height="12" rx="1" fill="currentColor"/>
  </svg>
)
const FilterIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <line x1="1.5" y1="4"  x2="12.5" y2="4"  stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    <line x1="3.5" y1="7.5" x2="10.5" y2="7.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    <line x1="5.5" y1="11" x2="8.5"  y2="11" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
  </svg>
)
