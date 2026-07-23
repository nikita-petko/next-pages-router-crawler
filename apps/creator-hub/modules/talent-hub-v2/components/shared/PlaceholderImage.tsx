import React from 'react';
import { clsx } from '@rbx/foundation-ui';
import { RobloxIcon } from '@rbx/ui';

type PlaceholderImageProps = {
  size?: number;
  className?: string;
  landscape?: boolean;
};

const ICON_RATIO = 0.4;

const PlaceholderImage: React.FC<PlaceholderImageProps> = ({ size = 40, className, landscape }) => {
  const iconSize = landscape ? 72 : Math.max(16, Math.round(size * ICON_RATIO));

  const landscapeStyle: React.CSSProperties | undefined = landscape
    ? {
        width: '100%',
        aspectRatio: '16 / 9',
        borderRadius: 'var(--radius-medium) var(--radius-medium) 0 0',
      }
    : { width: size, height: size };

  return (
    <div
      className={clsx('flex items-center justify-center bg-shift-200 clip shrink-0', className)}
      style={landscapeStyle}
      aria-hidden>
      <RobloxIcon className='content-muted' style={{ width: iconSize, height: iconSize }} />
    </div>
  );
};

export default PlaceholderImage;
