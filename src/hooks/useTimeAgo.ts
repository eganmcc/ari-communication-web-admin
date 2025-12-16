import { useState, useEffect } from 'react';
import { formatTimeAgo } from '../utils/formatters';

export function useTimeAgo(timestamp: string): string {
  const [timeAgo, setTimeAgo] = useState(() => {
    if (!timestamp) return '--';
    return formatTimeAgo(timestamp);
  });

  useEffect(() => {
    if (!timestamp) return;
    
    const interval = setInterval(() => {
      setTimeAgo(formatTimeAgo(timestamp));
    }, 1000);

    return () => clearInterval(interval);
  }, [timestamp]);

  return timeAgo;
}
