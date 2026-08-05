import type { ReactNode } from 'react';
import { useCallback, useState, type FC } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { StatusCodes } from '@rbx/core';
import {
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogTitle,
  Icon,
  Toggle,
  Tooltip,
  TooltipTrigger,
} from '@rbx/foundation-ui';
import { useLocalization, useTranslation } from '@rbx/intl';
import { useAuthentication } from '@modules/authentication/providers';
import type { TransactionVariantEnum } from '@modules/clients/coreContentTransactions';
import coreContentTransactionClient from '@modules/clients/coreContentTransactions';
import getResponseFromError from '@modules/clients/utils/getResponseFromError';
import useGetUserBalanceQuery from '@modules/creations/placeThumbnails/hooks/useGetUserBalanceQuery';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { transactionStatusQueryKey } from '../hooks/useCoreContentTransactionStatus';
import useGetGroupBalanceQuery from '../hooks/useGetGroupBalanceQuery';
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
  groupId?: number;
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
  groupId,
}) => {
  const { translateWithNamespace } = useTranslation();
  const { locale } = useLocalization();
  const numberFormatter = new Intl.NumberFormat(locale ?? 'en-us');
  const queryClient = useQueryClient();
  const { user } = useAuthentication();
  const { data: userBalance } = useGetUserBalanceQuery(user?.id ?? 0);
  const { data: groupBalance } = useGetGroupBalanceQuery(groupId ?? 0);
  const [isDepositLoading, setIsDepositLoading] = useState(false);
  const [error, setError] = useState(PublishingFeeDialogErrorState.None);
  const [useGroupFunds, setUseGroupFunds] = useState(false);
  const activeBalance = useGroupFunds ? groupBalance : userBalance;
  const insufficientFunds = activeBalance != null && fee != null && activeBalance < fee;

  const payDeposit = useCallback(async () => {
    setIsDepositLoading(true);
    try {
      await coreContentTransactionClient.coreContentTransactionDeposit({
        universeId,
        coreContentTransactionDepositRequest: {
          variant,
          useGroupFunds,
        },
      });
      openSuccessSnackbar?.(
        translateWithNamespace(TranslationNamespace.AudienceReach, 'Description.PublishingFeePaid'),
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
  }, [
    universeId,
    variant,
    useGroupFunds,
    queryClient,
    onOpenChange,
    openSuccessSnackbar,
    translateWithNamespace,
  ]);

  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      if (newOpen) {
        setError(PublishingFeeDialogErrorState.None);
        setUseGroupFunds(false);
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
      closeLabel={translateWithNamespace(TranslationNamespace.AudienceReach, 'Action.Close')}>
      <DialogContent>
        <DialogBody className='flex flex-col gap-medium padding-large'>
          <DialogTitle className='text-heading-small margin-none'>{modalHeading}</DialogTitle>
          <PublishingFeeDialogErrorBanner
            error={insufficientFunds ? PublishingFeeDialogErrorState.InsufficientFunds : error}
          />
          {modalBody}
          {groupId && (
            <div className='flex items-center gap-xsmall'>
              <Toggle
                label={translateWithNamespace(
                  TranslationNamespace.AudienceReach,
                  'Label.PayWithGroupFunds',
                )}
                placement='Start'
                size='Medium'
                isChecked={useGroupFunds}
                onCheckedChange={setUseGroupFunds}
                isDisabled={fee != null && groupBalance != null && groupBalance < fee}
              />
              {fee != null && groupBalance != null && groupBalance < fee && (
                <Tooltip
                  position='right-center'
                  title={translateWithNamespace(
                    TranslationNamespace.AudienceReach,
                    'Heading.InsufficientRobux',
                  )}
                  description={translateWithNamespace(
                    TranslationNamespace.AudienceReach,
                    'Description.InsufficientRobux',
                  )}
                  delayDurationMs={0}>
                  <TooltipTrigger asChild>
                    <span className='flex items-center justify-center content-system-neutral'>
                      <Icon
                        name='icon-regular-circle-question'
                        size='Small'
                        aria-label={translateWithNamespace(
                          TranslationNamespace.AudienceReach,
                          'Heading.InsufficientRobux',
                        )}
                      />
                    </span>
                  </TooltipTrigger>
                </Tooltip>
              )}
            </div>
          )}
          <div className='flex flex-row gap-small'>
            <Button
              variant='Emphasis'
              size='Medium'
              className='width-full'
              isDisabled={insufficientFunds}
              isLoading={isDepositLoading}
              onClick={payDeposit}>
              {fee === null ? (
                translateWithNamespace(TranslationNamespace.AudienceReach, 'Action.Enroll')
              ) : (
                <span className='flex items-center justify-center gap-xsmall'>
                  <span>
                    {translateWithNamespace(TranslationNamespace.AudienceReach, 'Action.Pay')}
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
              {translateWithNamespace(TranslationNamespace.AudienceReach, 'Action.Cancel')}
            </Button>
          </div>
          {fee &&
            (groupId != null ? (
              <div className='flex flex-col gap-xsmall'>
                <div className='flex items-center gap-xsmall'>
                  <span className='text-body-medium'>
                    {translateWithNamespace(
                      TranslationNamespace.AudienceReach,
                      'Label.CurrentUserBalance',
                    )}
                    :
                  </span>
                  <Icon name='icon-regular-robux' size='Small' aria-label='Robux' />
                  <span className='text-body-medium'>
                    {numberFormatter.format(userBalance ?? 0)}
                  </span>
                </div>
                <div className='flex items-center gap-xsmall'>
                  <span className='text-body-medium'>
                    {translateWithNamespace(
                      TranslationNamespace.AudienceReach,
                      'Label.CurrentGroupBalance',
                    )}
                    :
                  </span>
                  <Icon name='icon-regular-robux' size='Small' aria-label='Robux' />
                  <span className='text-body-medium'>
                    {numberFormatter.format(groupBalance ?? 0)}
                  </span>
                </div>
              </div>
            ) : (
              <div className='flex items-center gap-xsmall'>
                <span className='text-body-medium'>
                  {translateWithNamespace(
                    TranslationNamespace.AudienceReach,
                    'Label.CurrentBalance',
                  )}
                  :
                </span>
                <Icon name='icon-regular-robux' size='Small' aria-label='Robux' />
                <span className='text-body-medium'>{numberFormatter.format(userBalance ?? 0)}</span>
              </div>
            ))}
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
};

export default TransactionDepositDialog;
