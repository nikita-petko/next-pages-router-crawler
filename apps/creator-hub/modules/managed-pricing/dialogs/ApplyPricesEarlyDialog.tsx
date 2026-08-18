import { useCallback } from 'react';
import {
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogTitle,
} from '@rbx/foundation-ui';
import { useTranslationWithNamespace, withTranslation } from '@rbx/intl';
import TranslationNamespace from '@modules/miscellaneous/localization/enums/TranslationNamespace';
import { openDialog } from '@modules/monetization-shared/dialog/actions';
import { openRequestErrorDialog } from '@modules/monetization-shared/error-dialogs';
import { useStopHoldout } from '../queries/useStopHoldout';
import { openExperimentCompletingLoadingDialog } from './ExperimentCompletingLoadingDialog';

type Props = {
  universeId: number;
  eventId: string;
  experimentId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function ApplyPricesEarlyDialog({ universeId, eventId, experimentId, open, onOpenChange }: Props) {
  const { translate } = useTranslationWithNamespace(TranslationNamespace.ManagedPricing);

  const handleClose = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  const handleStopHoldoutSuccess = useCallback(() => {
    openExperimentCompletingLoadingDialog({ universeId, eventId, experimentId });
  }, [eventId, experimentId, universeId]);

  const { mutate: stopHoldout, isPending } = useStopHoldout({
    onSuccess: handleStopHoldoutSuccess,
    onError: openRequestErrorDialog,
  });

  const handleConfirm = useCallback(() => {
    stopHoldout({ universeId, experimentId });
  }, [experimentId, stopHoldout, universeId]);

  return (
    <Dialog
      size='Medium'
      isModal
      open={open}
      onOpenChange={onOpenChange}
      hasCloseAffordance={false}>
      <DialogContent className='!min-width-[280px] width-full'>
        <DialogBody className='flex flex-col gap-y-xsmall'>
          <DialogTitle className='text-heading-small margin-y-none padding-bottom-xsmall'>
            {translate('Heading.ApplyPricesEarly')}
          </DialogTitle>
          <span className='text-body-medium content-default margin-none'>
            {translate('Message.ApplyPricesEarly')}
          </span>
        </DialogBody>
        <DialogFooter className='flex flex-col gap-small small:flex-row'>
          <Button
            variant='Standard'
            size='Medium'
            className='fill small:basis-0'
            onClick={handleConfirm}
            isLoading={isPending}
            isDisabled={isPending}>
            {translate('Action.AcceptPrices')}
          </Button>
          <Button
            variant='Standard'
            size='Medium'
            className='fill small:basis-0'
            onClick={handleClose}
            isDisabled={isPending}>
            {translate('Action.KeepTestRunning')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const TranslatedDialog = withTranslation(ApplyPricesEarlyDialog, [
  TranslationNamespace.ManagedPricing,
]);

export function openApplyPricesEarlyDialog(
  params: Pick<Props, 'universeId' | 'eventId' | 'experimentId'>,
) {
  openDialog({
    component: TranslatedDialog,
    props: params,
    options: { mode: 'standalone' },
  });
}
