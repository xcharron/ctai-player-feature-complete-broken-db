/*
  # Add Verification Status

  1. Changes
    - Add is_verified field to users table
    - Add last_verified_at timestamp
    - Update user creation trigger to handle verification

  2. Security
    - Maintains existing RLS policies
    - Adds verification tracking
*/

-- Add verification fields
ALTER TABLE public.users
  ADD COLUMN is_verified boolean DEFAULT false,
  ADD COLUMN last_verified_at timestamptz;

-- Update the handle_new_user function to set verification status
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (
    id,
    first_name,
    last_name,
    email,
    phone,
    is_verified,
    last_verified_at
  ) VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    LOWER(NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    NEW.email_confirmed_at IS NOT NULL,
    NEW.email_confirmed_at
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;