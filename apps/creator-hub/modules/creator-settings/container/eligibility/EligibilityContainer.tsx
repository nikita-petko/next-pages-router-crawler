import type { FunctionComponent } from 'react';
import React from 'react';
import { useTranslation, withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import NestedSettingsHomeContainer from '../../components/NestedSettingsHomeContainer';
import getEligibilityNavigationSubitems from '../../hooks/getEligibilityNavigationSubitems';

const EligibilityContainer: FunctionComponent<React.PropsWithChildren> = () => {
  const { translate } = useTranslation();
  const items = getEligibilityNavigationSubitems(true);

  return (
    <NestedSettingsHomeContainer
      description={translate('Description.EligibilitySettings')}
      directory='eligibility'
      items={items}
    />
  );
};

export default withTranslation(EligibilityContainer, [
  TranslationNamespace.MarketplaceOnboarding,
  TranslationNamespace.Navigation,
  TranslationNamespace.FiatPaidAccess,
  TranslationNamespace.AffiliateProgram,
  TranslationNamespace.PublicPublish,
  TranslationNamespace.DevEx,
]);
