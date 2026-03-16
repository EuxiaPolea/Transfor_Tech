-- ConcernTrack Database Security: Row Level Security (RLS) Policies
-- Run this in your Supabase SQL Editor

-- 1. ENABLE RLS ON ALL TABLES
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE concerns ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_trail ENABLE ROW LEVEL SECURITY;

-- 2. STUDENT PROFILES POLICIES
-- Students can only view their own profile
CREATE POLICY "Profiles are viewable by owners" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Students can only update their own profile
CREATE POLICY "Profiles are updatable by owners" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- 3. STAFF PROFILES POLICIES
-- Superadmins can manage all staff accounts
CREATE POLICY "Superadmins have full staff access" ON staff_profiles
  FOR ALL USING (
    EXISTS (SELECT 1 FROM staff_profiles WHERE id = auth.uid() AND role = 'superadmin')
  );

-- Admins can view other staff (for routing visibility) but only update themselves
CREATE POLICY "Staff can view all staff" ON staff_profiles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Staff can update own profile" ON staff_profiles
  FOR UPDATE USING (auth.uid() = id);

-- 4. CONCERNS POLICIES
-- Students can view concerns they submitted (matched by email or ID)
CREATE POLICY "Students can view own concerns" ON concerns
  FOR SELECT USING (
    student_id = auth.uid()::text OR 
    email = (SELECT email FROM profiles WHERE id = auth.uid())
  );

-- Admins can view concerns routed to their department
CREATE POLICY "Admins can view department concerns" ON concerns
  FOR SELECT USING (
    department = (SELECT department FROM staff_profiles WHERE id = auth.uid())
  );

-- Superadmins can view ALL concerns
CREATE POLICY "Superadmins can view all concerns" ON concerns
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM staff_profiles WHERE id = auth.uid() AND role = 'superadmin')
  );

-- Anyone authenticated can submit a concern
CREATE POLICY "Authenticated users can insert concerns" ON concerns
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Only staff can update concern status
CREATE POLICY "Staff can update concerns" ON concerns
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM staff_profiles WHERE id = auth.uid())
  );

-- 5. AUDIT TRAIL POLICIES
-- Visibility is tied to concern visibility
CREATE POLICY "Audit trail is visible if concern is visible" ON audit_trail
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM concerns WHERE id = concern_id)
  );

-- Only staff can insert audit notes
CREATE POLICY "Staff can insert audit entries" ON audit_trail
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM staff_profiles WHERE id = auth.uid())
  );
