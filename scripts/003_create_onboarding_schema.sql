-- Create onboarding system tables
-- This script creates the database schema for user onboarding tracking

-- Create user onboarding progress table
CREATE TABLE IF NOT EXISTS public.user_onboarding (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  current_step INTEGER DEFAULT 0,
  completed_steps JSONB DEFAULT '[]',
  skipped_steps JSONB DEFAULT '[]',
  onboarding_data JSONB DEFAULT '{}',
  is_completed BOOLEAN DEFAULT FALSE,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on user_onboarding
ALTER TABLE public.user_onboarding ENABLE ROW LEVEL SECURITY;

-- Create policies for user_onboarding
CREATE POLICY "user_onboarding_select_own" ON public.user_onboarding FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user_onboarding_insert_own" ON public.user_onboarding FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_onboarding_update_own" ON public.user_onboarding FOR UPDATE USING (auth.uid() = user_id);

-- Create onboarding step completions table for analytics
CREATE TABLE IF NOT EXISTS public.onboarding_step_completions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  step_name TEXT NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  time_spent_seconds INTEGER,
  was_skipped BOOLEAN DEFAULT FALSE
);

-- Enable RLS on onboarding_step_completions
ALTER TABLE public.onboarding_step_completions ENABLE ROW LEVEL SECURITY;

-- Create policies for onboarding_step_completions
CREATE POLICY "onboarding_step_completions_select_own" ON public.onboarding_step_completions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "onboarding_step_completions_insert_own" ON public.onboarding_step_completions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Add updated_at trigger
CREATE TRIGGER user_onboarding_updated_at BEFORE UPDATE ON public.user_onboarding FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Create function to initialize user onboarding
CREATE OR REPLACE FUNCTION public.initialize_user_onboarding()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.user_onboarding (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Create trigger to initialize onboarding for new users
CREATE TRIGGER initialize_onboarding_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.initialize_user_onboarding();
