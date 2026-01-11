import { useState, useEffect } from 'react';

export function useStressCountdown(stressEndTime: string | undefined): string | null {
  const [countdown, setCountdown] = useState<string | null>(null);

  useEffect(() => {
    if (!stressEndTime) {
      setCountdown(null);
      return;
    }

    const endTime = new Date(stressEndTime);
    if (isNaN(endTime.getTime())) {
      console.warn('Invalid stress end time:', stressEndTime);
      setCountdown(null);
      return;
    }

    const updateCountdown = () => {
      const now = new Date();
      const remainingMs = endTime.getTime() - now.getTime();

      if (remainingMs <= 0) {
        setCountdown('00:00');
        return;
      }

      const totalSeconds = Math.floor(remainingMs / 1000);
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      
      const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      setCountdown(timeString);
    };

    updateCountdown(); // Initial update
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [stressEndTime]);

  return countdown;
}
