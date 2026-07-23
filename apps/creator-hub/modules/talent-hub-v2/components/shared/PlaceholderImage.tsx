import React from 'react';
import { clsx } from '@rbx/foundation-ui';
import { RobloxIcon } from '@rbx/ui';
import styles from './Layout.module.css';

type PlaceholderImageProps = {
  size?: number;
  className?: string;
  landscape?: boolean;
  /** Large top-only radius (e.g. studio card banner); default landscape uses medium */
  landscapeBanner?: boolean;
};

function getSquareSizeClass(size: number): string {
  if (size >= 80) {
    return styles.placeholderSquareLarge;
  }
  if (size <= 32) {
    return styles.placeholderSquareSmall;
  }
  return styles.placeholderSquareMedium;
}

function getSquareIconClass(size: number): string {
  if (size >= 80) {
    return styles.placeholderIconLarge;
  }
  if (size <= 32) {
    return styles.placeholderIconSmall;
  }
  return styles.placeholderIconMedium;
}

function getContainerClass(
  landscape: boolean | undefined,
  landscapeBanner: boolean,
  size: number,
): string {
  if (landscape) {
    return landscapeBanner ? styles.placeholderLandscapeBanner : styles.placeholderLandscape;
  }
  return getSquareSizeClass(size);
}

const PlaceholderImage: React.FC<PlaceholderImageProps> = ({
  size = 40,
  className,
  landscape,
  landscapeBanner = false,
}) => {
  const containerClass = getContainerClass(landscape, landscapeBanner, size);
  const iconClass = landscape ? styles.placeholderIconLandscape : getSquareIconClass(size);

  return (
    <div
      className={clsx(
        'flex items-center justify-center bg-shift-200 clip shrink-0',
        containerClass,
        className,
      )}
      aria-hidden>
      <RobloxIcon className={clsx('content-muted', iconClass)} />
    </div>
  );
};

export default PlaceholderImage;
