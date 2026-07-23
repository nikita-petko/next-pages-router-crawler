/* istanbul ignore file */
import { memo } from 'react';
import { Badge } from '@rbx/foundation-ui';
import type { Locale } from '@rbx/intl';
import { useLocalization, useTranslation, withTranslation } from '@rbx/intl';
import TranslationNamespace from '@modules/miscellaneous/localization/enums/TranslationNamespace';
import { useEventId } from '@modules/monetization-shared/route/useEventId';
import { useUniverseId } from '@modules/monetization-shared/route/useUniverseId';
import PageTitle from '@modules/monetization-shared/title';
import { useUniversePermissions } from '@modules/react-query/organizations';
import EventStatusBadge from '../common/EventStatusBadge';
import { openRescheduleEventDialog } from '../dialogs/RescheduleEventDialog';
import { openStopAndRescheduleWarningDialog } from '../dialogs/StopAndRescheduleWarningDialog';
import { useGetManagedPricingEvent } from '../queries/useGetManagedPricingEvent';
import type { ManagedPricingEvent } from '../types';

const EVENT_TYPE_TITLE_KEYS = {
  PriceTest: 'Label.PriceTest',
} satisfies Record<ManagedPricingEvent['eventType'], `Label.${string}`>;

function formatDate(date: Date, locale: Locale | null): string {
  return date.toLocaleDateString(locale ?? undefined, {
    month: 'numeric',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatEventDateRange(startTime: Date | null, endTime: Date | null, locale: Locale | null) {
  if (startTime === null) {
    return null;
  }

  return endTime
    ? `${formatDate(startTime, locale)} - ${formatDate(endTime, locale)}`
    : formatDate(startTime, locale);
}

/**
 * Title for the Managed Pricing Event Details page
 * Note this is dynamic based on the event type and status
 */
function ManagedPricingEventDetailsPageTitle() {
  const { translate } = useTranslation();
  const { locale } = useLocalization();
  const { universeId } = useUniverseId();
  const { eventId } = useEventId();

  const { data: permissions } = useUniversePermissions(universeId);
  const { data: event } = useGetManagedPricingEvent({ universeId, eventId });

  const hasPermission =
    permissions?.monetizeExperience === true || permissions?.viewAnalytics === true;
  if (!hasPermission || !event || !universeId || !eventId) {
    // Note: this is the title component, which will not be rendered under certain conditions
    return null;
  }

  const dateRangeLabel = formatEventDateRange(event.startTime, event.endTime, locale);

  const shouldShowReschedule = event.status === 'Upcoming' || event.status === 'Active';

  const handleRescheduleClick = () => {
    if (event.status === 'Active') {
      openStopAndRescheduleWarningDialog({ universeId, eventId, eventStartTime: event.startTime });
    } else {
      openRescheduleEventDialog({ universeId, eventId, eventStartTime: event.startTime });
    }
  };

  const actionLabel =
    event.status === 'Active'
      ? translate('Action.StopAndReschedule')
      : translate('Action.Reschedule');

  return (
    <PageTitle
      title={
        <div className='flex wrap items-center gap-medium medium:gap-xlarge'>
          <h1 className='text-heading-large text-no-wrap margin-none'>
            {translate(EVENT_TYPE_TITLE_KEYS[event.eventType])}
          </h1>
          <span className='flex gap-medium medium:gap-xlarge'>
            <EventStatusBadge status={event.status} />
            {dateRangeLabel && <Badge variant='Neutral' label={dateRangeLabel} />}
          </span>
        </div>
      }
      actionProps={
        shouldShowReschedule
          ? {
              variant: 'Standard',
              isDisabled: !permissions?.monetizeExperience,
              onClick: handleRescheduleClick,
              children: actionLabel,
              className: 'width-full medium:width-fit', // Custom responsive layout for this title action
            }
          : undefined
      }
      className={shouldShowReschedule ? 'wrap' : undefined} // TODO: revisiting this once we iterate on creator hub layout
    />
  );
}

export default withTranslation(memo(ManagedPricingEventDetailsPageTitle), [
  TranslationNamespace.ManagedPricing,
]);
