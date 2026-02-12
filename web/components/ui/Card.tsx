//
//  Card.tsx
//  
//
//  Created by Lindsey Drumm on 2/10/26.
//

import React from 'react';
import { motion } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  animate?: boolean;
  delay?: number;
}
export function Card({
  children,
  className,
  animate = true,
  delay = 0,
  ...props
}: CardProps) {
  const baseClasses = 'bg-slate-800/50 backdrop-blur-md border border-slate-700/50 rounded-xl overflow-hidden shadow-lg';
  if (animate) {
    return <motion.div initial={{
      opacity: 0,
      y: 20
    }} animate={{
      opacity: 1,
      y: 0
    }} transition={{
      duration: 0.5,
      delay,
      ease: 'easeOut'
    }} className={cn(baseClasses, className)} {...props as any}>
        {children}
      </motion.div>;
  }
  return <div className={cn(baseClasses, className)} {...props}>
      {children}
    </div>;
}
export function CardHeader({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-6 border-b border-slate-700/50', className)} {...props}>
      {children}
    </div>;
}
export function CardTitle({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn('text-lg font-semibold text-white flex items-center gap-2', className)} {...props}>
      {children}
    </h3>;
}
export function CardContent({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-6', className)} {...props}>
      {children}
    </div>;
}
