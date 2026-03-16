import { useState } from 'react'
import { supabase } from '../lib/supabase'

export type ConcernStatus = 'Submitted' | 'Routed' | 'Read' | 'Screened' | 'Resolved' | 'Escalated'
export type ConcernCategory = 'Academic' | 'Financial' | 'Welfare'

export interface AuditEntry {
  id: string
  concern_id: string
  action: string
  actor: string
  note: string
  timestamp: string
}

export interface Concern {
  id: string
  concern_number: string
  title: string
  description: string
  category: ConcernCategory
  sub_category?: string
  department: string
  status: ConcernStatus
  is_anonymous: boolean
  student_id: string
  student_name: string
  student_number: string
  program: string
  email: string
  file_url?: string
  routed_to: string
  submitted_at: string
  updated_at: string
  audit_trail?: AuditEntry[]
}

const departmentRouting: Record<ConcernCategory, string> = {
  Academic: 'Registrar',
  Financial: 'Accounting Office',
  Welfare: 'Student Affairs Office'
}

const generateConcernNumber = () => {
  const year = new Date().getFullYear()
  const random = Math.floor(100 + Math.random() * 900)
  return `CON-${year}-${random}`
}

export function useConcerns() {
  const [concerns, setConcerns] = useState<Concern[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchConcerns = async (): Promise<Concern[]> => {
    setLoading(true)
    setError(null)
    try {
      const { data, error } = await supabase
        .from('concerns')
        .select('*')
        .order('submitted_at', { ascending: false })
      if (error) throw error
      const result = data || []
      setConcerns(result)
      return result
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch concerns';
      setError(msg)
      return []
    } finally {
      setLoading(false)
    }
  }

  const fetchMyConcerns = async (email: string): Promise<Concern[]> => {
    setLoading(true)
    setError(null)
    try {
      const { data, error } = await supabase
        .from('concerns')
        .select('*')
        .eq('email', email)
        .order('submitted_at', { ascending: false })
      if (error) throw error
      return data || []
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch your concerns';
      setError(msg)
      return []
    } finally {
      setLoading(false)
    }
  }

  const fetchConcernById = async (concernNumber: string): Promise<Concern | null> => {
    const { data, error } = await supabase
      .from('concerns')
      .select('*, audit_trail(*)')
      .eq('concern_number', concernNumber)
      .single()
    if (error) return null
    return data
  }

  const submitConcern = async (formData: {
    title: string
    description: string
    category: ConcernCategory
    subCategory?: string
    isAnonymous: boolean
    studentId: string
    studentName: string
    studentNumber: string
    program: string
    email: string
    fileUrl?: string
  }): Promise<string> => {
    setLoading(true)
    setError(null)
    try {
      const concernNumber = generateConcernNumber()
      let routedTo = departmentRouting[formData.category]
      
      // Precise routing logic based on sub-categories
      if (formData.subCategory === 'Medical / Health Issue') {
        routedTo = 'Clinic'
      } else if (
        formData.subCategory === 'Receipt / OR Issue' || 
        formData.subCategory === 'Payment Not Credited'
      ) {
        routedTo = 'Accounting Office'
      } else if (
        formData.subCategory === 'Enrollment Issue' ||
        formData.subCategory === 'TOR / Records Request'
      ) {
        // These can potentially go to Admission Office if they handle initial entry,
        // but Registrar is usually safer. Let's stick with Registrar as per challenge.
        routedTo = 'Registrar'
      }

      const now = new Date().toISOString()

      const { data: concern, error: concernError } = await supabase
        .from('concerns')
        .insert({
          concern_number: concernNumber,
          title: formData.title,
          description: formData.description,
          category: formData.category,
          sub_category: formData.subCategory || null,
          department: routedTo,
          status: 'Submitted',
          is_anonymous: formData.isAnonymous,
          student_id: formData.studentId,
          student_name: formData.isAnonymous ? 'Anonymous' : formData.studentName,
          student_number: formData.studentNumber,
          program: formData.program,
          email: formData.email,
          file_url: formData.fileUrl || null,
          routed_to: routedTo,
          submitted_at: now,
          updated_at: now
        })
        .select()
        .single()

      if (concernError) throw concernError

      // Insert first audit trail entry
      await supabase.from('audit_trail').insert({
        concern_id: concern.id,
        action: 'Concern submitted',
        actor: formData.isAnonymous ? 'Anonymous' : formData.studentName,
        note: `Auto-routed to ${routedTo} based on category: ${formData.category}`,
        timestamp: now
      })

      return concernNumber
    } catch (err: any) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const updateConcernStatus = async (
    concernId: string,
    newStatus: ConcernStatus,
    actor: string,
    note?: string
  ) => {
    setLoading(true)
    try {
      const now = new Date().toISOString()

      const { error: updateError } = await supabase
        .from('concerns')
        .update({ status: newStatus, updated_at: now })
        .eq('id', concernId)

      if (updateError) throw updateError

      await supabase.from('audit_trail').insert({
        concern_id: concernId,
        action: `Status updated to ${newStatus}`,
        actor,
        note: note || '',
        timestamp: now
      })

      // Refresh concerns list
      await fetchConcerns()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update concern status';
      setError(msg)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const addAuditNote = async (
    concernId: string,
    actor: string,
    note: string
  ) => {
    const { error } = await supabase.from('audit_trail').insert({
      concern_id: concernId,
      action: 'Note added',
      actor,
      note,
      timestamp: new Date().toISOString()
    })
    if (error) throw error
  }

  return {
    concerns, loading, error,
    fetchConcerns, fetchMyConcerns, fetchConcernById,
    submitConcern, updateConcernStatus, addAuditNote
  }
}
