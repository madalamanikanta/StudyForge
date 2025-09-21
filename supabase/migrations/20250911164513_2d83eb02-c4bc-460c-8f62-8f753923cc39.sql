-- Create required tables for StudyForge MVP

-- plan_items table for study plan breakdown
CREATE TABLE public.plan_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  study_plan_id UUID NOT NULL REFERENCES public.study_plans(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  topic TEXT NOT NULL,
  estimated_duration_minutes INTEGER NOT NULL DEFAULT 30,
  difficulty_level TEXT NOT NULL DEFAULT 'medium',
  prerequisites TEXT[] DEFAULT '{}',
  order_index INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  completed_at TIMESTAMP WITH TIME ZONE,
  confidence_level INTEGER CHECK (confidence_level >= 1 AND confidence_level <= 5),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- spaced_items table for spaced repetition system
CREATE TABLE public.spaced_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  concept_id TEXT NOT NULL,
  concept_title TEXT NOT NULL,
  next_review TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ease_factor DECIMAL(3,2) NOT NULL DEFAULT 2.50,
  interval_days INTEGER NOT NULL DEFAULT 1,
  repetitions INTEGER NOT NULL DEFAULT 0,
  last_reviewed TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- progress_logs table for tracking study progress
CREATE TABLE public.progress_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  item_id UUID REFERENCES public.plan_items(id) ON DELETE CASCADE,
  concept_id TEXT,
  activity_type TEXT NOT NULL, -- 'study', 'review', 'micro_lesson', 'imported'
  correctness DECIMAL(3,2) CHECK (correctness >= 0 AND correctness <= 1),
  time_taken_minutes INTEGER,
  confidence_before INTEGER CHECK (confidence_before >= 1 AND confidence_before <= 5),
  confidence_after INTEGER CHECK (confidence_after >= 1 AND confidence_after <= 5),
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- imports table for LeetCode/HackerRank data
CREATE TABLE public.imports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  platform TEXT NOT NULL, -- 'leetcode', 'hackerrank'
  username TEXT NOT NULL,
  import_data JSONB NOT NULL DEFAULT '{}',
  problems_count INTEGER NOT NULL DEFAULT 0,
  last_synced TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- snapshots table for exportable study reports
CREATE TABLE public.snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  snapshot_data JSONB NOT NULL DEFAULT '{}',
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  pdf_url TEXT,
  is_exported BOOLEAN NOT NULL DEFAULT false
);

-- sync_audit table for offline-first sync tracking
CREATE TABLE public.sync_audit (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  sync_type TEXT NOT NULL, -- 'full', 'incremental', 'rollback'
  sync_status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'success', 'failed'
  data_checksum TEXT,
  error_message TEXT,
  synced_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.plan_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spaced_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.imports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_audit ENABLE ROW LEVEL SECURITY;

-- RLS policies for plan_items
CREATE POLICY "Users can manage plan items for their study plans" 
ON public.plan_items 
FOR ALL 
USING (
  study_plan_id IN (
    SELECT id FROM public.study_plans WHERE user_id = auth.uid()
  )
);

-- RLS policies for spaced_items
CREATE POLICY "Users can manage their own spaced repetition items" 
ON public.spaced_items 
FOR ALL 
USING (auth.uid() = user_id);

-- RLS policies for progress_logs
CREATE POLICY "Users can manage their own progress logs" 
ON public.progress_logs 
FOR ALL 
USING (auth.uid() = user_id);

-- RLS policies for imports
CREATE POLICY "Users can manage their own imports" 
ON public.imports 
FOR ALL 
USING (auth.uid() = user_id);

-- RLS policies for snapshots
CREATE POLICY "Users can manage their own snapshots" 
ON public.snapshots 
FOR ALL 
USING (auth.uid() = user_id);

-- RLS policies for sync_audit
CREATE POLICY "Users can view their own sync audit logs" 
ON public.sync_audit 
FOR ALL 
USING (auth.uid() = user_id);

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_plan_items_updated_at
BEFORE UPDATE ON public.plan_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_spaced_items_updated_at
BEFORE UPDATE ON public.spaced_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_imports_updated_at
BEFORE UPDATE ON public.imports
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_plan_items_study_plan_id ON public.plan_items(study_plan_id);
CREATE INDEX idx_plan_items_status ON public.plan_items(status);
CREATE INDEX idx_spaced_items_user_id ON public.spaced_items(user_id);
CREATE INDEX idx_spaced_items_next_review ON public.spaced_items(next_review);
CREATE INDEX idx_progress_logs_user_id ON public.progress_logs(user_id);
CREATE INDEX idx_progress_logs_created_at ON public.progress_logs(created_at);
CREATE INDEX idx_imports_user_id ON public.imports(user_id);
CREATE INDEX idx_snapshots_user_id ON public.snapshots(user_id);
CREATE INDEX idx_sync_audit_user_id ON public.sync_audit(user_id);