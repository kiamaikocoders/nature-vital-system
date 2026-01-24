-- Create mobile appointments table to link patients to mobile sessions
CREATE TABLE public.mobile_appointments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.mobile_sessions(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  appointment_time TIME NOT NULL,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'checked_in', 'in_progress', 'completed', 'cancelled', 'no_show')),
  check_in_time TIMESTAMP WITH TIME ZONE,
  vitals JSONB,
  chief_complaint TEXT,
  diagnosis TEXT,
  treatment TEXT,
  prescriptions JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create recurring schedule templates
CREATE TABLE public.mobile_schedule_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mobile_unit_id UUID NOT NULL REFERENCES public.mobile_units(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES public.mobile_locations(id) ON DELETE CASCADE,
  doctor_id UUID REFERENCES public.profiles(id),
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0 = Sunday, 6 = Saturday
  start_time TIME NOT NULL DEFAULT '08:00',
  end_time TIME NOT NULL DEFAULT '17:00',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.mobile_appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mobile_schedule_templates ENABLE ROW LEVEL SECURITY;

-- RLS policies for mobile_appointments
CREATE POLICY "Super admins can manage all mobile appointments"
  ON public.mobile_appointments FOR ALL
  USING (is_super_admin(auth.uid()));

CREATE POLICY "Branch users can view appointments for their branch sessions"
  ON public.mobile_appointments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM mobile_sessions ms
      JOIN mobile_units mu ON mu.id = ms.mobile_unit_id
      WHERE ms.id = mobile_appointments.session_id
      AND (mu.home_branch_id = get_user_branch_id(auth.uid()) OR is_super_admin(auth.uid()))
    )
  );

CREATE POLICY "Branch users can manage appointments for their branch sessions"
  ON public.mobile_appointments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM mobile_sessions ms
      JOIN mobile_units mu ON mu.id = ms.mobile_unit_id
      WHERE ms.id = mobile_appointments.session_id
      AND (mu.home_branch_id = get_user_branch_id(auth.uid()) OR is_super_admin(auth.uid()))
    )
  );

-- RLS policies for mobile_schedule_templates
CREATE POLICY "Super admins can manage all schedule templates"
  ON public.mobile_schedule_templates FOR ALL
  USING (is_super_admin(auth.uid()));

CREATE POLICY "Branch users can view their branch schedule templates"
  ON public.mobile_schedule_templates FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM mobile_units mu
      WHERE mu.id = mobile_schedule_templates.mobile_unit_id
      AND (mu.home_branch_id = get_user_branch_id(auth.uid()) OR is_super_admin(auth.uid()))
    )
  );

-- Add trigger for updated_at
CREATE TRIGGER update_mobile_appointments_updated_at
  BEFORE UPDATE ON public.mobile_appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for mobile appointments (for live check-in updates)
ALTER PUBLICATION supabase_realtime ADD TABLE public.mobile_appointments;