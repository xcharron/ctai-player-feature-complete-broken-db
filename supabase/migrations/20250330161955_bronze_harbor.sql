/*
  # Fix User Creation Process

  1. Changes
    - Add trigger to automatically create user profile
    - Update RLS policies for better security
    - Ensure proper user metadata handling

  2. Security
    - Maintains data integrity
    - Ensures proper user creation flow
    - Handles auth.users metadata
*/

-- Create a function to handle user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (
    id,
    first_name,
    last_name,
    email,
    phone
  ) VALUES (
    NEW.id,
    COALESCE((NEW.raw_user_meta_data->>'first_name')::text, ''),
    COALESCE((NEW.raw_user_meta_data->>'last_name')::text, ''),
    NEW.email,
    COALESCE((NEW.raw_user_meta_data->>'phone')::text, '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to handle new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update RLS policies
DROP POLICY IF EXISTS "Enable insert for registration" ON public.users;
CREATE POLICY "System level user creation" ON public.users
  FOR INSERT
  TO postgres
  WITH CHECK (true);

-- Ensure users can still read and update their own data
DROP POLICY IF EXISTS "Users can view own data" ON public.users;
CREATE POLICY "Users can view own data" ON public.users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own data" ON public.users;
CREATE POLICY "Users can update own data" ON public.users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);