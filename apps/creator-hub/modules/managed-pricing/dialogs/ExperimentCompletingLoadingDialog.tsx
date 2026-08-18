import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogBody, DialogContent, DialogTitle, ProgressCircle } from '@rbx/foundation-ui';
import { useTranslationWithNamespace, withTranslation } from '@rbx/intl';
import TranslationNamespace from '@modules/miscellaneous/localization/enums/TranslationNamespace';
import { closeDialog, openDialog } from '@modules/monetization-shared/dialog/actions';
import { usePriceExperimentCompletionPolling } from '../experiment-details/hooks/usePriceExperimentCompletionPolling';
import { managedPricingEventKeys } from '../queries/constants';

type Props = {
  universeId: number;
  eventId: string;
  experimentId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const preventDialogClose = () => undefined;

function ExperimentCompletingLoadingDialog({ universeId, eventId, experimentId, open }: Props) {
  const { translate } = useTranslationWithNamespace(TranslationNamespace.ManagedPricing);

  const queryClient = useQueryClient();
  const { isComplete } = usePriceExperimentCompletionPolling({
    universeId,
    eventId,
    experimentId,
  });

  useEffect(() => {
    if (!isComplete) {
      return;
    }

    void queryClient.invalidateQueries({ queryKey: managedPricingEventKeys.all(universeId) });
    closeDialog();
  }, [isComplete, queryClient, universeId]);

  return (
    <Dialog
      size='Medium'
      isModal
      open={open}
      onOpenChange={preventDialogClose}
      hasCloseAffordance={false}>
      <DialogContent className='!min-width-[280px] width-full'>
        <DialogBody className='flex flex-col gap-y-xsmall'>
          <DialogTitle className='text-heading-small margin-y-none padding-bottom-xsmall'>
            {translate('Heading.StoppingTest')}
          </DialogTitle>
          <span className='text-body-medium content-default margin-none'>
            {translate('Message.ApplyingOptimizedPrices')}
          </span>
          <div className='flex justify-center items-center height-[120px]'>
            <ProgressCircle
              ariaLabel={translate('Heading.StoppingTest')}
              size='Large'
              variant='Indeterminate'
            />
          </div>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}

const TranslatedDialog = withTranslation(ExperimentCompletingLoadingDialog, [
  TranslationNamespace.ManagedPricing,
]);

export function openExperimentCompletingLoadingDialog(
  params: Pick<Props, 'universeId' | 'eventId' | 'experimentId'>,
) {
  openDialog({
    component: TranslatedDialog,
    props: params,
    options: { mode: 'standalone' },
  });
}
