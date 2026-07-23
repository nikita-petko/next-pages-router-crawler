import type { FunctionComponent } from 'react';
import React, { useMemo } from 'react';
import { useFlag } from '@rbx/flags';
import { useTranslation, withTranslation } from '@rbx/intl';
import { showDevExO18LandingPage } from '@generated/flags/creatorBusiness';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import NestedSettingsHomeContainer from '../../components/NestedSettingsHomeContainer';
import { EligibilityType } from '../../constants/eligibilityConstants';
import getEligibilityNavigationSubitems from '../../hooks/getEligibilityNavigationSubitems';

const EligibilityContainer: FunctionComponent<React.PropsWithChildren> = () => {
  const { translate } = useTranslation();
  const { value: showDevExO18LandingPageEnabled, ready: isDevExO18FlagReady } =
    useFlag(showDevExO18LandingPage);

  const items = useMemo(() => {
    const showDevExO18NavItem = isDevExO18FlagReady && (showDevExO18LandingPageEnabled ?? false);

    return getEligibilityNavigationSubitems(true).filter(
      (item) => showDevExO18NavItem || item.key !== EligibilityType.UsO18DevexRate,
    );
  }, [isDevExO18FlagReady, showDevExO18LandingPageEnabled]);

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
