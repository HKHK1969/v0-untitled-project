-- Create user testing program tables
-- This script creates the database schema for managing the user testing program

-- Create pilot users table
CREATE TABLE IF NOT EXISTS public.pilot_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  company_name TEXT,
  role TEXT,
  industry TEXT,
  company_size TEXT,
  invited_by TEXT,
  invitation_code TEXT UNIQUE,
  status TEXT DEFAULT 'invited' CHECK (status IN ('invited', 'active', 'completed', 'dropped')),
  onboarding_completed BOOLEAN DEFAULT FALSE,
  testing_phase TEXT DEFAULT 'phase1' CHECK (testing_phase IN ('phase1', 'phase2', 'phase3')),
  assigned_tasks JSONB DEFAULT '[]',
  completed_tasks JSONB DEFAULT '[]',
  feedback_score INTEGER CHECK (feedback_score >= 1 AND feedback_score <= 10),
  would_recommend BOOLEAN,
  pain_points TEXT[],
  feature_requests TEXT[],
  testing_notes TEXT,
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  activated_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  last_active_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create testing tasks table
CREATE TABLE IF NOT EXISTS public.testing_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('onboarding', 'data-entry', 'navigation', 'features', 'workflow')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  estimated_time_minutes INTEGER,
  instructions TEXT,
  success_criteria TEXT,
  phase TEXT DEFAULT 'phase1' CHECK (phase IN ('phase1', 'phase2', 'phase3')),
  is_required BOOLEAN DEFAULT TRUE,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create task completions table
CREATE TABLE IF NOT EXISTS public.task_completions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES public.testing_tasks(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'assigned' CHECK (status IN ('assigned', 'in_progress', 'completed', 'skipped', 'failed')),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  time_spent_minutes INTEGER,
  difficulty_rating INTEGER CHECK (difficulty_rating >= 1 AND difficulty_rating <= 5),
  completion_notes TEXT,
  issues_encountered TEXT,
  suggestions TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, task_id)
);

-- Create testing sessions table
CREATE TABLE IF NOT EXISTS public.testing_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_type TEXT DEFAULT 'self_guided' CHECK (session_type IN ('self_guided', 'moderated', 'interview')),
  phase TEXT NOT NULL CHECK (phase IN ('phase1', 'phase2', 'phase3')),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER,
  tasks_assigned INTEGER DEFAULT 0,
  tasks_completed INTEGER DEFAULT 0,
  overall_rating INTEGER CHECK (overall_rating >= 1 AND overall_rating <= 5),
  session_notes TEXT,
  moderator_notes TEXT,
  recording_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user interviews table
CREATE TABLE IF NOT EXISTS public.user_interviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  interview_type TEXT DEFAULT 'exit' CHECK (interview_type IN ('onboarding', 'mid_point', 'exit')),
  scheduled_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER,
  interviewer TEXT,
  interview_notes TEXT,
  key_insights TEXT[],
  pain_points TEXT[],
  feature_requests TEXT[],
  satisfaction_score INTEGER CHECK (satisfaction_score >= 1 AND satisfaction_score <= 10),
  would_recommend BOOLEAN,
  recording_url TEXT,
  transcript_url TEXT,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no_show')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all testing tables
ALTER TABLE public.pilot_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testing_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testing_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_interviews ENABLE ROW LEVEL SECURITY;

-- Create policies for testing tables
CREATE POLICY "pilot_users_select_own" ON public.pilot_users FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "pilot_users_update_own" ON public.pilot_users FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "testing_tasks_select_all" ON public.testing_tasks FOR SELECT TO authenticated USING (true);

CREATE POLICY "task_completions_select_own" ON public.task_completions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "task_completions_insert_own" ON public.task_completions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "task_completions_update_own" ON public.task_completions FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "testing_sessions_select_own" ON public.testing_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "testing_sessions_insert_own" ON public.testing_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "testing_sessions_update_own" ON public.testing_sessions FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "user_interviews_select_own" ON public.user_interviews FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user_interviews_insert_own" ON public.user_interviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_interviews_update_own" ON public.user_interviews FOR UPDATE USING (auth.uid() = user_id);

-- Add updated_at triggers
CREATE TRIGGER pilot_users_updated_at BEFORE UPDATE ON public.pilot_users FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER testing_tasks_updated_at BEFORE UPDATE ON public.testing_tasks FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER task_completions_updated_at BEFORE UPDATE ON public.task_completions FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER user_interviews_updated_at BEFORE UPDATE ON public.user_interviews FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Insert default testing tasks
INSERT INTO public.testing_tasks (name, description, category, priority, estimated_time_minutes, instructions, success_criteria, phase, order_index) VALUES
('Complete Onboarding', 'Go through the complete onboarding flow', 'onboarding', 'high', 15, 'Follow the onboarding steps and complete your profile setup', 'All onboarding steps completed successfully', 'phase1', 1),
('Add First Supplier', 'Add a supplier to your database', 'data-entry', 'high', 10, 'Navigate to suppliers and add a new supplier with complete information', 'Supplier added with all required fields', 'phase1', 2),
('Create Product Entry', 'Add a new product or style', 'data-entry', 'high', 10, 'Create a new product entry with specifications', 'Product created with complete details', 'phase1', 3),
('Navigate Dashboard', 'Explore the main dashboard features', 'navigation', 'medium', 15, 'Spend time exploring different sections of the dashboard', 'Visited all main dashboard sections', 'phase1', 4),
('Create Sample Order', 'Create and manage a sample order', 'workflow', 'medium', 20, 'Create a sample order and track its progress', 'Sample order created and status updated', 'phase1', 5),
('Use Search and Filters', 'Test search and filtering capabilities', 'features', 'medium', 10, 'Try searching and filtering in different data tables', 'Successfully used search and filters', 'phase2', 6),
('Export Data', 'Export data from the system', 'features', 'low', 5, 'Export data from any table to CSV or other format', 'Data exported successfully', 'phase2', 7),
('Provide Feedback', 'Submit feedback through the feedback system', 'features', 'high', 5, 'Use the feedback widget to submit your thoughts', 'Feedback submitted successfully', 'phase1', 8);
