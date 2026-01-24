-- Create table for tracking medicine dispensing from mobile units
CREATE TABLE public.mobile_dispensing (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id UUID REFERENCES public.mobile_appointments(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.inventory_products(id) NOT NULL,
  mobile_unit_id UUID REFERENCES public.mobile_units(id) NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC DEFAULT 0,
  total_price NUMERIC DEFAULT 0,
  dispensed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  dispensed_by UUID REFERENCES public.profiles(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.mobile_dispensing ENABLE ROW LEVEL SECURITY;

-- RLS Policies for mobile_dispensing
CREATE POLICY "Branch users can view dispensing for their branch units" 
ON public.mobile_dispensing FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM mobile_units mu 
    WHERE mu.id = mobile_dispensing.mobile_unit_id 
    AND (mu.home_branch_id = get_user_branch_id(auth.uid()) OR is_super_admin(auth.uid()))
  )
);

CREATE POLICY "Branch users can manage dispensing for their branch units" 
ON public.mobile_dispensing FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM mobile_units mu 
    WHERE mu.id = mobile_dispensing.mobile_unit_id 
    AND (mu.home_branch_id = get_user_branch_id(auth.uid()) OR is_super_admin(auth.uid()))
  )
);

CREATE POLICY "Super admins can manage all dispensing" 
ON public.mobile_dispensing FOR ALL 
USING (is_super_admin(auth.uid()));

-- Create table for mobile session revenue tracking
CREATE TABLE public.mobile_session_invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES public.mobile_sessions(id) ON DELETE CASCADE NOT NULL,
  appointment_id UUID REFERENCES public.mobile_appointments(id) ON DELETE CASCADE NOT NULL,
  patient_id UUID REFERENCES public.patients(id) NOT NULL,
  consultation_fee NUMERIC DEFAULT 0,
  medicine_total NUMERIC DEFAULT 0,
  total_amount NUMERIC DEFAULT 0,
  payment_method TEXT DEFAULT 'cash',
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'waived')),
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.mobile_session_invoices ENABLE ROW LEVEL SECURITY;

-- RLS Policies for mobile_session_invoices
CREATE POLICY "Branch users can view invoices for their branch sessions" 
ON public.mobile_session_invoices FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM mobile_sessions ms 
    JOIN mobile_units mu ON mu.id = ms.mobile_unit_id
    WHERE ms.id = mobile_session_invoices.session_id 
    AND (mu.home_branch_id = get_user_branch_id(auth.uid()) OR is_super_admin(auth.uid()))
  )
);

CREATE POLICY "Branch users can manage invoices for their branch sessions" 
ON public.mobile_session_invoices FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM mobile_sessions ms 
    JOIN mobile_units mu ON mu.id = ms.mobile_unit_id
    WHERE ms.id = mobile_session_invoices.session_id 
    AND (mu.home_branch_id = get_user_branch_id(auth.uid()) OR is_super_admin(auth.uid()))
  )
);

CREATE POLICY "Super admins can manage all session invoices" 
ON public.mobile_session_invoices FOR ALL 
USING (is_super_admin(auth.uid()));

-- Add index for performance
CREATE INDEX idx_mobile_dispensing_appointment ON public.mobile_dispensing(appointment_id);
CREATE INDEX idx_mobile_dispensing_unit ON public.mobile_dispensing(mobile_unit_id);
CREATE INDEX idx_mobile_session_invoices_session ON public.mobile_session_invoices(session_id);

-- Enable realtime for dispensing updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.mobile_dispensing;
ALTER PUBLICATION supabase_realtime ADD TABLE public.mobile_session_invoices;