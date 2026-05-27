import { ArrowRight } from 'lucide-react'
import { EMPLOYEE_MOCK } from '../../../data/employeeMockData'
import { cn } from '../../../lib/cn'

type ShiftStatus = 'Active' | 'Approved' | 'Pending' | 'Flagged'

function StatusBadge({ status }: { status: ShiftStatus }) {
  switch (status) {
    case 'Active':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 text-[10px] font-bold">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
          Active
        </span>
      )
    case 'Approved':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-light text-green text-[10px] font-bold">
          <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
            <path d="M1.5 4.5L3.5 6.5L7.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Approved
        </span>
      )
    case 'Pending':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-yellow-light text-yellow-700 text-[10px] font-bold">
          Pending
        </span>
      )
    case 'Flagged':
      return (
        <span
          className="inline-flex items-center px-2 py-0.5 rounded-full bg-red-light text-red text-[10px] font-bold cursor-help"
          title="Contact HR"
        >
          Flagged
        </span>
      )
  }
}

export function PersonalTimesheet() {
  const { recentShifts } = EMPLOYEE_MOCK

  return (
    <div className="flex flex-col gap-0 -mx-1">
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left py-2 px-2 text-[10px] font-bold uppercase tracking-widest text-gray-400 whitespace-nowrap">Date</th>
              <th className="text-left py-2 px-2 text-[10px] font-bold uppercase tracking-widest text-gray-400 whitespace-nowrap">Clock In</th>
              <th className="text-left py-2 px-2 text-[10px] font-bold uppercase tracking-widest text-gray-400 whitespace-nowrap">Clock Out</th>
              <th className="text-left py-2 px-2 text-[10px] font-bold uppercase tracking-widest text-gray-400 whitespace-nowrap">Duration</th>
              <th className="text-left py-2 px-2 text-[10px] font-bold uppercase tracking-widest text-gray-400 whitespace-nowrap">Earnings</th>
              <th className="text-left py-2 px-2 text-[10px] font-bold uppercase tracking-widest text-gray-400 whitespace-nowrap">Status</th>
            </tr>
          </thead>
          <tbody>
            {recentShifts.map((shift, i) => (
              <tr
                key={i}
                className={cn(
                  'border-b border-gray-50 transition-colors hover:bg-sky/40',
                  shift.status === 'Pending' && 'border-l-2 border-l-yellow',
                  shift.status === 'Flagged' && 'border-l-2 border-l-red',
                )}
              >
                <td className="py-2.5 px-2 font-semibold text-blackish whitespace-nowrap">{shift.date}</td>
                <td className="py-2.5 px-2 text-muted whitespace-nowrap">{shift.clockIn}</td>
                <td className="py-2.5 px-2 text-muted whitespace-nowrap">{shift.clockOut ?? '—'}</td>
                <td className="py-2.5 px-2 text-muted whitespace-nowrap">{shift.duration ?? '—'}</td>
                <td className="py-2.5 px-2 font-semibold text-blackish whitespace-nowrap">
                  {shift.earnings != null ? `$${shift.earnings.toFixed(2)}` : '—'}
                </td>
                <td className="py-2.5 px-2 whitespace-nowrap">
                  <StatusBadge status={shift.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="pt-2 px-2">
        <button className="flex items-center gap-1 text-[11px] text-royal font-semibold hover:text-blue-700 transition-colors cursor-pointer group">
          View full timesheet
          <ArrowRight size={11} className="group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </div>
  )
}
