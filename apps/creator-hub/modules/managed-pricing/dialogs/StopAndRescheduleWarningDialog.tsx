import { Button, DialogBody, DialogContent, DialogFooter, DialogTitle } from '@rbx/foundation-ui';
import { useTranslation, withTranslation } from '@rbx/intl';
import TranslationNamespace from '@modules/miscellaneous/localization/enums/TranslationNamespace';
import { closeDialog, openDialog } from '@modules/monetization-shared/dialog/actions';
import { openRescheduleEventDialog } from './RescheduleEventDialog';

type Props = {
  universeId: number;
  eventId: string;
  eventStartTime: Date | null;
  onClose: () => void;
};

function StopAndRescheduleWarningDialogContent({
  universeId,
  eventId,
  eventStartTime,
  onClose,
}: Props) {
  const { translate } = useTranslation();

  const handleConfirm = () => {
    onClose();
    openRescheduleEventDialog({ universeId, eventId, eventStartTime });
  };

  return (
    <DialogContent className='!min-width-[280px] width-full'>
      <DialogBody className='flex flex-col gap-y-xsmall'>
        <DialogTitle className='text-heading-small margin-y-none padding-bottom-xsmall'>
          {/* Note: heading is currently specific to price tests */}
          {translate('Heading.StopAndRescheduleWarning')}
        </DialogTitle>
        <span className='text-body-medium content-default margin-none padding-bottom-medium'>
          {/* Note: message is currently specific to price tests  */}
          {translate('Message.StopAndRescheduleWarning')}
        </span>
      </DialogBody>
      <DialogFooter className='flex flex-col gap-small small:flex-row'>
        <Button
          variant='Alert'
          size='Medium'
          className='fill small:basis-0'
          onClick={handleConfirm}>
          {translate('Action.StopAndReschedule')}
        </Button>
        <Button variant='Standard' size='Medium' className='fill small:basis-0' onClick={onClose}>
          {translate('Action.Cancel')}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

const TranslatedDialogContent = withTranslation(StopAndRescheduleWarningDialogContent, [
  TranslationNamespace.ManagedPricing,
]);

export function openStopAndRescheduleWarningDialog(params: Omit<Props, 'onClose'>) {
  openDialog({
    content: <TranslatedDialogContent {...params} onClose={closeDialog} />,
  });
}
