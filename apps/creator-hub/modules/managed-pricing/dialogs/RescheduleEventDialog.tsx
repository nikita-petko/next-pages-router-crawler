import { useCallback, useMemo, useState } from 'react';
import {
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogTitle,
} from '@rbx/foundation-ui';
import { useTranslation, withTranslation } from '@rbx/intl';
import TranslationNamespace from '@modules/miscellaneous/localization/enums/TranslationNamespace';
import { DateTimePickerSinglePopoverInput } from '@modules/monetization-shared/date-picker-input/DateTimePickerSinglePopoverInput';
import { openDialog } from '@modules/monetization-shared/dialog/actions';
import { toast } from '@modules/monetization-shared/snackbar/actions';
import { useGetManagedPricingMetadata } from '../queries/useGetManagedPricingMetadata';
import { useRescheduleManagedPricingEvent } from '../queries/useRescheduleManagedPricingEvent';
import {
  getSelectableDateRanges,
  MAX_RESCHEDULE_WEEKS,
  MS_PER_DAY,
  MS_PER_MINUTE,
} from '../utils/getSelectableDateRanges';

type Props = {
  universeId: number;
  eventId: string;
  eventStartTime: Date | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

// Five minutes gives creators time for quick remediation while still rescheduling promptly for "today".
const REMEDIATION_OFFSET_MINUTES = 5;

// Calendar-day difference between two Dates using local-time midnights. Math.round keeps this correct across DST
// boundaries (where adjacent days span 23 or 25 hours instead of 24).
function getCalendarDayOffset(from: Date, to: Date): number {
  const fromMidnight = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const toMidnight = new Date(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.round((toMidnight.getTime() - fromMidnight.getTime()) / MS_PER_DAY);
}

// Maps the picker's calendar choice to a now-relative instant (required for backend processing):
// today -> `now + 5 minutes`, today + N days -> `now + N days + 5 minutes`.
function getRescheduledStartTime(selectedDate: Date): Date {
  const now = new Date();
  const dayOffset = getCalendarDayOffset(now, selectedDate);
  return new Date(
    now.getTime() + dayOffset * MS_PER_DAY + REMEDIATION_OFFSET_MINUTES * MS_PER_MINUTE,
  );
}

function RescheduleEventDialog({ universeId, eventId, eventStartTime, open, onOpenChange }: Props) {
  const { translate } = useTranslation();
  const [date, setDate] = useState<Date | null>(null);

  const { mutateAsync: rescheduleEvent, isPending: isRescheduling } =
    useRescheduleManagedPricingEvent();

  const { data: metadata, isLoading: isMetadataLoading } = useGetManagedPricingMetadata(universeId);

  const selectableDateRange = useMemo(() => {
    if (isMetadataLoading) {
      return [];
    }
    return getSelectableDateRanges({
      eventStartTime,
      freezeRanges: metadata?.disabledDateRanges ?? [],
    });
  }, [isMetadataLoading, eventStartTime, metadata]);

  const handleClose = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  /* oxlint-disable react/react-compiler -- rescheduleEvent is a stable React Query mutate fn flagged as an extra dep; react-compiler isn't enabled and exhaustive-deps requires it in the array */
  const handleConfirm = useCallback(async () => {
    /* istanbul ignore if -- guarded by disabled */
    if (!date) {
      return;
    }

    try {
      const newStartTime = getRescheduledStartTime(date);

      await rescheduleEvent({ universeId, eventId, newStartTime });

      toast({ title: translate('Message.SuccessfullyRescheduledPriceTest') });
    } catch {
      toast({ title: translate('Message.FailedToReschedulePriceTest') });
    } finally {
      onOpenChange(false);
    }
  }, [translate, universeId, eventId, date, onOpenChange, rescheduleEvent]);
  /* oxlint-enable react/react-compiler */

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
      hasCloseAffordance={false}>
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
            selectableDateRange={selectableDateRange}
            size='Medium'
            hint={translate('Message.CanRescheduleUpToTimeFrame', {
              numWeeks: MAX_RESCHEDULE_WEEKS.toString(),
            })}
          />
        </DialogBody>
        <DialogFooter className='flex flex-col gap-small small:flex-row'>
          <Button
            variant='Emphasis'
            size='Medium'
            className='fill small:basis-0'
            onClick={handleConfirm}
            isLoading={isRescheduling}
            isDisabled={isRescheduling || !date || isMetadataLoading}>
            {translate('Action.Confirm')}
          </Button>
          <Button
            variant='Standard'
            size='Medium'
            className='fill small:basis-0'
            onClick={handleClose}
            isDisabled={isRescheduling}>
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

export function openRescheduleEventDialog(params: Omit<Props, 'open' | 'onOpenChange'>) {
  openDialog({
    component: TranslatedDialog,
    props: params,
    options: { mode: 'standalone' },
  });
}
