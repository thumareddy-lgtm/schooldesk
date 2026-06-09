import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Users, ClipboardCheck, CreditCard,
  BookOpen, Bell, Settings, GraduationCap, X
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/students', icon: Users, label: 'Students' },
  { to: '/attendance', icon: ClipboardCheck, label: 'Attendance' },
  { to: '/fees', icon: CreditCard, label: 'Fees' },
  { to: '/exams', icon: BookOpen, label: 'Exams' },
  { to: '/notices', icon: Bell, label: 'Notices' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

export default function Sidebar({ open, onClose }) {
  const { user } = useAuth()

  return (
    <>
      {/* Overlay for mobile */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-20 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 h-full w-64 bg-blue-900 text-white z-30
          transform transition-transform duration-300 ease-in-out
          ${open ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:static lg:z-auto
        `}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-blue-800">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-7 h-7 text-blue-300" />
            <span className="text-xl font-bold">SchoolDesk</span>
          </div>
          <button onClick={onClose} className="lg:hidden text-blue-300 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* School name */}
        <div className="px-6 py-4 border-b border-blue-800">
          <p className="text-xs text-blue-400 uppercase tracking-wide">School</p>
          <p className="text-sm font-semibold mt-1 truncate">{user?.school_name || 'My School'}</p>
        </div>

        {/* Nav */}
        <nav className="px-3 py-4 space-y-1 flex-1 overflow-y-auto">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 ${
                  isActive
                    ? 'bg-blue-700 text-white'
                    : 'text-blue-200 hover:bg-blue-800 hover:text-white'
                }`
              }
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Plan badge */}
        <div className="px-6 py-4 border-t border-blue-800">
          <span className="text-xs bg-blue-700 text-blue-200 px-2 py-1 rounded-full uppercase tracking-wide">
            {user?.subscription_plan || 'free'} plan
          </span>
        </div>
      </aside>
    </>
  )
}
