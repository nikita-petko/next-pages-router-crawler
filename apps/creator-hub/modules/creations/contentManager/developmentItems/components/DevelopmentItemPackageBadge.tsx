import type { FunctionComponent } from 'react';
import { clsx, Icon } from '@rbx/foundation-ui';

export type DevelopmentItemPackageBadgeProps = {
  label: string;
  size?: 'Medium' | 'Small';
};

const DevelopmentItemPackageBadge: FunctionComponent<DevelopmentItemPackageBadgeProps> = ({
  label,
  size = 'Small',
}) => (
  <span
    aria-label={label}
    className={clsx(
      'absolute flex items-center justify-center radius-small bg-surface-100 content-emphasis pointer-events-none',
      size === 'Medium'
        ? 'size-800 [bottom:var(--gap-small)] [right:var(--gap-small)]'
        : 'size-500 [bottom:var(--gap-xxsmall)] [right:var(--gap-xxsmall)]',
    )}
    // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- Foundation icons render as spans, so the package indicator needs image semantics.
    role='img'
    title={label}>
    <Icon aria-hidden name='icon-regular-chain-link' size={size} />
  </span>
);

export default DevelopmentItemPackageBadge;
