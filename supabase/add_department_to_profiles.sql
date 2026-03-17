-- Add department_id to the profiles table to link officers to departments
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS department_id uuid REFERENCES public.departments(id);

-- Enable RLS for departments if not already enabled (should be)
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

-- Policy ensuring anyone can view departments (needed for registration)
DROP POLICY IF EXISTS "Anyone authenticated can view departments" ON public.departments;
CREATE POLICY "Anyone can view departments" ON public.departments FOR SELECT USING (true);
