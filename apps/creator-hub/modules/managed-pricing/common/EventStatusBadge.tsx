import { Badge, type TBadgeVariant } from '@rbx/foundation-ui';
import { useTranslationWithNamespace } from '@rbx/intl';
import TranslationNamespace from '@modules/miscellaneous/localization/enums/TranslationNamespace';
import type { ManagedPricingEvent } from '../types';

const STATUS_LABEL_KEYS = {
  Upcoming: 'Label.Upcoming',
  Active: 'Label.InProgress',
  Completed: 'Label.Completed',
  Cancelled: 'Label.Cancelled',
  Failed: 'Label.Failed',
} satisfies Record<ManagedPricingEvent['status'], `Label.${string}`>;

const STATUS_BADGE_VARIANTS = {
  Upcoming: 'Contrast',
  Active: 'Success',
  Completed: 'Neutral',
  Cancelled: 'Neutral',
  Failed: 'Alert',
} satisfies Record<ManagedPricingEvent['status'], TBadgeVariant>;

type Props = Pick<ManagedPricingEvent, 'status'> & {
  /** Override for default variant for the event */
  variant?: TBadgeVariant;
  className?: string;
};

function EventStatusBadge({ status, variant, className }: Props) {
  const { translate } = useTranslationWithNamespace(TranslationNamespace.ManagedPricing);
  return (
    <Badge
      variant={variant ?? STATUS_BADGE_VARIANTS[status]}
      label={translate(STATUS_LABEL_KEYS[status])}
      className={className}
    />
  );
}

export default EventStatusBadge;
