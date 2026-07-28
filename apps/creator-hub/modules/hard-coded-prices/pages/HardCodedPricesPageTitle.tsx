/* istanbul ignore file */
import { memo } from 'react';
import type { Locale } from '@rbx/intl';
import { useLocalization, useTranslation, withTranslation } from '@rbx/intl';
import { useIsManagedPricingAvailable } from '@modules/managed-pricing/hooks/useIsManagedPricingAvailable';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useUniverseId } from '@modules/monetization-shared/route/useUniverseId';
import PageTitle from '@modules/monetization-shared/title';
import { useUniversePermissions } from '@modules/react-query/organizations';
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
    .replaceAll(',', '');
}

function HardCodedPricesPageTitle() {
  const { translate } = useTranslation();
  const { universeId } = useUniverseId();

  const { data: permissions } = useUniversePermissions(universeId);
  const { data: isManagedPricingAvailable } = useIsManagedPricingAvailable(universeId);
  const { data: hardCodedPricesSummary } = useGetHardCodedPricesSummary(
    { universeId },
    { enabled: !!universeId },
  );

  const locale = useLocalization().locale ?? undefined;

  const hasPermission =
    permissions?.monetizeExperience === true || permissions?.viewAnalytics === true;
  if (!hasPermission || !isManagedPricingAvailable) {
    // Note: this is the title component, which will not be rendered under certain conditions
    return null;
  }

  return (
    <PageTitle
      titleKey='Heading.HardCodedPrices'
      subtitleKey='Description.HardCodedPricesSubtitle'
      subtitleLink='/docs/production/monetization/hard-coded-prices'
      actions={
        hardCodedPricesSummary?.lastScanned && (
          // Note(jeminpark): Temporarily increasing size from text-body-medium until title design migration
          <span className='text-body-large place-self-end content-muted text-no-wrap'>
            {translate('Message.LastScanned', {
              timestamp: formatDate(hardCodedPricesSummary.lastScanned, locale),
            })}
          </span>
        )
      }
      className='wrap !gap-y-xsmall !gap-x-large'
    />
  );
}

export default withTranslation(memo(HardCodedPricesPageTitle), [
  TranslationNamespace.Creations,
  TranslationNamespace.HardCodedPrices,
]);
