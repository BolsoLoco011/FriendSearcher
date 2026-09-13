import React from 'react';

interface AppLogoProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  withGlow?: boolean;
  alt?: string;
}

const sizeMap = {
  xs: 'w-4 h-4',
  sm: 'w-6 h-6',
  md: 'w-8 h-8',
  lg: 'w-14 h-14',
  xl: 'w-20 h-20',
};

export const AppLogo: React.FC<AppLogoProps> = ({
  className = '',
  size = 'md',
  withGlow = false,
  alt = 'FriendSearcher'
}) => {
  return (
    <img
      src="/logo.svg"
      alt={alt}
      className={`object-contain shrink-0 transition-transform ${sizeMap[size]} ${
        withGlow ? 'drop-shadow-[0_0_10px_rgba(0,240,255,0.7)]' : 'drop-shadow-xs'
      } ${className}`}
    />
  );
};
