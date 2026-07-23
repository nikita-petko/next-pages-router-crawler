import type { ReactNode } from 'react';
import { useCallback, useState, type FC } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { StatusCodes } from '@rbx/core';
import { Button, Dialog, DialogBody, DialogContent, DialogTitle, Icon } from '@rbx/foundation-ui';
import { useLocalization, useTranslation } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { useAuthentication } from '@modules/authentication/providers';
import type { TransactionVariantEnum } from '@modules/clients/coreContentTransactions';
import coreContentTransactionClient from '@modules/clients/coreContentTransactions';
import getResponseFromError from '@modules/clients/utils/getResponseFromError';
import useGetUserBalanceQuery from '@modules/creations/placeThumbnails/hooks/useGetUserBalanceQuery';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { transactionStatusQueryKey } from '../hooks/useCoreContentTransactionStatus';
import PublishingFeeDialogErrorBanner, {
  PublishingFeeDialogErrorState,
} from './PublishingFeeDialogErrorBanner';

interface TransactionDepositDialogProps {
  universeId: number;
  variant: TransactionVariantEnum;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  openSuccessSnackbar?: (message: string) => void;
  modalHeading: string;
  modalBody: ReactNode;
  fee: number | null;
}

const TransactionDepositDialog: FC<TransactionDepositDialogProps> = ({
  universeId,
  variant,
  open,
  onOpenChange,
  openSuccessSnackbar,
  modalHeading,
  modalBody,
  fee,
}) => {
  const { translate } = useTranslationWrapper(useTranslation());
  const { locale } = useLocalization();
  const numberFormatter = new Intl.NumberFormat(locale ?? 'en-us');
  const queryClient = useQueryClient();
  const { user } = useAuthentication();
  const { data: userBalance } = useGetUserBalanceQuery(user?.id ?? 0);
  const [isDepositLoading, setIsDepositLoading] = useState(false);
  const [error, setError] = useState(PublishingFeeDialogErrorState.None);
  const insufficientFunds = Boolean(userBalance && fee && userBalance < fee);

  const payDeposit = useCallback(async () => {
    setIsDepositLoading(true);
    try {
      await coreContentTransactionClient.coreContentTransactionDeposit({
        universeId,
        coreContentTransactionDepositRequest: {
          variant,
        },
      });
      openSuccessSnackbar?.(
        translate(
          translationKey('Description.PublishingFeePaid', TranslationNamespace.AudienceReach),
        ),
      );
      onOpenChange(false);
      await queryClient.invalidateQueries({
        queryKey: transactionStatusQueryKey(universeId, variant),
      });
    } catch (e) {
      const status = getResponseFromError(e)?.status;
      if (status === StatusCodes.PAYMENT_REQUIRED) {
        setError(PublishingFeeDialogErrorState.InsufficientFunds);
      } else {
        setError(PublishingFeeDialogErrorState.Unknown);
      }
    } finally {
      setIsDepositLoading(false);
    }
  }, [universeId, variant, queryClient, onOpenChange, openSuccessSnackbar, translate]);

  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      if (newOpen) {
        setError(PublishingFeeDialogErrorState.None);
      }
      onOpenChange(newOpen);
    },
    [onOpenChange],
  );

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
      size='Medium'
      isModal
      hasCloseAffordance
      closeLabel={translate(translationKey('Action.Close', TranslationNamespace.AudienceReach))}>
      <DialogContent>
        <DialogBody className='flex flex-col gap-medium padding-large'>
          <DialogTitle className='text-heading-small margin-none'>{modalHeading}</DialogTitle>
          <PublishingFeeDialogErrorBanner
            error={insufficientFunds ? PublishingFeeDialogErrorState.InsufficientFunds : error}
          />
          {modalBody}
          <div className='flex flex-row gap-small'>
            <Button
              variant='Emphasis'
              size='Medium'
              className='width-full'
              isDisabled={insufficientFunds}
              isLoading={isDepositLoading}
              onClick={payDeposit}>
              {fee === null ? (
                translate(translationKey('Action.Enroll', TranslationNamespace.AudienceReach))
              ) : (
                <span className='flex items-center justify-center gap-xsmall'>
                  <span>
                    {translate(translationKey('Action.Pay', TranslationNamespace.AudienceReach))}
                  </span>
                  <Icon name='icon-regular-robux' size='Small' aria-label='Robux' />
                  <span>{numberFormatter.format(fee)}</span>
                </span>
              )}
            </Button>
            <Button
              variant='Standard'
              size='Medium'
              className='width-full'
              onClick={() => onOpenChange(false)}>
              {translate(translationKey('Action.Cancel', TranslationNamespace.AudienceReach))}
            </Button>
          </div>
          {fee && (
            <div className='flex items-center gap-xsmall'>
              <span className='text-body-medium'>
                {translate(
                  translationKey('Label.CurrentBalance', TranslationNamespace.AudienceReach),
                )}
                :
              </span>
              <Icon name='icon-regular-robux' size='Small' aria-label='Robux' />
              <span className='text-body-medium'>{numberFormatter.format(userBalance ?? 0)}</span>
            </div>
          )}
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
};

export default TransactionDepositDialog;
