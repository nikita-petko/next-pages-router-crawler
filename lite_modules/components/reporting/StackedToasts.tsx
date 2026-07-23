import { useRouter } from 'next/router';
import { useEffect } from 'react';

import GenericSnackBar from '@components/common/GenericSnackBar';
import { TranslationNamespace } from '@constants/localization';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';
import { useToastStore } from '@stores/toastStoreProvider';

const StackedToasts = () => {
  const { translate } = useNamespacedTranslation(TranslationNamespace.Report);
  const router = useRouter();
  const { isFromSuccessfulEmailVerification = false } = router.query;
  const {
    clearManageStackedToasts,
    setShowCancelSuccessful,
    setShowClaimPromotionError,
    setShowClaimPromotionSuccessful,
    setShowClaimPromotionWarning,
    showCancelSuccessful,
    showClaimPromotionError,
    showClaimPromotionSuccessful,
    showClaimPromotionWarning,
    showCreateSuccessful,
    showEditSuccessful,
  } = useToastStore();

  useEffect(() => () => clearManageStackedToasts(), [clearManageStackedToasts]);

  return (
    <>
      {isFromSuccessfulEmailVerification && (
        <GenericSnackBar message={translate('Message.EmailVerified')} severity='success' />
      )}
      {showCreateSuccessful && (
        <GenericSnackBar message={translate('Message.CampaignCreated')} severity='success' />
      )}
      {showEditSuccessful && (
        <GenericSnackBar message={translate('Message.EditSaved')} severity='success' />
      )}
      {showCancelSuccessful && (
        <GenericSnackBar
          message={translate('Message.CampaignCanceled')}
          onClose={() => setShowCancelSuccessful(false)}
          severity='success'
        />
      )}
      {showClaimPromotionSuccessful && (
        <GenericSnackBar
          message={translate('Message.AdCreditRedeemed')}
          onClose={() => setShowClaimPromotionSuccessful(false)}
          severity='success'
        />
      )}
      {showClaimPromotionWarning && (
        <GenericSnackBar
          message={translate('Message.AdCreditAlreadyClaimed')}
          onClose={() => setShowClaimPromotionWarning(false)}
          severity='warning'
        />
      )}
      {showClaimPromotionError && (
        <GenericSnackBar
          message={translate('Message.ErrorOccurred')}
          onClose={() => setShowClaimPromotionError(false)}
          severity='error'
        />
      )}
    </>
  );
};

export default StackedToasts;
