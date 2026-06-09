import { useEffect, useState } from 'react'
import { Plus, Search, Edit2, Trash2, Users, Filter } from 'lucide-react'
import api from '../utils/api'
import toast from 'react-hot-toast'
import Modal from '../components/Modal'

const EMPTY_FORM = {
  name: '', class_id: '', roll_no: '', gender: '',
  dob: '', parent_name: '', parent_phone: '', parent_email: '', address: ''
}

export default function Students() {
  const [students, setStudents] = useState([])
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterClass, setFilterClass] = useState('')
  const [modal, setModal] = useState({ open: false, mode: 'add', student: null })
  const [classModal, setClassModal] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [classForm, setClassForm] = useState({ name: '', section: 'A', teacher_name: '' })
  const [saving, setSaving] = useState(false)

  const fetchAll = () => {
    Promise.all([
      api.get('/students', { params: { search, class_id: filterClass || undefined } }),
      api.get('/classes'),
    ]).then(([s, c]) => {
      setStudents(s.data)
      setClasses(c.data)
    }).finally(() => setLoading(false))
  }

  useEffect(() => { fetchAll() }, [search, filterClass])

  const openAdd = () => { setForm(EMPTY_FORM); setModal({ open: true, mode: 'add', student: null }) }
  const openEdit = (s) => {
    setForm({
      name: s.name || '', class_id: s.class_id || '', roll_no: s.roll_no || '',
      gender: s.gender || '', dob: s.dob || '', parent_name: s.parent_name || '',
      parent_phone: s.parent_phone || '', parent_email: s.parent_email || '', address: s.address || ''
    })
    setModal({ open: true, mode: 'edit', student: s })
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = { ...form, class_id: form.class_id || null, dob: form.dob || null }
      if (modal.mode === 'add') {
        await api.post('/students', payload)
        toast.success('Student added!')
      } else {
        await api.put(`/students/${modal.student.id}`, payload)
        toast.success('Student updated!')
      }
      setModal({ open: false, mode: 'add', student: null })
      fetchAll()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error saving student')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Deactivate this student?')) return
    await api.delete(`/students/${id}`)
    toast.success('Student deactivated')
    fetchAll()
  }

  const handleAddClass = async (e) => {
    e.preventDefault()
    try {
      await api.post('/classes', classForm)
      toast.success('Class added!')
      setClassModal(false)
      setClassForm({ name: '', section: 'A', teacher_name: '' })
      api.get('/classes').then(r => setClasses(r.data))
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error adding class')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Students</h1>
          <p className="text-gray-500 text-sm">{students.length} students found</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setClassModal(true)} className="btn-secondary text-sm flex items-center gap-1.5">
            <Plus className="w-4 h-4" /> Add Class
          </button>
          <button onClick={openAdd} className="btn-primary text-sm flex items-center gap-1.5">
            <Plus className="w-4 h-4" /> Add Student
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            className="input pl-9" placeholder="Search students by name..." />
        </div>
        <select value={filterClass} onChange={e => setFilterClass(e.target.value)}
          className="input sm:w-48">
          <option value="">All Classes</option>
          {classes.map(c => (
            <option key={c.id} value={c.id}>{c.name} - {c.section}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : students.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400">
            <Users className="w-12 h-12 mb-3 opacity-40" />
            <p className="font-medium">No students found</p>
            <p className="text-sm">Add your first student to get started</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Name', 'Class', 'Roll No', 'Parent', 'Phone', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {students.map(s => (
                  <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold text-xs flex-shrink-0">
                          {s.name[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{s.name}</p>
                          <p className="text-xs text-gray-400">{s.gender}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{s.class_name || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{s.roll_no || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{s.parent_name || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{s.parent_phone || '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEdit(s)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(s.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Student Modal */}
      <Modal open={modal.open} onClose={() => setModal(m => ({ ...m, open: false }))}
        title={modal.mode === 'add' ? 'Add Student' : 'Edit Student'} size="lg">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
              <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Student name" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
              <select className="input" value={form.class_id} onChange={e => setForm(f => ({ ...f, class_id: e.target.value }))}>
                <option value="">Select class</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name} - {c.section}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Roll No</label>
              <input className="input" value={form.roll_no} onChange={e => setForm(f => ({ ...f, roll_no: e.target.value }))} placeholder="e.g. 01" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
              <select className="input" value={form.gender} onChange={e => setForm(f => ({ ...f, gender: e.target.value }))}>
                <option value="">Select</option>
                <option>Male</option><option>Female</option><option>Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
              <input type="date" className="input" value={form.dob} onChange={e => setForm(f => ({ ...f, dob: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Parent Name</label>
              <input className="input" value={form.parent_name} onChange={e => setForm(f => ({ ...f, parent_name: e.target.value }))} placeholder="Parent / Guardian" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Parent Phone</label>
              <input className="input" value={form.parent_phone} onChange={e => setForm(f => ({ ...f, parent_phone: e.target.value }))} placeholder="+91 98765 43210" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Parent Email</label>
              <input type="email" className="input" value={form.parent_email} onChange={e => setForm(f => ({ ...f, parent_email: e.target.value }))} placeholder="parent@email.com" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <textarea className="input resize-none" rows={2} value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="Home address" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModal(m => ({ ...m, open: false }))} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Saving...' : modal.mode === 'add' ? 'Add Student' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Class Modal */}
      <Modal open={classModal} onClose={() => setClassModal(false)} title="Add Class" size="sm">
        <form onSubmit={handleAddClass} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Class Name *</label>
            <input className="input" value={classForm.name} onChange={e => setClassForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Class 5" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
            <input className="input" value={classForm.section} onChange={e => setClassForm(f => ({ ...f, section: e.target.value }))} placeholder="A" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Class Teacher</label>
            <input className="input" value={classForm.teacher_name} onChange={e => setClassForm(f => ({ ...f, teacher_name: e.target.value }))} placeholder="Teacher name" />
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setClassModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Add Class</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
