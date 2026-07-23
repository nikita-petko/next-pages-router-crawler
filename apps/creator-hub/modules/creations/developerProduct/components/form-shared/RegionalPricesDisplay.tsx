import { memo, useCallback, useMemo, useState } from 'react';
import { useWatch, type Control } from 'react-hook-form';
import { clsx } from '@rbx/foundation-ui';
import { useTranslation, withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import AllCountriesModal from '@modules/regional-pricing/components/AllCountriesModal/AllCountriesModal';
import TopCountriesTable from '@modules/regional-pricing/components/TopCountriesTable/TopCountriesTable';
import { useGetExperienceTopCountries } from '@modules/regional-pricing/queries/useGetExperienceTopCountries';
import { useGetRegionalPricingPreview } from '@modules/regional-pricing/queries/useGetRegionalPricingPreview';
import type {
  RegionalPriceDisplayInfo,
  AllCountriesDisplayInfo,
} from '@modules/regional-pricing/types';
import type { ConfigureDeveloperProductFormV2Values } from '../../types';

type Props = {
  universeId: number;
  control: Control<ConfigureDeveloperProductFormV2Values>;
  /** Whether to unmount the component when regional pricing is disabled @default true */
  shouldUnmount?: boolean;
  className?: string;
};

function RegionalPricesDisplay({ universeId, control, shouldUnmount = true, className }: Props) {
  const { translate } = useTranslation();

  const [isRegionalPricingEnabled, price, watchedIsForSale] = useWatch({
    name: ['isRegionalPricingEnabled', 'price', 'isForSale'],
    control,
  });

  // V2 callers don't drive `isForSale` from the form (it stays null), so fall back to the
  // legacy `price > 0` heuristic when `shouldUnmount` is true. V3 callers explicitly drive
  // `isForSale` and pass `shouldUnmount={false}` so the table stays mounted (dimmed).
  const isForSale = shouldUnmount ? price !== null && price > 0 : !!watchedIsForSale;

  const { data: topCountries } = useGetExperienceTopCountries({ universeId });
  const { data: regionalPrices } = useGetRegionalPricingPreview(
    // oxlint-disable-next-line typescript/no-non-null-assertion -- guarded by enabled flag
    { universeId, productType: 'DeveloperProduct', price: price! },
    { enabled: price !== null && price > 0 && isRegionalPricingEnabled },
  );

  const [isAllCountriesRegionalPricingModalOpen, setIsAllCountriesRegionalPricingModalOpen] =
    useState(false);

  // TODO(jeminpark,VEO-228): fix regional prices table props here
  const topCountriesRegionalPriceDisplayInfo: RegionalPriceDisplayInfo[] = useMemo(() => {
    const regionalPricesMap = new Map<string, number>(
      regionalPrices?.map(({ country, price: regionalPrice }) => [country, regionalPrice]) ?? [],
    );

    return (topCountries ?? []).map((country) => {
      const regionalPrice = regionalPricesMap.get(country);
      let displayPrice = '';
      if (regionalPrice !== undefined) {
        displayPrice = regionalPrice.toString();
      } else {
        displayPrice = '--';
      }
      return { country, displayPrice };
    });
  }, [topCountries, regionalPrices]);

  const allCountriesDisplayInfo: AllCountriesDisplayInfo[] = useMemo(() => {
    return [
      {
        displayHeader: translate('Heading.AllCountriesTableRegionalPrice'),
        allCountriesDisplayInfo: (regionalPrices ?? []).map(({ country, price: regionalPrice }) => {
          return { country, displayPrice: regionalPrice.toString() };
        }),
      },
    ];
  }, [translate, regionalPrices]);

  const openAllCountriesRegionalPricingModal = useCallback(() => {
    setIsAllCountriesRegionalPricingModalOpen(true);
  }, []);

  if (!isRegionalPricingEnabled && shouldUnmount) {
    return null;
  }

  const isDimmed = !isForSale || !isRegionalPricingEnabled;

  return (
    <>
      <TopCountriesTable
        onViewAllCountries={openAllCountriesRegionalPricingModal}
        disableViewAllCountries={!isForSale}
        topCountriesData={topCountriesRegionalPriceDisplayInfo}
        isForSale={isForSale}
        className={clsx(!shouldUnmount && isDimmed && 'opacity-[0.5]', className)}
      />
      <AllCountriesModal
        isOpen={isAllCountriesRegionalPricingModalOpen}
        setOpen={setIsAllCountriesRegionalPricingModalOpen}
        allCountriesData={allCountriesDisplayInfo}
      />
    </>
  );
}

export default withTranslation(memo(RegionalPricesDisplay), [TranslationNamespace.RegionalPricing]);
