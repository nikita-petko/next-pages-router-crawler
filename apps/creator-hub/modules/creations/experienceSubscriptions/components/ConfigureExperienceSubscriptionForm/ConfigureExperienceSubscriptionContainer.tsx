import { useCallback, useState } from 'react';
import { useRouter } from 'next/router';
import { useTranslation, withTranslation } from '@rbx/intl';
import { CircularProgress, Grid } from '@rbx/ui';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { FailureView } from '@modules/miscellaneous/common/components/FailureView';
import { useOverviewStyles } from '@modules/creations/common';
import { useSettings } from '@modules/settings';
import ConfigureExperienceSubscriptionForm from './ConfigureExperienceSubscriptionForm';
import ConfigureExperienceSubscriptionFormV2 from './ConfigureExperienceSubscriptionFormV2';
import useCurrentDeveloperProduct from '../../hooks/useCurrentExperienceSubscription';

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
