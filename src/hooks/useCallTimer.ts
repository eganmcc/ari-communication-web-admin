import { useState, useEffect } from 'react';

export function useCallTimer(lastStatusChange: string, status: string): string | null {
  const [duration, setDuration] = useState<string | null>(null);

  useEffect(() => {
    if (status !== 'busy') {
      setDuration(null);
      return;
    }

    const updateDuration = () => {
      const start = new Date(lastStatusChange);
      const now = new Date();
      const diff = Math.floor((now.getTime() - start.getTime()) / 1000);
      
      const minutes = Math.floor(diff / 60);
      const seconds = diff % 60;
      setDuration(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    };

    updateDuration();
    const interval = setInterval(updateDuration, 1000);

    return () => clearInterval(interval);
  }, [lastStatusChange, status]);

  return duration;
}
