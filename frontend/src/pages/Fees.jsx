import { useEffect, useState } from 'react'
import { Plus, Search, CreditCard, CheckCircle, Clock, AlertCircle } from 'lucide-react'
import api from '../utils/api'
import toast from 'react-hot-toast'
import Modal from '../components/Modal'
import { format } from 'date-fns'

const FEE_TYPES = ['Tuition', 'Transport', 'Exam', 'Sports', 'Library', 'Hostel', 'Other']

const EMPTY_FORM = { student_id: '', fee_type: 'Tuition', amount: '', due_date: '', notes: '' }

function StatusBadge({ status }) {
  const map = {
    paid: <span className="badge-green flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Paid</span>,
    pending: <span className="badge-yellow flex items-center gap-1"><Clock className="w-3 h-3" /> Pending</span>,
    overdue: <span className="badge-red flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Overdue</span>,
  }
  return map[status] || status
}

export default function Fees() {
  const [fees, setFees] = useState([])
  const [students, setStudents] = useState([])
  const [classes, setClasses] = useState([])
  const [summary, setSummary] = useState({})
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(false)
  const [collectModal, setCollectModal] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const fetchAll = () => {
    Promise.all([
      api.get('/fees', { params: { status: statusFilter || undefined } }),
      api.get('/students'),
      api.get('/classes'),
      api.get('/fees/summary'),
    ]).then(([f, s, c, sum]) => {
      setFees(f.data)
      setStudents(s.data)
      setClasses(c.data)
      setSummary(sum.data)
    }).finally(() => setLoading(false))
  }

  useEffect(() => { fetchAll() }, [statusFilter])

  const handleCreate = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post('/fees', { ...form, amount: parseFloat(form.amount), due_date: form.due_date || null })
      toast.success('Fee record created!')
      setModal(false)
      setForm(EMPTY_FORM)
      fetchAll()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error')
    } finally {
      setSaving(false)
    }
  }

  const handleCollect = async (feeId) => {
    try {
      await api.put(`/fees/${feeId}/collect`, { paid_date: format(new Date(), 'yyyy-MM-dd') })
      toast.success('Payment recorded!')
      setCollectModal(null)
      fetchAll()
    } catch (err) {
      toast.error('Error recording payment')
    }
  }

  const filtered = fees.filter(f =>
    !search || f.student_name?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fees</h1>
          <p className="text-gray-500 text-sm">Manage student fee collection</p>
        </div>
        <button onClick={() => setModal(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Fee Record
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Collected', value: summary.collected, color: 'text-green-600', bg: 'bg-green-50', icon: CheckCircle },
          { label: 'Pending', value: summary.pending, color: 'text-yellow-600', bg: 'bg-yellow-50', icon: Clock },
          { label: 'Overdue', value: summary.overdue, color: 'text-red-600', bg: 'bg-red-50', icon: AlertCircle },
        ].map(({ label, value, color, bg, icon: Icon }) => (
          <div key={label} className={`card flex items-center gap-4`}>
            <div className={`p-3 rounded-xl ${bg}`}>
              <Icon className={`w-6 h-6 ${color}`} />
            </div>
            <div>
              <p className="text-sm text-gray-500">{label}</p>
              <p className={`text-xl font-bold ${color}`}>₹{(value || 0).toLocaleString('en-IN')}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            className="input pl-9" placeholder="Search by student name..." />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="input sm:w-40">
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="paid">Paid</option>
          <option value="overdue">Overdue</option>
        </select>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400">
            <CreditCard className="w-12 h-12 mb-3 opacity-40" />
            <p className="font-medium">No fee records</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Student', 'Fee Type', 'Amount', 'Due Date', 'Status', 'Receipt', 'Action'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(fee => (
                  <tr key={fee.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{fee.student_name}</p>
                      <p className="text-xs text-gray-400">{fee.class_name}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{fee.fee_type}</td>
                    <td className="px-4 py-3 font-semibold text-gray-900">₹{fee.amount.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3 text-gray-600">{fee.due_date || '—'}</td>
                    <td className="px-4 py-3"><StatusBadge status={fee.status} /></td>
                    <td className="px-4 py-3 text-xs text-gray-400 font-mono">{fee.receipt_no}</td>
                    <td className="px-4 py-3">
                      {fee.status !== 'paid' && (
                        <button onClick={() => setCollectModal(fee)}
                          className="text-xs btn-primary py-1 px-3">
                          Collect
                        </button>
                      )}
                      {fee.status === 'paid' && (
                        <span className="text-xs text-green-600">Paid {fee.paid_date}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Fee Modal */}
      <Modal open={modal} onClose={() => setModal(false)} title="Add Fee Record">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Student *</label>
            <select className="input" value={form.student_id} onChange={e => setForm(f => ({ ...f, student_id: e.target.value }))} required>
              <option value="">Select student</option>
              {students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.class_name || 'No class'})</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fee Type *</label>
              <select className="input" value={form.fee_type} onChange={e => setForm(f => ({ ...f, fee_type: e.target.value }))}>
                {FEE_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹) *</label>
              <input type="number" className="input" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="5000" required min="0" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
            <input type="date" className="input" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea className="input resize-none" rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Creating...' : 'Create Record'}</button>
          </div>
        </form>
      </Modal>

      {/* Collect Modal */}
      <Modal open={!!collectModal} onClose={() => setCollectModal(null)} title="Record Payment" size="sm">
        {collectModal && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Student</span><span className="font-medium">{collectModal.student_name}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Fee Type</span><span>{collectModal.fee_type}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Amount</span><span className="font-bold text-lg">₹{collectModal.amount.toLocaleString('en-IN')}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Receipt No</span><span className="font-mono text-xs">{collectModal.receipt_no}</span></div>
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setCollectModal(null)} className="btn-secondary">Cancel</button>
              <button onClick={() => handleCollect(collectModal.id)} className="btn-primary">
                ✓ Mark as Paid
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
