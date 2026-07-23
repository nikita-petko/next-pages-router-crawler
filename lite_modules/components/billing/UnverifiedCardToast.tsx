import AlertToast from '@components/billing/AlertToast';
import { openCardVerificationDialog } from '@components/billing/dialogs/CardVerificationDialog';
import { TranslationNamespace } from '@constants/localization';
import { AlertToastLevel } from '@constants/toastConstants';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';
import { startPaymentProfileChallenge } from '@services/ads/paymentProfileChallengeService';
import { CaptureException } from '@utils/error';

interface UnverifiedCardToastProps {
  // Function to run after card verification modal is closed
  hasActiveChallenge: boolean;
  paymentProfileId: string;
  refreshFunc?: () => Promise<boolean>;
}

const UnverifiedCardToast = ({
  hasActiveChallenge = false,
  paymentProfileId,
  refreshFunc = () => Promise.resolve(true),
}: UnverifiedCardToastProps) => {
  const { translate: translateBilling } = useNamespacedTranslation(TranslationNamespace.Billing);
  const { translate: translateMisc } = useNamespacedTranslation(TranslationNamespace.Misc);
  // TODO: [4/17/23] Add loading state(probably a loading icon next to button) while new challenge is being made because it takes some time.
  const startNewChallenge = (): Promise<boolean> =>
    // startPaymentProfileChallenge returns a Promise, so we can directly use .then() and .catch()
    startPaymentProfileChallenge(paymentProfileId)
      .then(
        () => true, // Indicate success
      )
      .catch((error) => {
        // This catch block handles actual promise rejections (e.g., network errors, service down)
        CaptureException(error);
        // TODO: [4/14/23] Show error modal
        return false; // Indicate failure
      });
  const showCardVerificationModal = (profileId: string) => {
    let challengePromise: Promise<boolean>;

    if (hasActiveChallenge) {
      challengePromise = Promise.resolve(true);
    } else {
      challengePromise = startNewChallenge();
    }

    challengePromise
      .then((validChallenge) => {
        if (validChallenge) {
          openCardVerificationDialog({
            onDismiss: () => {
              refreshFunc()
                .then((updatedStatus) => {
                  if (!updatedStatus) {
                    CaptureException('Failed to update status after modal close.');
                  }
                })
                .catch((error) => {
                  CaptureException(error);
                });
            },
            paymentProfileId: profileId,
          });
        } else {
          CaptureException('Card verification challenge could not be started.');
        }
      })
      .catch((error) => {
        CaptureException(error);
      });
  };

  return (
    <AlertToast
      header={translateBilling('Heading.UnverifiedCard')}
      level={AlertToastLevel.Warning}
      onPrimaryButtonClick={() => showCardVerificationModal(paymentProfileId)}
      primaryButtonText={translateMisc('Action.Verify')}
      text={translateBilling('Warning.UntilCardVerifiedCantCreateAds')}
    />
  );
};

export default UnverifiedCardToast;
