import { useEffect, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts'
import {
  type AnalyticsDashboardResponse,
  fetchDashboard,
  formatNis,
} from '../../api/analytics'
import PermissionPanel from './PermissionPanel'

const PIE_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4']

// Custom RTL-friendly tooltip for Recharts
function NisTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-slate-800 border border-slate-600 rounded-lg p-3 text-xs space-y-1" dir="rtl">
      <p className="text-slate-300 font-medium">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }}>{p.name}: {formatNis(p.value)}</p>
      ))}
    </div>
  )
}

function KpiCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-slate-900 rounded-xl border border-slate-700 p-4">
      <p className="text-slate-500 text-xs mb-1">{label}</p>
      <p className="text-slate-100 text-2xl font-bold">{value}</p>
      {sub && <p className="text-slate-500 text-xs mt-1">{sub}</p>}
    </div>
  )
}

// Placeholder hotmanUserId — in production this comes from the users list API
const HOTMAN_USER_ID_PLACEHOLDER = '00000000-0000-0000-0000-000000000001'

export default function AnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsDashboardResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboard().then(setData).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="p-6 text-slate-400 text-sm">טוען...</div>
  if (!data) return <div className="p-6 text-red-400 text-sm">שגיאה בטעינת נתונים</div>

  const barData = data.monthlyRevenue.map(m => ({
    name: m.monthHe,
    'סכום כולל': m.grossAmount,
    'נגבה': m.collected,
  }))

  const pieData = data.materialDistribution.map(m => ({
    name: m.modelCode,
    value: Math.round(m.squareMeters),
  }))

  return (
    <div className="p-4 space-y-6" dir="rtl">
      <h2 className="text-slate-100 font-semibold text-lg">לוח בקרה — ניתוח עסקי</h2>

      {/* KPI header */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard label="הכנסות החודש" value={formatNis(data.totalRevenueThisMonth)} />
        <KpiCard label="נגבה החודש"   value={formatNis(data.totalCollectedThisMonth)} />
        <KpiCard label="צפוי לגביה"   value={formatNis(data.totalReceivablesPipeline)}
                 sub="הזמנות פעילות" />
        <KpiCard label="בייצור כעת"   value={String(data.openProductionBacklog)}
                 sub="הזמנות" />
      </div>

      {/* Revenue bar chart */}
      {barData.length > 0 && (
        <div className="bg-slate-900 rounded-xl border border-slate-700 p-4">
          <p className="text-slate-300 text-sm font-medium mb-4">הכנסות לעומת גבייה — השנה הנוכחית</p>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={barData} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }}
                     tickFormatter={v => `₪${(v / 1000).toFixed(0)}K`} />
              <Tooltip content={<NisTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12, color: '#94a3b8' }} />
              <Bar dataKey="סכום כולל" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="נגבה"      fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Material pie */}
      {pieData.length > 0 && (
        <div className="bg-slate-900 rounded-xl border border-slate-700 p-4">
          <p className="text-slate-300 text-sm font-medium mb-4">התפלגות חומרים (מ"ר)</p>
          <div className="flex flex-col md:flex-row items-center gap-4">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%"
                     outerRadius={80} label={({ name, percent }) =>
                       `${name} ${(percent * 100).toFixed(0)}%`}
                     labelLine={{ stroke: '#475569' }}>
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(val: number) => [`${val} מ"ר`, '']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* SLA compliance */}
      {data.slaCompliance.length > 0 && (
        <div className="bg-slate-900 rounded-xl border border-slate-700 p-4">
          <p className="text-slate-300 text-sm font-medium mb-3">עמידה ב-SLA — ייצור פעיל</p>
          <div className="space-y-2">
            {data.slaCompliance.map(entry => (
              <div key={entry.orderRef}
                   className="flex items-center justify-between text-sm">
                <span className="text-slate-300">{entry.customerName}</span>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 text-xs">{entry.slaDealine}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    entry.metSla
                      ? 'bg-emerald-900/40 text-emerald-300'
                      : 'bg-red-900/40 text-red-300'
                  }`}>
                    {entry.metSla ? 'בזמן' : 'חריגה'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Installer performance */}
      {data.installerPerformance.length > 0 && (
        <div className="bg-slate-900 rounded-xl border border-slate-700 p-4">
          <p className="text-slate-300 text-sm font-medium mb-3">ביצועי מתקינים</p>
          <div className="space-y-2">
            {data.installerPerformance.map(inst => (
              <div key={inst.installerName}
                   className="flex items-center justify-between text-sm">
                <span className="text-slate-300">{inst.installerName}</span>
                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <span>{inst.completedJobs} הושלמו</span>
                  {inst.jobsWithNotes > 0 && (
                    <span className="text-amber-400">{inst.jobsWithNotes} עם הערות</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hotman permission panel */}
      <PermissionPanel hotmanUserId={HOTMAN_USER_ID_PLACEHOLDER} />
    </div>
  )
}
