import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showText?: boolean;
}

const sizeClasses = {
  sm: 'w-8 h-8',
  md: 'w-12 h-12', 
  lg: 'w-16 h-16',
  xl: 'w-20 h-20'
};

const textSizeClasses = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg', 
  xl: 'text-xl'
};

export function Logo({ size = 'md', className = '', showText = true }: LogoProps) {
  const logoSize = sizeClasses[size];
  const textSize = textSizeClasses[size];

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className={`${logoSize} flex-shrink-0`}>
        <img 
          src="/logo-official.svg" 
          alt="EPIC-Q Logo" 
          className="w-full h-full object-contain"
        />
      </div>
      
      {showText && (
        <span className={`font-bold text-gray-900 ${textSize}`}>
          EPIC-Q
        </span>
      )}
    </div>
  );
}

export default Logo;
