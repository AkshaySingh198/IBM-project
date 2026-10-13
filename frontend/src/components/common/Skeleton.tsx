import React from 'react';

interface SkeletonProps {
  width?: string;
  height?: string;
  borderRadius?: string;
  style?: React.CSSProperties;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = '1.25rem',
  borderRadius = 'var(--radius-sm)',
  style,
}) => {
  return (
    <div
      style={{
        width,
        height,
        borderRadius,
        backgroundColor: 'var(--neutral-bg)',
        animation: 'pulseSkeleton 1.5s ease-in-out infinite',
        ...style,
      }}
    />
  );
};
