import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Users, Zap, ArrowRight, Loader2 } from 'lucide-react';
import FileUploader from '@/components/FileUploader';
import { useRoom } from '@/hooks/useRoom';
import { cn } from '@/lib/utils';

const Index = () => {
  const navigate = useNavigate();
  const { createRoom } = useRoom(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [subtitleUrl, setSubtitleUrl] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [joinCode, setJoinCode] = useState('');

  const handleCreateRoom = async () => {
    if (!videoUrl) return;
    
    setIsCreating(true);
    const roomCode = await createRoom(videoUrl, subtitleUrl || undefined);
    
    if (roomCode) {
      navigate(`/room/${roomCode}`);
    }
    setIsCreating(false);
  };

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (joinCode.trim()) {
      navigate(`/room/${joinCode.toUpperCase()}`);
    }
  };

  return (
    <div className="min-h-screen cinema-gradient">
      {/* Ambient Glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-12">
        {/* Header */}
        <header className="text-center mb-16 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-sm text-primary font-medium">Real-time sync</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-4">
            <span className="text-foreground">Sync</span>
            <span className="text-primary glow-text">Watch</span>
          </h1>
          
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Watch videos together in perfect synchronization. 
            Upload, share, and enjoy with friends — no matter the distance.
          </p>
        </header>

        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8">
          {/* Create Room Section */}
          <div className="glass-card rounded-2xl p-6 md:p-8 space-y-6 animate-fade-in">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-primary/10 glow-box">
                <Play className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Create a Room</h2>
                <p className="text-sm text-muted-foreground">Upload your video to get started</p>
              </div>
            </div>

            <div className="space-y-4">
              <FileUploader
                type="video"
                onUploadComplete={setVideoUrl}
                currentFile={videoUrl}
                onClear={() => setVideoUrl(null)}
              />

              <FileUploader
                type="subtitle"
                onUploadComplete={setSubtitleUrl}
                currentFile={subtitleUrl}
                onClear={() => setSubtitleUrl(null)}
              />
            </div>

            <button
              onClick={handleCreateRoom}
              disabled={!videoUrl || isCreating}
              className={cn(
                "w-full flex items-center justify-center gap-2 py-4 px-6 rounded-xl font-semibold transition-all duration-300",
                videoUrl && !isCreating
                  ? "bg-primary text-primary-foreground hover:shadow-glow hover:scale-[1.02]"
                  : "bg-secondary text-muted-foreground cursor-not-allowed"
              )}
            >
              {isCreating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creating room...
                </>
              ) : (
                <>
                  Create Watch Room
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>

          {/* Join Room Section */}
          <div className="glass-card rounded-2xl p-6 md:p-8 space-y-6 animate-fade-in">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-secondary">
                <Users className="w-6 h-6 text-muted-foreground" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Join a Room</h2>
                <p className="text-sm text-muted-foreground">Enter a room code to join</p>
              </div>
            </div>

            <form onSubmit={handleJoinRoom} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground/80">Room Code</label>
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="Enter 6-character code"
                  maxLength={6}
                  className="w-full px-4 py-4 rounded-xl bg-secondary/50 border border-border text-center font-mono text-2xl tracking-[0.3em] placeholder:text-muted-foreground/50 placeholder:text-base placeholder:tracking-normal focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={joinCode.length !== 6}
                className={cn(
                  "w-full flex items-center justify-center gap-2 py-4 px-6 rounded-xl font-semibold transition-all duration-300",
                  joinCode.length === 6
                    ? "bg-secondary hover:bg-secondary/80 text-foreground"
                    : "bg-secondary/50 text-muted-foreground cursor-not-allowed"
                )}
              >
                Join Room
                <ArrowRight className="w-5 h-5" />
              </button>
            </form>

            {/* Features */}
            <div className="pt-6 border-t border-border/50">
              <div className="grid gap-4">
                {[
                  { icon: Zap, text: "Sub-second sync latency" },
                  { icon: Play, text: "Play, pause & seek together" },
                ].map((feature, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm text-muted-foreground">
                    <feature.icon className="w-4 h-4 text-primary" />
                    {feature.text}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center mt-16 text-sm text-muted-foreground animate-fade-in">
          <p>Powered by real-time sync technology • No account required</p>
        </footer>
      </div>
    </div>
  );
};

export default Index;
