import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { User } from '@supabase/supabase-js'

export type UserRole = 'student' | 'admin' | 'superadmin' | null


export interface CurrentUser {
  id: string
  email: string
  role: UserRole
  fullName: string
  studentId?: string
  program?: string
  yearSection?: string
  department?: string
  jobTitle?: string
  employeeId?: string
  isApproved?: boolean
}

// Role is determined from the database `role` column, not a hardcoded email

export function useAuth() {
  const [user, setUser] = useState<CurrentUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) loadUserProfile(session.user)
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) loadUserProfile(session.user)
      else { setUser(null); setLoading(false) }
    })

    return () => subscription.unsubscribe()
  }, [])

  const loadUserProfile = async (authUser: User) => {
    // Check student profile first
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .single()

    if (profile) {
      setUser({
        id: authUser.id,
        email: authUser.email ?? '',
        role: 'student',
        fullName: profile.full_name,
        studentId: profile.student_id,
        program: profile.program,
        yearSection: profile.year_section,
      })
      setLoading(false)
      return
    }

    // Check staff profile
    const { data: staffProfile } = await supabase
      .from('staff_profiles')
      .select('*')
      .eq('id', authUser.id)
      .single()

    if (staffProfile) {
      const staffRole: UserRole = staffProfile.role === 'superadmin' ? 'superadmin' : 'admin'
      setUser({
        id: authUser.id,
        email: authUser.email ?? '',
        role: staffRole,
        fullName: staffProfile.full_name,
        department: staffProfile.department,
        jobTitle: staffProfile.job_title,
        employeeId: staffProfile.employee_id,
        isApproved: staffProfile.is_approved,
      })
    }
    setLoading(false)
  }

  const studentLogin = async (studentId: string, password: string) => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('email')
      .eq('student_id', studentId)
      .single()

    if (!profile) throw new Error('Student ID not found')

    const { error } = await supabase.auth.signInWithPassword({
      email: profile.email,
      password
    })
    if (error) throw new Error(error.message)
  }

  const adminLogin = async (email: string, password: string) => {
    const { data: signInData, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw new Error(error.message)

    if (!signInData.user) throw new Error('Authentication failed: No user returned');

    // Check role and approval status
    const { data: staffProfile, error: profileError } = await supabase
      .from('staff_profiles')
      .select('is_approved, role')
      .eq('id', signInData.user.id)
      .single()

    if (profileError) {
      console.error('Error fetching staff profile:', profileError);
      await supabase.auth.signOut();
      
      const errorMessage = profileError.code === 'PGRST116' 
        ? 'Your account profile was not found in the database. Registration might have failed.' 
        : `Database Error (${profileError.code}): ${profileError.message}. This is likely a permission issue (RLS).`;
        
      throw new Error(errorMessage);
    }

    // Superadmins skip approval check
    if (staffProfile?.role === 'superadmin') return

    if (!staffProfile?.is_approved) {
      await supabase.auth.signOut()
      throw new Error('Your account is pending admin approval')
    }
  }

  const studentRegister = async (data: {
    fullName: string, studentId: string, program: string,
    yearSection: string, email: string, password: string
  }) => {
    const { data: authData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
    })
    if (error) throw new Error(error.message)

    console.log('Student auth created, inserting profile...');
    const { error: profileError } = await supabase.from('profiles').insert({
      id: authData.user?.id,
      student_id: data.studentId,
      full_name: data.fullName,
      program: data.program,
      year_section: data.yearSection,
      email: data.email,
      role: 'student'
    })
    
    if (profileError) {
      console.error('Student profile insertion failed:', profileError);
      throw new Error(`Profile creation failed (${profileError.code}): ${profileError.message}. Contact admin.`);
    }
  }

  const adminRegister = async (data: {
    firstName: string, lastName: string, email: string,
    employeeId: string, department: string, jobTitle: string, password: string
  }) => {
    const { data: authData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
    })
    if (error) throw new Error(error.message)

    console.log('Admin auth created, inserting staff profile...');
    const { error: profileError } = await supabase.from('staff_profiles').insert({
      id: authData.user?.id,
      employee_id: data.employeeId,
      full_name: `${data.firstName} ${data.lastName}`,
      email: data.email,
      department: data.department,
      job_title: data.jobTitle,
      role: 'admin',
      is_approved: false
    })

    if (profileError) {
      console.error('Staff profile insertion failed:', profileError);
      throw new Error(`Profile creation failed (${profileError.code}): ${profileError.message}. Contact admin.`);
    }
  }

  const updateStudentProfile = async (data: {
    fullName: string, program: string, yearSection: string, section?: string
  }) => {
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: data.fullName,
        program: data.program,
        year_section: data.yearSection,
      })
      .eq('id', user?.id)

    if (error) throw new Error(error.message)

    setUser(prev => prev ? { ...prev, fullName: data.fullName, program: data.program, yearSection: data.yearSection } : null)
  }

  const updateAdminProfile = async (data: {
    fullName: string, department: string, jobTitle: string
  }) => {
    const { error } = await supabase
      .from('staff_profiles')
      .update({
        full_name: data.fullName,
        department: data.department,
        job_title: data.jobTitle,
      })
      .eq('id', user?.id)

    if (error) throw new Error(error.message)

    setUser(prev => prev ? { ...prev, fullName: data.fullName, department: data.department, jobTitle: data.jobTitle } : null)
  }

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) throw new Error(error.message)
  }

  const logout = async () => {
    await supabase.auth.signOut()
    setUser(null)
  }

  return {
    user, loading,
    studentLogin, adminLogin,
    studentRegister, adminRegister,
    updateStudentProfile, updateAdminProfile, updatePassword,
    logout
  }
}
