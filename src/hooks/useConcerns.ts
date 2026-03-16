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
  Financial: 'Finance Office',
  Welfare: 'Student Affairs Office'
}

const generateConcernNumber = () => {
  const num = Math.floor(1000 + Math.random() * 9000)
  return `CON-${num}`
}

export function useConcerns() {
  const [concerns, setConcerns] = useState<Concern[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchConcerns = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error } = await supabase
        .from('concerns')
        .select('*')
        .order('submitted_at', { ascending: false })
      if (error) throw error
      setConcerns(data || [])
    } catch (err: any) {
      setError(err.message)
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
      const routedTo = departmentRouting[formData.category]
      const now = new Date().toISOString()

      const { data: concern, error: concernError } = await supabase
        .from('concerns')
        .insert({
          concern_number: concernNumber,
          title: formData.title,
          description: formData.description,
          category: formData.category,
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
    } catch (err: any) {
      setError(err.message)
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
    fetchConcerns, fetchConcernById,
    submitConcern, updateConcernStatus, addAuditNote
  }
}
