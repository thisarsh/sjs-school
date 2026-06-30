-- ==============================================
-- 1. Create the `profiles` table
-- ==============================================
CREATE TABLE public.profiles (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username text UNIQUE NOT NULL,
  full_name text,
  role text NOT NULL CHECK (role IN ('super_admin', 'principal', 'teacher', 'fee_desk', 'student', 'parent')),
  created_at timestamp with time zone DEFAULT now(),
  is_active boolean DEFAULT true
);

-- Turn on Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own profile
CREATE POLICY "Users can view own profile" 
  ON public.profiles FOR SELECT 
  USING (auth.uid() = id);

-- Allow super_admin to do everything
CREATE POLICY "Super Admins have full access to profiles" 
  ON public.profiles FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );


-- ==============================================
-- 2. Create the `students` table
-- ==============================================
CREATE TABLE public.students (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  scholar_number text UNIQUE NOT NULL,
  name text NOT NULL,
  class_name text NOT NULL,
  section text NOT NULL,
  parent_phone text NOT NULL,
  status text DEFAULT 'Active',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Turn on Row Level Security (RLS)
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view students
CREATE POLICY "Authenticated users can view students" 
  ON public.students FOR SELECT 
  TO authenticated 
  USING (true);

-- Allow super_admin to manage students
CREATE POLICY "Super Admins can manage students" 
  ON public.students FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- ==============================================
-- 3. Trigger to create profile on signup
-- ==============================================
-- (Optional but helpful for testing: auto-creates a super_admin profile for the first user)
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name, role)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name', COALESCE(new.raw_user_meta_data->>'role', 'super_admin'));
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
