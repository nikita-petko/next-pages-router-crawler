import NextLink from 'next/link';
import type { TBadgeProps, TIconProps } from '@rbx/foundation-ui';
import { Badge, Button, clsx, Icon } from '@rbx/foundation-ui';
import { Skeleton } from '@rbx/ui';
import { Tooltip } from '@modules/monetization-shared/tooltip';

type BadgeProps =
  | { badgeProps?: TBadgeProps; badge?: never }
  | { badgeProps?: never; badge: React.ReactNode };

type Props = BadgeProps & {
  label: string;
  content: string;
  icon?: TIconProps;
  hint?: string;
  tooltip?: string;
  className?: string;
  href?: string;
  loading?: boolean;
};

const outerContainerClassName = 'bg-surface-100 !padding-large radius-medium';
// Button comes with custom styling, some if which needs to be overridden
const buttonOverrideClassName = 'height-min !justify-start [&_span_span]:padding-y-none';
const innerContainerClassName = 'inline-flex flex-col gap-small';

function ManagedPricingCard({
  label,
  content,
  icon,
  badgeProps,
  badge,
  hint,
  tooltip,
  className,
  href,
  loading,
}: Props) {
  if (loading) {
    return (
      <div className={clsx(outerContainerClassName, innerContainerClassName, className)}>
        <Skeleton animate variant='text' height={14} width={140} />
        <Skeleton
          animate
          variant='rectangular'
          height={28}
          width={badgeProps || badge ? 180 : 120}
        />
        {hint && <Skeleton animate variant='text' height={20} width={160} />}
      </div>
    );
  }

  const cardContent = (
    <>
      <div className='flex items-center gap-xsmall'>
        <span className={clsx('text-label-medium content-default', href && 'underline')}>
          {label}
        </span>
        {tooltip && (
          <Tooltip
            title={label}
            description={tooltip}
            position='top-center'
            contentClassName='text-wrap'>
            <Icon name='icon-regular-circle-i' size='Small' />
          </Tooltip>
        )}
      </div>

      <div className='flex items-center gap-small'>
        {icon && <Icon size='Large' {...icon} />}
        <span className='text-heading-medium content-emphasis'>{content}</span>
        {badgeProps ? <Badge {...badgeProps} /> : badge}
      </div>
      {hint && <span className='text-body-medium content-default'>{hint}</span>}
    </>
  );

  if (href) {
    // Wrap with a button to get button semantics like hover and focus states
    return (
      <Button asChild className={clsx(outerContainerClassName, buttonOverrideClassName, className)}>
        <NextLink href={href}>
          <div className={innerContainerClassName}>{cardContent}</div>
        </NextLink>
      </Button>
    );
  }

  return (
    <div className={clsx(outerContainerClassName, innerContainerClassName, className)}>
      {cardContent}
    </div>
  );
}

export default ManagedPricingCard;
