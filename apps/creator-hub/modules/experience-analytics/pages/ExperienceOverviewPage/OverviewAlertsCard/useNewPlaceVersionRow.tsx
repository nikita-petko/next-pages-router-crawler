import { useMemo } from 'react';
import { RAQIV2DateRangeType } from '@rbx/creator-hub-analytics-config';
import { InfoOutlinedIcon } from '@rbx/ui';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { useUniverseResource } from '@modules/experience-analytics-shared/hooks/useChartResourceProvider';
import useNewPlaceVersion from '@modules/experience-analytics-shared/hooks/useNewPlaceVersion';
import useRAQIV2TranslationDependencies from '@modules/experience-analytics-shared/hooks/useRAQIV2TranslationDependencies';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { creatorHub } from '@modules/miscellaneous/urls';
import type { OverviewAlertRowProps } from './OverviewAlertRow';

/**
 * Returns the `OverviewAlertRow` props for the "Vxxxx is live" entry, or
 * `null` when there is no new place version to surface. The row intentionally
 * omits `timeAgo` because the publish time isn't a meaningful "firing" age.
 */
const useNewPlaceVersionRow = (
  onMonitorClick?: (versionNumber: number) => void,
): OverviewAlertRowProps | null => {
  const { translate } = useRAQIV2TranslationDependencies();
  const resource = useUniverseResource();
  const newVersion = useNewPlaceVersion();

  return useMemo<OverviewAlertRowProps | null>(() => {
    if (newVersion === null) {
      return null;
    }
    const monitorHref = `${creatorHub.dashboard.getAnalyticsPerformanceUrl(resource.id)}?rangeType=${RAQIV2DateRangeType.Last1Day}`;
    return {
      icon: <InfoOutlinedIcon color='info' fontSize='small' />,
      text: translate(
        translationKey('Title.NewPlaceVersionLiveBanner', TranslationNamespace.Analytics),
        { versionNumber: `${newVersion}` },
      ),
      action: {
        label: translate(translationKey('Action.Monitor', TranslationNamespace.Analytics)),
        href: monitorHref,
        onClick: onMonitorClick ? () => onMonitorClick(newVersion) : undefined,
      },
      testId: 'overview-alert-row-new-place-version',
    };
  }, [newVersion, onMonitorClick, resource.id, translate]);
};

export default useNewPlaceVersionRow;
