import { useEffect, useRef, useState, useCallback } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatTime, SYNC_THRESHOLD } from '@/lib/roomUtils';

interface VideoPlayerProps {
  videoUrl: string;
  artUrl?: string | null;
  subtitleUrl?: string | null;
  isPlaying: boolean;
  playbackTime: number;
  onPlay: () => void;
  onPause: () => void;
  onSeek: (time: number) => void;
  onTimeUpdate?: (time: number) => void;
}

const VideoPlayer = ({
  videoUrl,
  artUrl,
  subtitleUrl,
  isPlaying,
  playbackTime,
  onPlay,
  onPause,
  onSeek,
  onTimeUpdate,
}: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showControls, setShowControls] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasStarted, setHasStarted] = useState(false);
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();
  const isSyncingRef = useRef(false);

  // Handle external sync events
  useEffect(() => {
    const video = videoRef.current;
    if (!video || isSyncingRef.current) return;

    const timeDiff = Math.abs(video.currentTime - playbackTime);
    if (timeDiff > SYNC_THRESHOLD) {
      isSyncingRef.current = true;
      video.currentTime = playbackTime;
      setTimeout(() => { isSyncingRef.current = false; }, 500);
    }
  }, [playbackTime]);

  // Handle play/pause sync
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !hasStarted) return;

    if (isPlaying && video.paused) {
      video.play().catch(console.error);
    } else if (!isPlaying && !video.paused) {
      video.pause();
    }
  }, [isPlaying, hasStarted]);

  // Video event handlers
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      onTimeUpdate?.(video.currentTime);
    };

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      setIsLoading(false);
    };

    const handleProgress = () => {
      if (video.buffered.length > 0) {
        setBuffered(video.buffered.end(video.buffered.length - 1));
      }
    };

    const handleWaiting = () => setIsLoading(true);
    const handleCanPlay = () => setIsLoading(false);

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('progress', handleProgress);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('canplay', handleCanPlay);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('progress', handleProgress);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('canplay', handleCanPlay);
    };
  }, [onTimeUpdate]);

  // Auto-hide controls
  const resetControlsTimeout = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (hasStarted && isPlaying) {
        setShowControls(false);
      }
    }, 3000);
  }, [hasStarted, isPlaying]);

  const handlePlayPause = () => {
    if (!hasStarted) {
      setHasStarted(true);
      onPlay();
      videoRef.current?.play();
      return;
    }

    if (isPlaying) {
      onPause();
    } else {
      onPlay();
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const newTime = percent * duration;
    
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
    }
    onSeek(newTime);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
    }
    setIsMuted(!isMuted);
  };

  const toggleFullscreen = () => {
    if (containerRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        containerRef.current.requestFullscreen();
      }
    }
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufferedPercent = duration > 0 ? (buffered / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-video bg-black rounded-xl overflow-hidden group"
      onMouseMove={resetControlsTimeout}
      onMouseLeave={() => hasStarted && isPlaying && setShowControls(false)}
    >
      {/* Cover Art (before video starts) */}
      {!hasStarted && artUrl && (
        <div className="absolute inset-0 z-10">
          <img
            src={artUrl}
            alt="Video cover"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        </div>
      )}

      {/* Video Element */}
      <video
        ref={videoRef}
        src={videoUrl}
        className="w-full h-full object-contain"
        playsInline
      >
        {subtitleUrl && (
          <track
            kind="subtitles"
            src={subtitleUrl}
            srcLang="en"
            label="English"
            default
          />
        )}
      </video>

      {/* Loading Spinner */}
      {isLoading && hasStarted && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-20">
          <Loader2 className="w-12 h-12 text-primary animate-spin" />
        </div>
      )}

      {/* Play Button Overlay (before start) */}
      {!hasStarted && (
        <button
          onClick={handlePlayPause}
          className="absolute inset-0 z-20 flex items-center justify-center group/play"
        >
          <div className="p-6 rounded-full bg-primary/20 backdrop-blur-sm border border-primary/30 group-hover/play:bg-primary/30 group-hover/play:scale-110 transition-all duration-300 animate-pulse-glow">
            <Play className="w-12 h-12 text-primary fill-primary" />
          </div>
        </button>
      )}

      {/* Controls Overlay */}
      <div
        className={cn(
          "absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/90 via-black/50 to-transparent transition-opacity duration-300 z-30",
          showControls ? "opacity-100" : "opacity-0"
        )}
      >
        {/* Progress Bar */}
        <div
          className="relative h-1.5 bg-white/20 rounded-full cursor-pointer mb-4 group/progress"
          onClick={handleSeek}
        >
          <div
            className="absolute h-full bg-white/30 rounded-full"
            style={{ width: `${bufferedPercent}%` }}
          />
          <div
            className="absolute h-full bg-primary rounded-full transition-all"
            style={{ width: `${progressPercent}%` }}
          />
          <div
            className="absolute h-3 w-3 bg-primary rounded-full -top-[3px] opacity-0 group-hover/progress:opacity-100 transition-opacity"
            style={{ left: `calc(${progressPercent}% - 6px)` }}
          />
        </div>

        {/* Control Buttons */}
        <div className="flex items-center gap-4">
          <button
            onClick={handlePlayPause}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            {isPlaying ? (
              <Pause className="w-6 h-6 text-white" />
            ) : (
              <Play className="w-6 h-6 text-white" />
            )}
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleMute}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              {isMuted ? (
                <VolumeX className="w-5 h-5 text-white" />
              ) : (
                <Volume2 className="w-5 h-5 text-white" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-20 accent-primary"
            />
          </div>

          <span className="text-sm text-white/80 font-mono">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>

          <div className="flex-1" />

          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <Maximize className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
