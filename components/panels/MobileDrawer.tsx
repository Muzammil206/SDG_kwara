'use client'
import LayerPanel from './LayerPanel'
import StatsPanel from './StatsPanel'
import type { AmenityType } from '@/types'

export type DrawerTab = 'layers' | 'stats' | 'filter'

interface Props {
  open: boolean
  activeTab: DrawerTab
  onTabChange: (t: DrawerTab) => void
  activeLayers: AmenityType[]
  onToggle: (t: AmenityType) => void
  vizMode: 'markers' | 'heatmap' | 'choropleth'
  onVizChange: (v: any) => void
  onClose: () => void
}

export default function MobileDrawer({
  open, activeTab, onTabChange,
  activeLayers, onToggle, vizMode, onVizChange, onClose,
}: Props) {
  const TABS: { key: DrawerTab; label: string }[] = [
    { key: 'layers', label: 'Layers' },
    { key: 'stats',  label: 'Stats' },
    { key: 'filter', label: 'Filter' },
  ]

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="md:hidden absolute inset-0 z-30 bg-black/10"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={`
          md:hidden absolute left-0 right-0 bottom-14 z-40
          bg-white rounded-t-2xl shadow-2xl
          flex flex-col
          transition-transform duration-200 ease-out
          ${open ? 'translate-y-0' : 'translate-y-full'}
        `}
        style={{ maxHeight: '62dvh' }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-2.5 pb-1 flex-shrink-0 cursor-pointer" onClick={onClose}>
          <div className="w-9 h-1 bg-gray-200 rounded-full" />
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 px-4 flex-shrink-0">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => onTabChange(tab.key)}
              className={`py-2.5 px-4 text-[12px] font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'text-brand border-brand'
                  : 'text-gray-400 border-transparent'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 min-h-0">
          {activeTab === 'layers' && (
            <LayerPanel
              activeLayers={activeLayers}
              onToggle={onToggle}
              vizMode={vizMode}
              onVizChange={onVizChange}
            />
          )}
          {activeTab === 'stats' && (
            <StatsPanel activeLayers={activeLayers} />
          )}
          {activeTab === 'filter' && (
            <div className="p-4">
              <p className="text-[10px] font-medium uppercase tracking-widest text-gray-300 mb-2">LGA</p>
              <select className="w-full text-[12px] px-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-700 mb-4 focus:outline-none">
                <option>All LGAs</option>
                <option>Ilorin West</option>
                <option>Ilorin East</option>
                <option>Offa</option>
                <option>Edu</option>
                <option>Kwara North</option>
              </select>
              <p className="text-[10px] font-medium uppercase tracking-widest text-gray-300 mb-2">Status</p>
              <select className="w-full text-[12px] px-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-700 mb-4 focus:outline-none">
                <option>All statuses</option>
                <option>Functional</option>
                <option>Non-functional</option>
                <option>Under construction</option>
              </select>
              <p className="text-[10px] font-medium uppercase tracking-widest text-gray-300 mb-2">Study Area</p>
              <button className="w-full text-left flex items-center gap-2 px-3 py-2 text-[12px] rounded-lg border border-gray-200 text-gray-500 mb-2 hover:bg-gray-50">
                Draw boundary
              </button>
              <button className="w-full text-left flex items-center gap-2 px-3 py-2 text-[12px] rounded-lg border border-gray-200 text-gray-500 mb-4 hover:bg-gray-50">
                Upload GeoJSON
              </button>
              <button className="w-full py-2.5 text-[12px] font-medium rounded-lg bg-brand text-white hover:bg-brand-mid transition-colors">
                Export Report
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
