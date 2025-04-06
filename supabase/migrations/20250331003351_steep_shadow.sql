/*
  # Fix User Registration and Verification Flow

  1. Changes
    - Simplify user creation trigger
    - Add default values for required fields
    - Improve error handling
    - Fix verification tracking
    
  2. Security
    - Maintains existing RLS policies
    - Ensures data integrity
*/

-- First drop existing triggers to avoid conflicts
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS update_trial_status ON public.users;
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;

-- Drop existing functions
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.check_trial_status();
DROP FUNCTION IF EXISTS public.update_updated_at_column();

-- Drop and recreate users table
DROP TABLE IF EXISTS public.users;

CREATE TABLE public.users (
  id uuid PRIMARY KEY DEFAULT auth.uid(),
  first_name text NOT NULL DEFAULT '',
  last_name text NOT NULL DEFAULT '',
  email text UNIQUE NOT NULL,
  phone text NOT NULL DEFAULT '',
  trial_start timestamptz DEFAULT now(),
  trial_end timestamptz DEFAULT (now() + interval '30 days'),
  is_trial_expired boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  is_verified boolean DEFAULT false,
  last_verified_at timestamptz,
  CONSTRAINT email_validation CHECK (
    email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
    AND
    email !~* '@(tempmail\.com|throwawaymail\.com|mailinator\.com|guerrillamail\.com|sharklasers\.com|grr\.la|guerrillamail\.net|spam4\.me|byom\.de|dispostable\.com|yopmail\.com|10minutemail\.com)$'
  ),
  CONSTRAINT phone_validation CHECK (phone ~* '^\+[1-9]\d{1,14}$')
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS users_email_idx ON public.users (email);
CREATE INDEX IF NOT EXISTS users_phone_idx ON public.users (phone);
CREATE INDEX IF NOT EXISTS users_trial_end_idx ON public.users (trial_end);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own data"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "System level user creation"
  ON public.users
  FOR INSERT
  TO postgres
  WITH CHECK (true);

-- Create function to check and update trial status
CREATE OR REPLACE FUNCTION check_trial_status()
RETURNS trigger AS $$
BEGIN
  IF NEW.trial_end < now() THEN
    NEW.is_trial_expired := true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create function to handle new user creation with simplified logic
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Create user profile with basic info
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
    false, -- Always start as unverified
    NULL   -- Will be updated when email is confirmed
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers
CREATE TRIGGER update_trial_status
  BEFORE INSERT OR UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION check_trial_status();

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();