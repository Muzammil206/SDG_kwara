'use client'
import type { AmenityType } from '@/types'
import { LAYER_COLORS, LAYER_LABELS, ALL_LAYERS } from '@/types'

type VizMode = 'markers' | 'heatmap' | 'choropleth'

interface Props {
  activeLayers: AmenityType[]
  onToggle: (t: AmenityType) => void
  vizMode: VizMode
  onVizChange: (v: VizMode) => void
  onClose?: () => void
}

export default function LayerPanel({
  activeLayers, onToggle, vizMode, onVizChange, onClose,
}: Props) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <span className="text-[13px] font-medium text-gray-800">Map Controls</span>
        {onClose && (
          <button
            onClick={onClose}
            className="w-6 h-6 rounded-md bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-[11px] text-gray-500 transition-colors"
          >
            ✕
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Layers */}
        <Section label="Amenity Layers">
          {ALL_LAYERS.map(type => (
            <LayerRow
              key={type}
              type={type}
              active={activeLayers.includes(type)}
              onToggle={() => onToggle(type)}
            />
          ))}
        </Section>

        {/* Visualization */}
        <Section label="Visualization">
          {(
            [
              { mode: 'markers',    label: 'Marker view',  icon: <MarkerIcon /> },
              { mode: 'heatmap',    label: 'Heatmap',      icon: <HeatmapIcon /> },
              { mode: 'choropleth', label: 'Choropleth',   icon: <ChoroplethIcon /> },
            ] as { mode: VizMode; label: string; icon: React.ReactNode }[]
          ).map(({ mode, label, icon }) => (
            <button
              key={mode}
              onClick={() => onVizChange(mode)}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 text-[12px] rounded-lg border mb-1 transition-all text-left ${
                vizMode === mode
                  ? 'bg-brand-light text-brand border-brand/30 font-medium'
                  : 'bg-white text-gray-500 border-gray-100 hover:bg-gray-50'
              }`}
            >
              <span className="flex-shrink-0">{icon}</span>
              {label}
            </button>
          ))}
        </Section>

        {/* Study Area */}
        <Section label="Study Area">
          <ActionBtn icon={<DrawIcon />} label="Draw boundary" />
          <ActionBtn icon={<UploadIcon />} label="Upload GeoJSON" />
          <ActionBtn icon={<TableIcon />} label="Select by LGA" />
        </Section>

        {/* Filters */}
        <Section label="Filter">
          <label className="block text-[11px] text-gray-400 mb-1">LGA</label>
          <select className="w-full text-[12px] px-2.5 py-2 rounded-lg border border-gray-200 bg-white text-gray-700 mb-3 focus:outline-none focus:border-brand/50">
            <option>All LGAs</option>
            <option>Ilorin West</option>
            <option>Ilorin East</option>
            <option>Offa</option>
            <option>Edu</option>
            <option>Kwara North</option>
            <option>Moro</option>
            <option>Patigi</option>
          </select>
          <label className="block text-[11px] text-gray-400 mb-1">Status</label>
          <select className="w-full text-[12px] px-2.5 py-2 rounded-lg border border-gray-200 bg-white text-gray-700 focus:outline-none focus:border-brand/50">
            <option>All statuses</option>
            <option>Functional</option>
            <option>Non-functional</option>
            <option>Under construction</option>
          </select>
        </Section>
      </div>

      {/* Export button */}
      <div className="p-3 border-t border-gray-100">
        <button className="w-full py-2.5 text-[12px] font-medium rounded-lg bg-brand text-white hover:bg-brand-mid transition-colors">
          Export Report
        </button>
      </div>
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="px-3 py-3 border-b border-gray-50">
      <p className="text-[10px] font-medium uppercase tracking-widest text-gray-300 mb-2.5">
        {label}
      </p>
      {children}
    </div>
  )
}

function LayerRow({ type, active, onToggle }: {
  type: AmenityType; active: boolean; onToggle: () => void
}) {
  return (
    <div
      className="flex items-center gap-2.5 py-1.5 px-1 rounded-lg hover:bg-gray-50 cursor-pointer"
      onClick={onToggle}
    >
      <span
        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
        style={{ background: LAYER_COLORS[type] }}
      />
      <span className="flex-1 text-[12px] text-gray-700">{LAYER_LABELS[type]}</span>
      {/* Toggle pill */}
      <div className={`w-7 h-4 rounded-full relative transition-colors ${active ? 'bg-brand' : 'bg-gray-200'}`}>
        <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-transform ${active ? 'translate-x-3.5' : 'translate-x-0.5'}`} />
      </div>
    </div>
  )
}

function ActionBtn({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <button className="w-full flex items-center gap-2 px-2.5 py-2 text-[12px] rounded-lg border border-gray-100 bg-white text-gray-500 hover:bg-gray-50 mb-1 transition-colors">
      <span className="flex-shrink-0 text-gray-400">{icon}</span>
      {label}
    </button>
  )
}

// ─── Icons ────────────────────────────────────────────────────────────────────
const MarkerIcon = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
    <circle cx="6.5" cy="6.5" r="3.5" fill="currentColor" opacity=".45"/>
    <circle cx="6.5" cy="6.5" r="2" fill="currentColor"/>
  </svg>
)
const HeatmapIcon = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
    <circle cx="6.5" cy="6.5" r="5.5" fill="rgba(230,57,70,.12)"/>
    <circle cx="6.5" cy="6.5" r="3.5" fill="rgba(230,57,70,.3)"/>
    <circle cx="6.5" cy="6.5" r="1.8" fill="rgba(230,57,70,.85)"/>
  </svg>
)
const ChoroplethIcon = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
    <rect x="0.5" y="0.5" width="5.5" height="5.5" fill="rgba(26,95,63,.2)" stroke="rgba(26,95,63,.4)" strokeWidth=".5"/>
    <rect x="7" y="0.5" width="5.5" height="5.5" fill="rgba(26,95,63,.5)" stroke="rgba(26,95,63,.4)" strokeWidth=".5"/>
    <rect x="0.5" y="7" width="5.5" height="5.5" fill="rgba(26,95,63,.75)" stroke="rgba(26,95,63,.4)" strokeWidth=".5"/>
    <rect x="7" y="7" width="5.5" height="5.5" fill="rgba(26,95,63,.15)" stroke="rgba(26,95,63,.4)" strokeWidth=".5"/>
  </svg>
)
const DrawIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
    <polygon points="1.5,1.5 10.5,1.5 10.5,10.5 1.5,10.5" stroke="currentColor" strokeWidth="1" fill="none" strokeDasharray="2 1.5"/>
  </svg>
)
const UploadIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
    <path d="M6 8V2M3.5 4.5L6 2l2.5 2.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
    <path d="M1.5 9.5v1h9v-1" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
  </svg>
)
const TableIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
    <rect x="1" y="2.5" width="10" height="7" rx="1.5" stroke="currentColor" strokeWidth="1" fill="none"/>
    <line x1="1" y1="5" x2="11" y2="5" stroke="currentColor" strokeWidth=".8"/>
    <line x1="5" y1="5" x2="5" y2="9.5" stroke="currentColor" strokeWidth=".8"/>
  </svg>
)
