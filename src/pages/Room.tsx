import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Loader2 } from 'lucide-react';
import VideoPlayer from '@/components/VideoPlayer';
import RoomCodeDisplay from '@/components/RoomCodeDisplay';
import FileUploader from '@/components/FileUploader';
import { useRoom } from '@/hooks/useRoom';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

const Room = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { room, loading, error, isHost, sendSyncEvent, onSyncEvent } = useRoom(code || null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackTime, setPlaybackTime] = useState(0);
  const [subtitleUrl, setSubtitleUrl] = useState<string | null>(null);

  // Handle sync events from other users
  useEffect(() => {
    onSyncEvent((event) => {
      console.log('Received sync event:', event);
      switch (event.type) {
        case 'play':
          setIsPlaying(true);
          setPlaybackTime(event.time);
          break;
        case 'pause':
          setIsPlaying(false);
          break;
        case 'seek':
          setPlaybackTime(event.time);
          break;
      }
    });
  }, [onSyncEvent]);

  // Initialize state from room data
  useEffect(() => {
    if (room) {
      setIsPlaying(room.is_playing || false);
      setPlaybackTime(room.playback_time || 0);
      setSubtitleUrl(room.subtitle_url);
    }
  }, [room]);

  const handlePlay = useCallback(() => {
    setIsPlaying(true);
    sendSyncEvent('play', playbackTime);
  }, [sendSyncEvent, playbackTime]);

  const handlePause = useCallback(() => {
    setIsPlaying(false);
    sendSyncEvent('pause', playbackTime);
  }, [sendSyncEvent, playbackTime]);

  const handleSeek = useCallback((time: number) => {
    setPlaybackTime(time);
    sendSyncEvent('seek', time);
  }, [sendSyncEvent]);

  const handleTimeUpdate = useCallback((time: number) => {
    setPlaybackTime(time);
  }, []);

  const handleSubtitleUpload = async (url: string) => {
    setSubtitleUrl(url);
    if (room) {
      await supabase
        .from('rooms')
        .update({ subtitle_url: url })
        .eq('id', room.id);
    }
  };

  const handleSubtitleClear = async () => {
    setSubtitleUrl(null);
    if (room) {
      await supabase
        .from('rooms')
        .update({ subtitle_url: null })
        .eq('id', room.id);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen cinema-gradient flex items-center justify-center">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading room...</span>
        </div>
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="min-h-screen cinema-gradient flex items-center justify-center">
        <div className="glass-card rounded-2xl p-8 text-center max-w-md mx-4 animate-fade-in">
          <h2 className="text-2xl font-bold mb-2">Room Not Found</h2>
          <p className="text-muted-foreground mb-6">
            The room you're looking for doesn't exist or has expired.
          </p>
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:shadow-glow transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen cinema-gradient">
      {/* Ambient Glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-6">
        {/* Header */}
        <header className="flex items-center justify-between mb-6 animate-fade-in">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Leave Room</span>
          </button>

          <div className="flex items-center gap-3">
            <div className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm",
              isHost ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"
            )}>
              <Users className="w-4 h-4" />
              {isHost ? 'Host' : 'Viewer'}
            </div>
            <div className="px-3 py-1.5 rounded-full bg-secondary text-sm font-mono text-primary">
              {code}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="grid lg:grid-cols-[1fr,320px] gap-6">
          {/* Video Player */}
          <div className="space-y-4 animate-fade-in">
            <VideoPlayer
              videoUrl={room.video_url || ''}
              subtitleUrl={subtitleUrl}
              isPlaying={isPlaying}
              playbackTime={playbackTime}
              onPlay={handlePlay}
              onPause={handlePause}
              onSeek={handleSeek}
              onTimeUpdate={handleTimeUpdate}
            />

            {/* Sync Status */}
            <div className="flex items-center justify-center gap-2 py-2">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-sm text-muted-foreground">
                {isPlaying ? 'Playing in sync' : 'Paused'}
              </span>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4 animate-fade-in">
            <RoomCodeDisplay code={code || ''} />

            {/* Subtitle Upload */}
            <div className="glass-card rounded-xl p-6">
              <h3 className="font-semibold mb-4">Add Subtitles (optional)</h3>
              <FileUploader
                type="subtitle"
                onUploadComplete={handleSubtitleUpload}
                currentFile={subtitleUrl}
                onClear={handleSubtitleClear}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Room;
