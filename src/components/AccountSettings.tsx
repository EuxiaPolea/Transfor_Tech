import React, { useState, useEffect } from 'react';
import { UserCircleIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import type { CurrentUser } from '../hooks/useAuth';

type AccountSettingsProps = {
  role: 'student' | 'admin';
  user: CurrentUser;
  onBack: () => void;
  onUpdateProfile: (data: any) => Promise<void>;
  onUpdatePassword: (newPassword: string) => Promise<void>;
};

export default function AccountSettings({ role, user, onBack, onUpdateProfile, onUpdatePassword }: AccountSettingsProps) {
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [passLoading, setPassLoading] = useState(false);

  const [studentProfile, setStudentProfile] = useState({
    fullName: '',
    programYear: '',
    section: '',
    email: '',
    studentId: ''
  });

  const [adminProfile, setAdminProfile] = useState({
    fullName: '',
    email: '',
    dept: '',
    jobTitle: ''
  });

  const [passwords, setPasswords] = useState({
    current: '',
    newPass: '',
    confirm: ''
  });
  const [passErrors, setPassErrors] = useState({
    current: '',
    newPass: '',
    confirm: ''
  });

  // Pre-fill from user prop
  useEffect(() => {
    if (role === 'student') {
      setStudentProfile({
        fullName: user.fullName || '',
        programYear: user.program || '',
        section: user.yearSection || '',
        email: user.email || '',
        studentId: user.studentId || ''
      });
    } else {
      setAdminProfile({
        fullName: user.fullName || '',
        email: user.email || '',
        dept: user.department || '',
        jobTitle: user.jobTitle || ''
      });
    }
  }, [user, role]);

  const getPasswordStrength = (pass: string) => {
    if (!pass) return { label: '', color: '', fill: 'w-0' };
    if (pass.length < 8 || /^[a-zA-Z]+$/.test(pass)) {
      return { label: 'Weak', color: 'text-red-400', fill: 'w-1/3 bg-red-400' };
    }
    const hasSpecial = /[^A-Za-z0-9]/.test(pass);
    const hasNum = /[0-9]/.test(pass);
    const hasLetter = /[A-Za-z]/.test(pass);
    if (hasSpecial && hasNum && hasLetter && pass.length >= 8) {
      return { label: 'Strong', color: 'text-green-500', fill: 'w-full bg-green-500' };
    }
    return { label: 'Medium', color: 'text-amber-500', fill: 'w-2/3 bg-amber-500' };
  };

  const strength = getPasswordStrength(passwords.newPass);

  const handleProfileSave = async () => {
    setProfileLoading(true);
    try {
      if (role === 'student') {
        await onUpdateProfile({
          fullName: studentProfile.fullName,
          program: studentProfile.programYear,
          yearSection: studentProfile.section,
        });
      } else {
        await onUpdateProfile({
          fullName: adminProfile.fullName,
          department: adminProfile.dept,
          jobTitle: adminProfile.jobTitle,
        });
      }
      showToast('Profile updated successfully', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to update profile', 'error');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleSecuritySave = async () => {
    const errors = { current: '', newPass: '', confirm: '' };
    let valid = true;
    if (!passwords.current) { errors.current = 'Current password is required'; valid = false; }
    if (!passwords.newPass) { errors.newPass = 'New password is required'; valid = false; }
    else if (passwords.newPass.length < 8) { errors.newPass = 'Minimum 8 characters required'; valid = false; }
    if (!passwords.confirm) { errors.confirm = 'Confirm new password is required'; valid = false; }
    else if (passwords.confirm !== passwords.newPass) { errors.confirm = 'Passwords do not match'; valid = false; }

    setPassErrors(errors);
    if (!valid) return;

    setPassLoading(true);
    try {
      await onUpdatePassword(passwords.newPass);
      showToast('Password updated successfully', 'success');
      setPasswords({ current: '', newPass: '', confirm: '' });
      setPassErrors({ current: '', newPass: '', confirm: '' });
    } catch (err: any) {
      showToast(err.message || 'Failed to update password', 'error');
    } finally {
      setPassLoading(false);
    }
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div className="w-full bg-[#0f1117] min-h-screen p-6">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={onBack}
          className="text-gray-400 hover:text-white text-sm mb-6 flex items-center transition-colors"
        >
          &larr; Back
        </button>

        <h1 className="text-[28px] font-bold text-white mb-8">Account Settings</h1>

        {/* Section 1 - Profile Information */}
        <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl p-6 mb-4">
          <div className="flex items-center mb-6">
            <UserCircleIcon className="w-6 h-6 text-white mr-2" />
            <h2 className="text-xl font-semibold text-white">Profile Information</h2>
          </div>

          <div className="space-y-4">
            {role === 'student' ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-[#9ca3af] mb-1">Full name</label>
                  <input
                    type="text"
                    value={studentProfile.fullName}
                    onChange={(e) => setStudentProfile({...studentProfile, fullName: e.target.value})}
                    disabled={profileLoading}
                    className="w-full bg-[#0f1117] border border-[#2a2d3a] rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#9ca3af] mb-1">Program & Year</label>
                  <input
                    type="text"
                    value={studentProfile.programYear}
                    onChange={(e) => setStudentProfile({...studentProfile, programYear: e.target.value})}
                    disabled={profileLoading}
                    className="w-full bg-[#0f1117] border border-[#2a2d3a] rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                  />
                  <p className="text-gray-500 text-xs mt-1">Update this when you move to a new year level or section</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#9ca3af] mb-1">Section</label>
                  <input
                    type="text"
                    value={studentProfile.section}
                    onChange={(e) => setStudentProfile({...studentProfile, section: e.target.value})}
                    disabled={profileLoading}
                    className="w-full bg-[#0f1117] border border-[#2a2d3a] rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#9ca3af] mb-1">Email address</label>
                  <input
                    type="email"
                    value={studentProfile.email}
                    readOnly
                    className="w-full bg-[#0f1117] opacity-50 cursor-not-allowed border border-[#2a2d3a] rounded-lg px-4 py-2 text-white focus:outline-none"
                  />
                  <p className="text-gray-500 text-xs mt-1">Email cannot be changed</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#9ca3af] mb-1">Student ID</label>
                  <input
                    type="text"
                    readOnly
                    value={studentProfile.studentId}
                    className="w-full bg-[#0f1117] opacity-50 cursor-not-allowed border border-[#2a2d3a] rounded-lg px-4 py-2 text-white focus:outline-none"
                  />
                  <p className="text-gray-500 text-xs mt-1">Student ID cannot be changed</p>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-[#9ca3af] mb-1">Full name</label>
                  <input
                    type="text"
                    value={adminProfile.fullName}
                    onChange={(e) => setAdminProfile({...adminProfile, fullName: e.target.value})}
                    disabled={profileLoading}
                    className="w-full bg-[#0f1117] border border-[#2a2d3a] rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#9ca3af] mb-1">Email address</label>
                  <input
                    type="email"
                    value={adminProfile.email}
                    readOnly
                    className="w-full bg-[#0f1117] opacity-50 cursor-not-allowed border border-[#2a2d3a] rounded-lg px-4 py-2 text-white focus:outline-none"
                  />
                  <p className="text-gray-500 text-xs mt-1">Email cannot be changed</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#9ca3af] mb-1">Department</label>
                  <input
                    type="text"
                    value={adminProfile.dept}
                    onChange={(e) => setAdminProfile({...adminProfile, dept: e.target.value})}
                    disabled={profileLoading}
                    className="w-full bg-[#0f1117] border border-[#2a2d3a] rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                  />
                  <p className="text-gray-500 text-xs mt-1">Update this if you are reassigned to a different department</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#9ca3af] mb-1">Job title</label>
                  <input
                    type="text"
                    value={adminProfile.jobTitle}
                    onChange={(e) => setAdminProfile({...adminProfile, jobTitle: e.target.value})}
                    disabled={profileLoading}
                    className="w-full bg-[#0f1117] border border-[#2a2d3a] rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                  />
                </div>
              </>
            )}

            <div className="flex justify-end pt-4 mt-2">
              <button
                onClick={handleProfileSave}
                disabled={profileLoading}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {profileLoading ? (
                  <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> Saving...</>
                ) : 'Save changes'}
              </button>
            </div>
          </div>
        </div>

        {/* Section 2 - Security */}
        <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl p-6 mb-4">
          <div className="flex items-center mb-6">
            <LockClosedIcon className="w-6 h-6 text-white mr-2" />
            <h2 className="text-xl font-semibold text-white">Security</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#9ca3af] mb-1">Current password</label>
              <input
                type="password"
                placeholder="Enter current password"
                value={passwords.current}
                onChange={(e) => setPasswords({...passwords, current: e.target.value})}
                disabled={passLoading}
                className="w-full bg-[#0f1117] border border-[#2a2d3a] rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
              />
              {passErrors.current && <p className="text-red-400 text-xs mt-1">{passErrors.current}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-[#9ca3af] mb-1">New password</label>
              <input
                type="password"
                placeholder="Enter new password"
                value={passwords.newPass}
                onChange={(e) => setPasswords({...passwords, newPass: e.target.value})}
                disabled={passLoading}
                className="w-full bg-[#0f1117] border border-[#2a2d3a] rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
              />
              {passErrors.newPass && <p className="text-red-400 text-xs mt-1">{passErrors.newPass}</p>}

              {passwords.newPass && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1 h-1 bg-[#2a2d3a] rounded-full overflow-hidden">
                    <div className={`h-full transition-all duration-300 ${strength.fill}`}></div>
                  </div>
                  <span className={`text-xs font-medium ${strength.color}`}>{strength.label}</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-[#9ca3af] mb-1">Confirm new password</label>
              <input
                type="password"
                placeholder="Confirm new password"
                value={passwords.confirm}
                onChange={(e) => setPasswords({...passwords, confirm: e.target.value})}
                disabled={passLoading}
                className="w-full bg-[#0f1117] border border-[#2a2d3a] rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
              />
              {passErrors.confirm && <p className="text-red-400 text-xs mt-1">{passErrors.confirm}</p>}
            </div>

            <div className="flex justify-end pt-4 mt-2">
              <button
                onClick={handleSecuritySave}
                disabled={passLoading}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {passLoading ? (
                  <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> Updating...</>
                ) : 'Update password'}
              </button>
            </div>
          </div>
        </div>

        {/* Toast */}
        {toast && (
          <div className={`fixed bottom-6 right-6 ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'} text-white text-sm px-4 py-3 rounded-lg shadow-lg z-50 transition-opacity animate-in fade-in slide-in-from-bottom-4`}>
            {toast.message}
          </div>
        )}

      </div>
    </div>
  );
}
