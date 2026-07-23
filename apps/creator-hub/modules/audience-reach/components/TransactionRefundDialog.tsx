import { useCallback, useState, type FC } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogTitle,
  FeedbackBanner,
  Icon,
} from '@rbx/foundation-ui';
import { useLocalization, useTranslation } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TransactionVariantEnum } from '@modules/clients/coreContentTransactions';
import coreContentTransactionClient from '@modules/clients/coreContentTransactions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { ExpeditedReviewFee } from '../constants/audienceReachConstants';
import { transactionStatusQueryKey } from '../hooks/useCoreContentTransactionStatus';

interface TransactionRefundDialogProps {
  universeId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  openSuccessSnackbar?: (message: string) => void;
}

const TransactionRefundDialog: FC<TransactionRefundDialogProps> = ({
  universeId,
  open,
  onOpenChange,
  openSuccessSnackbar,
}) => {
  const { translate } = useTranslationWrapper(useTranslation());
  const { locale } = useLocalization();
  const numberFormatter = new Intl.NumberFormat(locale ?? 'en-us');
  const queryClient = useQueryClient();
  const [isRefundLoading, setIsRefundLoading] = useState(false);
  const [error, setError] = useState(false);

  const requestRefund = useCallback(async () => {
    setIsRefundLoading(true);
    setError(false);
    try {
      await coreContentTransactionClient.coreContentTransactionRefund({
        universeId,
        variant: TransactionVariantEnum.Expedited, // This is hard coded because at the moment it's the only use case
      });
      openSuccessSnackbar?.(
        translate(
          translationKey('Message.RefundRequestSuccessful', TranslationNamespace.AudienceReach),
        ),
      );
      onOpenChange(false);
      await queryClient.invalidateQueries({
        queryKey: transactionStatusQueryKey(universeId, TransactionVariantEnum.Expedited),
      });
    } catch {
      setError(true);
    } finally {
      setIsRefundLoading(false);
    }
  }, [universeId, queryClient, onOpenChange, openSuccessSnackbar, translate]);

  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      setError(false);
      onOpenChange(newOpen);
    },
    [onOpenChange],
  );

  const handleClose = useCallback(() => handleOpenChange(false), [handleOpenChange]);

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
          <DialogTitle className='text-heading-small margin-none'>
            {translate(
              translationKey(
                'Heading.ExpeditedReviewRefundModal',
                TranslationNamespace.AudienceReach,
              ),
            )}
          </DialogTitle>
          {error && (
            <FeedbackBanner
              title={translate(
                translationKey('Description.RefundErrorBanner', TranslationNamespace.AudienceReach),
              )}
              layout='Stacked'
              variant='Emphasis'
              severity='Error'
            />
          )}
          {translate(
            translationKey(
              'Description.ExpeditedReviewRefundModal',
              TranslationNamespace.AudienceReach,
            ),
          )}
          <div className='flex flex-row gap-small'>
            <Button
              variant='Emphasis'
              size='Medium'
              className='width-full'
              isLoading={isRefundLoading}
              onClick={requestRefund}>
              {translate(translationKey('Action.Request', TranslationNamespace.AudienceReach))}
            </Button>
            <Button variant='Standard' size='Medium' className='width-full' onClick={handleClose}>
              {translate(translationKey('Action.Cancel', TranslationNamespace.AudienceReach))}
            </Button>
          </div>
          <div className='flex items-center gap-xsmall'>
            <span className='text-body-medium'>
              {translate(
                translationKey('Description.YouWillGet', TranslationNamespace.AudienceReach),
              )}
              :
            </span>
            <Icon name='icon-regular-robux' size='Small' aria-label='Robux' />
            <span className='text-body-medium'>{numberFormatter.format(ExpeditedReviewFee)}</span>
          </div>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
};

export default TransactionRefundDialog;
