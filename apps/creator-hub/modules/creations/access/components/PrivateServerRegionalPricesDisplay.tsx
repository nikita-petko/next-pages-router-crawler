import { memo, useMemo, useState } from 'react';
import { useFormState, useWatch } from 'react-hook-form';
import { Button } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { InfoOutlinedIcon, Tooltip } from '@rbx/ui';
import AllCountriesModal from '@modules/regional-pricing/components/AllCountriesModal/AllCountriesModal';
import { useGetRegionalPricingPreview } from '@modules/regional-pricing/queries/useGetRegionalPricingPreview';
import type { AllCountriesDisplayInfo } from '@modules/regional-pricing/types';
import type { ExperienceAccessFormType } from '../ExperienceAccessTypes';

type Props = {
  universeId: number;
  minimumPrice: number;
};

function PrivateServerRegionalPricesDisplay({ universeId, minimumPrice }: Props) {
  const { translate } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { errors } = useFormState<ExperienceAccessFormType>({
    name: 'privateServerPrice',
  });
  const currentPrice = useWatch<ExperienceAccessFormType, 'privateServerPrice'>({
    name: 'privateServerPrice',
  });

  const priceValue = currentPrice ? parseInt(String(currentPrice), 10) : 0;
  const hasValidPrice = priceValue >= minimumPrice && !errors.privateServerPrice;

  const { data: regionalPrices, isLoading: isLoadingRegionalPrices } = useGetRegionalPricingPreview(
    { universeId, productType: 'PrivateServer', price: priceValue },
    { enabled: hasValidPrice },
  );

  const allCountriesDisplayInfo: AllCountriesDisplayInfo[] = useMemo(() => {
    if (!regionalPrices || regionalPrices.length === 0) {
      return [];
    }

    const countries = regionalPrices.map(({ country, price }) => ({
      country,
      displayPrice: price.toString(),
    }));

    return [
      {
        displayHeader: translate('Heading.AllCountriesTableRegionalPrice'),
        allCountriesDisplayInfo: countries,
      },
    ];
  }, [translate, regionalPrices]);

  return (
    <>
      <div className='flex items-center gap-x-xsmall no-wrap padding-x-xxlarge padding-bottom-small'>
        <span className='text-body-small content-default text-no-wrap'>
          {translate('Label.RegionalPricingIsEnabled')}
        </span>
        <Tooltip title={translate('Tooltip.EnableRegionalPricingDetailed')} placement='right' arrow>
          <InfoOutlinedIcon fontSize='small' />
        </Tooltip>
        <Button
          variant='Link'
          size='Small'
          isDisabled={!hasValidPrice}
          onClick={() => setIsModalOpen(true)}>
          {translate('Label.ViewRegionalPrices')}
        </Button>
      </div>
      <AllCountriesModal
        isOpen={isModalOpen}
        setOpen={setIsModalOpen}
        loading={isLoadingRegionalPrices}
        allCountriesData={allCountriesDisplayInfo}
      />
    </>
  );
}

export default memo(PrivateServerRegionalPricesDisplay);
