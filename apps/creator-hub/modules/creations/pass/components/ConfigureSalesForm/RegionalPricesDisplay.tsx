import { Fragment, memo, useCallback, useMemo, useState } from 'react';
import { useFormState, useWatch, type Control } from 'react-hook-form';
import { useTranslation, withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import type {
  RegionalPriceDisplayInfo,
  AllCountriesDisplayInfo,
} from '@modules/regional-pricing/types';
import TopCountriesTable from '@modules/regional-pricing/components/TopCountriesTable/TopCountriesTable';
import AllCountriesModal from '@modules/regional-pricing/components/AllCountriesModal/AllCountriesModal';
import { useGetExperienceTopCountries } from '@modules/regional-pricing/queries/useGetExperienceTopCountries';
import { useGetRegionalPricingPreview } from '@modules/regional-pricing/queries/useGetRegionalPricingPreview';
import type { ConfigureSalesFormValues } from '../form-shared/types';

type Props = {
  universeId: number;
  control: Control<ConfigureSalesFormValues>;
  className?: string;
};

function RegionalPricesDisplay({ universeId, control, className }: Props) {
  const { translate } = useTranslation();

  const [isAllCountriesRegionalPricingModalOpen, setIsAllCountriesRegionalPricingModalOpen] =
    useState(false);

  const [isForSale, isRegionalPricingEnabled, price] = useWatch({
    name: ['isForSale', 'isRegionalPricingEnabled', 'price'],
    control,
  });

  const { isValid: isValidPrice } = useFormState({ name: 'price', control });

  const { data: topCountries } = useGetExperienceTopCountries({ universeId });
  const { data: regionalPrices } = useGetRegionalPricingPreview(
    { universeId, productType: 'GamePass', price: price! },
    { enabled: price !== null && price > 0 && !!isRegionalPricingEnabled },
  );

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

  if (!isRegionalPricingEnabled) {
    return null;
  }

  return (
    <Fragment>
      <TopCountriesTable
        onViewAllCountries={openAllCountriesRegionalPricingModal}
        disableViewAllCountries={!isForSale || !isValidPrice}
        topCountriesData={topCountriesRegionalPriceDisplayInfo}
        isForSale={isForSale ?? false}
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
