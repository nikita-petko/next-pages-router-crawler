import type { CSSProperties, MouseEventHandler } from 'react';
import { IconButton, clsx } from '@rbx/foundation-ui';

type LicenseCarouselArrowDirection = 'previous' | 'next';

interface LicenseCarouselArrowButtonProps {
  direction: LicenseCarouselArrowDirection;
  ariaLabel: string;
  onClick: MouseEventHandler<HTMLButtonElement>;
  className?: string;
  style?: CSSProperties;
  testId?: string;
  visible?: boolean;
}

const LicenseCarouselArrowButton = ({
  direction,
  ariaLabel,
  onClick,
  className,
  style,
  testId,
  visible = false,
}: LicenseCarouselArrowButtonProps) => {
  const icon =
    direction === 'previous'
      ? 'icon-regular-chevron-large-left'
      : 'icon-regular-chevron-large-right';

  return (
    <IconButton
      data-testid={testId}
      icon={icon}
      ariaLabel={ariaLabel}
      variant='OverMedia'
      size='Small'
      iconColor='Inverse'
      isCircular
      className={clsx('!bg-action-over-media transition-opacity', className)}
      style={{
        opacity: visible ? 1 : 0,
        ...style,
      }}
      onClick={onClick}
    />
  );
};

export default LicenseCarouselArrowButton;
