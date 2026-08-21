import { useRouter } from 'next/router';
import { withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useCurrentGame } from '@modules/providers/game/GameProvider';
import ReferralRewardSubmissionForm from '../components/ReferralRewardSubmissionForm';

const ReferralRewardSubmissionContainer = () => {
  const router = useRouter();
  const { gameDetails } = useCurrentGame();
  const handleSuccess = () => {
    router.push(`/dashboard/creations/experiences/${gameDetails?.id}/referral-reward-details`);
  };

  return <ReferralRewardSubmissionForm onSuccess={handleSuccess} />;
};

export default withTranslation(ReferralRewardSubmissionContainer, [
  TranslationNamespace.Creations,
  TranslationNamespace.Controls,
  TranslationNamespace.Error,
  TranslationNamespace.ConfigureItem,
  TranslationNamespace.ReferralRewards,
]);
