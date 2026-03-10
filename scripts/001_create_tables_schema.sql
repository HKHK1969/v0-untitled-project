-- Create tables for supply chain tracker
-- This script creates the core database schema for the apparel supply chain tracker

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  company_name TEXT,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_delete_own" ON public.profiles FOR DELETE USING (auth.uid() = id);

-- Create custom tables for supply chain data
CREATE TABLE IF NOT EXISTS public.custom_tables (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  table_type TEXT DEFAULT 'custom',
  schema_definition JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on custom_tables
ALTER TABLE public.custom_tables ENABLE ROW LEVEL SECURITY;

-- Create policies for custom_tables
CREATE POLICY "custom_tables_select_own" ON public.custom_tables FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "custom_tables_insert_own" ON public.custom_tables FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "custom_tables_update_own" ON public.custom_tables FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "custom_tables_delete_own" ON public.custom_tables FOR DELETE USING (auth.uid() = user_id);

-- Create table records for storing actual data
CREATE TABLE IF NOT EXISTS public.table_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  table_id UUID NOT NULL REFERENCES public.custom_tables(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  record_data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on table_records
ALTER TABLE public.table_records ENABLE ROW LEVEL SECURITY;

-- Create policies for table_records
CREATE POLICY "table_records_select_own" ON public.table_records FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "table_records_insert_own" ON public.table_records FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "table_records_update_own" ON public.table_records FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "table_records_delete_own" ON public.table_records FOR DELETE USING (auth.uid() = user_id);

-- Create dropdown options table
CREATE TABLE IF NOT EXISTS public.dropdown_options (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  table_id UUID NOT NULL REFERENCES public.custom_tables(id) ON DELETE CASCADE,
  field_id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  options JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(table_id, field_id)
);

-- Enable RLS on dropdown_options
ALTER TABLE public.dropdown_options ENABLE ROW LEVEL SECURITY;

-- Create policies for dropdown_options
CREATE POLICY "dropdown_options_select_own" ON public.dropdown_options FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "dropdown_options_insert_own" ON public.dropdown_options FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "dropdown_options_update_own" ON public.dropdown_options FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "dropdown_options_delete_own" ON public.dropdown_options FOR DELETE USING (auth.uid() = user_id);

-- Create function to automatically create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', '')
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Add updated_at triggers to all tables
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER custom_tables_updated_at BEFORE UPDATE ON public.custom_tables FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER table_records_updated_at BEFORE UPDATE ON public.table_records FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER dropdown_options_updated_at BEFORE UPDATE ON public.dropdown_options FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
