-- 1. Fix RLS Recursion and Permissions for Admins
-- Ensure the has_role function is robust
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

-- Explicitly allow Admins to read profiles and roles without recursion issues
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
CREATE POLICY "Admins can view all roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 2. Update handle_new_user to be more robust
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _role public.app_role;
  _dept_id uuid;
BEGIN
  -- Extract and validate role
  _role := COALESCE((new.raw_user_meta_data->>'role')::public.app_role, 'citizen');
  
  -- Extract and validate department_id (safely handle empty strings)
  IF (new.raw_user_meta_data->>'department_id') IS NOT NULL AND (new.raw_user_meta_data->>'department_id') != '' THEN
    _dept_id := (new.raw_user_meta_data->>'department_id')::uuid;
  ELSE
    _dept_id := NULL;
  END IF;

  -- Insert profile
  INSERT INTO public.profiles (id, name, email, phone, department_id)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', ''),
    COALESCE(new.email, ''),
    COALESCE(new.raw_user_meta_data->>'phone', ''),
    _dept_id
  );

  -- Insert role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, _role);

  RETURN new;
END;
$$;

-- 3. Fix existing officers missing department_id in profiles
-- (This helps if they registered before the trigger was updated)
-- We can try to sync from raw_user_meta_data for existing users
UPDATE public.profiles p
SET department_id = (u.raw_user_meta_data->>'department_id')::uuid
FROM auth.users u
WHERE p.id = u.id 
  AND p.department_id IS NULL 
  AND (u.raw_user_meta_data->>'role') = 'officer'
  AND (u.raw_user_meta_data->>'department_id') IS NOT NULL
  AND (u.raw_user_meta_data->>'department_id') != '';
