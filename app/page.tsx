import Topbar from '@/components/ui/Topbar'
import MapShell from '@/components/map/MapShell'

export default function DashboardPage() {
  return (
    <div className="flex flex-col h-full">
      <Topbar />
      <MapShell />
    </div>
  )
}
