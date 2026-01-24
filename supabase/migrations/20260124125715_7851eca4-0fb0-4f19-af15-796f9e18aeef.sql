
-- Create mobile units table (vehicles/teams)
CREATE TABLE public.mobile_units (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  vehicle_registration TEXT,
  assigned_doctor_id UUID REFERENCES public.profiles(id),
  home_branch_id UUID REFERENCES public.branches(id) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create mobile locations table (cities/stops)
CREATE TABLE public.mobile_locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  address TEXT,
  contact_phone TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create mobile sessions table (specific operational dates at locations)
CREATE TABLE public.mobile_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mobile_unit_id UUID REFERENCES public.mobile_units(id) ON DELETE CASCADE NOT NULL,
  location_id UUID REFERENCES public.mobile_locations(id) ON DELETE CASCADE NOT NULL,
  doctor_id UUID REFERENCES public.profiles(id),
  session_date DATE NOT NULL,
  start_time TIME NOT NULL DEFAULT '08:00',
  end_time TIME NOT NULL DEFAULT '17:00',
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create mobile inventory transfers table
CREATE TABLE public.mobile_inventory_transfers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  from_branch_id UUID REFERENCES public.branches(id) NOT NULL,
  to_mobile_unit_id UUID REFERENCES public.mobile_units(id) NOT NULL,
  product_id UUID REFERENCES public.inventory_products(id) NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  transfer_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  session_id UUID REFERENCES public.mobile_sessions(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'transferred', 'returned')),
  transferred_by UUID REFERENCES public.profiles(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create mobile unit inventory (current stock in mobile unit)
CREATE TABLE public.mobile_unit_inventory (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mobile_unit_id UUID REFERENCES public.mobile_units(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.inventory_products(id) ON DELETE CASCADE NOT NULL,
  quantity INTEGER DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(mobile_unit_id, product_id)
);

-- Enable RLS on all tables
ALTER TABLE public.mobile_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mobile_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mobile_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mobile_inventory_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mobile_unit_inventory ENABLE ROW LEVEL SECURITY;

-- RLS Policies for mobile_units
CREATE POLICY "Super admins can manage all mobile units" 
ON public.mobile_units FOR ALL 
USING (is_super_admin(auth.uid()));

CREATE POLICY "Branch users can view mobile units from their branch" 
ON public.mobile_units FOR SELECT 
USING (home_branch_id = get_user_branch_id(auth.uid()) OR is_super_admin(auth.uid()));

-- RLS Policies for mobile_locations
CREATE POLICY "Super admins can manage all locations" 
ON public.mobile_locations FOR ALL 
USING (is_super_admin(auth.uid()));

CREATE POLICY "Authenticated users can view locations" 
ON public.mobile_locations FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- RLS Policies for mobile_sessions
CREATE POLICY "Super admins can manage all sessions" 
ON public.mobile_sessions FOR ALL 
USING (is_super_admin(auth.uid()));

CREATE POLICY "Branch users can view sessions for their branch units" 
ON public.mobile_sessions FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.mobile_units mu 
    WHERE mu.id = mobile_unit_id 
    AND (mu.home_branch_id = get_user_branch_id(auth.uid()) OR is_super_admin(auth.uid()))
  )
);

CREATE POLICY "Branch users can manage sessions for their branch units" 
ON public.mobile_sessions FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.mobile_units mu 
    WHERE mu.id = mobile_unit_id 
    AND mu.home_branch_id = get_user_branch_id(auth.uid())
  ) OR is_super_admin(auth.uid())
);

-- RLS Policies for mobile_inventory_transfers
CREATE POLICY "Super admins can manage all transfers" 
ON public.mobile_inventory_transfers FOR ALL 
USING (is_super_admin(auth.uid()));

CREATE POLICY "Branch users can view their branch transfers" 
ON public.mobile_inventory_transfers FOR SELECT 
USING (from_branch_id = get_user_branch_id(auth.uid()) OR is_super_admin(auth.uid()));

CREATE POLICY "Branch users can create transfers from their branch" 
ON public.mobile_inventory_transfers FOR INSERT 
WITH CHECK (from_branch_id = get_user_branch_id(auth.uid()) OR is_super_admin(auth.uid()));

CREATE POLICY "Branch users can update their branch transfers" 
ON public.mobile_inventory_transfers FOR UPDATE 
USING (from_branch_id = get_user_branch_id(auth.uid()) OR is_super_admin(auth.uid()));

-- RLS Policies for mobile_unit_inventory
CREATE POLICY "Super admins can manage all unit inventory" 
ON public.mobile_unit_inventory FOR ALL 
USING (is_super_admin(auth.uid()));

CREATE POLICY "Branch users can view their branch unit inventory" 
ON public.mobile_unit_inventory FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.mobile_units mu 
    WHERE mu.id = mobile_unit_id 
    AND (mu.home_branch_id = get_user_branch_id(auth.uid()) OR is_super_admin(auth.uid()))
  )
);

-- Add triggers for updated_at
CREATE TRIGGER update_mobile_units_updated_at
BEFORE UPDATE ON public.mobile_units
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_mobile_sessions_updated_at
BEFORE UPDATE ON public.mobile_sessions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_mobile_inventory_transfers_updated_at
BEFORE UPDATE ON public.mobile_inventory_transfers
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
