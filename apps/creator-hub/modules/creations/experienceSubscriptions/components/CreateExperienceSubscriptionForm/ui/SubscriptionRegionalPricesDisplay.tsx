import { Fragment, memo, useMemo, useState } from 'react';
import { useWatch, type Control } from 'react-hook-form';
import { useTranslation } from '@rbx/intl';
import { useCurrentGame } from '@modules/providers/game/GameProvider';
import type { AllCountriesDisplayInfo } from '@modules/regional-pricing/types';
import AllCountriesModal from '@modules/regional-pricing/components/AllCountriesModal/AllCountriesModal';
// eslint-disable-next-line no-restricted-imports -- removing barrel files
import { useGetRegionalPricingPreview } from '@modules/regional-pricing/queries/useGetRegionalPricingPreview';
import type { CreateSubscriptionFormType } from '../../../constants/CreateSubscriptionRegisterConstants';
import { MinimumRobuxPriceForSubscription } from '../../../constants/CreateSubscriptionRegisterConstants';

type SubscriptionRegionalPricesDisplayProps = {
  control: Control<CreateSubscriptionFormType>;
};

function SubscriptionRegionalPricesDisplay({ control }: SubscriptionRegionalPricesDisplayProps) {
  const { translate } = useTranslation();
  const { gameDetails } = useCurrentGame();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [isRegionalPricingEnabled, priceInRobux] = useWatch({
    name: ['isRegionalPricingEnabled', 'priceInRobux'],
    control,
  });

  const isValidPrice = priceInRobux >= MinimumRobuxPriceForSubscription;
  const universeId = gameDetails?.id;

  const { data: regionalPrices } = useGetRegionalPricingPreview(
    { universeId: universeId!, productType: 'DeveloperSubscriptionProduct', price: priceInRobux },
    { enabled: isValidPrice && isRegionalPricingEnabled && !!universeId },
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
    <Fragment>
      <button
        type='button'
        disabled={!isValidPrice}
        onClick={() => setIsModalOpen(true)}
        className='text-body-small content-default underline cursor-pointer disabled:opacity-50 disabled:cursor-default'
        style={{ background: 'none', border: 'none', padding: 0, outline: 'none' }}>
        {translate('Label.TopCountriesTableViewAllCountries')}
      </button>
      <AllCountriesModal
        isOpen={isModalOpen}
        setOpen={setIsModalOpen}
        allCountriesData={allCountriesDisplayInfo}
      />
    </Fragment>
  );
}

export default memo(SubscriptionRegionalPricesDisplay);
