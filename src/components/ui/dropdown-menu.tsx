'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface DropdownMenuProps {
  trigger: React.ReactNode
  children: React.ReactNode
  className?: string
  align?: 'left' | 'right'
}

export function DropdownMenu({ trigger, children, className, align = 'left' }: DropdownMenuProps) {
  const [open, setOpen] = React.useState(false)
  const ref = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  return (
    <div ref={ref} className={cn('relative inline-block', className)}>
      <div onClick={() => setOpen((v) => !v)}>{trigger}</div>
      {open && (
        <div
          className={cn(
            'absolute z-50 mt-1 min-w-[10rem] rounded-brand border border-[var(--border)] bg-white shadow-md py-1',
            align === 'right' ? 'right-0' : 'left-0',
          )}
        >
          {children}
        </div>
      )}
    </div>
  )
}

type DropdownMenuItemProps = React.ButtonHTMLAttributes<HTMLButtonElement>

export function DropdownMenuItem({ className, ...props }: DropdownMenuItemProps) {
  return (
    <button
      type="button"
      className={cn(
        'flex w-full items-center px-3 py-2 text-sm text-midnight hover:bg-[var(--muted)] transition-colors',
        className,
      )}
      {...props}
    />
  )
}

export function DropdownMenuSeparator() {
  return <div className="my-1 h-px bg-[var(--border)]" />
}

type DropdownMenuLabelProps = React.HTMLAttributes<HTMLDivElement>

export function DropdownMenuLabel({ className, ...props }: DropdownMenuLabelProps) {
  return (
    <div
      className={cn('px-3 py-1.5 text-xs font-semibold text-[var(--muted-foreground)]', className)}
      {...props}
    />
  )
}
