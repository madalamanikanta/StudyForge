-- Function to update the 'updated_at' timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- study_plans table
CREATE TABLE public.study_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  goal TEXT,
  timeline_days INTEGER,
  hours_per_week INTEGER,
  difficulty_level TEXT,
  ai_generated BOOLEAN DEFAULT false,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.study_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own study plans" ON public.study_plans FOR ALL USING (auth.uid() = user_id);
CREATE TRIGGER update_study_plans_updated_at BEFORE UPDATE ON public.study_plans FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

-- plan_items table
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
  completed_at TIMESTAMPTZ,
  confidence_level INTEGER CHECK (confidence_level >= 1 AND confidence_level <= 5),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.plan_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage plan items for their study plans" ON public.plan_items FOR ALL USING (study_plan_id IN (SELECT id FROM public.study_plans WHERE user_id = auth.uid()));
CREATE TRIGGER update_plan_items_updated_at BEFORE UPDATE ON public.plan_items FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();
CREATE INDEX idx_plan_items_study_plan_id ON public.plan_items(study_plan_id);

-- spaced_items table
CREATE TABLE public.spaced_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  concept_id TEXT NOT NULL,
  concept_title TEXT NOT NULL,
  next_review TIMESTAMPTZ NOT NULL DEFAULT now(),
  ease_factor DECIMAL(3,2) NOT NULL DEFAULT 2.50,
  interval_days INTEGER NOT NULL DEFAULT 1,
  repetitions INTEGER NOT NULL DEFAULT 0,
  last_reviewed TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.spaced_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own spaced repetition items" ON public.spaced_items FOR ALL USING (auth.uid() = user_id);
CREATE TRIGGER update_spaced_items_updated_at BEFORE UPDATE ON public.spaced_items FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();
CREATE INDEX idx_spaced_items_user_id ON public.spaced_items(user_id);

-- progress_logs table
CREATE TABLE public.progress_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id UUID,
  concept_id TEXT,
  activity_type TEXT NOT NULL,
  correctness DECIMAL(3,2) CHECK (correctness >= 0 AND correctness <= 1),
  time_taken_minutes INTEGER,
  confidence_before INTEGER CHECK (confidence_before >= 1 AND confidence_before <= 5),
  confidence_after INTEGER CHECK (confidence_after >= 1 AND confidence_after <= 5),
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.progress_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own progress logs" ON public.progress_logs FOR ALL USING (auth.uid() = user_id);
CREATE INDEX idx_progress_logs_user_id ON public.progress_logs(user_id);

-- imports table
CREATE TABLE public.imports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  username TEXT NOT NULL,
  import_data JSONB,
  problems_count INTEGER NOT NULL DEFAULT 0,
  contest_rating INTEGER NOT NULL DEFAULT 0,
  badges JSONB DEFAULT '[]'::jsonb,
  last_synced TIMESTAMPTZ NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, platform)
);
ALTER TABLE public.imports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own imports" ON public.imports FOR ALL USING (auth.uid() = user_id);
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.imports FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();
CREATE INDEX idx_imports_user_id_platform ON public.imports(user_id, platform);

-- snapshots table
CREATE TABLE public.snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  snapshot_data JSONB NOT NULL DEFAULT '{}',
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  pdf_url TEXT,
  is_exported BOOLEAN NOT NULL DEFAULT false
);
ALTER TABLE public.snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own snapshots" ON public.snapshots FOR ALL USING (auth.uid() = user_id);
CREATE INDEX idx_snapshots_user_id ON public.snapshots(user_id);

-- sync_audit table
CREATE TABLE public.sync_audit (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sync_type TEXT NOT NULL,
  sync_status TEXT NOT NULL DEFAULT 'pending',
  data_checksum TEXT,
  error_message TEXT,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.sync_audit ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own sync audit logs" ON public.sync_audit FOR ALL USING (auth.uid() = user_id);
CREATE INDEX idx_sync_audit_user_id ON public.sync_audit(user_id);
