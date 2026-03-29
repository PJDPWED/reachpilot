import { cn, getStatusColor } from '@/utils/helpers'

interface BadgeProps {
  status: string
  label?: string
  className?: string
}

export function StatusBadge({ status, label, className }: BadgeProps) {
  return (
    <span className={cn('badge', getStatusColor(status), className)}>
      <span className={cn('status-dot mr-1.5', dotColor(status))} />
      {label || status}
    </span>
  )
}

function dotColor(status: string): string {
  const map: Record<string, string> = {
    pending: 'bg-gray-400',
    queued: 'bg-blue-400',
    sending: 'bg-yellow-400 animate-pulse',
    sent: 'bg-green-400',
    failed: 'bg-red-400',
    replied: 'bg-purple-400',
    running: 'bg-blue-400 animate-pulse',
    paused: 'bg-yellow-400',
    completed: 'bg-green-400',
    YES: 'bg-green-400',
    NO: 'bg-red-400',
    NEUTRAL: 'bg-gray-400',
  }
  return map[status] ?? 'bg-gray-400'
}
