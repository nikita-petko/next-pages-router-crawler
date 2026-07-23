import React, { useMemo } from 'react';
import { Button } from '@rbx/ui';
import {
  AnalyticsQueryParams,
  AnalyticsSearchParams,
  analyticsExperimentsCreateNavigationItem,
  buildExperienceAnalyticsUrlWithParams,
} from '@modules/charts-generic';
import { useUniverseResource } from '@modules/experience-analytics-shared';
import { FormattedText } from '@modules/analytics-translations';
import { Link } from '@modules/miscellaneous/common';
import { ValidExperiment } from '../../api/validExperimentationTypes';
import { isExperimentReschedulatbleOnly } from '../../utils/experimentProperties';
import { ExperimentCreationSteps } from '../hooks/useCreationStepAndQueryParams';

type ToExperimentCreationPageButtonProps = {
  variant?: React.ComponentProps<typeof Button>['variant'];
  color?: React.ComponentProps<typeof Button>['color'];
  size?: React.ComponentProps<typeof Button>['size'];
  label: FormattedText;
  experiment?: Pick<ValidExperiment, 'id' | 'experimentType' | 'state'>;
};

const ToExperimentCreateOrEditPageButton = ({
  variant = 'contained',
  color = 'primaryBrand',
  size = 'meidum',
  label,
  experiment,
}: ToExperimentCreationPageButtonProps) => {
  const { id: universeId } = useUniverseResource();

  const href = useMemo(() => {
    const params: AnalyticsSearchParams = {};
    if (experiment) {
      params[AnalyticsQueryParams.ExperimentId] = experiment.id;
      params[AnalyticsQueryParams.ExperimentType] = experiment.experimentType;
      if (isExperimentReschedulatbleOnly(experiment.state)) {
        params[AnalyticsQueryParams.ExperimentStep] = ExperimentCreationSteps.Review;
      }
    }

    return buildExperienceAnalyticsUrlWithParams(
      analyticsExperimentsCreateNavigationItem,
      params,
      universeId,
    );
  }, [experiment, universeId]);

  return (
    <Link href={href} underline='none'>
      <Button variant={variant} color={color} size={size}>
        {label}
      </Button>
    </Link>
  );
};

export default ToExperimentCreateOrEditPageButton;
