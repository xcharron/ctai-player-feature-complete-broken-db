/*
  # Fix User Metadata Handling

  1. Changes
    - Update user creation trigger to properly handle all metadata
    - Ensure all required fields are populated
    - Fix phone number handling
    
  2. Security
    - Maintains existing RLS policies
    - Ensures data integrity
*/

-- Update the handle_new_user function to properly handle all fields
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (
    id,
    email,
    first_name,
    last_name,
    phone,
    trial_start,
    trial_end,
    is_trial_expired,
    created_at,
    updated_at,
    is_verified,
    last_verified_at
  ) VALUES (
    NEW.id,
    LOWER(NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    now(),
    now() + interval '30 days',
    false,
    now(),
    now(),
    NEW.email_confirmed_at IS NOT NULL,
    NEW.email_confirmed_at
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;