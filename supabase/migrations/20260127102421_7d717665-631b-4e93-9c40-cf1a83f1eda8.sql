-- Fix 1: Add RLS policy to prevent unauthorized role insertion
-- Only super admins can insert roles (blocks privilege escalation during signup)
CREATE POLICY "Only super admins can insert roles"
ON public.user_roles
FOR INSERT
WITH CHECK (public.is_super_admin(auth.uid()));

-- Create a trigger to auto-assign 'doctor' role after profile creation
-- This ensures new users get a default role without client-side manipulation
CREATE OR REPLACE FUNCTION public.assign_default_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only insert if user doesn't already have a role (prevents duplicates)
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = NEW.user_id) THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.user_id, 'doctor');
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger on profiles table
DROP TRIGGER IF EXISTS on_profile_created_assign_role ON public.profiles;
CREATE TRIGGER on_profile_created_assign_role
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.assign_default_role();