import { useTranslation, withTranslation } from '@rbx/intl';
import { useRouter } from 'next/router';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { CircularProgress, Grid } from '@rbx/ui';
import { FailureView } from '@modules/miscellaneous/common/components/FailureView';
import { useOverviewStyles } from '@modules/creations/common';
import CreateExperienceSubscriptionForm from './CreateExperienceSubscriptionForm';
import useCurrentExperienceSubscription from '../../hooks/useCurrentExperienceSubscription';
import { CreationLimit } from '../../constants/CreateSubscriptionRegisterConstants';
import ExperienceSubscriptionUnauthorizedView from '../ExperienceSubscriptionUnauthorizedView';
import useDevSubsInRobuxGate from '../../hooks/useDevSubsInRobuxGate';

function CreateExperienceSubscriptionContainer() {
  const {
    classes: { emptyGrid },
  } = useOverviewStyles();
  const {
    isExperienceSubscriptionLoading,
    usedSubscriptionNames,
    canAccessExperienceSubscription,
    priceTierMap,
    revshareStatModelMap,
  } = useCurrentExperienceSubscription();
  const { translate } = useTranslation();
  const router = useRouter();
  const shouldAdditionallyShowDevSubsInRobux = useDevSubsInRobuxGate();

  if (isExperienceSubscriptionLoading) {
    return (
      <Grid container classes={{ root: emptyGrid }} justifyContent='center' alignItems='center'>
        <CircularProgress />
      </Grid>
    );
  }

  if (!canAccessExperienceSubscription && !shouldAdditionallyShowDevSubsInRobux) {
    return <ExperienceSubscriptionUnauthorizedView showButton />;
  }

  if (usedSubscriptionNames.length >= CreationLimit) {
    return (
      <FailureView
        title={translate('Heading.CreationLimitExceeded')}
        message={translate('Message.SubscriptionLimitWarning', {
          number: CreationLimit.toString(),
        })}
        buttonText={translate('Action.BackToSubscriptions')}
        onReload={() => router.back()}
      />
    );
  }

  return (
    <Grid container justifyContent='space-between' alignItems='center'>
      <CreateExperienceSubscriptionForm
        priceTierMap={priceTierMap}
        revshareStatModelMap={revshareStatModelMap}
        usedSubscriptionNames={usedSubscriptionNames}
        canAccessExperienceSubscription={canAccessExperienceSubscription}
      />
    </Grid>
  );
}

export default withTranslation(CreateExperienceSubscriptionContainer, [
  TranslationNamespace.ConfigureItem,
  TranslationNamespace.ExperienceSubscriptions,
  TranslationNamespace.Error,
  TranslationNamespace.RegionalPricing,
]);
