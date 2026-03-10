-- Create analytics and monitoring tables
-- This script creates the database schema for tracking user behavior and system metrics

-- Create user sessions table
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER,
  page_views INTEGER DEFAULT 0,
  actions_count INTEGER DEFAULT 0,
  user_agent TEXT,
  ip_address INET,
  country TEXT,
  city TEXT,
  device_type TEXT,
  browser TEXT,
  os TEXT,
  referrer TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT
);

-- Create user events table for detailed tracking
CREATE TABLE IF NOT EXISTS public.user_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT,
  event_type TEXT NOT NULL,
  event_name TEXT NOT NULL,
  page_url TEXT,
  element_id TEXT,
  element_class TEXT,
  element_text TEXT,
  event_data JSONB DEFAULT '{}',
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create page views table
CREATE TABLE IF NOT EXISTS public.page_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT,
  page_url TEXT NOT NULL,
  page_title TEXT,
  referrer TEXT,
  time_on_page_seconds INTEGER,
  scroll_depth_percentage INTEGER,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create feature usage table
CREATE TABLE IF NOT EXISTS public.feature_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  feature_name TEXT NOT NULL,
  feature_category TEXT,
  usage_count INTEGER DEFAULT 1,
  first_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  total_time_spent_seconds INTEGER DEFAULT 0
);

-- Create error logs table
CREATE TABLE IF NOT EXISTS public.error_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT,
  error_type TEXT NOT NULL,
  error_message TEXT NOT NULL,
  error_stack TEXT,
  page_url TEXT,
  user_agent TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved BOOLEAN DEFAULT FALSE,
  severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical'))
);

-- Create performance metrics table
CREATE TABLE IF NOT EXISTS public.performance_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT,
  metric_name TEXT NOT NULL,
  metric_value NUMERIC NOT NULL,
  page_url TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all analytics tables
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_metrics ENABLE ROW LEVEL SECURITY;

-- Create policies for analytics tables (users can only see their own data)
CREATE POLICY "user_sessions_select_own" ON public.user_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user_sessions_insert_own" ON public.user_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_sessions_update_own" ON public.user_sessions FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "user_events_select_own" ON public.user_events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user_events_insert_own" ON public.user_events FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "page_views_select_own" ON public.page_views FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "page_views_insert_own" ON public.page_views FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "feature_usage_select_own" ON public.feature_usage FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "feature_usage_insert_own" ON public.feature_usage FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "feature_usage_update_own" ON public.feature_usage FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "error_logs_select_own" ON public.error_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "error_logs_insert_own" ON public.error_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "performance_metrics_select_own" ON public.performance_metrics FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "performance_metrics_insert_own" ON public.performance_metrics FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create indexes for better query performance
CREATE INDEX idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX idx_user_sessions_started_at ON public.user_sessions(started_at);
CREATE INDEX idx_user_events_user_id ON public.user_events(user_id);
CREATE INDEX idx_user_events_timestamp ON public.user_events(timestamp);
CREATE INDEX idx_user_events_event_type ON public.user_events(event_type);
CREATE INDEX idx_page_views_user_id ON public.page_views(user_id);
CREATE INDEX idx_page_views_timestamp ON public.page_views(timestamp);
CREATE INDEX idx_feature_usage_user_id ON public.feature_usage(user_id);
CREATE INDEX idx_feature_usage_feature_name ON public.feature_usage(feature_name);
CREATE INDEX idx_error_logs_timestamp ON public.error_logs(timestamp);
CREATE INDEX idx_error_logs_severity ON public.error_logs(severity);
CREATE INDEX idx_performance_metrics_timestamp ON public.performance_metrics(timestamp);
CREATE INDEX idx_performance_metrics_metric_name ON public.performance_metrics(metric_name);

-- Create function to update feature usage
CREATE OR REPLACE FUNCTION public.update_feature_usage(
  p_user_id UUID,
  p_feature_name TEXT,
  p_feature_category TEXT DEFAULT NULL,
  p_time_spent INTEGER DEFAULT 0
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.feature_usage (
    user_id,
    feature_name,
    feature_category,
    usage_count,
    total_time_spent_seconds
  )
  VALUES (
    p_user_id,
    p_feature_name,
    p_feature_category,
    1,
    p_time_spent
  )
  ON CONFLICT (user_id, feature_name)
  DO UPDATE SET
    usage_count = feature_usage.usage_count + 1,
    last_used_at = NOW(),
    total_time_spent_seconds = feature_usage.total_time_spent_seconds + p_time_spent;
END;
$$;

-- Add unique constraint for feature usage
ALTER TABLE public.feature_usage ADD CONSTRAINT unique_user_feature UNIQUE (user_id, feature_name);
