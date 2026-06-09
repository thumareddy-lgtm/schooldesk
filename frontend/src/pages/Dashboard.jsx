import { useEffect, useState } from 'react'
import { Users, ClipboardCheck, CreditCard, BookOpen, TrendingUp, UserX, Bell, GraduationCap } from 'lucide-react'
import api from '../utils/api'
import { useAuth } from '../context/AuthContext'

function MetricCard({ icon: Icon, label, value, sub, color }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    red: 'bg-red-50 text-red-600',
    purple: 'bg-purple-50 text-purple-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    indigo: 'bg-indigo-50 text-indigo-600',
  }
  return (
    <div className="card flex items-start gap-4">
      <div className={`p-3 rounded-xl ${colors[color]}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-500 font-medium">{label}</p>
        <p className="text-2xl font-bold text-gray-900 mt-0.5">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const [metrics, setMetrics] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/dashboard/metrics')
      .then(r => setMetrics(r.data))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">{today}</p>
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard icon={Users} label="Total Students" value={metrics?.total_students ?? 0}
          sub={`${metrics?.total_classes ?? 0} classes`} color="blue" />
        <MetricCard icon={ClipboardCheck} label="Present Today" value={metrics?.present_today ?? 0}
          sub={`${metrics?.attendance_rate ?? 0}% attendance rate`} color="green" />
        <MetricCard icon={UserX} label="Absent Today" value={metrics?.absent_today ?? 0}
          sub="Marked absent" color="red" />
        <MetricCard icon={CreditCard} label="Fees Collected" value={`₹${(metrics?.total_fees_collected ?? 0).toLocaleString('en-IN')}`}
          sub={`₹${(metrics?.total_fees_pending ?? 0).toLocaleString('en-IN')} pending`} color="purple" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard icon={TrendingUp} label="Attendance Rate" value={`${metrics?.attendance_rate ?? 0}%`}
          sub="Today's rate" color="indigo" />
        <MetricCard icon={BookOpen} label="Upcoming Exams" value={metrics?.upcoming_exams ?? 0}
          sub="Scheduled" color="yellow" />
        <MetricCard icon={Bell} label="Total Notices" value={metrics?.recent_notices ?? 0}
          sub="All announcements" color="blue" />
      </div>

      {/* Welcome banner */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <GraduationCap className="w-6 h-6 text-blue-200" />
          <h2 className="text-lg font-semibold">Welcome, {user?.name}!</h2>
        </div>
        <p className="text-blue-100 text-sm">
          Manage your school efficiently with SchoolDesk. Track students, attendance, fees and exams all in one place.
        </p>
      </div>

      {/* Quick stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Classes', value: metrics?.total_classes ?? 0 },
          { label: 'Fees Pending', value: `₹${(metrics?.total_fees_pending ?? 0).toLocaleString('en-IN')}` },
          { label: 'Upcoming Exams', value: metrics?.upcoming_exams ?? 0 },
          { label: 'Notices Posted', value: metrics?.recent_notices ?? 0 },
        ].map(({ label, value }) => (
          <div key={label} className="card text-center">
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-500 mt-1">{label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
