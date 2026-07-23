/* istanbul ignore file */
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
import { TableCell, TableRow } from '@rbx/ui';
import { Locale, useLocalization, useTranslation } from '@rbx/intl';
import { dashboard } from '@modules/miscellaneous/common/urls/creatorHub';
import { openRescheduleEventDialog } from '../../dialogs/RescheduleEventDialog';
import type { ManagedPricingEvent } from '../types';

type Props = {
  universeId: number;
  event: ManagedPricingEvent;
};

const getExperimentDetailsUrl = dashboard.getManagedPricingExperimentDetailsUrl;

const getExternalEventUrl = (universeId: number, event: ManagedPricingEvent) => {
  if (event.type !== 'price-test') {
    return undefined;
  }

  return getExperimentDetailsUrl(universeId, event.externalId);
};

const DATE_FORMAT_OPTIONS = {
  month: 'long', // 'long' for 'December', 'short' for 'Dec', 'numeric' for '12'
  day: 'numeric', // 'numeric' for '12', '2-digit' for '01'
  year: 'numeric', // 'numeric' for '2026', '2-digit' for '26'
} as const;

function EventStatusBadge({ status }: Pick<ManagedPricingEvent, 'status'>) {
  const { translate } = useTranslation();

  if (status === 'upcoming') {
    return <Badge label={translate('Label.Upcoming')} variant='Contrast' />;
  }
  if (status === 'completed') {
    return <Badge label={translate('Label.Completed')} variant='Neutral' />;
  }
  return null;
}

function formatPermilleToPercent(permille: number, locale?: Locale | null) {
  // 1. Convert permille to a base decimal (e.g., 101 -> 0.101)
  const decimalValue = permille / 1000;

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
  revenueImpactPermille,
  locale,
}: Pick<ManagedPricingEvent, 'revenueImpactPermille'> & { locale?: Locale | null }) {
  if (revenueImpactPermille === undefined) {
    return <span className='content-muted text-body-medium'>-</span>;
  }

  const formattedRevenueImpact = formatPermilleToPercent(revenueImpactPermille, locale);
  if (revenueImpactPermille > 0) {
    return (
      <Badge
        icon='icon-filled-arrow-wide-short-up'
        label={formattedRevenueImpact}
        variant='Success'
        aria-label={`${formattedRevenueImpact} lift in revenue`} // TODO: Translate
      />
    );
  }
  if (revenueImpactPermille < 0) {
    return (
      <Badge
        icon='icon-filled-arrow-wide-short-down'
        label={formattedRevenueImpact}
        variant='Alert'
        aria-label={`${formattedRevenueImpact} decrease in revenue`} // TODO: Translate
      />
    );
  }
  return <span className='content-muted text-body-medium'>NA</span>;
}

function MoreEventOptionsMenu({
  universeId,
  eventDetailsUrl,
  showReschedule,
}: {
  universeId: number;
  eventDetailsUrl?: string;
  showReschedule?: boolean;
}) {
  const { translate } = useTranslation();

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
        <Menu
          size='Medium'
          className='max-width-[calc(var(--radix-popover-content-available-width)-2rem)]'>
          <MenuSection>
            {eventDetailsUrl ? (
              <MenuItem asChild value='view-details' title={translate('Action.ViewDetails')}>
                <NextLink href={eventDetailsUrl} className='no-underline' />
              </MenuItem>
            ) : null}
            {showReschedule ? (
              <MenuItem
                value='reschedule'
                title={translate('Action.Reschedule')}
                onSelect={() => openRescheduleEventDialog(universeId)}
              />
            ) : null}
          </MenuSection>
        </Menu>
      </PopoverContent>
    </Popover>
  );
}

function PricingEventsTableRow({ universeId, event }: Props) {
  const { translate } = useTranslation();

  const { locale } = useLocalization();

  const eventDetailsUrl = getExternalEventUrl(universeId, event);

  const formattedDate = (event.endDate ?? event.startDate).toLocaleDateString(
    locale ?? undefined,
    DATE_FORMAT_OPTIONS,
  );

  return (
    <TableRow hover>
      <TableCell>
        {eventDetailsUrl ? (
          <NextLink
            href={eventDetailsUrl}
            className='content-emphasis text-body-medium no-underline hover:underline'>
            {translate('Label.PriceTest' /* TranslationNamespace.ManagedPricing */)}
          </NextLink>
        ) : (
          <span className='content-emphasis text-body-medium'>{event.type}</span>
        )}
      </TableCell>

      <TableCell>
        <span className='content-emphasis text-body-medium'>{formattedDate}</span>
      </TableCell>

      <TableCell>
        <EventStatusBadge status={event.status} />
      </TableCell>

      <TableCell>
        {event.itemsUpdated !== undefined ? (
          <span className='content-emphasis text-body-medium'>{event.itemsUpdated}</span>
        ) : (
          <span className='content-muted text-body-medium'>-</span>
        )}
      </TableCell>

      <TableCell>
        <RevenueImpactBadge revenueImpactPermille={event.revenueImpactPermille} locale={locale} />
      </TableCell>

      <TableCell padding='checkbox' align='center'>
        <MoreEventOptionsMenu
          universeId={universeId}
          eventDetailsUrl={eventDetailsUrl}
          showReschedule={event.status === 'upcoming'}
        />
      </TableCell>
    </TableRow>
  );
}

export default memo(PricingEventsTableRow);
