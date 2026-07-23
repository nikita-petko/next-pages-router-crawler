import React, { useCallback } from 'react';
import CreatorDashboardLink from '@modules/miscellaneous/common/components/CreatorDashboardLink';
import { IconButton, LinkIcon, Tooltip } from '@rbx/ui';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { translationKey } from '@modules/analytics-translations';
import useRAQIV2TranslationDependencies from '../../hooks/useRAQIV2TranslationDependencies';
import useAnalyticsPageControlBarStyles from './ExperienceAnalyticsPageControlBar.styles';

const ExperienceAnalyticsPermalinkIcon = ({ overrideUrl }: { overrideUrl?: string }) => {
  const {
    classes: { controlBarIconButton },
  } = useAnalyticsPageControlBarStyles();

  const onClick = useCallback(async () => {
    const url = overrideUrl ?? window.location.href;
    await navigator.clipboard.writeText(url);
  }, [overrideUrl]);

  const { translate } = useRAQIV2TranslationDependencies();
  const label = translate(
    translationKey('Description.PagePermalinkTooltip', TranslationNamespace.Analytics),
  );

  return (
    <CreatorDashboardLink href={window.location.href} onClick={onClick}>
      <Tooltip title={label} arrow placement='top'>
        <IconButton aria-label={label} classes={{ root: controlBarIconButton }}>
          <LinkIcon fontSize='large' color='secondary' />
        </IconButton>
      </Tooltip>
    </CreatorDashboardLink>
  );
};
export default ExperienceAnalyticsPermalinkIcon;
