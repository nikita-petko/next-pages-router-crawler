import React, { FC, useMemo } from 'react';
import { CloseIcon, IconButton, Tooltip } from '@rbx/ui';
import { TranslationKey } from '@modules/analytics-translations';
import { urls } from '@modules/miscellaneous/common';
import CreatorDashboardLink from '@modules/miscellaneous/common/components/CreatorDashboardLink';
import useAnalyticsPageControlBarStyles from './ExperienceAnalyticsPageControlBar.styles';
import useRAQIV2TranslationDependencies from '../../hooks/useRAQIV2TranslationDependencies';
import { useUniverseResource } from '../../hooks/useChartResourceProvider';

type ExperienceAnalyticsFullScreenModeExitControlProps = {
  priorUri?: string | null;
  iconKey: TranslationKey;
};

const ExperienceAnalyticsFullScreenModeExitControl: FC<
  ExperienceAnalyticsFullScreenModeExitControlProps
> = ({ priorUri, iconKey }) => {
  const {
    classes: { controlBarIconButton },
  } = useAnalyticsPageControlBarStyles();
  const { translate } = useRAQIV2TranslationDependencies();
  const { id: universeId } = useUniverseResource();

  const href = useMemo(() => {
    if (priorUri) {
      return priorUri;
    }
    return urls.creatorHub.dashboard.getExperienceOverviewUrl(universeId);
  }, [priorUri, universeId]);

  const iconLabel = useMemo(() => translate(iconKey), [iconKey, translate]);
  return (
    <CreatorDashboardLink href={href}>
      <Tooltip title={iconLabel} arrow placement='top'>
        <IconButton aria-label={iconLabel} classes={{ root: controlBarIconButton }}>
          <CloseIcon fontSize='large' color='secondary' />
        </IconButton>
      </Tooltip>
    </CreatorDashboardLink>
  );
};
export default ExperienceAnalyticsFullScreenModeExitControl;
