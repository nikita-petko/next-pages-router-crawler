import React, { useMemo } from 'react';
import { Button } from '@rbx/ui';
import {
  analyticsExperimentsCreateNavigationItem,
  AnalyticsQueryParams,
  buildExperienceAnalyticsUrlWithParams,
} from '@modules/charts-generic';
import { Link } from '@modules/miscellaneous/common';
import { useRouter } from 'next/router';
import { ExperimentProductType } from '@modules/remote-configs/api/universeExperimentationClientEnums';

type ToExperimentCreationPageButtonProps = {
  className?: string;
  variant?: React.ComponentProps<typeof Button>['variant'];
  color?: React.ComponentProps<typeof Button>['color'];
  size?: React.ComponentProps<typeof Button>['size'];
  label: string;
  experimentId?: string;
};

const ToMatchmakingExperimentCreateOrEditPageButton = ({
  className,
  variant = 'contained',
  color = 'primaryBrand',
  size = 'meidum',
  label,
  experimentId,
}: ToExperimentCreationPageButtonProps) => {
  const router = useRouter();
  const universeId = router.query.id as string;

  const href = useMemo(
    () =>
      buildExperienceAnalyticsUrlWithParams(
        analyticsExperimentsCreateNavigationItem,
        {
          [AnalyticsQueryParams.ExperimentType]: ExperimentProductType.Matchmaking,
          ...(experimentId && { [AnalyticsQueryParams.ExperimentId]: experimentId }),
        },
        Number(universeId),
      ),
    [universeId, experimentId],
  );

  return (
    <Link href={href} underline='none'>
      <Button className={className} variant={variant} color={color} size={size}>
        {label}
      </Button>
    </Link>
  );
};

export default ToMatchmakingExperimentCreateOrEditPageButton;
