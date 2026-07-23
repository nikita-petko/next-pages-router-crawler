import { memo, useMemo } from 'react';
import type { ProductType } from '@rbx/client-price-experimentation-api/v1';
import { useTranslation } from '@rbx/intl';
import AllCountriesModal from '@modules/regional-pricing/components/AllCountriesModal/AllCountriesModal';
import { useGetRegionalPricingPreview } from '@modules/regional-pricing/queries/useGetRegionalPricingPreview';
import type { AllCountriesDisplayInfo } from '@modules/regional-pricing/types';

type Props = {
  isOpen: boolean;
  setOpen: (open: boolean) => void;
  universeId: number;
  productType: Exclude<ProductType, 'Invalid'>;
  currentPrice: number;
  optimizedPrice: number;
};

function ProductTableRegionalPricingModal({
  isOpen,
  setOpen,
  universeId,
  productType,
  currentPrice,
  optimizedPrice,
}: Props) {
  const { translate } = useTranslation();

  // Each api call is guaranteed to return all or nothing regional prices
  const { data: currentRegionalPrices, isPending: isLoadingCurrentRegionalPrices } =
    useGetRegionalPricingPreview(
      { universeId, price: currentPrice, productType },
      { enabled: isOpen },
    );

  const { data: optimizedRegionalPrices, isPending: isLoadingOptimizedRegionalPrices } =
    useGetRegionalPricingPreview(
      { universeId, price: optimizedPrice, productType },
      { enabled: isOpen },
    );

  const allCountriesData: AllCountriesDisplayInfo[] = useMemo(() => {
    if (
      currentRegionalPrices === undefined ||
      optimizedRegionalPrices === undefined ||
      currentRegionalPrices.length !== optimizedRegionalPrices.length ||
      currentRegionalPrices.length === 0
    ) {
      return [];
    }

    const currentPriceDisplayInfo: AllCountriesDisplayInfo = {
      displayHeader: translate('Heading.CurrentPrice'),
      allCountriesDisplayInfo: currentRegionalPrices.map(({ country, price }) => {
        return { country, displayPrice: price.toString() };
      }),
    };
    const optimizedPriceDisplayInfo: AllCountriesDisplayInfo = {
      displayHeader: translate('Heading.OptimizedPrice'),
      allCountriesDisplayInfo: optimizedRegionalPrices.map(({ country, price }) => {
        return { country, displayPrice: price.toString() };
      }),
    };
    return [currentPriceDisplayInfo, optimizedPriceDisplayInfo];
  }, [translate, currentRegionalPrices, optimizedRegionalPrices]);

  return (
    <AllCountriesModal
      isOpen={isOpen}
      setOpen={setOpen}
      loading={isLoadingCurrentRegionalPrices || isLoadingOptimizedRegionalPrices}
      allCountriesData={allCountriesData}
    />
  );
}

export default memo(ProductTableRegionalPricingModal);
