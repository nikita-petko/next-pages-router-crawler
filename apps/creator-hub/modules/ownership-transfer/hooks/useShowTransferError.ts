import { useSnackbarAlert } from '@modules/miscellaneous/hooks';
import { useTranslation } from '@rbx/intl';

type TErrorCases =
  | 'createTransfer'
  | 'acceptTransfer'
  | 'rejectTransfer'
  | 'cancelTransfer'
  | 'acknowledgedTransfer';

const errorTranslationKeys: Record<TErrorCases, string> = {
  createTransfer: 'Error.FailedToInitiateTransferRequest',
  acceptTransfer: 'Error.FailedToAcceptTransferRequest',
  rejectTransfer: 'Error.FailedToDeclineTransferRequest',
  cancelTransfer: 'Error.FailedCancelRequest',
  acknowledgedTransfer: 'Error.FailedAcknowledgeTransfer',
};

const useShowTransferError = () => {
  const showSnackbarMessage = useSnackbarAlert();
  const { translate } = useTranslation();

  return (errorCase: TErrorCases) => {
    return showSnackbarMessage('error', translate(errorTranslationKeys[errorCase]), 'standard', {
      vertical: 'bottom',
      horizontal: 'center',
    });
  };
};
export default useShowTransferError;
