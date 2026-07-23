import React, { FunctionComponent } from 'react';
import { useTranslation, withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { FrontendFlagName } from '@modules/toolboxService/toolboxFeatureManagement';
import { useToolboxServiceApiProvider } from '@modules/toolboxService/ToolboxServiceApiProvider';
import { CircularProgress, Grid } from '@rbx/ui';
import { useSettings } from '@modules/settings';
import getEligibilityNavigationSubitems from '../../hooks/getEligibilityNavigationSubitems';
import NestedSettingsHomeContainer from '../../components/NestedSettingsHomeContainer';

const EligibilityContainer: FunctionComponent<React.PropsWithChildren<unknown>> = () => {
  const { translate } = useTranslation();
  const { frontendFlags, loadingFrontendFlags } = useToolboxServiceApiProvider();
  const enableAudioDistributionOnboarding =
    frontendFlags[FrontendFlagName.FrontendFlagEnableAudioDistributionOnboarding];
  const { settings } = useSettings();

  if (loadingFrontendFlags) {
    return (
      <Grid container justifyContent='center' alignItems='center'>
        <CircularProgress />
      </Grid>
    );
  }

  const isPublishingPermissionsEnabled = settings.enableCoreContentStatusLabelLink ?? false;
  const eligibilityNavigationSubitems = getEligibilityNavigationSubitems(
    enableAudioDistributionOnboarding,
    true, // showExtendedServices
    !isPublishingPermissionsEnabled, // showPublicPublish
    isPublishingPermissionsEnabled, // showPublishingPermissions
  );

  return (
    <NestedSettingsHomeContainer
      description={translate('Description.EligibilitySettings')}
      directory='eligibility'
      items={eligibilityNavigationSubitems}
    />
  );
};

export default withTranslation(EligibilityContainer, [
  TranslationNamespace.MarketplaceOnboarding,
  TranslationNamespace.Navigation,
  TranslationNamespace.FiatPaidAccess,
  TranslationNamespace.AffiliateProgram,
  TranslationNamespace.PublicPublish,
]);
