import { useRouter } from 'next/router';
import { useTranslation, withTranslation } from '@rbx/intl';
import { CircularProgress, Grid } from '@rbx/ui';
import FailureView from '@modules/miscellaneous/components/FailureView/FailureView';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import useOverviewStyles from '../../../common/components/Overview.styles';
import { CreationLimit } from '../../constants/CreateSubscriptionRegisterConstants';
import useCurrentExperienceSubscription from '../../hooks/useCurrentExperienceSubscription';
import CreateExperienceSubscriptionForm from './CreateExperienceSubscriptionForm';

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

  if (isExperienceSubscriptionLoading) {
    return (
      <Grid container classes={{ root: emptyGrid }} justifyContent='center' alignItems='center'>
        <CircularProgress />
      </Grid>
    );
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
