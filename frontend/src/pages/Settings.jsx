import { useEffect, useState } from 'react'
import { Save, School, CreditCard, Check } from 'lucide-react'
import api from '../utils/api'
import toast from 'react-hot-toast'

const PLANS = [
  {
    name: 'Free',
    key: 'free',
    price: '₹0',
    period: 'forever',
    features: ['Up to 100 students', '3 classes', 'Basic attendance', 'Notices'],
    color: 'border-gray-200',
    badge: 'bg-gray-100 text-gray-700',
  },
  {
    name: 'Basic',
    key: 'basic',
    price: '₹999',
    period: 'per month',
    features: ['Up to 500 students', 'Unlimited classes', 'Fees management', 'Exam results', 'Email support'],
    color: 'border-blue-400',
    badge: 'bg-blue-100 text-blue-700',
    recommended: true,
  },
  {
    name: 'Pro',
    key: 'pro',
    price: '₹2,499',
    period: 'per month',
    features: ['Unlimited students', 'Unlimited classes', 'All features', 'Priority support', 'Custom branding', 'Reports & analytics'],
    color: 'border-purple-400',
    badge: 'bg-purple-100 text-purple-700',
  },
]

export default function Settings() {
  const [school, setSchool] = useState(null)
  const [form, setForm] = useState({ name: '', phone: '', address: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api.get('/settings/school').then(r => {
      setSchool(r.data)
      setForm({ name: r.data.name, phone: r.data.phone || '', address: r.data.address || '' })
    }).finally(() => setLoading(false))
  }, [])

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const updated = await api.put('/settings/school', form)
      setSchool(updated.data)
      toast.success('School profile updated!')
    } catch (err) {
      toast.error('Error updating profile')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 text-sm">Manage your school profile and subscription</p>
      </div>

      {/* School Profile */}
      <div className="card">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-50 rounded-lg">
            <School className="w-5 h-5 text-blue-600" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900">School Profile</h2>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">School Name *</label>
              <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input className="input bg-gray-50" value={school?.email || ''} disabled />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input className="input" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+91 98765 43210" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subscription Plan</label>
              <input className="input bg-gray-50 capitalize" value={school?.subscription_plan || 'free'} disabled />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <textarea className="input resize-none" rows={3} value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="School address" />
          </div>
          <div className="flex justify-end">
            <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>

      {/* Subscription Plans */}
      <div className="card">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-purple-50 rounded-lg">
            <CreditCard className="w-5 h-5 text-purple-600" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900">Subscription Plans</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {PLANS.map(plan => {
            const isCurrent = school?.subscription_plan === plan.key
            return (
              <div key={plan.key} className={`border-2 rounded-xl p-5 relative ${plan.color} ${isCurrent ? 'shadow-md' : ''}`}>
                {plan.recommended && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-blue-600 text-white text-xs font-semibold px-3 py-1 rounded-full">Recommended</span>
                  </div>
                )}
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${plan.badge}`}>{plan.name}</span>
                  {isCurrent && <span className="text-xs text-green-600 font-semibold">✓ Current</span>}
                </div>
                <div className="mb-4">
                  <span className="text-2xl font-bold text-gray-900">{plan.price}</span>
                  <span className="text-sm text-gray-500 ml-1">{plan.period}</span>
                </div>
                <ul className="space-y-2 mb-5">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
                {!isCurrent && plan.key !== 'free' && (
                  <button
                    onClick={() => toast('Razorpay integration — configure plan IDs in .env', { icon: '💡' })}
                    className="w-full btn-primary text-sm py-2">
                    Upgrade to {plan.name}
                  </button>
                )}
                {isCurrent && (
                  <div className="w-full text-center text-sm text-gray-500 py-2">Active plan</div>
                )}
              </div>
            )
          })}
        </div>
        <p className="text-xs text-gray-400 mt-4">
          Payments processed securely via Razorpay. Configure your Razorpay plan IDs in the backend .env file.
        </p>
      </div>
    </div>
  )
}
