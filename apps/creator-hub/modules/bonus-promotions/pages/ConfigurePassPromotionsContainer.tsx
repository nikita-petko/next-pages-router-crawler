import { useRouter } from 'next/router';
import { StatusCodes } from '@rbx/core';
import { useTranslation, withTranslation } from '@rbx/intl';
import { BonusOptInModerationStatus } from '@modules/clients/bonusItem';
import { useCurrentPass } from '@modules/creations/pass/contexts/PassContext';
import FailureView from '@modules/miscellaneous/components/FailureView/FailureView';
import ErrorPage from '@modules/miscellaneous/error/components/ErrorPage';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { ProgressCircleLoader } from '@modules/monetization-shared/loaders';
import { useUniversePermissions } from '@modules/react-query/organizations';
import ConfigurePromotionsForm from '../ConfigurePromotionsForm/ConfigurePromotionsForm';

type Props = {
  universeId: number;
  passId: number;
};

function ConfigurePassPromotionsContainer({ universeId, passId }: Props) {
  const router = useRouter();
  const { translate } = useTranslation();

  const { data: permissions, isLoading: isLoadingPermissions } = useUniversePermissions(universeId);

  const { passDetails, isPassLoading, passPromotionsStatus } = useCurrentPass();

  // Block promotions page access in Luobu environment
  if (process.env.buildTarget === 'luobu') {
    return <ErrorPage errorCode={StatusCodes.NOT_FOUND} />;
  }

  if (isPassLoading || isLoadingPermissions) {
    return <ProgressCircleLoader />;
  }

  if (!passDetails) {
    return (
      <FailureView
        title={translate('Heading.FailedToLoadPage')}
        message={translate('Message.FailedToLoadPage')}
        buttonText={translate('Action.FailedToLoadPage')}
        onReload={router.reload}
      />
    );
  }

  if (permissions?.monetizeExperience === false) {
    return <ErrorPage errorCode={StatusCodes.FORBIDDEN} />;
  }

  if (!passPromotionsStatus?.isEligible) {
    return null;
  }

  return (
    <ConfigurePromotionsForm
      universeId={universeId}
      passId={passId}
      isForPromotions={passPromotionsStatus?.isBonusOptedIn ?? false}
      isEligibleForPromotions={passPromotionsStatus?.isEligible ?? false}
      moderationStatus={
        passPromotionsStatus?.moderationStatus ?? BonusOptInModerationStatus.Unspecified
      }
    />
  );
}

export default withTranslation(ConfigurePassPromotionsContainer, [
  TranslationNamespace.ConfigureItem,
  TranslationNamespace.Passes,
  TranslationNamespace.Error,
]);
