
import React from 'react';

interface CardProps {
  children?: React.ReactNode;
  className?: string;
}

export function Card({ children, className = '' }: CardProps): React.ReactElement {
  return (
    <div className={`bg-white dark:bg-gray-800 shadow-lg dark:shadow-none rounded-xl p-6 border border-gray-100 dark:border-gray-700 transition-colors duration-300 ${className}`}>
      {children}
    </div>
  );
}
