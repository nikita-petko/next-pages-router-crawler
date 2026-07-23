import type { ReactNode } from 'react';
import { useMemo } from 'react';
import { useRouter } from 'next/router';
import { Icon } from '@rbx/foundation-ui';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { formatTimeAgoCompact } from '@modules/charts-generic/utils/dateUtils';
import { analyticsAlertSeverityTranslationKey } from '@modules/experience-alerts/constants/alertFormConstants';
import {
  AnalyticsAlertFiringStatus,
  AnalyticsAlertSeverity,
  type AnalyticsAlertDetail,
} from '@modules/experience-alerts/constants/types';
import useAnalyticsAlertsListQuery from '@modules/experience-alerts/hooks/useAnalyticsAlertsListQuery';
import { buildExploreModeUrlFromAlertDetail } from '@modules/experience-alerts/utils/alertExploreModeUrls';
import { useUniverseResource } from '@modules/experience-analytics-shared/hooks/useChartResourceProvider';
import useRAQIV2TranslationDependencies from '@modules/experience-analytics-shared/hooks/useRAQIV2TranslationDependencies';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import OverviewAlertCurrentValueText from './OverviewAlertCurrentValueText';
import type { OverviewAlertRowProps } from './OverviewAlertRow';

/**
 * Severity icon for a firing-alert row. SEV_0/SEV_1/SEV_2 (most to least
 * severe) map to
 * `icon-regular-circle-x` / `icon-regular-triangle-exclamation` / `icon-regular-circle-i`.
 * Exhaustive switch so a future severity addition fails compilation here.
 */
const renderSeverityIcon = (severity: AnalyticsAlertSeverity): ReactNode => {
  switch (severity) {
    case AnalyticsAlertSeverity.SEV_0:
      return <Icon name='icon-regular-circle-x' size='Small' className='content-system-alert' />;
    case AnalyticsAlertSeverity.SEV_1:
      return (
        <Icon
          name='icon-regular-triangle-exclamation'
          size='Small'
          className='content-system-warning'
        />
      );
    case AnalyticsAlertSeverity.SEV_2:
      return <Icon name='icon-regular-circle-i' size='Small' className='content-default' />;
    default: {
      const exhaustiveCheck: never = severity;
      throw new Error(`Unhandled severity: ${String(exhaustiveCheck)}`);
    }
  }
};

/**
 * Severity ordering used for sorting SEV_0 -> SEV_1 -> SEV_2 (most to least
 * severe). Independent
 * from the numeric enum values so reordering the enum can't silently change
 * row order.
 */
const SEVERITY_SORT_RANK: Record<AnalyticsAlertSeverity, number> = {
  [AnalyticsAlertSeverity.SEV_0]: 0,
  [AnalyticsAlertSeverity.SEV_1]: 1,
  [AnalyticsAlertSeverity.SEV_2]: 2,
};

export type FiringAlertRowsResult = {
  rows: OverviewAlertRowProps[];
  isLoading: boolean;
  isError: boolean;
  totalCount: number;
};

/**
 * Fetches the list of currently firing alerts for the universe and converts
 * each entry into the props the compact `OverviewAlertRow` expects. Rows are
 * sorted SEV_0 -> SEV_1 -> SEV_2 (most to least severe), then by `lastFiredAt` desc.
 */
const useFiringAlertRows = (maxItems: number): FiringAlertRowsResult => {
  const { id: universeId } = useUniverseResource();
  const translationDependencies = useRAQIV2TranslationDependencies();
  const { translate } = translationDependencies;
  const router = useRouter();
  const referrer = btoa(router.asPath);

  const {
    data: firingAlerts = [],
    isLoading,
    isError,
  } = useAnalyticsAlertsListQuery(universeId, {
    firingStatus: AnalyticsAlertFiringStatus.Firing,
  });

  const sortedAlerts = useMemo(() => {
    return [...firingAlerts].sort((a, b) => {
      const severityDiff = SEVERITY_SORT_RANK[a.severity] - SEVERITY_SORT_RANK[b.severity];
      if (severityDiff !== 0) {
        return severityDiff;
      }
      const aTime = a.lastFiredAt?.getTime() ?? 0;
      const bTime = b.lastFiredAt?.getTime() ?? 0;
      return bTime - aTime;
    });
  }, [firingAlerts]);

  const rows = useMemo<OverviewAlertRowProps[]>(() => {
    return sortedAlerts.slice(0, maxItems).map((alert: AnalyticsAlertDetail) => {
      const severityLabel = translate(analyticsAlertSeverityTranslationKey(alert.severity));
      const text = translate(translationKey('Label.AlertIsFiring', TranslationNamespace.Insights), {
        severityLabel,
        alertName: alert.name,
        currentValue: '__CURRENT_VALUE__',
      });

      const [textBefore, textAfter = ''] = String(text).split('__CURRENT_VALUE__');

      return {
        icon: renderSeverityIcon(alert.severity),
        text: (
          <>
            {textBefore}
            <OverviewAlertCurrentValueText alert={alert} />
            {textAfter}
          </>
        ),
        action: {
          label: translate(
            translationKey('Label.Action.ViewChart', TranslationNamespace.Analytics),
          ),
          href: buildExploreModeUrlFromAlertDetail(alert, referrer),
        },
        timeAgo: alert.lastFiredAt ? formatTimeAgoCompact(alert.lastFiredAt, translate) : undefined,
        testId: `overview-alert-row-${alert.alertId}`,
      };
    });
  }, [sortedAlerts, maxItems, translate, referrer]);

  return {
    rows,
    isLoading,
    isError,
    totalCount: sortedAlerts.length,
  };
};

export default useFiringAlertRows;
