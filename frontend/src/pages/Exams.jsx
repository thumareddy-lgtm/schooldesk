import { useEffect, useState } from 'react'
import { Plus, BookOpen, Edit2, Trash2, ClipboardList } from 'lucide-react'
import api from '../utils/api'
import toast from 'react-hot-toast'
import Modal from '../components/Modal'

const EMPTY_EXAM = { name: '', class_id: '', subject: '', exam_date: '', max_marks: 100, passing_marks: 35 }

const GRADE_COLORS = {
  'A+': 'badge-green', 'A': 'badge-green', 'B+': 'badge-blue', 'B': 'badge-blue',
  'C': 'badge-yellow', 'D': 'badge-yellow', 'F': 'badge-red',
}

export default function Exams() {
  const [exams, setExams] = useState([])
  const [classes, setClasses] = useState([])
  const [students, setStudents] = useState([])
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterClass, setFilterClass] = useState('')
  const [examModal, setExamModal] = useState(false)
  const [resultsModal, setResultsModal] = useState(null) // exam object
  const [form, setForm] = useState(EMPTY_EXAM)
  const [marks, setMarks] = useState({}) // student_id -> marks
  const [saving, setSaving] = useState(false)

  const fetchAll = () => {
    Promise.all([
      api.get('/exams', { params: { class_id: filterClass || undefined } }),
      api.get('/classes'),
    ]).then(([e, c]) => {
      setExams(e.data)
      setClasses(c.data)
    }).finally(() => setLoading(false))
  }

  useEffect(() => { fetchAll() }, [filterClass])

  const openResults = async (exam) => {
    setResultsModal(exam)
    const [studRes, resRes] = await Promise.all([
      api.get('/students', { params: { class_id: exam.class_id } }),
      api.get(`/exams/${exam.id}/results`),
    ])
    setStudents(studRes.data)
    const marksMap = {}
    resRes.data.forEach(r => { marksMap[r.student_id] = r.marks_obtained ?? '' })
    studRes.data.forEach(s => { if (!(s.id in marksMap)) marksMap[s.id] = '' })
    setMarks(marksMap)
    setResults(resRes.data)
  }

  const handleCreateExam = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post('/exams', { ...form, exam_date: form.exam_date || null, max_marks: parseInt(form.max_marks), passing_marks: parseInt(form.passing_marks) })
      toast.success('Exam created!')
      setExamModal(false)
      setForm(EMPTY_EXAM)
      fetchAll()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteExam = async (id) => {
    if (!confirm('Delete this exam?')) return
    await api.delete(`/exams/${id}`)
    toast.success('Exam deleted')
    fetchAll()
  }

  const handleSaveResults = async () => {
    setSaving(true)
    try {
      const resultsList = students.map(s => ({
        student_id: s.id,
        marks_obtained: marks[s.id] !== '' ? parseFloat(marks[s.id]) : null,
      })).filter(r => r.marks_obtained !== null)

      await api.post(`/exams/${resultsModal.id}/results`, { results: resultsList })
      toast.success('Results saved!')
      setResultsModal(null)
    } catch (err) {
      toast.error('Error saving results')
    } finally {
      setSaving(false)
    }
  }

  const calcGrade = (marks, max) => {
    if (!marks) return '—'
    const pct = (marks / max) * 100
    if (pct >= 90) return 'A+'
    if (pct >= 80) return 'A'
    if (pct >= 70) return 'B+'
    if (pct >= 60) return 'B'
    if (pct >= 50) return 'C'
    if (pct >= 35) return 'D'
    return 'F'
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Exams</h1>
          <p className="text-gray-500 text-sm">Schedule exams and manage results</p>
        </div>
        <button onClick={() => setExamModal(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Schedule Exam
        </button>
      </div>

      {/* Filter */}
      <div className="flex gap-3">
        <select value={filterClass} onChange={e => setFilterClass(e.target.value)} className="input sm:w-48">
          <option value="">All Classes</option>
          {classes.map(c => <option key={c.id} value={c.id}>{c.name} - {c.section}</option>)}
        </select>
      </div>

      {/* Exam cards */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : exams.length === 0 ? (
        <div className="card flex flex-col items-center justify-center h-48 text-gray-400">
          <BookOpen className="w-12 h-12 mb-3 opacity-40" />
          <p className="font-medium">No exams scheduled</p>
          <p className="text-sm">Click "Schedule Exam" to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {exams.map(exam => (
            <div key={exam.id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openResults(exam)}
                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Enter Results">
                    <ClipboardList className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDeleteExam(exam.id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <h3 className="font-semibold text-gray-900">{exam.name}</h3>
              <p className="text-sm text-gray-500 mt-1">{exam.subject}</p>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
                <span>{exam.class_name}</span>
                <span>{exam.exam_date || 'Date TBD'}</span>
              </div>
              <div className="flex items-center justify-between mt-2 text-xs">
                <span className="text-gray-400">Max: {exam.max_marks} | Pass: {exam.passing_marks}</span>
                <span className="badge-blue">{exam.result_count} results</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Exam Modal */}
      <Modal open={examModal} onClose={() => setExamModal(false)} title="Schedule Exam">
        <form onSubmit={handleCreateExam} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Exam Name *</label>
            <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Unit Test 1" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Class *</label>
              <select className="input" value={form.class_id} onChange={e => setForm(f => ({ ...f, class_id: e.target.value }))} required>
                <option value="">Select class</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name} - {c.section}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
              <input className="input" value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} placeholder="Mathematics" required />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input type="date" className="input" value={form.exam_date} onChange={e => setForm(f => ({ ...f, exam_date: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Marks</label>
              <input type="number" className="input" value={form.max_marks} onChange={e => setForm(f => ({ ...f, max_marks: e.target.value }))} min="1" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pass Marks</label>
              <input type="number" className="input" value={form.passing_marks} onChange={e => setForm(f => ({ ...f, passing_marks: e.target.value }))} min="0" />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setExamModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Creating...' : 'Schedule Exam'}</button>
          </div>
        </form>
      </Modal>

      {/* Results Modal */}
      <Modal open={!!resultsModal} onClose={() => setResultsModal(null)} title={`Results — ${resultsModal?.name}`} size="lg">
        {resultsModal && (
          <div className="space-y-4">
            <div className="flex gap-4 text-sm text-gray-500">
              <span>Class: <strong>{resultsModal.class_name}</strong></span>
              <span>Subject: <strong>{resultsModal.subject}</strong></span>
              <span>Max Marks: <strong>{resultsModal.max_marks}</strong></span>
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {students.map((s, i) => {
                const grade = calcGrade(marks[s.id], resultsModal.max_marks)
                return (
                  <div key={s.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <span className="text-xs text-gray-400 w-5">{i + 1}</span>
                    <span className="flex-1 text-sm font-medium text-gray-800">{s.name}</span>
                    <span className="text-xs text-gray-400">Roll: {s.roll_no || '—'}</span>
                    <input
                      type="number"
                      className="input w-24 text-center"
                      placeholder="Marks"
                      value={marks[s.id] ?? ''}
                      onChange={e => setMarks(m => ({ ...m, [s.id]: e.target.value }))}
                      min="0"
                      max={resultsModal.max_marks}
                    />
                    <span className={`w-10 text-center text-xs font-bold ${GRADE_COLORS[grade] || ''}`}>
                      {marks[s.id] !== '' ? grade : '—'}
                    </span>
                  </div>
                )
              })}
            </div>
            <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
              <button onClick={() => setResultsModal(null)} className="btn-secondary">Cancel</button>
              <button onClick={handleSaveResults} disabled={saving} className="btn-primary">
                {saving ? 'Saving...' : 'Save Results'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
