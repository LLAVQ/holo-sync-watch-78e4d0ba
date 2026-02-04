import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { generateUserId, SYNC_THRESHOLD } from '@/lib/roomUtils';

interface Room {
  id: string;
  code: string;
  video_url: string | null;
  art_url: string | null;
  subtitle_url: string | null;
  host_id: string;
  playback_time: number | null;
  is_playing: boolean | null;
  last_sync_at: string | null;
}

interface SyncEvent {
  type: 'play' | 'pause' | 'seek';
  time: number;
  sender_id: string;
  timestamp: number;
}

export const useRoom = (roomCode: string | null) => {
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isHost, setIsHost] = useState(false);
  const userId = useRef(generateUserId());
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const onSyncEventRef = useRef<((event: SyncEvent) => void) | null>(null);

  // Fetch room data
  const fetchRoom = useCallback(async () => {
    if (!roomCode) {
      setLoading(false);
      return;
    }

    try {
      const { data, error: fetchError } = await supabase
        .from('rooms')
        .select('*')
        .eq('code', roomCode.toUpperCase())
        .single();

      if (fetchError) {
        setError('Room not found');
        setLoading(false);
        return;
      }

      setRoom(data);
      setIsHost(data.host_id === userId.current);
      setLoading(false);
    } catch (err) {
      setError('Failed to load room');
      setLoading(false);
    }
  }, [roomCode]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!roomCode || !room) return;

    const channel = supabase
      .channel(`room:${roomCode}`)
      .on('broadcast', { event: 'sync' }, ({ payload }) => {
        const event = payload as SyncEvent;
        // Don't process our own events
        if (event.sender_id !== userId.current && onSyncEventRef.current) {
          onSyncEventRef.current(event);
        }
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
    };
  }, [roomCode, room]);

  // Initial fetch
  useEffect(() => {
    fetchRoom();
  }, [fetchRoom]);

  // Send sync event
  const sendSyncEvent = useCallback(async (type: 'play' | 'pause' | 'seek', time: number) => {
    if (!channelRef.current || !room) return;

    const event: SyncEvent = {
      type,
      time,
      sender_id: userId.current,
      timestamp: Date.now(),
    };

    await channelRef.current.send({
      type: 'broadcast',
      event: 'sync',
      payload: event,
    });

    // Update room state in database
    await supabase
      .from('rooms')
      .update({
        playback_time: time,
        is_playing: type === 'play',
        last_sync_at: new Date().toISOString(),
      })
      .eq('id', room.id);
  }, [room]);

  // Register sync event handler
  const onSyncEvent = useCallback((handler: (event: SyncEvent) => void) => {
    onSyncEventRef.current = handler;
  }, []);

  // Create a new room
  const createRoom = useCallback(async (
    videoUrl: string,
    artUrl?: string,
    subtitleUrl?: string
  ): Promise<string | null> => {
    const code = generateRoomCode();
    
    const { data, error: createError } = await supabase
      .from('rooms')
      .insert({
        code,
        video_url: videoUrl,
        art_url: artUrl || null,
        subtitle_url: subtitleUrl || null,
        host_id: userId.current,
      })
      .select()
      .single();

    if (createError) {
      console.error('Failed to create room:', createError);
      return null;
    }

    return data.code;
  }, []);

  return {
    room,
    loading,
    error,
    isHost,
    userId: userId.current,
    sendSyncEvent,
    onSyncEvent,
    createRoom,
    refetch: fetchRoom,
  };
};

// Helper to generate room code
const generateRoomCode = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};
