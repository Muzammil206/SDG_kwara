'use client'
import { useLGAStats } from '@/lib/hooks/useLGAStats'
import { useAlerts } from '@/lib/hooks/useAlerts'
import { LAYER_COLORS, LAYER_LABELS, STATUS_COLORS } from '@/types'
import type { AmenityType } from '@/types'

interface Props {
  activeLayers: AmenityType[]
  selectedAmenity?: Record<string, unknown> | null
  onClose?: () => void
}

export default function StatsPanel({ activeLayers, selectedAmenity, onClose }: Props) {
  const { totals, stats, loading } = useLGAStats()
  const { alerts } = useAlerts(5)

  // Top 5 LGAs for health facilities
  const healthByLGA = stats
    .filter(s => s.amenity_type === 'health')
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  const maxCount = healthByLGA[0]?.count ?? 1

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 relative">
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-6 h-6 rounded-md bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-[11px] text-gray-500 transition-colors"
          >
            ✕
          </button>
        )}
        <p className="text-[13px] font-medium text-gray-800">Kwara State Overview</p>
        <p className="text-[11px] text-gray-400 mt-0.5">16 LGAs · analysis ready</p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Stat cards */}
        <div className="grid grid-cols-2 gap-2 p-3">
          {(['health', 'power', 'water', 'road'] as AmenityType[]).map(type => (
            <div
              key={type}
              className={`rounded-xl p-3 transition-opacity ${activeLayers.includes(type) ? 'opacity-100' : 'opacity-40'}`}
              style={{ background: LAYER_COLORS[type] + '12' }}
            >
              <div className="flex items-center gap-1.5 mb-1.5">
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ background: LAYER_COLORS[type] }}
                />
                <span className="text-[10px] text-gray-500">{LAYER_LABELS[type]}</span>
              </div>
              <div className="text-[20px] font-semibold text-gray-900 leading-none">
                {loading ? '—' : (totals[type] ?? 0).toLocaleString()}
              </div>
              <div className="text-[10px] text-gray-400 mt-0.5">
                {type === 'road' ? 'km mapped' : 'features'}
              </div>
            </div>
          ))}
        </div>

        {/* LGA bar chart */}
        <div className="px-3 pb-3 border-t border-gray-50 pt-3">
          <p className="text-[11px] font-medium text-gray-400 mb-3">Health facilities by LGA</p>
          {healthByLGA.length === 0 && !loading && (
            <p className="text-[11px] text-gray-300 text-center py-4">No data</p>
          )}
          {healthByLGA.map(row => (
            <div key={row.lga_id} className="flex items-center gap-2 mb-2">
              <span className="text-[10px] text-gray-400 w-16 text-right flex-shrink-0 truncate">
                {row.lga_name.replace(' Local Government', '')}
              </span>
              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${(row.count / maxCount) * 100}%`,
                    background: LAYER_COLORS.health,
                    opacity: 0.75,
                  }}
                />
              </div>
              <span className="text-[10px] text-gray-300 w-5 text-right">{row.count}</span>
            </div>
          ))}
        </div>

        {/* Selected amenity detail */}
        {selectedAmenity && (
          <div className="mx-3 mb-3 p-3 rounded-xl border border-gray-100 bg-gray-50">
            <p className="text-[11px] font-medium text-gray-700 mb-2">Selected Feature</p>
            {Object.entries(selectedAmenity)
              .filter(([k]) => !['id', 'color'].includes(k))
              .map(([k, v]) => (
                <div key={k} className="flex justify-between text-[11px] mb-1">
                  <span className="text-gray-400 capitalize">{k.replace(/_/g, ' ')}</span>
                  <span
                    className="font-medium"
                    style={{
                      color: k === 'status' && typeof v === 'string'
                        ? STATUS_COLORS[v as keyof typeof STATUS_COLORS] ?? '#333'
                        : '#333',
                    }}
                  >
                    {String(v).replace(/_/g, ' ')}
                  </span>
                </div>
              ))}
          </div>
        )}

        {/* Alerts */}
        <div className="px-3 pb-4 border-t border-gray-50 pt-3">
          <p className="text-[11px] font-medium text-gray-400 mb-2.5">Recent activity</p>
          {alerts.length === 0 && (
            <p className="text-[11px] text-gray-300 text-center py-3">No recent activity</p>
          )}
          {alerts.map(alert => (
            <div key={alert.id} className="flex gap-2.5 items-start mb-2 p-2.5 rounded-xl bg-gray-50">
              <div
                className="w-6 h-6 rounded-md flex-shrink-0 flex items-center justify-center text-[9px] font-bold text-white"
                style={{ background: LAYER_COLORS[alert.amenity_type as AmenityType] ?? '#999' }}
              >
                {alert.amenity_type?.[0]?.toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-[11px] text-gray-600 leading-snug truncate">{alert.amenity_name}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  {alert.old_status
                    ? `${alert.old_status.replace(/_/g,' ')} → ${alert.new_status.replace(/_/g,' ')}`
                    : alert.new_status.replace(/_/g,' ')}
                </p>
                <p className="text-[9px] text-gray-300 mt-0.5">
                  {new Date(alert.changed_at).toLocaleDateString('en-NG', {
                    day:'numeric', month:'short', hour:'2-digit', minute:'2-digit',
                  })}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
