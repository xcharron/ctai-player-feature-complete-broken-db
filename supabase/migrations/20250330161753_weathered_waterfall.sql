/*
  # Fix RLS Policy for User Registration

  1. Changes
    - Update RLS policy to allow new user registration
    - Add policy for inserting new users during registration

  2. Security
    - Maintains existing RLS policies for read/update
    - Adds controlled insert capability for registration
*/

-- Add policy to allow new user registration
CREATE POLICY "Enable insert for registration" ON public.users
  FOR INSERT
  WITH CHECK (
    -- Ensure the inserting user can only create their own profile
    auth.uid() = id
    -- Validate required fields
    AND first_name IS NOT NULL
    AND last_name IS NOT NULL
    AND email IS NOT NULL
    AND phone IS NOT NULL
  );