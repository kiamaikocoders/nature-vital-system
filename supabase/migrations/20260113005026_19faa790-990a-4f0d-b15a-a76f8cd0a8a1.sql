-- Create role enum
CREATE TYPE public.app_role AS ENUM ('super_admin', 'branch_admin', 'doctor', 'pharmacist');

-- Create branches table
CREATE TABLE public.branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create profiles table (linked to auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  branch_id UUID REFERENCES public.branches(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create user_roles table (CRITICAL: roles in separate table)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE(user_id, role)
);

-- Create patients table
CREATE TABLE public.patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID REFERENCES public.branches(id) NOT NULL,
  patient_code TEXT UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  date_of_birth DATE,
  gender TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  blood_type TEXT,
  allergies TEXT[],
  medical_history JSONB DEFAULT '[]'::jsonb,
  diet_tracker JSONB DEFAULT '{"alkaline": 80, "acidic": 20}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create appointments table
CREATE TABLE public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID REFERENCES public.branches(id) NOT NULL,
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
  doctor_id UUID REFERENCES public.profiles(id),
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  type TEXT DEFAULT 'consultation',
  status TEXT DEFAULT 'pending',
  notes TEXT,
  vitals JSONB,
  diagnosis TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create inventory_products table
CREATE TABLE public.inventory_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID REFERENCES public.branches(id) NOT NULL,
  product_code TEXT,
  name TEXT NOT NULL,
  category TEXT,
  description TEXT,
  stock_quantity INTEGER DEFAULT 0,
  min_stock_level INTEGER DEFAULT 10,
  price DECIMAL(10,2) NOT NULL,
  batch_number TEXT,
  expiry_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create invoices table
CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID REFERENCES public.branches(id) NOT NULL,
  patient_id UUID REFERENCES public.patients(id) ON DELETE SET NULL,
  invoice_number TEXT UNIQUE,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal DECIMAL(10,2) DEFAULT 0,
  tax DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) DEFAULT 0,
  status TEXT DEFAULT 'pending',
  payment_method TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create patient_visits table for timeline
CREATE TABLE public.patient_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID REFERENCES public.branches(id) NOT NULL,
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
  appointment_id UUID REFERENCES public.appointments(id),
  visit_date TIMESTAMPTZ DEFAULT now(),
  chief_complaint TEXT,
  vitals JSONB,
  diagnosis TEXT,
  treatment TEXT,
  prescriptions JSONB DEFAULT '[]'::jsonb,
  supplements_recommended JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  doctor_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_visits ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Function to get user's branch_id
CREATE OR REPLACE FUNCTION public.get_user_branch_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT branch_id FROM public.profiles WHERE user_id = _user_id
$$;

-- Function to check if user is super admin
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'super_admin'
  )
$$;

-- Branches policies (super admin sees all, others see their branch)
CREATE POLICY "Anyone can view branches" ON public.branches FOR SELECT USING (true);
CREATE POLICY "Super admins can manage branches" ON public.branches FOR ALL USING (public.is_super_admin(auth.uid()));

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Super admins can view all profiles" ON public.profiles FOR SELECT USING (public.is_super_admin(auth.uid()));
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User roles policies
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Super admins can manage roles" ON public.user_roles FOR ALL USING (public.is_super_admin(auth.uid()));

-- Patients policies (branch isolation)
CREATE POLICY "Super admins can view all patients" ON public.patients FOR SELECT USING (public.is_super_admin(auth.uid()));
CREATE POLICY "Branch users can view branch patients" ON public.patients FOR SELECT USING (branch_id = public.get_user_branch_id(auth.uid()));
CREATE POLICY "Branch users can insert patients" ON public.patients FOR INSERT WITH CHECK (branch_id = public.get_user_branch_id(auth.uid()) OR public.is_super_admin(auth.uid()));
CREATE POLICY "Branch users can update patients" ON public.patients FOR UPDATE USING (branch_id = public.get_user_branch_id(auth.uid()) OR public.is_super_admin(auth.uid()));

-- Appointments policies
CREATE POLICY "Super admins can view all appointments" ON public.appointments FOR SELECT USING (public.is_super_admin(auth.uid()));
CREATE POLICY "Branch users can view branch appointments" ON public.appointments FOR SELECT USING (branch_id = public.get_user_branch_id(auth.uid()));
CREATE POLICY "Branch users can manage appointments" ON public.appointments FOR ALL USING (branch_id = public.get_user_branch_id(auth.uid()) OR public.is_super_admin(auth.uid()));

-- Inventory policies
CREATE POLICY "Super admins can view all inventory" ON public.inventory_products FOR SELECT USING (public.is_super_admin(auth.uid()));
CREATE POLICY "Branch users can view branch inventory" ON public.inventory_products FOR SELECT USING (branch_id = public.get_user_branch_id(auth.uid()));
CREATE POLICY "Branch users can manage inventory" ON public.inventory_products FOR ALL USING (branch_id = public.get_user_branch_id(auth.uid()) OR public.is_super_admin(auth.uid()));

-- Invoices policies
CREATE POLICY "Super admins can view all invoices" ON public.invoices FOR SELECT USING (public.is_super_admin(auth.uid()));
CREATE POLICY "Branch users can view branch invoices" ON public.invoices FOR SELECT USING (branch_id = public.get_user_branch_id(auth.uid()));
CREATE POLICY "Branch users can manage invoices" ON public.invoices FOR ALL USING (branch_id = public.get_user_branch_id(auth.uid()) OR public.is_super_admin(auth.uid()));

-- Patient visits policies
CREATE POLICY "Super admins can view all visits" ON public.patient_visits FOR SELECT USING (public.is_super_admin(auth.uid()));
CREATE POLICY "Branch users can view branch visits" ON public.patient_visits FOR SELECT USING (branch_id = public.get_user_branch_id(auth.uid()));
CREATE POLICY "Doctors can manage visits" ON public.patient_visits FOR ALL USING (
  (branch_id = public.get_user_branch_id(auth.uid()) AND public.has_role(auth.uid(), 'doctor'))
  OR public.is_super_admin(auth.uid())
);

-- Trigger function for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers
CREATE TRIGGER update_branches_updated_at BEFORE UPDATE ON public.branches FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON public.patients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_inventory_updated_at BEFORE UPDATE ON public.inventory_products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default branches
INSERT INTO public.branches (name, location, phone, email) VALUES
  ('Machakos Branch', 'Machakos Town', '+254 700 100 001', 'machakos@naturevital.co.ke'),
  ('Mlolongo Branch', 'Mlolongo Center', '+254 700 100 002', 'mlolongo@naturevital.co.ke'),
  ('Matuu Branch', 'Matuu Town', '+254 700 100 003', 'matuu@naturevital.co.ke'),
  ('Tala Town Branch', 'Tala Town', '+254 700 100 004', 'tala@naturevital.co.ke');

-- Generate patient codes function
CREATE OR REPLACE FUNCTION public.generate_patient_code()
RETURNS TRIGGER AS $$
BEGIN
  NEW.patient_code := 'NV-' || LPAD(nextval('patient_code_seq')::text, 6, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE SEQUENCE IF NOT EXISTS patient_code_seq START 1000;
CREATE TRIGGER set_patient_code BEFORE INSERT ON public.patients FOR EACH ROW WHEN (NEW.patient_code IS NULL) EXECUTE FUNCTION public.generate_patient_code();

-- Generate invoice numbers
CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.invoice_number := 'INV-' || TO_CHAR(now(), 'YYYYMMDD') || '-' || LPAD(nextval('invoice_number_seq')::text, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE SEQUENCE IF NOT EXISTS invoice_number_seq START 1;
CREATE TRIGGER set_invoice_number BEFORE INSERT ON public.invoices FOR EACH ROW WHEN (NEW.invoice_number IS NULL) EXECUTE FUNCTION public.generate_invoice_number();