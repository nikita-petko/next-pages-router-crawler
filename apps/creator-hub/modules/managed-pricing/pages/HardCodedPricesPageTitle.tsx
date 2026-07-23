/* istanbul ignore file */
import React, { memo } from 'react';
import { useUniversePermissions } from '@modules/react-query/organizations';
import PageTitle from '@modules/monetization-shared/title';
import { useUniverseId } from '@modules/monetization-shared/route/useUniverseId';
import { Locale, useLocalization } from '@rbx/intl';
import { useGetManagedPricingStatus } from '../queries/useGetManagedPricingStatus';
import { useGetHardCodedPricesSummary } from '../queries/useGetHardCodedPricesSummary';

const DATE_FORMAT_OPTIONS = {
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: true,
  timeZoneName: 'shortGeneric',
} as const satisfies Intl.DateTimeFormatOptions;

/** Formats a date to a string in the format of "MM/DD h:mm AM/PM TZ */
function formatDate(date: Date, locale?: Locale | null) {
  return new Intl.DateTimeFormat(locale ?? undefined, DATE_FORMAT_OPTIONS)
    .format(date)
    .replace(/,/g, '');
}

function HardCodedPricesPageTitle() {
  const { universeId } = useUniverseId();

  const { data: permissions } = useUniversePermissions(universeId);
  const { data: managedPricingStatus } = useGetManagedPricingStatus(universeId, {
    enabled: !!universeId,
  });
  const { data: hardCodedPricesSummary } = useGetHardCodedPricesSummary(
    { universeId },
    { enabled: !!universeId },
  );

  const locale = useLocalization().locale ?? undefined;

  const shouldShowPageContent = managedPricingStatus?.status === 'Accepted';

  const hasPermission = permissions?.monetizeExperience || permissions?.viewAnalytics;
  if (!hasPermission || !shouldShowPageContent) {
    // Note: this is the title component, which will not be rendered under certain conditions
    return null;
  }

  return (
    <PageTitle
      titleKey='Heading.HardCodedPrices'
      subtitleKey='Description.HardCodedPricesSubtitle'
      subtitleLink='/docs/production/monetization/hard-coded-prices'
      actions={
        hardCodedPricesSummary && (
          <span className='place-self-end padding-bottom-xsmall content-muted text-no-wrap'>
            Last scanned: {formatDate(hardCodedPricesSummary.lastScanned, locale)}
          </span>
        )
      }
      className='wrap !gap-y-xsmall !gap-x-large'
    />
  );
}

export default memo(HardCodedPricesPageTitle);
