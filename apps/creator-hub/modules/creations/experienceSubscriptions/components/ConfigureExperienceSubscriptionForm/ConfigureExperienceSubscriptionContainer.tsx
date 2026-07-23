import { useRouter } from 'next/router';
import { useCallback, useState } from 'react';
import { useTranslation, withTranslation } from '@rbx/intl';
import { CircularProgress, Grid } from '@rbx/ui';
import FailureView from '@modules/miscellaneous/components/FailureView/FailureView';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useSettings } from '@modules/settings/SettingsProvider/SettingsProvider';
import useOverviewStyles from '../../../common/components/Overview.styles';
import useCurrentDeveloperProduct from '../../hooks/useCurrentExperienceSubscription';
import ConfigureExperienceSubscriptionForm from './ConfigureExperienceSubscriptionForm';
import ConfigureExperienceSubscriptionFormV2 from './ConfigureExperienceSubscriptionFormV2';

function ConfigureExperienceSubscriptionContainer() {
  const {
    classes: { emptyGrid },
  } = useOverviewStyles();
  const {
    experienceSubscriptionDetails,
    isExperienceSubscriptionLoading,
    canAccessExperienceSubscription,
    priceTierMap,
    revshareStatModelMap,
    refreshExperienceSubscriptionDetails,
  } = useCurrentDeveloperProduct();
  const { translate } = useTranslation();
  const { settings, isFetched } = useSettings();
  const router = useRouter();
  const [isInitializing, setIsInitializing] = useState<boolean>(true);

  const handleReload = useCallback(() => {
    router.reload();
  }, [router]);

  const refreshData = () => {
    setIsInitializing(false);
    refreshExperienceSubscriptionDetails();
  };

  if (isInitializing && isExperienceSubscriptionLoading) {
    return (
      <Grid container classes={{ root: emptyGrid }} justifyContent='center' alignItems='center'>
        <CircularProgress />
      </Grid>
    );
  }

  if (!experienceSubscriptionDetails) {
    return (
      <FailureView
        title={translate('Heading.FailedToLoadPage')}
        message={translate('Message.FailedToLoadPage')}
        buttonText={translate('Action.FailedToLoadPage')}
        onReload={handleReload}
      />
    );
  }

  return (
    <Grid container justifyContent='space-between' alignItems='center'>
      {isFetched && settings.enableDeveloperSubscriptionUpdateRevShareDemo ? (
        <ConfigureExperienceSubscriptionFormV2
          experienceSubscriptionDetailsInfo={experienceSubscriptionDetails}
          priceTierMap={priceTierMap}
          revshareStatModelMap={revshareStatModelMap}
          refreshData={refreshData}
          canAccessExperienceSubscription={canAccessExperienceSubscription}
        />
      ) : (
        <ConfigureExperienceSubscriptionForm
          experienceSubscriptionDetailsInfo={experienceSubscriptionDetails}
          priceTierMap={priceTierMap}
          refreshData={refreshData}
        />
      )}
    </Grid>
  );
}

export default withTranslation(ConfigureExperienceSubscriptionContainer, [
  TranslationNamespace.Creations,
  TranslationNamespace.Controls,
  TranslationNamespace.Error,
  TranslationNamespace.ConfigureItem,
  TranslationNamespace.ExperienceSubscriptions,
  TranslationNamespace.RegionalPricing,
]);
