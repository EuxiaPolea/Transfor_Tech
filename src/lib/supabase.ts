import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://dczkjekvlycghfeimqgk.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRjemtqZWt2bHljZ2hmZWltcWdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2MzkxMjMsImV4cCI6MjA4OTIxNTEyM30.YmfoD2ThlpW1hkz7tv16h88v29Z12qPsP5YpLnPeOKI'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
