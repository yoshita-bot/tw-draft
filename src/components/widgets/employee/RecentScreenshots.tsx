import { ArrowRight, Monitor } from 'lucide-react'
import { EMPLOYEE_MOCK } from '../../../data/employeeMockData'
import { cn } from '../../../lib/cn'

// Generates a deterministic mock desktop screenshot as an SVG,
// simulating what a TimeWorks Desktop capture might look like.
function MockScreenshot({ variant, app }: { variant: number; app: string }) {
  // Each variant has slightly different "window" layouts
  const variants = [
    // 0 — Figma-like (canvas with panels)
    (
      <svg viewBox="0 0 280 175" className="w-full h-full">
        <rect width="280" height="175" fill="#F1F5F9" />
        {/* Top bar */}
        <rect width="280" height="26" fill="#1E293B" />
        <circle cx="14" cy="13" r="4" fill="#EF4444" opacity="0.7" />
        <circle cx="26" cy="13" r="4" fill="#F59E0B" opacity="0.7" />
        <circle cx="38" cy="13" r="4" fill="#10B981" opacity="0.7" />
        <rect x="90" y="9" width="100" height="8" rx="3" fill="#334155" />
        {/* Left panel */}
        <rect x="0" y="26" width="44" height="149" fill="#253047" />
        <rect x="8" y="38" width="28" height="28" rx="4" fill="#3B71E8" opacity="0.8" />
        <rect x="8" y="74" width="28" height="6" rx="2" fill="#4B6388" />
        <rect x="8" y="86" width="28" height="6" rx="2" fill="#4B6388" />
        <rect x="8" y="98" width="28" height="6" rx="2" fill="#4B6388" />
        {/* Right panel */}
        <rect x="224" y="26" width="56" height="149" fill="#F8FAFC" />
        <rect x="230" y="36" width="44" height="6" rx="2" fill="#CBD5E1" />
        <rect x="230" y="48" width="30" height="6" rx="2" fill="#E2E8F0" />
        <rect x="230" y="60" width="44" height="20" rx="3" fill="#EFF6FF" />
        <rect x="230" y="86" width="44" height="6" rx="2" fill="#E2E8F0" />
        {/* Canvas */}
        <rect x="44" y="26" width="180" height="149" fill="#E8EDF4" />
        <rect x="64" y="46" width="140" height="100" rx="4" fill="white" />
        <rect x="74" y="56" width="60" height="8" rx="2" fill="#CBD5E1" />
        <rect x="74" y="70" width="100" height="6" rx="2" fill="#E2E8F0" />
        <rect x="74" y="80" width="80" height="6" rx="2" fill="#E2E8F0" />
        <rect x="74" y="96" width="120" height="32" rx="4" fill="#EFF6FF" />
        <rect x="74" y="136" width="40" height="4" rx="2" fill="#E2E8F0" />
      </svg>
    ),
    // 1 — Browser / Chrome-like
    (
      <svg viewBox="0 0 280 175" className="w-full h-full">
        <rect width="280" height="175" fill="#FFFFFF" />
        {/* Chrome top bar */}
        <rect width="280" height="32" fill="#DEE1E6" />
        <circle cx="14" cy="16" r="4" fill="#EF4444" opacity="0.7" />
        <circle cx="26" cy="16" r="4" fill="#F59E0B" opacity="0.7" />
        <circle cx="38" cy="16" r="4" fill="#10B981" opacity="0.7" />
        {/* Tab */}
        <rect x="50" y="8" width="90" height="16" rx="3" fill="white" />
        <rect x="56" y="12" width="8" height="8" rx="1" fill="#3B71E8" opacity="0.6" />
        <rect x="68" y="14" width="50" height="4" rx="1" fill="#94A3B8" />
        {/* URL bar */}
        <rect x="50" y="36" width="180" height="10" rx="3" fill="#F1F5F9" />
        <rect x="54" y="39" width="60" height="4" rx="1" fill="#94A3B8" />
        {/* Page content */}
        <rect x="20" y="56" width="240" height="24" rx="3" fill="#F8FAFC" />
        <rect x="28" y="64" width="80" height="8" rx="2" fill="#3B71E8" opacity="0.5" />
        <rect x="20" y="88" width="160" height="6" rx="2" fill="#E2E8F0" />
        <rect x="20" y="100" width="200" height="6" rx="2" fill="#E2E8F0" />
        <rect x="20" y="112" width="140" height="6" rx="2" fill="#E2E8F0" />
        <rect x="20" y="128" width="240" height="32" rx="4" fill="#F0F9FF" />
        <rect x="28" y="138" width="100" height="6" rx="2" fill="#93C5FD" />
        <rect x="28" y="150" width="60" height="4" rx="2" fill="#BFDBFE" />
      </svg>
    ),
    // 2 — Figma variant 2 (component view)
    (
      <svg viewBox="0 0 280 175" className="w-full h-full">
        <rect width="280" height="175" fill="#2C2C2C" />
        {/* Top bar */}
        <rect width="280" height="26" fill="#1A1A1A" />
        <circle cx="14" cy="13" r="4" fill="#EF4444" opacity="0.7" />
        <circle cx="26" cy="13" r="4" fill="#F59E0B" opacity="0.7" />
        <circle cx="38" cy="13" r="4" fill="#10B981" opacity="0.7" />
        <rect x="80" y="9" width="120" height="8" rx="3" fill="#3A3A3A" />
        {/* Left sidebar */}
        <rect x="0" y="26" width="50" height="149" fill="#222222" />
        <rect x="8" y="36" width="34" height="6" rx="2" fill="#444" />
        <rect x="8" y="48" width="34" height="6" rx="2" fill="#3B71E8" opacity="0.6" />
        <rect x="8" y="60" width="34" height="6" rx="2" fill="#444" />
        <rect x="8" y="72" width="34" height="6" rx="2" fill="#444" />
        {/* Canvas */}
        <rect x="50" y="26" width="178" height="149" fill="#3C3C3C" />
        {/* Component frame */}
        <rect x="70" y="46" width="138" height="110" rx="2" fill="#484848" />
        <rect x="80" y="56" width="50" height="12" rx="3" fill="#6366F1" opacity="0.9" />
        <rect x="80" y="74" width="118" height="6" rx="2" fill="#555" />
        <rect x="80" y="84" width="90" height="6" rx="2" fill="#555" />
        <rect x="80" y="100" width="118" height="36" rx="4" fill="#404040" />
        <rect x="88" y="108" width="70" height="4" rx="1" fill="#666" />
        <rect x="88" y="116" width="50" height="4" rx="1" fill="#666" />
        <rect x="88" y="124" width="80" height="4" rx="1" fill="#666" />
        {/* Right panel */}
        <rect x="228" y="26" width="52" height="149" fill="#222222" />
        <rect x="234" y="36" width="40" height="6" rx="2" fill="#444" />
        <rect x="234" y="48" width="40" height="6" rx="2" fill="#444" />
      </svg>
    ),
    // 3 — VS Code
    (
      <svg viewBox="0 0 280 175" className="w-full h-full">
        <rect width="280" height="175" fill="#1E1E1E" />
        {/* Title bar */}
        <rect width="280" height="22" fill="#323233" />
        <circle cx="14" cy="11" r="4" fill="#EF4444" opacity="0.7" />
        <circle cx="26" cy="11" r="4" fill="#F59E0B" opacity="0.7" />
        <circle cx="38" cy="11" r="4" fill="#10B981" opacity="0.7" />
        <rect x="90" y="7" width="100" height="8" rx="2" fill="#3C3C3C" />
        {/* Activity bar */}
        <rect x="0" y="22" width="36" height="153" fill="#333333" />
        <rect x="8" y="32" width="20" height="20" rx="2" fill="#007ACC" opacity="0.8" />
        <rect x="10" y="60" width="16" height="4" rx="1" fill="#555" />
        <rect x="10" y="70" width="16" height="4" rx="1" fill="#555" />
        <rect x="10" y="80" width="16" height="4" rx="1" fill="#555" />
        {/* Sidebar */}
        <rect x="36" y="22" width="72" height="153" fill="#252526" />
        <rect x="42" y="32" width="60" height="6" rx="1" fill="#3C3C3C" />
        <rect x="42" y="44" width="50" height="4" rx="1" fill="#4E9A06" opacity="0.7" />
        <rect x="42" y="52" width="44" height="4" rx="1" fill="#569CD6" opacity="0.7" />
        <rect x="42" y="60" width="56" height="4" rx="1" fill="#4E9A06" opacity="0.7" />
        <rect x="42" y="68" width="48" height="4" rx="1" fill="#CE9178" opacity="0.7" />
        <rect x="42" y="76" width="60" height="4" rx="1" fill="#569CD6" opacity="0.7" />
        {/* Editor */}
        <rect x="108" y="22" width="172" height="153" fill="#1E1E1E" />
        {/* Line numbers */}
        <rect x="112" y="32" width="12" height="3" rx="1" fill="#3C3C3C" />
        <rect x="112" y="40" width="12" height="3" rx="1" fill="#3C3C3C" />
        <rect x="112" y="48" width="12" height="3" rx="1" fill="#3C3C3C" />
        {/* Code lines */}
        <rect x="130" y="30" width="30" height="4" rx="1" fill="#569CD6" opacity="0.8" />
        <rect x="164" y="30" width="50" height="4" rx="1" fill="#4FC1FF" opacity="0.8" />
        <rect x="130" y="40" width="20" height="4" rx="1" fill="#4E9A06" opacity="0.8" />
        <rect x="154" y="40" width="60" height="4" rx="1" fill="#CE9178" opacity="0.8" />
        <rect x="130" y="50" width="40" height="4" rx="1" fill="#DCDCAA" opacity="0.8" />
        <rect x="130" y="60" width="80" height="4" rx="1" fill="#9CDCFE" opacity="0.8" />
        <rect x="130" y="70" width="60" height="4" rx="1" fill="#CE9178" opacity="0.8" />
        <rect x="130" y="80" width="100" height="4" rx="1" fill="#4EC9B0" opacity="0.8" />
        <rect x="130" y="90" width="50" height="4" rx="1" fill="#569CD6" opacity="0.8" />
        <rect x="130" y="100" width="40" height="4" rx="1" fill="#DCDCAA" opacity="0.8" />
        {/* Active line highlight */}
        <rect x="108" y="58" width="172" height="14" fill="#2A2D2E" opacity="0.6" />
        {/* Status bar */}
        <rect x="108" y="161" width="172" height="14" fill="#007ACC" />
        <rect x="114" y="165" width="40" height="4" rx="1" fill="white" opacity="0.7" />
      </svg>
    ),
  ]

  return variants[variant % variants.length]
}

export function RecentScreenshots() {
  const { recentScreenshots } = EMPLOYEE_MOCK

  return (
    <div className="flex flex-col gap-4">
      {/* Header note */}
      <div className="flex items-center gap-2">
        <Monitor size={12} className="text-gray-400" />
        <span className="text-[11px] text-gray-400">
          Captured every 10 minutes by TimeWorks Desktop · Screenshots are visible to your manager
        </span>
      </div>

      {/* Screenshot grid — 2×2 */}
      <div className="grid grid-cols-2 gap-3">
        {recentScreenshots.map(shot => {
          const badgeColor =
            shot.activityPct >= 80 ? '#10B981' :
            shot.activityPct >= 60 ? '#F59E0B' : '#EF4444'

          return (
            <div key={shot.id} className="flex flex-col gap-2 group cursor-pointer">
              {/* Screenshot thumbnail */}
              <div className="relative rounded-lg overflow-hidden border border-gray-200 shadow-sm group-hover:border-blue-300 group-hover:shadow-md transition-all aspect-video">
                <MockScreenshot variant={shot.variant} app={shot.app} />

                {/* Activity badge — overlaid bottom-right */}
                <div
                  className="absolute bottom-1.5 right-1.5 flex items-center gap-1 px-1.5 py-0.5 rounded-md text-white text-[9px] font-bold"
                  style={{ backgroundColor: badgeColor }}
                >
                  {shot.activityPct}%
                </div>

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>

              {/* Timestamp + app */}
              <div className="flex items-center justify-between px-0.5">
                <span className="text-[11px] font-semibold text-gray-700">{shot.time}</span>
                <span className="text-[10px] text-gray-400">{shot.app}</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Footer link */}
      <button className="flex items-center gap-1.5 text-[11px] text-[#3B71E8] font-semibold hover:text-blue-700 transition-colors cursor-pointer group self-start">
        View all screenshots
        <ArrowRight size={11} className="group-hover:translate-x-0.5 transition-transform" />
      </button>
    </div>
  )
}
