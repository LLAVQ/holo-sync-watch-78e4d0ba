// Generate a unique user ID for this session
export const generateUserId = (): string => {
  const stored = localStorage.getItem('syncwatch_user_id');
  if (stored) return stored;
  
  const id = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  localStorage.setItem('syncwatch_user_id', id);
  return id;
};

// Generate a 6-character room code
export const generateRoomCode = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Convert SRT to VTT format
export const convertSrtToVtt = (srtContent: string): string => {
  // Add VTT header
  let vttContent = 'WEBVTT\n\n';
  
  // Replace comma with period in timestamps and convert format
  vttContent += srtContent
    .replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, '$1.$2')
    .replace(/^\d+\s*$/gm, '') // Remove index numbers
    .trim();
  
  return vttContent;
};

// Format time for display
export const formatTime = (seconds: number): string => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m}:${s.toString().padStart(2, '0')}`;
};

// Sync threshold in seconds
export const SYNC_THRESHOLD = 2;
