import type { FunctionComponent } from 'react';
import { useTranslation, withTranslation } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

const TaxesPageTitle: FunctionComponent = () => {
  const { tPendingTranslation } = useTranslationWrapper(useTranslation());
  const title = tPendingTranslation(
    'Taxes',
    'Page title / navigation label for the DevEx taxes page.',
    translationKey('Heading.Taxes', TranslationNamespace.TaxDocumentation),
  );

  return <h1 className='text-heading-large margin-none'>{title}</h1>;
};

export default withTranslation(TaxesPageTitle, [TranslationNamespace.TaxDocumentation]);
