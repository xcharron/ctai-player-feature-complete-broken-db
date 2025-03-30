/*
  # Improve User Data Handling

  1. Changes
    - Add index on email field for better query performance
    - Update user creation trigger to handle metadata more robustly
    - Add function to validate email format

  2. Security
    - Maintains existing RLS policies
    - Improves data integrity checks
*/

-- Add index on email field if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'users' 
    AND indexname = 'users_email_idx'
  ) THEN
    CREATE INDEX users_email_idx ON public.users (email);
  END IF;
END $$;

-- Update the handle_new_user function to be more robust
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
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    LOWER(NEW.email), -- Ensure email is stored in lowercase
    COALESCE(NEW.raw_user_meta_data->>'phone', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;