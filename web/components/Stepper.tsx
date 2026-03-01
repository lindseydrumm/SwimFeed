import React from 'react';

interface StepperProps {
  steps: string[];
  currentStep: number;
  className?: string;
}

export function Stepper({ steps, currentStep, className = '' }: StepperProps) {
  return (
    <div className={`flex items-center justify-center gap-2 ${className}`}>
      {steps.map((_, i) => (
        <div
          key={i}
          className={`h-2 rounded-full transition-all ${
            i <= currentStep ? 'bg-cyan-500 w-8' : 'bg-slate-700 w-2'
          }`}
        />
      ))}
    </div>
  );
}
