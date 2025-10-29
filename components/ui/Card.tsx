import React from 'react';

interface CardProps {
  // FIX: Made children optional to resolve TypeScript errors where the prop was incorrectly reported as missing.
  children?: React.ReactNode;
  className?: string;
}

export function Card({ children, className = '' }: CardProps): React.ReactElement {
  return (
    <div className={`bg-gray-800 shadow-lg rounded-lg p-6 border border-gray-700 ${className}`}>
      {children}
    </div>
  );
}