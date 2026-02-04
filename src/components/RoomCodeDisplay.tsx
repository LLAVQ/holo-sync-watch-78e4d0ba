import { useState } from 'react';
import { Copy, Check, Link2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RoomCodeDisplayProps {
  code: string;
}

const RoomCodeDisplay = ({ code }: RoomCodeDisplayProps) => {
  const [copied, setCopied] = useState(false);
  const roomUrl = `${window.location.origin}/room/${code}`;

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="glass-card rounded-xl p-6 space-y-4 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Link2 className="w-5 h-5 text-primary" />
        </div>
        <h3 className="font-semibold text-foreground">Share this room</h3>
      </div>

      <div className="space-y-3">
        {/* Room Code */}
        <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 border border-border">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Room Code</p>
            <p className="room-code">{code}</p>
          </div>
          <button
            onClick={() => copyToClipboard(code)}
            className={cn(
              "p-3 rounded-lg transition-all",
              copied ? "bg-primary/20" : "bg-secondary hover:bg-primary/10"
            )}
          >
            {copied ? (
              <Check className="w-5 h-5 text-primary" />
            ) : (
              <Copy className="w-5 h-5 text-muted-foreground" />
            )}
          </button>
        </div>

        {/* Full URL */}
        <button
          onClick={() => copyToClipboard(roomUrl)}
          className="w-full flex items-center justify-between p-4 rounded-lg bg-secondary/30 border border-border/50 hover:bg-secondary/50 transition-colors group"
        >
          <p className="text-sm text-muted-foreground truncate pr-4">
            {roomUrl}
          </p>
          <Copy className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
        </button>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Share this link with your friend to watch together
      </p>
    </div>
  );
};

export default RoomCodeDisplay;
