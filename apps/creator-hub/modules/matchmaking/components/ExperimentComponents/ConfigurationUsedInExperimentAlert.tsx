import React, { useCallback } from 'react';
import { Button, Alert, AlertTitle } from '@rbx/ui';
import {
  analyticsExperimentsNavigationItem,
  buildExperienceAnalyticsUrlWithParams,
} from '@modules/charts-generic';
import { useRouter } from 'next/router';
import { ExperimentState } from '@modules/remote-configs/api/universeExperimentationClientEnums';
import type { ValidExperiment } from '@modules/remote-configs/api/validExperimentationTypes';
import { useTranslation } from '@rbx/intl';

type ConfigurationUsedInExperimentAlertProps = {
  experiment: ValidExperiment;
};

const ConfigurationUsedInExperimentAlert = ({
  experiment,
}: ConfigurationUsedInExperimentAlertProps) => {
  const { translate } = useTranslation();

  const router = useRouter();
  const universeId = router.query.id as string;

  const renderAlertTitle = useCallback(() => {
    if (
      experiment.state === ExperimentState.Running ||
      experiment.state === ExperimentState.Scheduled
    ) {
      return (
        <AlertTitle paddingTop={0.5}>
          {translate('Alert.Title.CustomConfigurationUsedInRunningExperiment')}
        </AlertTitle>
      );
    }

    if (experiment.state === ExperimentState.Draft) {
      return (
        <AlertTitle paddingTop={0.5}>
          {translate('Alert.Title.CustomConfigurationUsedInDraftExperiment')}
        </AlertTitle>
      );
    }

    return null;
  }, [translate, experiment.state]);

  if (!experiment) {
    return null;
  }

  return (
    <Alert
      severity='warning'
      variant='outlined'
      action={
        <Button
          onClick={() => {
            const url = buildExperienceAnalyticsUrlWithParams(
              analyticsExperimentsNavigationItem,
              {},
              Number(universeId),
            );
            router.push(`${url}/${experiment.id}/experiment-details`);
          }}
          color='inherit'
          size='small'>
          {translate('Button.GoToExperiment')}
        </Button>
      }>
      {renderAlertTitle()}
    </Alert>
  );
};

export default ConfigurationUsedInExperimentAlert;
