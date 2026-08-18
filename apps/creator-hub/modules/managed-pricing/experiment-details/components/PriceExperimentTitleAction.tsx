import { useCallback, useEffect, useState } from 'react';
import type { ExperimentState } from '@rbx/client-price-experimentation-api/v1';
import {
  Button,
  clsx,
  Icon,
  Menu,
  MenuItem,
  MenuSection,
  MenuSeparator,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@rbx/foundation-ui';
import { useTranslationWithNamespace } from '@rbx/intl';
import TranslationNamespace from '@modules/miscellaneous/localization/enums/TranslationNamespace';
import { DEFAULT_ACTION_PROPS } from '@modules/monetization-shared/title';
import { openApplyPricesEarlyDialog } from '../../dialogs/ApplyPricesEarlyDialog';
import { openExperimentCompletingLoadingDialog } from '../../dialogs/ExperimentCompletingLoadingDialog';
import { openRescheduleEventDialog } from '../../dialogs/RescheduleEventDialog';
import { openStopAndRescheduleWarningDialog } from '../../dialogs/StopAndRescheduleWarningDialog';
import { useGetExperimentSummary } from '../../queries/useGetExperimentSummary';
import type { ManagedPricingEvent } from '../../types';

type ActivePriceExperiment = Extract<ManagedPricingEvent, { status: 'Active' }>;

type Props = {
  universeId: number;
  event: ManagedPricingEvent;
  disabled: boolean;
  className?: string;
};

type PriceExperimentOptionsMenuProps = {
  universeId: number;
  event: ActivePriceExperiment;
  disabled: boolean;
  className?: string;
};

const STATES_DISABLE_EXPERIMENT_STOP: readonly ExperimentState[] = [
  'HoldoutCompleting',
  'PriceReverted',
  'PriceRevertingWithCompletion',
  'Completed',
  'Cancelled',
  'Failed',
] as const;

function PriceExperimentOptionsMenu({
  universeId,
  event,
  disabled,
  className,
}: PriceExperimentOptionsMenuProps) {
  const { translate } = useTranslationWithNamespace(TranslationNamespace.ManagedPricing);
  const [open, setOpen] = useState(false);

  const { data: experiment } = useGetExperimentSummary({
    universeId,
    experimentId: event.eventReferenceId,
  });

  const isExperimentChangeDisabled =
    experiment?.state !== undefined && STATES_DISABLE_EXPERIMENT_STOP.includes(experiment.state);

  useEffect(() => {
    if (experiment?.state === 'HoldoutCompleting') {
      openExperimentCompletingLoadingDialog({
        universeId,
        eventId: event.id,
        experimentId: event.eventReferenceId,
      });
    }
  }, [event.eventReferenceId, event.id, experiment?.state, universeId]);

  const handleAcceptOptimizedPrices = useCallback(() => {
    setOpen(false);
    openApplyPricesEarlyDialog({
      universeId,
      eventId: event.id,
      experimentId: event.eventReferenceId,
    });
  }, [event.eventReferenceId, event.id, universeId]);

  const handleReschedule = useCallback(() => {
    setOpen(false);
    openStopAndRescheduleWarningDialog({
      universeId,
      eventId: event.id,
      eventStartTime: event.startTime,
    });
  }, [event.id, event.startTime, universeId]);

  const stopTestLabel = translate('Action.StopTest');

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild disabled={disabled}>
        <Button
          {...DEFAULT_ACTION_PROPS}
          variant='Standard'
          isDisabled={disabled}
          className={clsx(DEFAULT_ACTION_PROPS.className, '!padding-x-large', className)}>
          <span className='flex items-center gap-small'>
            {stopTestLabel}
            <Icon name='icon-filled-chevron-small-down' size='Medium' />
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align='end'
        // Note: adding explicitly specified offsets for design layout
        sideOffset={4} // 4px away from trigger
        collisionPadding={32} // 32px away from edges of screen
        ariaLabel={stopTestLabel}>
        <Menu size='Medium' className='min-width-[225px]'>
          <MenuSection>
            {experiment?.allowStopHoldout && (
              <>
                <MenuItem
                  value='accept-optimized-prices'
                  title={translate('MenuItem.AcceptOptimizedPrices')}
                  description={translate('Label.Recommended')}
                  disabled={isExperimentChangeDisabled}
                  onSelect={handleAcceptOptimizedPrices}
                  className='!padding-y-[10px]'
                />
                <MenuSeparator />
              </>
            )}

            <MenuItem
              value='reschedule-test'
              title={translate('MenuItem.RescheduleTest')}
              disabled={isExperimentChangeDisabled}
              onSelect={handleReschedule}
              className='!padding-y-[10px]'
            />
          </MenuSection>
        </Menu>
      </PopoverContent>
    </Popover>
  );
}

export function PriceExperimentTitleAction({ universeId, event, disabled, className }: Props) {
  const { translate } = useTranslationWithNamespace(TranslationNamespace.ManagedPricing);

  if (event.status === 'Upcoming') {
    return (
      <Button
        {...DEFAULT_ACTION_PROPS}
        variant='Standard'
        isDisabled={disabled}
        className={clsx(DEFAULT_ACTION_PROPS.className, className)}
        onClick={() =>
          openRescheduleEventDialog({
            universeId,
            eventId: event.id,
            eventStartTime: event.startTime,
          })
        }>
        {translate('Action.Reschedule')}
      </Button>
    );
  }

  if (event.status === 'Active') {
    return (
      <PriceExperimentOptionsMenu
        universeId={universeId}
        event={event}
        disabled={disabled}
        className={className}
      />
    );
  }

  return null;
}
