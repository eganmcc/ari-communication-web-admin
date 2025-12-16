import { useState, useEffect } from 'react';

export function useCallTimer(lastStatusChange: string, status: string): string | null {
  const [duration, setDuration] = useState<string | null>(null);

  useEffect(() => {
    if (status !== 'busy') {
      setDuration(null);
      return;
    }

    // Log for debugging
    const startDate = new Date(lastStatusChange);
    const isValidDate = !isNaN(startDate.getTime());
    
    console.log('⏱️ Call timer effect triggered:', { 
      lastStatusChange, 
      status,
      type: typeof lastStatusChange,
      parsed: isValidDate ? startDate.toISOString() : 'INVALID',
      isValid: isValidDate
    });

    const updateDuration = () => {
      const start = new Date(lastStatusChange);
      
      // Check if date is valid
      if (isNaN(start.getTime())) {
        console.warn('❌ Invalid lastStatusChange date:', lastStatusChange);
        setDuration('00:00');
        return;
      }
      
      const now = new Date();
      const diff = Math.floor((now.getTime() - start.getTime()) / 1000);
      
      // Ensure diff is positive
      const absDiff = Math.max(0, diff);
      
      const minutes = Math.floor(absDiff / 60);
      const seconds = absDiff % 60;
      const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      console.log('⏱️ Timer updated:', formattedTime, `(${absDiff}s)`);
      setDuration(formattedTime);
    };

    updateDuration();
    const interval = setInterval(updateDuration, 1000);

    return () => clearInterval(interval);
  }, [lastStatusChange, status]);

  return duration;
}
