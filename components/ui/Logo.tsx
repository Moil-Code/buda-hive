import React from 'react';
import { cn } from '@/lib/utils';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showText?: boolean;
}

const Logo: React.FC<LogoProps> = ({ 
  size = 'md', 
  className,
  showText = true 
}) => {
  const sizeClasses = {
    sm: {
      container: 'w-8 h-8',
      text: 'text-base',
      icon: 'text-lg'
    },
    md: {
      container: 'w-12 h-12',
      text: 'text-xl',
      icon: 'text-2xl'
    },
    lg: {
      container: 'w-16 h-16',
      text: 'text-2xl',
      icon: 'text-3xl'
    }
  };

  const sizes = sizeClasses[size];

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div 
        className={cn(
          sizes.container,
          'rounded-xl bg-gradient-to-br from-buda-blue to-blue-600 flex items-center justify-center text-white font-bold shadow-lg',
          sizes.icon
        )}
      >
        B
      </div>
      {showText && (
        <span className={cn('font-bold text-gray-900', sizes.text)}>
          Buda Hive
        </span>
      )}
    </div>
  );
};

export default Logo;
