'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { fetchChannels, type Channel } from './api';

interface ChannelContextValue {
  channels: Channel[];
  selected: Channel | null;
  setSelectedId: (id: number) => void;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

const ChannelContext = createContext<ChannelContextValue>({
  channels: [],
  selected: null,
  setSelectedId: () => {},
  loading: true,
  error: null,
  refresh: () => {},
});

export function ChannelProvider({ children }: { children: ReactNode }) {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchChannels();
      setChannels(data.channels);
      if (data.channels.length > 0 && selectedId === null) {
        setSelectedId(data.channels[0].id);
      }
    } catch {
      setError('接続エラー: APIサーバーに接続できません');
    } finally {
      setLoading(false);
    }
  }, [selectedId]);

  useEffect(() => {
    load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const selected = channels.find((c) => c.id === selectedId) ?? null;

  return (
    <ChannelContext.Provider
      value={{
        channels,
        selected,
        setSelectedId,
        loading,
        error,
        refresh: load,
      }}
    >
      {children}
    </ChannelContext.Provider>
  );
}

export function useChannel() {
  return useContext(ChannelContext);
}
