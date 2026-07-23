import { type ComponentPropsWithoutRef, forwardRef, type ReactElement } from 'react';

import styles from '@components/common/Skeleton.module.css';

type SkeletonVariant = 'rectangular' | 'text';

interface SkeletonProps extends Omit<
  ComponentPropsWithoutRef<'span'>,
  'aria-label' | 'children' | 'role'
> {
  animate?: boolean;
  variant?: SkeletonVariant;
}

const variantClassNames: Record<SkeletonVariant, string> = {
  rectangular: 'radius-small',
  text: 'radius-small',
};

/**
 * Decorative loading placeholder for content whose final shape is known.
 * Supply dimensions with Foundation Tailwind classes so the placeholder
 * reserves the same space as the content it replaces.
 *
 * TODO: Replace this compatibility component with Foundation UI's Skeleton
 * once it is available:
 * https://roblox.atlassian.net/wiki/spaces/UB/pages/3437167231/Foundation+Web+Implementation+Plans
 */
const Skeleton = forwardRef<HTMLSpanElement, SkeletonProps>(
  ({ animate = true, className, variant = 'text', ...spanProps }, ref): ReactElement => (
    <span
      {...spanProps}
      aria-hidden='true'
      className={[
        'block relative clip',
        styles.skeleton,
        animate ? styles.animated : undefined,
        variantClassNames[variant],
        variant === 'text' ? styles.text : undefined,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      ref={ref}
    />
  ),
);

Skeleton.displayName = 'Skeleton';

export default Skeleton;
