import { Fragment, memo, useCallback, useMemo, useState } from 'react';
import { useWatch, type Control } from 'react-hook-form';
import { useTranslation, withTranslation } from '@rbx/intl';
import type {
  RegionalPriceDisplayInfo,
  AllCountriesDisplayInfo,
} from '@modules/regional-pricing/types';
import TopCountriesTable from '@modules/regional-pricing/components/TopCountriesTable/TopCountriesTable';
import AllCountriesModal from '@modules/regional-pricing/components/AllCountriesModal/AllCountriesModal';
import { useGetExperienceTopCountries } from '@modules/regional-pricing/queries/useGetExperienceTopCountries';
import { useGetRegionalPricingPreview } from '@modules/regional-pricing/queries/useGetRegionalPricingPreview';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import type { ConfigureDeveloperProductFormV2Values } from '../../types';

type Props = {
  universeId: number;
  control: Control<ConfigureDeveloperProductFormV2Values>;
  className?: string;
};

function RegionalPricesDisplay({ universeId, control, className }: Props) {
  const { translate } = useTranslation();

  const [isRegionalPricingEnabled, price] = useWatch({
    name: ['isRegionalPricingEnabled', 'price'],
    control,
  });

  const { data: topCountries } = useGetExperienceTopCountries({ universeId });
  const { data: regionalPrices } = useGetRegionalPricingPreview(
    { universeId, productType: 'DeveloperProduct', price: price! },
    { enabled: price !== null && price > 0 && !!isRegionalPricingEnabled },
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

  const isForSale = price !== null && price > 0;

  const openAllCountriesRegionalPricingModal = useCallback(() => {
    setIsAllCountriesRegionalPricingModalOpen(true);
  }, []);

  if (!isRegionalPricingEnabled) {
    return null;
  }

  return (
    <Fragment>
      <TopCountriesTable
        onViewAllCountries={openAllCountriesRegionalPricingModal}
        disableViewAllCountries={!isForSale}
        topCountriesData={topCountriesRegionalPriceDisplayInfo}
        isForSale={isForSale}
        className={className}
      />
      <AllCountriesModal
        isOpen={isAllCountriesRegionalPricingModalOpen}
        setOpen={setIsAllCountriesRegionalPricingModalOpen}
        allCountriesData={allCountriesDisplayInfo}
      />
    </Fragment>
  );
}

export default withTranslation(memo(RegionalPricesDisplay), [TranslationNamespace.RegionalPricing]);
