import * as React from 'react'
import { cn } from '@/lib/utils'

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info'

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-midnight-50 text-midnight border border-midnight-100',
  success: 'bg-sage-50 text-sage-700 border border-sage-100',
  warning: 'bg-gold-50 text-gold-700 border border-gold-100',
  danger: 'bg-terracotta-50 text-terracotta-700 border border-terracotta-100',
  info: 'bg-midnight-50 text-midnight-300 border border-midnight-100',
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  )
}
