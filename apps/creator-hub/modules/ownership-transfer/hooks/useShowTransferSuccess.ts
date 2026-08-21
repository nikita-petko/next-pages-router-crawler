import { useTranslation } from '@rbx/intl';
import { useSnackbarAlert } from '@modules/miscellaneous/hooks';

type TSuccessCases =
  | 'createTransfer'
  | 'acceptTransfer'
  | 'rejectTransfer'
  | 'cancelTransfer'
  | 'acknowledgeTransfer';

const successTranslationKeys: Record<TSuccessCases, string> = {
  createTransfer: 'Label.OwnershipTransferRequestCreated',
  acceptTransfer: 'Label.OwnershipTransferRequestAccepted',
  rejectTransfer: 'Label.OwnershipTransferRequestRejected',
  cancelTransfer: 'Label.OwnershipTransferRequestCancelled',
  acknowledgeTransfer: 'Label.OwnershipTransferAcknowledgedExpired',
};

const useShowTransferSuccess = () => {
  const showSnackbarMessage = useSnackbarAlert();
  const { translate } = useTranslation();

  return (successCase: TSuccessCases) => {
    showSnackbarMessage('success', translate(successTranslationKeys[successCase]), 'standard', {
      vertical: 'bottom',
      horizontal: 'center',
    });
  };
};
export default useShowTransferSuccess;
