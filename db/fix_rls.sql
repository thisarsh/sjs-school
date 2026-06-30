DROP POLICY IF EXISTS "Super Admins have full access to profiles" ON public.profiles;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'super_admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE POLICY "Super Admins have full access to profiles" 
  ON public.profiles FOR ALL 
  USING (public.is_super_admin());

-- Also fix the students policy that queries profiles!
DROP POLICY IF EXISTS "Super Admins can manage students" ON public.students;
CREATE POLICY "Super Admins can manage students" 
  ON public.students FOR ALL 
  USING (public.is_super_admin());
