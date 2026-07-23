import { ExperimentState, TriggerMode } from '@rbx/client-price-experimentation-api/v1';
import { addDays } from '@rbx/core';
import { useTranslation } from '@rbx/intl';
import { useLocalStorage } from '@rbx/react-utilities';
import type { TAlertProps } from '@rbx/ui';
import { Alert, AlertTitle, CloseIcon, IconButton } from '@rbx/ui';
import { Link } from '@modules/monetization-shared/link';
import {
  lastViewedFailedPriceExperimentKey,
  lastViewedHoldoutFinishedKey,
} from '../../constants/experimentConstants';
import { supportLink } from '../../constants/links';
import {
  isOngoingExperiment,
  convertTimeSpanToWeeks,
  convertTimeSpanToDays,
} from '../../helpers/experimentUtils';
import { useFormatters } from '../../helpers/useFormatters';
import { useGetExperimentationMetadata } from '../../queries/useGetExperimentationMetadata';
import { useGetLatestExperiment } from '../../queries/useGetLatestExperiment';
import TimelineBanner from './TimelineBanner';

const StatusBanner = () => {
  const { translate, translateHTML } = useTranslation();
  const { longDateFormatter } = useFormatters();
  const { latestExperiment: currentExperiment, isLoading, isError } = useGetLatestExperiment();

  // Used to check if we are in a polling state for holdout completion
  const [lastViewedHoldoutFinished] = useLocalStorage<null | string>(
    lastViewedHoldoutFinishedKey,
    null,
  );

  // Store the experiment id of the last viewed price experiment in local storage
  const [lastViewedFailedPriceExperiment, setLastViewedFailedPriceExperiment] = useLocalStorage<
    string | null
  >(lastViewedFailedPriceExperimentKey, null);

  const {
    isWithinFreezePeriod,
    holdoutDuration: defaultHoldoutDuration,
    experimentDuration: defaultExperimentDuration,
  } = useGetExperimentationMetadata();

  const defaultHoldoutDays = convertTimeSpanToDays(defaultHoldoutDuration, true);
  const defaultExperimentDays = convertTimeSpanToDays(defaultExperimentDuration, false);
  const currentExperimentDays = convertTimeSpanToDays(
    currentExperiment?.displayExperimentDuration ?? null,
    false,
  );
  const currentHoldoutDays = convertTimeSpanToDays(
    currentExperiment?.displayHoldoutExperimentDuration ?? null,
    true,
  );

  if (isLoading || isError || currentExperiment === undefined || isWithinFreezePeriod) {
    return null;
  }

  // Failed experiment status alert
  // On close will switch to showing the initial state status banner
  if (
    currentExperiment &&
    currentExperiment.state === ExperimentState.Failed &&
    lastViewedFailedPriceExperiment !== currentExperiment.id
  ) {
    return (
      <Alert
        severity='error'
        action={
          <IconButton
            aria-label='Close'
            color='secondary'
            onClick={() => setLastViewedFailedPriceExperiment(currentExperiment.id)}>
            <CloseIcon />
          </IconButton>
        }>
        <AlertTitle>{translate('Heading.Error')}</AlertTitle>
        {translateHTML('Message.TestError', [
          {
            opening: 'linkStart',
            closing: 'linkEnd',
            content(chunks) {
              return (
                <Link href={supportLink} target='_blank'>
                  {chunks}
                </Link>
              );
            },
          },
        ])}
      </Alert>
    );
  }

  // Initial state status banner
  // Keep the !currentExperiment check for type checking further down
  if (!currentExperiment || !isOngoingExperiment(currentExperiment?.state)) {
    // Don't show the timeline if we just finished polling into the completed state
    // and user hasn't acknowledged the holdout completion
    const isFinishedPollingDisplay =
      currentExperiment?.state === ExperimentState.Completed &&
      lastViewedHoldoutFinished === currentExperiment.id;
    if (isFinishedPollingDisplay) {
      return null;
    }
    return <TimelineBanner />;
  }

  let heading = '';
  let message = '';
  let severity: TAlertProps['severity'];
  // oxlint-disable-next-line typescript/switch-exhaustiveness-check -- DO NOT REMOVE THIS, WILL BREAK. Default case fallthrough is intended
  switch (currentExperiment.state) {
    case ExperimentState.Running: {
      // If start time and experiment duration is null, means experiment just started and is transitioning from Starting -> Running
      // This means we should use the default experiment duration
      // Otherwise the experiment already has an experiment duration set which we should use
      const runningExperimentDays =
        currentExperiment.startTime === null && currentExperiment.displayExperimentDuration === null
          ? defaultExperimentDays
          : currentExperimentDays;
      const endDate = addDays(currentExperiment.startTime ?? new Date(), runningExperimentDays);
      const endDateString = longDateFormatter.format(endDate);
      heading = translate('Heading.TestState.InProgress', { endDate: endDateString });
      message = translate('Message.TestState.InProgress');
      severity = 'info';
      break;
    }
    case ExperimentState.ResultsReady: {
      const endDate = currentExperiment.endTime ?? new Date();
      const endDateString = longDateFormatter.format(endDate);
      heading = translate('Heading.TestState.ResultsReady', { endDate: endDateString });
      message = translate('Message.TestState.ResultsReady');
      severity = 'success';
      break;
    }
    case ExperimentState.HoldoutRunning:
    case ExperimentState.HoldoutCompleting: {
      // If start time and holdout duration is null, means holdout just started and is transitioning from HoldoutStarting -> HoldoutRunning
      // This means we should use the default experiment duration
      // Otherwise the holdout already has a holdout duration set which we should use
      const recentlyStartedHoldout =
        currentExperiment.holdoutMetadata === null &&
        currentExperiment.displayHoldoutExperimentDuration === null;
      const runningHoldoutDays = recentlyStartedHoldout ? defaultHoldoutDays : currentHoldoutDays;
      const holdoutDurationWeeks = convertTimeSpanToWeeks(
        recentlyStartedHoldout
          ? defaultHoldoutDuration
          : (currentExperiment?.displayHoldoutExperimentDuration ?? null),
        true,
      );

      const endDate = addDays(
        currentExperiment.holdoutMetadata?.startTime ?? new Date(),
        runningHoldoutDays,
      );
      const endDateString = longDateFormatter.format(endDate);
      heading = translate('Heading.TestState.HoldoutActive', { endDate: endDateString });
      message = translate('Message.TestState.HoldoutActiveV2', { numWeeks: holdoutDurationWeeks });
      severity = 'info';
      break;
    }
    case ExperimentState.HoldoutCompleted: {
      if (currentExperiment.holdoutMetadata?.holdoutCompletionMode === TriggerMode.Manual) {
        heading = translate('Heading.TestState.HoldoutStopped');
        message = translate('Message.TestState.HoldoutStopped');
        severity = 'success';
        break;
      }
      const endDate = currentExperiment.holdoutMetadata?.endTime ?? new Date();
      const endDateString = longDateFormatter.format(endDate);
      heading = translate('Heading.TestState.HoldoutComplete', { endDate: endDateString });
      message = translate('Message.TestState.HoldoutComplete');
      severity = 'success';
      break;
    }
    case ExperimentState.PriceReverted: {
      heading = translate('Heading.TestState.PriceAutoReverted');
      message = translate('Message.TestState.PriceAutoReverted');
      severity = 'warning';
      break;
    }
    case ExperimentState.PriceRevertingWithCompletion: {
      if (currentExperiment.holdoutMetadata?.holdoutCompletionMode === TriggerMode.Manual) {
        heading = translate('Heading.TestState.HoldoutStopped');
        message = translate('Message.TestState.HoldoutStopped');
        severity = 'success';
        break;
      } else if (currentExperiment.holdoutMetadata?.holdoutCompletionMode === TriggerMode.Auto) {
        const endDate = currentExperiment.holdoutMetadata?.endTime ?? new Date();
        const endDateString = longDateFormatter.format(endDate);
        heading = translate('Heading.TestState.HoldoutComplete', { endDate: endDateString });
        message = translate('Message.TestState.HoldoutComplete');
        severity = 'success';
        break;
      }
      const endDate = addDays(
        currentExperiment.holdoutMetadata?.startTime ?? new Date(),
        currentHoldoutDays,
      );
      const endDateString = longDateFormatter.format(endDate);
      heading = translate('Heading.TestState.HoldoutActive', { endDate: endDateString });

      const holdoutDurationWeeks = convertTimeSpanToWeeks(
        currentExperiment?.displayHoldoutExperimentDuration ?? null,
        true,
      );
      message = translate('Message.TestState.HoldoutActiveV2', { numWeeks: holdoutDurationWeeks });
      severity = 'info';
      break;
    }
  }

  return (
    <Alert severity={severity}>
      <AlertTitle>{heading}</AlertTitle>
      {message}
    </Alert>
  );
};

export default StatusBanner;
