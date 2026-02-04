-- Create rooms table for storing watch party sessions
CREATE TABLE public.rooms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code VARCHAR(8) NOT NULL UNIQUE,
  video_url TEXT,
  art_url TEXT,
  subtitle_url TEXT,
  host_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  playback_time FLOAT DEFAULT 0,
  is_playing BOOLEAN DEFAULT false,
  last_sync_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS (but allow public access for this prototype)
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;

-- Allow anyone to create rooms
CREATE POLICY "Anyone can create rooms" 
ON public.rooms 
FOR INSERT 
WITH CHECK (true);

-- Allow anyone to view rooms
CREATE POLICY "Anyone can view rooms" 
ON public.rooms 
FOR SELECT 
USING (true);

-- Allow anyone to update rooms
CREATE POLICY "Anyone can update rooms" 
ON public.rooms 
FOR UPDATE 
USING (true);

-- Enable realtime for rooms
ALTER PUBLICATION supabase_realtime ADD TABLE public.rooms;

-- Create storage bucket for videos
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('videos', 'videos', true, 524288000);

-- Create storage bucket for art/covers
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('art', 'art', true, 10485760);

-- Create storage bucket for subtitles
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('subtitles', 'subtitles', true, 5242880);

-- Storage policies for videos bucket
CREATE POLICY "Anyone can upload videos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'videos');

CREATE POLICY "Anyone can view videos"
ON storage.objects FOR SELECT
USING (bucket_id = 'videos');

-- Storage policies for art bucket
CREATE POLICY "Anyone can upload art"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'art');

CREATE POLICY "Anyone can view art"
ON storage.objects FOR SELECT
USING (bucket_id = 'art');

-- Storage policies for subtitles bucket
CREATE POLICY "Anyone can upload subtitles"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'subtitles');

CREATE POLICY "Anyone can view subtitles"
ON storage.objects FOR SELECT
USING (bucket_id = 'subtitles');

-- Function to generate random room code
CREATE OR REPLACE FUNCTION generate_room_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql SET search_path = public;