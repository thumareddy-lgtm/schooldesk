import { useEffect, useState } from 'react'
import { Plus, Bell, Pin, Trash2, Edit2, Users, BookOpen } from 'lucide-react'
import api from '../utils/api'
import toast from 'react-hot-toast'
import Modal from '../components/Modal'
import { format } from 'date-fns'

const AUDIENCE_OPTIONS = [
  { value: 'all', label: 'Everyone', icon: Users },
  { value: 'parents', label: 'Parents', icon: Users },
  { value: 'teachers', label: 'Teachers', icon: BookOpen },
  { value: 'students', label: 'Students', icon: BookOpen },
]

const AUDIENCE_COLORS = {
  all: 'badge-blue',
  parents: 'badge-green',
  teachers: 'badge-purple',
  students: 'badge-yellow',
}

const EMPTY_FORM = { title: '', content: '', audience: 'all', is_pinned: false }

export default function Notices() {
  const [notices, setNotices] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState({ open: false, mode: 'add', notice: null })
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [audienceFilter, setAudienceFilter] = useState('')

  const fetchNotices = () => {
    api.get('/notices', { params: { audience: audienceFilter || undefined } })
      .then(r => setNotices(r.data))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchNotices() }, [audienceFilter])

  const openAdd = () => { setForm(EMPTY_FORM); setModal({ open: true, mode: 'add', notice: null }) }
  const openEdit = (n) => {
    setForm({ title: n.title, content: n.content, audience: n.audience, is_pinned: n.is_pinned })
    setModal({ open: true, mode: 'edit', notice: n })
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (modal.mode === 'add') {
        await api.post('/notices', form)
        toast.success('Notice posted!')
      } else {
        await api.put(`/notices/${modal.notice.id}`, form)
        toast.success('Notice updated!')
      }
      setModal({ open: false, mode: 'add', notice: null })
      fetchNotices()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this notice?')) return
    await api.delete(`/notices/${id}`)
    toast.success('Notice deleted')
    fetchNotices()
  }

  const togglePin = async (notice) => {
    await api.put(`/notices/${notice.id}`, { is_pinned: !notice.is_pinned })
    fetchNotices()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notices</h1>
          <p className="text-gray-500 text-sm">{notices.length} announcements</p>
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Post Notice
        </button>
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        <span className="text-sm text-gray-600 self-center">Filter by:</span>
        {[{ value: '', label: 'All' }, ...AUDIENCE_OPTIONS].map(opt => (
          <button
            key={opt.value}
            onClick={() => setAudienceFilter(opt.value)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              audienceFilter === opt.value
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Notices list */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : notices.length === 0 ? (
        <div className="card flex flex-col items-center justify-center h-48 text-gray-400">
          <Bell className="w-12 h-12 mb-3 opacity-40" />
          <p className="font-medium">No notices posted</p>
          <p className="text-sm">Post your first announcement</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notices.map(notice => (
            <div key={notice.id} className={`card relative ${notice.is_pinned ? 'border-blue-300 bg-blue-50/30' : ''}`}>
              {notice.is_pinned && (
                <div className="absolute top-4 right-4">
                  <Pin className="w-4 h-4 text-blue-500" />
                </div>
              )}
              <div className="flex items-start justify-between gap-4 pr-6">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900">{notice.title}</h3>
                    <span className={`${AUDIENCE_COLORS[notice.audience] || 'badge-blue'} capitalize`}>
                      {notice.audience}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{notice.content}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    {format(new Date(notice.created_at), 'dd MMM yyyy, hh:mm a')}
                  </p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => togglePin(notice)}
                    className={`p-1.5 rounded-lg transition-colors ${notice.is_pinned ? 'text-blue-600 bg-blue-100' : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'}`}>
                    <Pin className="w-4 h-4" />
                  </button>
                  <button onClick={() => openEdit(notice)}
                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(notice.id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal open={modal.open} onClose={() => setModal(m => ({ ...m, open: false }))}
        title={modal.mode === 'add' ? 'Post Notice' : 'Edit Notice'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input className="input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="Notice title" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Content *</label>
            <textarea className="input resize-none" rows={4} value={form.content}
              onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
              placeholder="Write your announcement here..." required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Target Audience</label>
            <div className="flex gap-2 flex-wrap">
              {AUDIENCE_OPTIONS.map(opt => (
                <button key={opt.value} type="button"
                  onClick={() => setForm(f => ({ ...f, audience: opt.value }))}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                    form.audience === opt.value
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
                  }`}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.is_pinned} onChange={e => setForm(f => ({ ...f, is_pinned: e.target.checked }))}
              className="w-4 h-4 text-blue-600 rounded" />
            <span className="text-sm text-gray-700">Pin this notice to top</span>
          </label>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModal(m => ({ ...m, open: false }))} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Posting...' : modal.mode === 'add' ? 'Post Notice' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
