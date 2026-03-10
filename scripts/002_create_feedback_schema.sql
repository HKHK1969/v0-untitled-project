-- Create feedback system tables
-- This script creates the database schema for user feedback collection

-- Create feedback submissions table
CREATE TABLE IF NOT EXISTS public.feedback_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('bug', 'feature', 'improvement', 'general')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  page_url TEXT,
  user_agent TEXT,
  screenshot_url TEXT,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in-progress', 'resolved', 'closed')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on feedback_submissions
ALTER TABLE public.feedback_submissions ENABLE ROW LEVEL SECURITY;

-- Create policies for feedback_submissions
CREATE POLICY "feedback_submissions_select_own" ON public.feedback_submissions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "feedback_submissions_insert_own" ON public.feedback_submissions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "feedback_submissions_update_own" ON public.feedback_submissions FOR UPDATE USING (auth.uid() = user_id);

-- Create feature requests table
CREATE TABLE IF NOT EXISTS public.feature_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT DEFAULT 'general' CHECK (category IN ('ui-ux', 'data-management', 'analytics', 'integrations', 'performance', 'general')),
  votes INTEGER DEFAULT 1,
  status TEXT DEFAULT 'submitted' CHECK (status IN ('submitted', 'under-review', 'planned', 'in-development', 'completed', 'rejected')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  estimated_effort TEXT CHECK (estimated_effort IN ('small', 'medium', 'large', 'extra-large')),
  target_release TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on feature_requests
ALTER TABLE public.feature_requests ENABLE ROW LEVEL SECURITY;

-- Create policies for feature_requests
CREATE POLICY "feature_requests_select_all" ON public.feature_requests FOR SELECT TO authenticated USING (true);
CREATE POLICY "feature_requests_insert_own" ON public.feature_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "feature_requests_update_own" ON public.feature_requests FOR UPDATE USING (auth.uid() = user_id);

-- Create feature request votes table
CREATE TABLE IF NOT EXISTS public.feature_request_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  feature_request_id UUID NOT NULL REFERENCES public.feature_requests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(feature_request_id, user_id)
);

-- Enable RLS on feature_request_votes
ALTER TABLE public.feature_request_votes ENABLE ROW LEVEL SECURITY;

-- Create policies for feature_request_votes
CREATE POLICY "feature_request_votes_select_all" ON public.feature_request_votes FOR SELECT TO authenticated USING (true);
CREATE POLICY "feature_request_votes_insert_own" ON public.feature_request_votes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "feature_request_votes_delete_own" ON public.feature_request_votes FOR DELETE USING (auth.uid() = user_id);

-- Create NPS surveys table
CREATE TABLE IF NOT EXISTS public.nps_surveys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 10),
  feedback TEXT,
  survey_type TEXT DEFAULT 'periodic' CHECK (survey_type IN ('periodic', 'feature-specific', 'onboarding', 'exit')),
  context JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on nps_surveys
ALTER TABLE public.nps_surveys ENABLE ROW LEVEL SECURITY;

-- Create policies for nps_surveys
CREATE POLICY "nps_surveys_select_own" ON public.nps_surveys FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "nps_surveys_insert_own" ON public.nps_surveys FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Add updated_at triggers
CREATE TRIGGER feedback_submissions_updated_at BEFORE UPDATE ON public.feedback_submissions FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER feature_requests_updated_at BEFORE UPDATE ON public.feature_requests FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Create function to update feature request vote counts
CREATE OR REPLACE FUNCTION public.update_feature_request_votes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.feature_requests 
    SET votes = votes + 1 
    WHERE id = NEW.feature_request_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.feature_requests 
    SET votes = GREATEST(votes - 1, 0) 
    WHERE id = OLD.feature_request_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Create triggers for vote counting
CREATE TRIGGER feature_request_vote_count_trigger
  AFTER INSERT OR DELETE ON public.feature_request_votes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_feature_request_votes();
