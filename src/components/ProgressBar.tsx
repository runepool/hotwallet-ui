import React from 'react';

interface ProgressBarProps {
  value: number;
  max: number;
  type: 'ask' | 'bid';
}

export function ProgressBar({ value, max, type }: ProgressBarProps) {
  const percentage = Math.min((value / max) * 100, 100);
  
  return (
    <div className="w-full bg-gray-200 rounded-full h-2.5">
      <div
        className={`h-2.5 rounded-full ${
          type === 'ask' ? 'bg-red-500' : 'bg-green-500'
        }`}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}