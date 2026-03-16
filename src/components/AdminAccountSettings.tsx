import { useState, useEffect } from 'react'
import type { CurrentUser } from '../hooks/useAuth'
import ChangePasswordSection from './ChangePasswordSection'

interface AdminAccountSettingsProps {
  user: CurrentUser
  onBack: () => void
  onUpdateProfile: (data: any) => Promise<void>
  onUpdatePassword: (newPassword: string) => Promise<void>
}

export default function AdminAccountSettings({ user, onBack, onUpdateProfile, onUpdatePassword }: AdminAccountSettingsProps) {
  const [fullName, setFullName] = useState('')
  const [department, setDepartment] = useState('')
  const [jobTitle, setJobTitle] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  useEffect(() => {
    setFullName(user.fullName || '')
    setDepartment(user.department || '')
    setJobTitle(user.jobTitle || '')
    setEmail(user.email || '')
  }, [user])

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), type === 'success' ? 3000 : 4000)
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await onUpdateProfile({ fullName, department, jobTitle, email })
      showToast('Profile updated successfully', 'success')
    } catch (err: any) {
      showToast(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-6 right-6 text-white text-sm px-6 py-4 rounded-2xl shadow-2xl z-50 transition-all duration-500 animate-in slide-in-from-right-full ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          <div className="flex items-center gap-3">
            <span>{toast.type === 'success' ? '✅' : '❌'}</span>
            <span className="font-medium">{toast.message}</span>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-8">
        <div>
          <button onClick={onBack} className="text-gray-400 hover:text-white mb-2 flex items-center gap-2 transition-colors text-sm">
            <span>←</span> Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-white tracking-tight">Staff Settings</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Information */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-2xl p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400 font-bold">
                💼
              </div>
              <h3 className="text-lg font-bold text-white tracking-tight">Professional Profile</h3>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2.5">Full name</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-[#0f1117] border border-[#2a2d3a] rounded-xl px-5 py-3.5 text-white placeholder-gray-700 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2.5">Email address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#0f1117] border border-[#2a2d3a] rounded-xl px-5 py-3.5 text-white placeholder-gray-700 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  />
                  <p className="mt-2 text-[10px] text-gray-500 italic">Official institutional communication will be sent here.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2.5">Department</label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full bg-[#0f1117] border border-[#2a2d3a] rounded-xl px-5 py-3.5 text-white placeholder-gray-700 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2.5">Job Title</label>
                  <input
                    type="text"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    className="w-full bg-[#0f1117] border border-[#2a2d3a] rounded-xl px-5 py-3.5 text-white placeholder-gray-700 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2.5">Employee ID</label>
                  <div className="w-full bg-[#0f1117]/50 border border-[#2a2d3a] rounded-xl px-5 py-3.5 text-gray-500 cursor-not-allowed">
                    {user.employeeId}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-[#2a2d3a] flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/20 flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Saving...</span>
                    </>
                  ) : (
                    'Save changes'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Security / Sidebar */}
        <div className="space-y-6">
          <ChangePasswordSection 
            onUpdatePassword={onUpdatePassword}
            onSuccess={() => showToast('Password updated successfully', 'success')}
            onError={(err) => showToast(err, 'error')}
          />
        </div>
      </div>
    </div>
  )
}
