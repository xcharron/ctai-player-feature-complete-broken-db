/*
  # Update User Registration Requirements

  1. Changes
    - Make phone field required (NOT NULL)
    - Add phone number format validation
    - Add stricter email validation to help reduce disposable emails
    
  2. Migration Steps
    - Update users table schema
    - Add phone validation constraint
    - Update email validation regex
*/

-- Make phone field required and add validation
ALTER TABLE public.users 
  ALTER COLUMN phone SET NOT NULL,
  ADD CONSTRAINT phone_validation 
    CHECK (phone ~* '^\+[1-9]\d{1,14}$');

-- Update email validation to be more strict
ALTER TABLE public.users 
  DROP CONSTRAINT IF EXISTS email_validation,
  ADD CONSTRAINT email_validation 
    CHECK (
      email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
      AND
      -- Block common disposable email domains
      email !~* '@(tempmail\.com|throwawaymail\.com|mailinator\.com|guerrillamail\.com|sharklasers\.com|grr\.la|guerrillamail\.net|spam4\.me|byom\.de|dispostable\.com|yopmail\.com|10minutemail\.com)$'
    );