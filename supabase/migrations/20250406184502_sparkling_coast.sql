/*
  # Fix User Verification Flow

  1. Changes
    - Update user creation trigger to properly handle verification
    - Add trigger to sync verification status
    - Fix email confirmation handling
    
  2. Security
    - Maintains existing RLS policies
    - Ensures proper verification tracking
*/

-- Create function to sync verification status
CREATE OR REPLACE FUNCTION sync_user_verification()
RETURNS trigger AS $$
BEGIN
  -- Update verification status in public.users when auth.users is updated
  UPDATE public.users
  SET 
    is_verified = NEW.email_confirmed_at IS NOT NULL,
    last_verified_at = NEW.email_confirmed_at,
    updated_at = now()
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to sync verification status
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE OF email_confirmed_at ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION sync_user_verification();

-- Update the handle_new_user function to properly set initial verification
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (
    id,
    email,
    first_name,
    last_name,
    phone,
    is_verified,
    last_verified_at
  ) VALUES (
    NEW.id,
    LOWER(NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    NEW.email_confirmed_at IS NOT NULL,
    NEW.email_confirmed_at
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;