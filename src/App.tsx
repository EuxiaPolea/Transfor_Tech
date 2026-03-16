import { useState } from 'react'
import { useAuth } from './hooks/useAuth'
import LoginPage from './components/LoginPage'
import RegisterForm from './components/RegisterForm'
import ForgotPassword from './components/ForgotPassword'
import SubmitConcernForm from './components/SubmitConcernForm'
import StatusTracker from './components/StatusTracker'
import AdminDashboard from './components/AdminDashboard'
import StudentAccountSettings from './components/StudentAccountSettings'
import AdminAccountSettings from './components/AdminAccountSettings'
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
      <AdminAccountSettings
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
      <AdminAccountSettings
        user={user}
        onBack={() => setScreen('login')}
        onUpdateProfile={updateAdminProfile}
        onUpdatePassword={updatePassword}
      />
    )

    // Check approval status
    if (!user.isApproved) {
      return (
        <div className="min-h-screen bg-[#0f1117] flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-[#1a1d27] border border-[#2a2d3a] rounded-2xl p-10 shadow-2xl text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-amber-500"></div>
            
            <div className="w-24 h-24 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-8 ring-8 ring-amber-500/5">
              <span className="text-5xl animate-pulse">⏳</span>
            </div>
            
            <h2 className="text-3xl font-bold text-white mb-4">Pending Approval</h2>
            <div className="mb-8">
              <p className="text-[#9ca3af] leading-relaxed">
                Welcome, <span className="text-white font-medium">{user.fullName}</span>.
              </p>
              <p className="text-[#9ca3af] leading-relaxed mt-2 text-sm">
                Your account for the <span className="text-indigo-400 font-bold">{user.department}</span> is currently under review by the System Administrator.
              </p>
            </div>

            <div className="space-y-4">
              <div className="p-5 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl text-sm text-indigo-300 flex items-start gap-3">
                <span className="text-lg">ℹ️</span>
                <p className="text-left leading-relaxed">
                  Dashboard access is restricted until your credentials are verified. You will be able to manage student concerns once approved.
                </p>
              </div>
              
              <button
                onClick={logout}
                className="w-full py-4 px-6 bg-[#0f1117] border border-[#2a2d3a] hover:bg-[#1a1d27] hover:border-indigo-500/50 text-white rounded-2xl font-bold transition-all duration-300 flex items-center justify-center gap-3 group"
              >
                <span>Sign out</span>
                <span className="text-gray-500 group-hover:text-indigo-400 transition-colors">⇥</span>
              </button>
            </div>

            <p className="mt-8 text-[11px] text-gray-600 uppercase tracking-widest font-bold">
              ConcernTrack Security System
            </p>
          </div>
        </div>
      )
    }

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
    <StudentAccountSettings
      user={user}
      onBack={() => {
        setScreen('login');
        setActiveTab('submit');
      }}
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
