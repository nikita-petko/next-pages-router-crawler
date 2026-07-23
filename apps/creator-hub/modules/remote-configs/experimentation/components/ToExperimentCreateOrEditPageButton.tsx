import React, { useMemo } from 'react';
import { Button } from '@rbx/ui';
import type { FormattedText } from '@modules/analytics-translations/types';
import { analyticsExperimentsCreateNavigationItem } from '@modules/charts-generic/constants/analyticsNavigationItems';
import AnalyticsQueryParams from '@modules/charts-generic/enums/AnalyticsQueryParams';
import buildExperienceAnalyticsUrlWithParams, {
  type AnalyticsSearchParams,
} from '@modules/charts-generic/utils/analyticsUrlBuilder';
import { useUniverseResource } from '@modules/experience-analytics-shared/hooks/useChartResourceProvider';
import { Link } from '@modules/miscellaneous/components';
import type { ValidExperiment } from '../../api/validExperimentationTypes';
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
