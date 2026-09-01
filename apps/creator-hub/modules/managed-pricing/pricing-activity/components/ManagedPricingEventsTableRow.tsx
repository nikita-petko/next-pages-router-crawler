import { memo } from 'react';
import NextLink from 'next/link';
import {
  Badge,
  IconButton,
  Menu,
  MenuItem,
  MenuSection,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@rbx/foundation-ui';
import type { Locale } from '@rbx/intl';
import { useLocalization, useTranslation } from '@rbx/intl';
import { TableCell, TableRow } from '@rbx/ui';
import { dashboard } from '@modules/miscellaneous/urls/creatorHub';
import { Link } from '@modules/monetization-shared/link';
import EventStatusBadge from '../../common/EventStatusBadge';
import { openRescheduleEventDialog } from '../../dialogs/RescheduleEventDialog';
import type { ManagedPricingEvent } from '../../types';

type Props = {
  universeId: number;
  event: ManagedPricingEvent;
};

const getEventDetailsUrl = dashboard.getManagedPricingEventDetailsUrl;

const notAvailableText = 'NA'; // Intentionally hard-coded

const DATE_FORMAT_OPTIONS = {
  month: 'long', // 'long' for 'December', 'short' for 'Dec', 'numeric' for '12'
  day: 'numeric', // 'numeric' for '12', '2-digit' for '01'
  year: 'numeric', // 'numeric' for '2026', '2-digit' for '26'
} as const;

function formatEventDate(startTime: Date | null, endTime: Date | null, locale?: Locale | null) {
  if (startTime === null) {
    return '-';
  }
  return (endTime ?? startTime).toLocaleDateString(locale ?? undefined, DATE_FORMAT_OPTIONS);
}

function formatMicrosToPercent(micros: number, locale?: Locale | null) {
  // 1. Convert micros to a base decimal (e.g., 101000 -> 0.101)
  const decimalValue = micros / 1_000_000;

  // 2. Set up the formatter
  const formatter = new Intl.NumberFormat(locale ?? undefined, {
    style: 'percent',
    signDisplay: 'never', // Never show the sign
    minimumFractionDigits: 1, // Ensures at least 1 decimal place (e.g., 10.1%)
    maximumFractionDigits: 1, // Prevents it from going beyond 1 decimal place
  });

  // 3. Format and return
  return formatter.format(decimalValue);
}

function RevenueImpactBadge({
  revenueLiftMicros,
  locale,
}: Pick<ManagedPricingEvent, 'revenueLiftMicros'> & { locale?: Locale | null }) {
  const { translate } = useTranslation();
  if (revenueLiftMicros === null) {
    return <span className='content-muted text-body-medium'>-</span>;
  }

  const formattedRevenueImpact = formatMicrosToPercent(revenueLiftMicros, locale);
  if (revenueLiftMicros > 0) {
    return (
      <Badge
        icon='icon-filled-arrow-wide-short-up'
        label={formattedRevenueImpact}
        variant='Success'
        aria-label={translate('Label.AriaLabel.PercentageRevenueImpactLift', {
          percentImpact: formattedRevenueImpact /* TranslationNamespace.ManagedPricing */,
        })}
      />
    );
  }
  if (revenueLiftMicros < 0) {
    return (
      <Badge
        icon='icon-filled-arrow-wide-short-down'
        label={formattedRevenueImpact}
        variant='Alert'
        aria-label={translate('Label.AriaLabel.PercentageRevenueImpactDecrease', {
          percentImpact: formattedRevenueImpact /* TranslationNamespace.ManagedPricing */,
        })}
      />
    );
  }
  return <span className='content-muted text-body-medium'>{notAvailableText}</span>;
}

function MoreEventOptionsMenu({
  universeId,
  event,
  eventDetailsUrl,
  showReschedule,
}: {
  universeId: number;
  event: ManagedPricingEvent;
  eventDetailsUrl: string;
  showReschedule?: boolean;
}) {
  const { translate } = useTranslation();

  /* istanbul ignore next - defensive guard */
  if (!eventDetailsUrl && !showReschedule) {
    return null;
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <IconButton
          as='button'
          variant='Utility'
          size='Small'
          isCircular
          icon='icon-filled-three-dots-vertical'
          ariaLabel={translate('Action.MoreOptions')}
        />
      </PopoverTrigger>
      <PopoverContent side='bottom' align='end' ariaLabel={translate('Action.MoreOptions')}>
        <Menu size='Medium'>
          <MenuSection>
            {!!eventDetailsUrl && (
              <MenuItem asChild value='view-details' title={translate('Action.ViewDetails')}>
                <NextLink href={eventDetailsUrl} className='no-underline' />
              </MenuItem>
            )}

            {showReschedule && (
              <MenuItem
                value='reschedule'
                title={translate('Action.Reschedule')}
                onSelect={() =>
                  openRescheduleEventDialog({
                    universeId,
                    eventId: event.id,
                    eventStartTime: event.startTime,
                  })
                }
              />
            )}
          </MenuSection>
        </Menu>
      </PopoverContent>
    </Popover>
  );
}

function ManagedPricingEventsTableRow({ universeId, event }: Props) {
  const { translate } = useTranslation();

  const { locale } = useLocalization();

  const eventDetailsUrl = getEventDetailsUrl(universeId, event.id);

  const showProductCount = event.totalProductCount !== null || event.updatedProductCount !== null;

  return (
    <TableRow hover>
      <TableCell>
        {eventDetailsUrl ? (
          <Link href={eventDetailsUrl} color='Standard' className='text-body-medium'>
            {translate('Label.PriceTest' /* TranslationNamespace.ManagedPricing */)}
          </Link>
        ) : (
          // Temporary fallback for non-price test events
          <span className='content-emphasis text-body-medium'>
            {translate('Label.PriceTest' /* TranslationNamespace.ManagedPricing */)}
          </span>
        )}
      </TableCell>

      <TableCell>
        <span className='content-emphasis text-body-medium'>
          {formatEventDate(event.startTime, event.endTime, locale)}
        </span>
      </TableCell>

      <TableCell>
        <EventStatusBadge status={event.status} />
      </TableCell>

      <TableCell>
        {showProductCount ? (
          <span className='content-emphasis text-body-medium'>
            {event.updatedProductCount ?? event.totalProductCount}
          </span>
        ) : (
          <span className='content-muted text-body-medium'>-</span>
        )}
      </TableCell>

      <TableCell>
        <RevenueImpactBadge revenueLiftMicros={event.revenueLiftMicros} locale={locale} />
      </TableCell>

      <TableCell padding='checkbox' align='center'>
        <MoreEventOptionsMenu
          universeId={universeId}
          event={event}
          eventDetailsUrl={eventDetailsUrl}
          showReschedule={event.status === 'Upcoming'}
        />
      </TableCell>
    </TableRow>
  );
}

export default memo(ManagedPricingEventsTableRow);
