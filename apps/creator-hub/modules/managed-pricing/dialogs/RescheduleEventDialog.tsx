import { useCallback, useMemo, useState } from 'react';
import { useTranslation, withTranslation } from '@rbx/intl';
import {
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogTitle,
} from '@rbx/foundation-ui';
import { openDialog } from '@modules/monetization-shared/dialog/actions';
import { toast } from '@modules/monetization-shared/snackbar/actions';
import { DateTimePickerSinglePopoverInput } from '@modules/monetization-shared/date-picker-input/DateTimePickerSinglePopoverInput';
import TranslationNamespace from '@modules/miscellaneous/localization/enums/TranslationNamespace';

type Props = {
  universeId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const MAX_RESCHEDULE_WEEKS = 4;

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

// TODO: handle for timezones + holiday freeze logic - should be split out into separate util
function getSelectableDateRange() {
  const now = new Date();
  return {
    startDate: addDays(now, 1), // now + 1 day
    endDate: addDays(now, MAX_RESCHEDULE_WEEKS * 7), // now + 4 weeks
  } as const;
}

function RescheduleEventDialog({ universeId, open, onOpenChange }: Props) {
  const { translate } = useTranslation();
  const [date, setDate] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleClose = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  // TODO: hook in reschedule API call + handle timezones
  const handleConfirm = useCallback(async () => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsLoading(false);
    // TODO: use schedule specific message - narrow down on this copy
    toast({ title: translate('Message.SuccessfullyUpdatedItem') });
    // eslint-disable-next-line no-console -- testing for now
    console.log('universeId', universeId);
    onOpenChange(false);
  }, [onOpenChange, translate, universeId]);

  const dateTimePickerLabels = useMemo(
    () => ({
      previousMonth: translate('Label.PreviousMonth'),
      nextMonth: translate('Label.NextMonth'),
    }),
    [translate],
  );

  return (
    <Dialog
      size='Medium'
      isModal
      open={open}
      onOpenChange={onOpenChange}
      hasCloseAffordance
      closeLabel={translate('Action.Close')}>
      <DialogContent className='!min-width-[280px] width-full'>
        <DialogBody className='flex flex-col gap-y-xsmall'>
          <DialogTitle className='text-heading-small margin-y-none padding-bottom-small'>
            {/* Note: only one event type for now */}
            {translate('Heading.ReschedulePriceTest')}
          </DialogTitle>

          <DateTimePickerSinglePopoverInput
            value={date}
            onChange={setDate}
            variant='Standard'
            placeholder={translate('Action.SelectDate')}
            popoverAriaLabel={translate('Action.SelectDate')}
            dateTimePickerLabels={dateTimePickerLabels}
            selectableDateRange={getSelectableDateRange()}
            size='Medium'
            hint={translate('Message.CanRescheduleUpToTimeFrame', {
              numWeeks: MAX_RESCHEDULE_WEEKS.toString(),
            })}
          />
        </DialogBody>
        <DialogFooter className='flex gap-x-small'>
          <Button
            variant='Emphasis'
            size='Medium'
            className='fill basis-0'
            onClick={handleConfirm}
            isLoading={isLoading}
            isDisabled={isLoading || !date}>
            {translate('Action.Confirm')}
          </Button>
          <Button
            variant='Standard'
            size='Medium'
            className='fill basis-0'
            onClick={handleClose}
            isDisabled={isLoading}>
            {translate('Action.Cancel')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const TranslatedDialog = withTranslation(RescheduleEventDialog, [
  TranslationNamespace.Creations,
  TranslationNamespace.ManagedPricing,
]);

// eslint-disable-next-line import/prefer-default-export -- keep named export
export function openRescheduleEventDialog(universeId: number) {
  openDialog({
    component: TranslatedDialog,
    props: { universeId },
    options: { mode: 'standalone' },
  });
}
