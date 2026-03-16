import { useState, useEffect } from 'react'

interface ChangePasswordSectionProps {
  onUpdatePassword: (newPassword: string) => Promise<void>
  onSuccess: () => void
  onError: (error: string) => void
}

export default function ChangePasswordSection({ onUpdatePassword, onSuccess, onError }: ChangePasswordSectionProps) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [strength, setStrength] = useState(0)

  // Password Strength Logic
  useEffect(() => {
    let score = 0
    if (newPassword.length >= 8) score++
    if (/\d/.test(newPassword) && /[a-zA-Z]/.test(newPassword)) score++
    if (/[!@#$%^&*(),.?":{}|<>]/.test(newPassword)) score++
    setStrength(score)
  }, [newPassword])

  const getStrengthLabel = () => {
    if (strength === 0 && newPassword === '') return ''
    if (strength === 1) return 'Weak'
    if (strength === 2) return 'Medium'
    if (strength === 3) return 'Strong'
    return ''
  }

  const getStrengthColor = () => {
    if (strength === 1) return 'bg-red-500'
    if (strength === 2) return 'bg-amber-500'
    if (strength === 3) return 'bg-green-500'
    return 'bg-gray-700'
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!currentPassword || !newPassword || !confirmPassword) {
      onError('All password fields are required')
      return
    }

    if (newPassword.length < 8) {
      onError('Password must be at least 8 characters')
      return
    }

    if (newPassword !== confirmPassword) {
      onError('Passwords do not match')
      return
    }

    setLoading(true)
    try {
      await onUpdatePassword(newPassword)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      onSuccess()
    } catch (err: any) {
      onError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-2xl p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400">
          <span className="text-xl">🔒</span>
        </div>
        <h3 className="text-lg font-bold text-white">Security</h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Current password</label>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Enter current password"
            className="w-full bg-[#0f1117] border border-[#2a2d3a] rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">New password</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Enter new password"
            className="w-full bg-[#0f1117] border border-[#2a2d3a] rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
          />
          
          {/* Password Strength Indicator */}
          {newPassword && (
            <div className="mt-3">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Strength: {getStrengthLabel()}</span>
              </div>
              <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden flex gap-1">
                <div className={`h-full transition-all duration-500 ${strength >= 1 ? getStrengthColor() : 'bg-transparent'} flex-1`}></div>
                <div className={`h-full transition-all duration-500 ${strength >= 2 ? getStrengthColor() : 'bg-transparent'} flex-1`}></div>
                <div className={`h-full transition-all duration-500 ${strength >= 3 ? getStrengthColor() : 'bg-transparent'} flex-1`}></div>
              </div>
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Confirm new password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm new password"
            className="w-full bg-[#0f1117] border border-[#2a2d3a] rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-2 py-4 px-6 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 disabled:cursor-not-allowed text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Updating...</span>
            </>
          ) : (
            'Update password'
          )}
        </button>
      </form>
    </div>
  )
}
