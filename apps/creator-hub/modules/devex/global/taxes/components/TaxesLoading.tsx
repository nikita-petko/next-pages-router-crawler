import type { FunctionComponent, ReactNode } from 'react';
import { ProgressCircle } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import TaxesPageStateLayout, { type TaxesPageStateContext } from './TaxesPageStateLayout';

type TaxesLoadingProps = {
  context?: TaxesPageStateContext;
  label?: ReactNode;
};

const TaxesLoading: FunctionComponent<TaxesLoadingProps> = ({ context, label }) => {
  const { tPendingTranslation } = useTranslationWrapper(useTranslation());
  const loadingAriaLabel = tPendingTranslation(
    'Loading tax information...',
    'Accessible label for a loading indicator in the DevEx tax experience.',
    translationKey(
      'Taxes.Description.LoadingTaxInformation',
      TranslationNamespace.TaxDocumentation,
    ),
  );

  return (
    <TaxesPageStateLayout context={context}>
      <ProgressCircle
        ariaLabel={loadingAriaLabel}
        size='Large'
        value={50}
        variant='Indeterminate'
      />
      {label && (
        <p className='text-title-large content-default text-align-x-center margin-none'>{label}</p>
      )}
    </TaxesPageStateLayout>
  );
};

export default TaxesLoading;
