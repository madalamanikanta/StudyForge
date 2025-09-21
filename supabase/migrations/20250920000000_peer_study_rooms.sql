-- Create user_preferences table for peer matching
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  timezone TEXT DEFAULT 'UTC',
  skill_level TEXT DEFAULT 'intermediate',
  study_goals TEXT[] DEFAULT '{}',
  study_times JSONB DEFAULT '[]',
  topics TEXT[] DEFAULT '{}',
  looking_for_partners BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own preferences" ON public.user_preferences FOR ALL USING (auth.uid() = user_id);
CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON public.user_preferences FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

-- Create study_rooms table
CREATE TABLE IF NOT EXISTS public.study_rooms (
  id TEXT NOT NULL PRIMARY KEY,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic TEXT NOT NULL DEFAULT 'General Study',
  max_participants INTEGER NOT NULL DEFAULT 4,
  current_participants INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'active', 'ended')),
  expires_at TIMESTAMPTZ NOT NULL,
  privacy_settings JSONB DEFAULT '{}',
  participant_preferences JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.study_rooms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active study rooms" ON public.study_rooms FOR SELECT USING (status IN ('waiting', 'active') AND expires_at > now());
CREATE POLICY "Users can manage rooms they created" ON public.study_rooms FOR ALL USING (auth.uid() = created_by);
CREATE TRIGGER update_study_rooms_updated_at BEFORE UPDATE ON public.study_rooms FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();
CREATE INDEX idx_study_rooms_status ON public.study_rooms(status);
CREATE INDEX idx_study_rooms_expires_at ON public.study_rooms(expires_at);

-- Create room_participants table
CREATE TABLE IF NOT EXISTS public.room_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id TEXT NOT NULL REFERENCES public.study_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'kicked')),
  last_seen_at TIMESTAMPTZ,
  UNIQUE(room_id, user_id)
);

ALTER TABLE public.room_participants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Room participants can view room data" ON public.room_participants FOR SELECT USING (
  auth.uid() IN (
    SELECT user_id FROM public.room_participants WHERE room_id = room_participants.room_id
    UNION
    SELECT created_by FROM public.study_rooms WHERE id = room_participants.room_id
  )
);
CREATE POLICY "Users can manage their own participation" ON public.room_participants FOR ALL USING (auth.uid() = user_id);
CREATE INDEX idx_room_participants_room_id ON public.room_participants(room_id);
CREATE INDEX idx_room_participants_user_id ON public.room_participants(user_id);

-- Create study_room_messages table for in-room chat
CREATE TABLE IF NOT EXISTS public.study_room_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id TEXT NOT NULL REFERENCES public.study_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'system', 'file')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.study_room_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Room participants can view messages" ON public.study_room_messages FOR SELECT USING (
  auth.uid() IN (
    SELECT user_id FROM public.room_participants WHERE room_id = study_room_messages.room_id
  )
);
CREATE POLICY "Room participants can send messages" ON public.study_room_messages FOR INSERT WITH CHECK (
  auth.uid() = user_id AND
  auth.uid() IN (
    SELECT user_id FROM public.room_participants WHERE room_id = study_room_messages.room_id
  )
);
CREATE INDEX idx_study_room_messages_room_id ON public.study_room_messages(room_id);
CREATE INDEX idx_study_room_messages_created_at ON public.study_room_messages(created_at);

-- Add cleanup function for expired rooms
CREATE OR REPLACE FUNCTION public.cleanup_expired_rooms()
RETURNS void AS $$
BEGIN
  DELETE FROM public.study_rooms WHERE expires_at < now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a scheduled cleanup (this would typically be set up as a cron job)
-- For now, we'll rely on application-level cleanup when accessing rooms
