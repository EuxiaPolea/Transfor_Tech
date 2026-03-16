import { useState } from 'react'
import { useAuth } from './hooks/useAuth'
import LoginPage from './components/LoginPage'
import RegisterForm from './components/RegisterForm'
import ForgotPassword from './components/ForgotPassword'
import SubmitConcernForm from './components/SubmitConcernForm'
import StatusTracker from './components/StatusTracker'
import AdminDashboard from './components/AdminDashboard'
import AccountSettings from './components/AccountSettings'
import SuperAdminDashboard from './components/SuperAdminDashboard'

export default function App() {
  const {
    user, loading,
    studentLogin, adminLogin,
    studentRegister, adminRegister,
    updateStudentProfile, updateAdminProfile, updatePassword,
    logout
  } = useAuth()

  const [screen, setScreen] = useState<'login' | 'register-student' | 'register-admin' | 'forgot' | 'settings'>('login')
  const [forgotRole, setForgotRole] = useState<'student' | 'admin'>('student')
  const [activeTab, setActiveTab] = useState<'submit' | 'tracker'>('submit')

  // Show loading spinner while checking session
  if (loading) return (
    <div className="min-h-screen bg-[#0f1117] flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full"></div>
    </div>
  )

  // ── NOT LOGGED IN ──────────────────────────────
  if (!user) {
    if (screen === 'register-student') return (
      <RegisterForm
        role="student"
        onBack={() => setScreen('login')}
        onRegister={studentRegister}
      />
    )
    if (screen === 'register-admin') return (
      <RegisterForm
        role="admin"
        onBack={() => setScreen('login')}
        onRegister={adminRegister}
      />
    )
    if (screen === 'forgot') return (
      <ForgotPassword
        role={forgotRole}
        onBack={() => setScreen('login')}
      />
    )
    return (
      <LoginPage
        onStudentLogin={studentLogin}
        onAdminLogin={adminLogin}
        onStudentRegister={() => setScreen('register-student')}
        onAdminRegister={() => setScreen('register-admin')}
        onForgotPassword={(role) => { setForgotRole(role); setScreen('forgot') }}
      />
    )
  }

  // ── SUPER ADMIN ────────────────────────────────
  if (user.role === 'superadmin') {
    if (screen === 'settings') return (
      <AccountSettings
        role="admin"
        user={user}
        onBack={() => setScreen('login')}
        onUpdateProfile={updateAdminProfile}
        onUpdatePassword={updatePassword}
      />
    )
    return (
      <SuperAdminDashboard
        user={user}
        onLogout={logout}
        onSettings={() => setScreen('settings')}
      />
    )
  }

  // ── ADMIN ──────────────────────────────────────
  if (user.role === 'admin') {
    if (screen === 'settings') return (
      <AccountSettings
        role="admin"
        user={user}
        onBack={() => setScreen('login')}
        onUpdateProfile={updateAdminProfile}
        onUpdatePassword={updatePassword}
      />
    )
    return (
      <div className="min-h-screen bg-[#0f1117]">
        <nav className="bg-[#1a1d27] border-b border-[#2a2d3a] px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-indigo-600 rounded-md flex items-center justify-center text-white text-xs font-bold">C</div>
              <span className="text-white font-semibold text-sm">ConcernTrack</span>
            </div>
            <span className="px-4 py-2 font-medium text-indigo-400 border-b-2 border-indigo-500 text-sm">Admin Dashboard</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-gray-400 text-sm">{user.fullName}</span>
            <button onClick={() => setScreen('settings')} className="text-gray-400 hover:text-white transition-colors" title="Account Settings">⚙</button>
            <button onClick={logout} className="text-gray-400 hover:text-red-400 transition-colors" title="Sign out">⇥</button>
          </div>
        </nav>
        <main className="p-6">
          <AdminDashboard user={user} />
        </main>
      </div>
    )
  }

  // ── STUDENT ────────────────────────────────────
  if (screen === 'settings') return (
    <AccountSettings
      role="student"
      user={user}
      onBack={() => setActiveTab('submit')}
      onUpdateProfile={updateStudentProfile}
      onUpdatePassword={updatePassword}
    />
  )

  return (
    <div className="min-h-screen bg-[#0f1117]">
      <nav className="bg-[#1a1d27] border-b border-[#2a2d3a] px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-indigo-600 rounded-md flex items-center justify-center text-white text-xs font-bold">C</div>
            <span className="text-white font-semibold text-sm">ConcernTrack</span>
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab('submit')}
              className={`px-4 py-2 text-sm transition-colors ${activeTab === 'submit' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-gray-400 hover:text-white'}`}
            >Submit Concern</button>
            <button
              onClick={() => setActiveTab('tracker')}
              className={`px-4 py-2 text-sm transition-colors ${activeTab === 'tracker' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-gray-400 hover:text-white'}`}
            >Status Tracker</button>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-gray-400 text-sm">{user.fullName}</span>
          <button onClick={() => setScreen('settings')} className="text-gray-400 hover:text-white transition-colors" title="Account Settings">
            ⚙
          </button>
          <button onClick={logout} className="text-gray-400 hover:text-white transition-colors" title="Sign out">
            ⇥
          </button>
        </div>
      </nav>
      <main className="p-6">
        {activeTab === 'submit' && <SubmitConcernForm user={user} />}
        {activeTab === 'tracker' && <StatusTracker />}
      </main>
    </div>
  )
}
