import { Loader2 } from 'lucide-react'
import { cn } from '@/utils/helpers'

export function Spinner({ className, size = 16 }: { className?: string; size?: number }) {
  return <Loader2 size={size} className={cn('animate-spin text-brand-600', className)} />
}
