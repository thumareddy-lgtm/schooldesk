import { useEffect, useState } from 'react'
import { ClipboardCheck, Save, ChevronLeft, ChevronRight } from 'lucide-react'
import api from '../utils/api'
import toast from 'react-hot-toast'
import { format, addDays, subDays } from 'date-fns'

const STATUS_OPTIONS = ['present', 'absent', 'leave']
const STATUS_COLORS = {
  present: 'bg-green-100 text-green-800 border-green-300',
  absent: 'bg-red-100 text-red-800 border-red-300',
  leave: 'bg-yellow-100 text-yellow-800 border-yellow-300',
}

export default function Attendance() {
  const [classes, setClasses] = useState([])
  const [selectedClass, setSelectedClass] = useState('')
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [students, setStudents] = useState([])
  const [attendance, setAttendance] = useState({}) // student_id -> status
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api.get('/classes').then(r => {
      setClasses(r.data)
      if (r.data.length > 0 && !selectedClass) setSelectedClass(r.data[0].id)
    })
  }, [])

  useEffect(() => {
    if (!selectedClass) return
    setLoading(true)

    Promise.all([
      api.get('/students', { params: { class_id: selectedClass } }),
      api.get(`/attendance/class/${selectedClass}`, { params: { date } }),
    ]).then(([studentsRes, attRes]) => {
      setStudents(studentsRes.data)

      // Initialize attendance map: default all to 'present'
      const attMap = {}
      studentsRes.data.forEach(s => { attMap[s.id] = 'present' })

      // Override with existing records
      attRes.data.forEach(r => { attMap[r.student_id] = r.status })
      setAttendance(attMap)
    }).finally(() => setLoading(false))
  }, [selectedClass, date])

  const handleStatusChange = (studentId, status) => {
    setAttendance(prev => ({ ...prev, [studentId]: status }))
  }

  const markAll = (status) => {
    const updated = {}
    students.forEach(s => { updated[s.id] = status })
    setAttendance(updated)
  }

  const handleSave = async () => {
    if (students.length === 0) { toast.error('No students in this class'); return }
    setSaving(true)
    try {
      const records = students.map(s => ({
        student_id: s.id,
        status: attendance[s.id] || 'present',
      }))
      await api.post('/attendance/bulk', {
        class_id: selectedClass,
        date,
        records,
      })
      toast.success('Attendance saved!')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error saving attendance')
    } finally {
      setSaving(false)
    }
  }

  const present = Object.values(attendance).filter(s => s === 'present').length
  const absent = Object.values(attendance).filter(s => s === 'absent').length
  const leave = Object.values(attendance).filter(s => s === 'leave').length

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Attendance</h1>
          <p className="text-gray-500 text-sm">Mark daily attendance by class</p>
        </div>
        <button onClick={handleSave} disabled={saving || students.length === 0}
          className="btn-primary flex items-center gap-2">
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save Attendance'}
        </button>
      </div>

      {/* Controls */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
            <select className="input" value={selectedClass} onChange={e => setSelectedClass(e.target.value)}>
              <option value="">Select class</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name} - {c.section} ({c.student_count} students)</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <div className="flex items-center gap-2">
              <button onClick={() => setDate(format(subDays(new Date(date), 1), 'yyyy-MM-dd'))}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <input type="date" className="input" value={date} onChange={e => setDate(e.target.value)} />
              <button onClick={() => setDate(format(addDays(new Date(date), 1), 'yyyy-MM-dd'))}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Summary */}
        {students.length > 0 && (
          <div className="flex gap-4 mt-4 pt-4 border-t border-gray-100">
            <span className="badge-green">✓ Present: {present}</span>
            <span className="badge-red">✗ Absent: {absent}</span>
            <span className="badge-yellow">◐ Leave: {leave}</span>
            <span className="text-sm text-gray-500">of {students.length}</span>
          </div>
        )}
      </div>

      {/* Quick actions */}
      {students.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          <span className="text-sm text-gray-600 self-center">Mark all as:</span>
          {STATUS_OPTIONS.map(s => (
            <button key={s} onClick={() => markAll(s)}
              className={`px-3 py-1 rounded-full text-xs font-medium border capitalize ${STATUS_COLORS[s]}`}>
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Student list */}
      <div className="card p-0 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !selectedClass ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400">
            <ClipboardCheck className="w-12 h-12 mb-3 opacity-40" />
            <p>Select a class to mark attendance</p>
          </div>
        ) : students.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400">
            <p className="font-medium">No students in this class</p>
            <p className="text-sm">Add students first from the Students page</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {students.map((student, idx) => (
              <div key={student.id} className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50">
                <span className="text-sm text-gray-400 w-8 text-right">{idx + 1}</span>
                <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold text-sm flex-shrink-0">
                  {student.name[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm">{student.name}</p>
                  <p className="text-xs text-gray-400">Roll: {student.roll_no || '—'}</p>
                </div>
                <div className="flex gap-2">
                  {STATUS_OPTIONS.map(status => (
                    <button
                      key={status}
                      onClick={() => handleStatusChange(student.id, status)}
                      className={`px-3 py-1 rounded-full text-xs font-medium border capitalize transition-all ${
                        attendance[student.id] === status
                          ? STATUS_COLORS[status] + ' ring-2 ring-offset-1'
                          : 'bg-white text-gray-400 border-gray-200 hover:border-gray-400'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
