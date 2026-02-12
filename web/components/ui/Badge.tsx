//
//  Badge.tsx
//  
//
//  Created by Lindsey Drumm on 2/10/26.
//

import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'outline' | 'secondary' | 'accent' | 'success' | 'warning';
}
export function Badge({
  children,
  className,
  variant = 'default',
  ...props
}: BadgeProps) {
  const variants = {
    default: 'bg-slate-700 text-slate-200',
    outline: 'border border-slate-700 text-slate-300',
    secondary: 'bg-slate-800 text-slate-400',
    accent: 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20',
    success: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    warning: 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
  };
  return <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', variants[variant], className)} {...props}>
      {children}
    </span>;
}
