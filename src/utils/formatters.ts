export function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function calculateCallDuration(lastStatusChange: string, status: string): string | null {
  if (status !== 'busy') return null;
  
  const start = new Date(lastStatusChange);
  const now = new Date();
  const diff = Math.floor((now.getTime() - start.getTime()) / 1000); // seconds
  
  return formatDuration(diff);
}

export function formatTimeAgo(timestamp: string): string {
  // Handle undefined, null, or empty strings
  if (!timestamp || timestamp === '') return '--';
  
  const last = new Date(timestamp);
  
  // Check if date is valid
  if (isNaN(last.getTime())) {
    console.warn('Invalid timestamp:', timestamp);
    return '--';
  }
  
  const now = new Date();
  const diff = Math.floor((now.getTime() - last.getTime()) / 1000); // seconds
  
  // Handle negative diff (future dates)
  if (diff < 0) return 'just now';
  
  // Ensure we're working with valid numbers
  if (!isFinite(diff) || isNaN(diff)) return '--';
  
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    available: 'bg-green-500',
    busy: 'bg-red-500',
    break: 'bg-amber-500',
    offline: 'bg-gray-500',
  };
  return colors[status] || 'bg-gray-500';
}

export function getStatusEmoji(status: string): string {
  const emojis: Record<string, string> = {
    available: '🟢',
    busy: '🔴',
    break: '🟡',
    offline: '⚫',
  };
  return emojis[status] || '⚫';
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    available: 'Available',
    busy: 'Busy',
    break: 'Break',
    offline: 'Offline',
  };
  return labels[status] || 'Unknown';
}
