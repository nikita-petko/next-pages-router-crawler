import React, { useCallback } from 'react';
import { Button, Alert, Typography, AlertTitle } from '@rbx/ui';
import {
  analyticsExperimentsNavigationItem,
  buildExperienceAnalyticsUrlWithParams,
  formatShortDateTimeWithoutYear,
} from '@modules/charts-generic';
import { useRouter } from 'next/router';
import { ExperimentState } from '@modules/remote-configs/api/universeExperimentationClientEnums';
import type { ValidExperiment } from '@modules/remote-configs/api/validExperimentationTypes';
import { useTranslation, useLocalization, Locale } from '@rbx/intl';
import { ConfigurationBriefInfo } from '../../types/ConfigurationInfo';

type ActiveExperimentSummaryAlertProps = {
  activeExperiment: ValidExperiment;
  fetchConfigurationsError: Error | null;
  allConfigurationBriefInfoList: ConfigurationBriefInfo[];
  isLoadingConfigurations: boolean;
};

const ActiveExperimentSummaryAlert = ({
  activeExperiment,
  fetchConfigurationsError,
  allConfigurationBriefInfoList,
  isLoadingConfigurations,
}: ActiveExperimentSummaryAlertProps) => {
  const { translate } = useTranslation();
  const { locale } = useLocalization();

  const router = useRouter();
  const universeId = router.query.id as string;

  const getDetailedExperimentTime = (experiment: ValidExperiment) => {
    if (experiment.state !== ExperimentState.Running) {
      return null;
    }

    const millisecondsPerDay = 1000 * 60 * 60 * 24;
    const millisecondsPerHour = 1000 * 60 * 60;

    // Helper function to get date without time components (midnight of that day)
    const getDateWithoutTime = (date: Date): Date => {
      return new Date(date.getFullYear(), date.getMonth(), date.getDate());
    };

    const now = new Date();
    const nowTime = now.getTime();
    const startTime = experiment.startedTime.getTime();
    const durationMs = experiment.durationDays * millisecondsPerDay;
    const endTime = startTime + durationMs;

    // Calculate elapsed calendar days (using date without time components)
    const todayDate = getDateWithoutTime(now);
    const startDate = getDateWithoutTime(experiment.startedTime);
    const elapsedDays = Math.floor(
      (todayDate.getTime() - startDate.getTime()) / millisecondsPerDay,
    );

    // Calculate remaining time (keep using actual time for hours precision)
    const remainingMs = Math.max(0, endTime - nowTime);
    const remainingDays = Math.floor(remainingMs / millisecondsPerDay);
    const remainingHours = Math.floor((remainingMs % millisecondsPerDay) / millisecondsPerHour);

    return {
      elapsedDays,
      remainingDays,
      remainingHours,
    };
  };

  const isRunningExperimentDurationMet = (experiment: ValidExperiment) => {
    if (experiment.state !== ExperimentState.Running) return false;
    return (
      experiment.startedTime.getTime() + experiment.durationDays * 24 * 60 * 60 * 1000 <=
      new Date().getTime()
    );
  };

  const renderAlertTitle = useCallback(() => {
    if (!activeExperiment) {
      return null;
    }

    let alertTitleText = '';
    switch (activeExperiment.state) {
      case ExperimentState.Scheduled: {
        const { scheduledTime } = activeExperiment;
        alertTitleText = translate('Alert.Title.ScheduledExperimentSummary', {
          date: formatShortDateTimeWithoutYear(scheduledTime, locale ?? Locale.English),
        });
        break;
      }
      case ExperimentState.Running: {
        if (isRunningExperimentDurationMet(activeExperiment)) {
          const endedTime = new Date(
            activeExperiment.startedTime.getTime() +
              activeExperiment.durationDays * 24 * 60 * 60 * 1000,
          );
          alertTitleText = translate('Alert.Title.EndedExperimentSummary', {
            date: formatShortDateTimeWithoutYear(endedTime, locale ?? Locale.English),
          });
        } else {
          const timeDetails = getDetailedExperimentTime(activeExperiment);
          if (timeDetails) {
            const { elapsedDays, remainingDays, remainingHours } = timeDetails;
            alertTitleText = translate('Alert.Title.RunningExperimentSummary', {
              elapsedDays: elapsedDays.toString(),
              remainingDays: remainingDays.toString(),
              remainingHours: remainingHours.toString(),
            });
          }
        }
        break;
      }
      default:
        break;
    }

    return <AlertTitle paddingBottom={1}>{alertTitleText}</AlertTitle>;
  }, [activeExperiment, translate, locale]);

  const renderAlertBody = useCallback(() => {
    if (
      !allConfigurationBriefInfoList ||
      allConfigurationBriefInfoList.length === 0 ||
      !activeExperiment ||
      isLoadingConfigurations
    ) {
      return null;
    }

    let alertBodyText = '';

    if (isRunningExperimentDurationMet(activeExperiment)) {
      alertBodyText = translate('Alert.Body.EndedExperiment.MakeDecision', {
        name: activeExperiment.name,
      });
      return <Typography variant='body1'>{alertBodyText}</Typography>;
    }

    const { variants } = activeExperiment;

    if (variants.length === 0) {
      return null;
    }

    // Extract all scoring config IDs from all variants and deduplicate
    const allCustomScoringConfigIds = new Set<string>();
    let hasPlatformDefault = false;
    variants.forEach((variant) => {
      if ('placeMatchmakingConfigs' in variant && variant.placeMatchmakingConfigs) {
        variant.placeMatchmakingConfigs.forEach((config) => {
          if (config.usePlatformDefault) {
            hasPlatformDefault = true;
            // skip adding to the set and continue
            return;
          }
          if (
            config.matchmakingScoringConfigId !== null &&
            config.matchmakingScoringConfigId !== undefined
          ) {
            allCustomScoringConfigIds.add(config.matchmakingScoringConfigId);
          }
        });
      }
    });

    const uniqueCustomScoringConfigIds = Array.from(allCustomScoringConfigIds);

    // Map scoring config IDs to their configuration names
    const uniqueCustomScoringConfigNames = uniqueCustomScoringConfigIds
      .map((configId) => {
        const config = allConfigurationBriefInfoList.find((briefInfo) => briefInfo.id === configId);
        return config?.name;
      })
      .filter((name): name is string => name !== undefined);

    const customConfigCount = uniqueCustomScoringConfigNames.length;
    const totalConfigCount = customConfigCount + (hasPlatformDefault ? 1 : 0);

    if (totalConfigCount === 0) {
      return null;
    }

    // Determine the primary config to display, prioritize to display the custom
    // config over the Roblox default
    const primaryConfigName =
      customConfigCount > 0 ? uniqueCustomScoringConfigNames[0] : translate('Label.RobloxDefault'); // if there is no custom config, display the Roblox Default

    if (totalConfigCount === 1) {
      alertBodyText = translate('Alert.Body.ExperimentScoringConfigurationsDetails.SingleConfig', {
        scoringConfigName: primaryConfigName,
      });
    } else {
      const otherConfigCount = totalConfigCount - 1;
      alertBodyText = translate(
        'Alert.Body.ExperimentScoringConfigurationsDetails.MoreThanOneConfig',
        {
          scoringConfigName: primaryConfigName,
          numberOfOtherConfigs: otherConfigCount.toString(),
        },
      );
    }

    return <Typography variant='body1'>{alertBodyText}</Typography>;
  }, [allConfigurationBriefInfoList, activeExperiment, translate, isLoadingConfigurations]);

  if (fetchConfigurationsError) {
    return null;
  }

  return (
    <Alert
      severity='info'
      variant='outlined'
      action={
        <Button
          onClick={() => {
            const url = buildExperienceAnalyticsUrlWithParams(
              analyticsExperimentsNavigationItem,
              {},
              Number(universeId),
            );
            router.push(`${url}/${activeExperiment.id}/experiment-details`);
          }}
          color='inherit'
          size='small'>
          {translate('Button.GoToExperiment')}
        </Button>
      }>
      {renderAlertTitle()}
      {renderAlertBody()}
    </Alert>
  );
};

export default ActiveExperimentSummaryAlert;
