
-- First, let's update existing profiles with names from auth.users metadata
UPDATE public.profiles 
SET 
  first_name = COALESCE(
    (SELECT raw_user_meta_data ->> 'first_name' FROM auth.users WHERE auth.users.id = profiles.id),
    first_name
  ),
  last_name = COALESCE(
    (SELECT raw_user_meta_data ->> 'last_name' FROM auth.users WHERE auth.users.id = profiles.id),
    last_name
  ),
  updated_at = now()
WHERE first_name IS NULL OR last_name IS NULL;

-- Update the handle_new_user function to better handle profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, email)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data ->> 'first_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'last_name', ''),
    NEW.email
  )
  ON CONFLICT (id) DO UPDATE SET
    first_name = COALESCE(EXCLUDED.first_name, profiles.first_name),
    last_name = COALESCE(EXCLUDED.last_name, profiles.last_name),
    email = COALESCE(EXCLUDED.email, profiles.email),
    updated_at = now();
  RETURN NEW;
END;
$$;

-- Create a function to sync profile data from auth metadata
CREATE OR REPLACE FUNCTION public.sync_profile_from_auth(user_uuid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  UPDATE public.profiles 
  SET 
    first_name = COALESCE(
      (SELECT raw_user_meta_data ->> 'first_name' FROM auth.users WHERE auth.users.id = user_uuid),
      first_name
    ),
    last_name = COALESCE(
      (SELECT raw_user_meta_data ->> 'last_name' FROM auth.users WHERE auth.users.id = user_uuid),
      last_name
    ),
    email = COALESCE(
      (SELECT email FROM auth.users WHERE auth.users.id = user_uuid),
      email
    ),
    updated_at = now()
  WHERE id = user_uuid;
END;
$$;
