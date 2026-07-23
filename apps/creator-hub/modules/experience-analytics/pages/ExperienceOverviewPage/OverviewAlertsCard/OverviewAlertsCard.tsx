import type { FC } from 'react';
import { useCallback, useMemo } from 'react';
import { Button } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { Card, Skeleton } from '@rbx/ui';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { useUniverseResource } from '@modules/experience-analytics-shared/hooks/useChartResourceProvider';
import { useUnifiedLoggerProvider } from '@modules/miscellaneous/hooks/UnifiedLoggerProvider';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { creatorHub } from '@modules/miscellaneous/urls';
import Section from '../../../components/Section';
import {
  logClickOverviewAlertViewChart,
  logClickOverviewAlertsViewAll,
  logClickOverviewNewPlaceVersionMonitor,
} from '../logger';
import OverviewAlertRow, { type OverviewAlertRowProps } from './OverviewAlertRow';
import useFiringAlertRows from './useFiringAlertRows';
import useNewPlaceVersionRow from './useNewPlaceVersionRow';

const MAX_VISIBLE_ROWS = 5;
const NUM_LOADING_SKELETON_ROWS = 2;

/**
 * Minimum card width sized to fit the longest expected single-line alert
 * sentence at the smallest supported font size; below this width the row text
 * wraps awkwardly across three+ lines and the "View chart" link drops onto a
 * line of its own.
 */
const CARD_MIN_WIDTH_PX = 314;

const OverviewAlertsCard: FC = () => {
  const { translate } = useTranslationWrapper(useTranslation());
  const { id: universeId } = useUniverseResource();
  const { unifiedLogger } = useUnifiedLoggerProvider();

  const firingResult = useFiringAlertRows(MAX_VISIBLE_ROWS);
  const { rows: firingRows, isLoading: isFiringLoading } = firingResult;

  const handleMonitorClick = useCallback(
    (versionNumber: number) => {
      logClickOverviewNewPlaceVersionMonitor(unifiedLogger, universeId, versionNumber);
    },
    [unifiedLogger, universeId],
  );
  const newPlaceVersionRow = useNewPlaceVersionRow(handleMonitorClick);

  // Firing alerts arrive already sorted/capped from the hook; the
  // new-place-version row is pinned to the bottom and counts toward
  // MAX_VISIBLE_ROWS so the card never exceeds that height.
  const visibleRows = useMemo<OverviewAlertRowProps[]>(() => {
    const combined: OverviewAlertRowProps[] = [];
    if (newPlaceVersionRow) {
      const firingSliceLength = Math.max(0, MAX_VISIBLE_ROWS - 1);
      combined.push(...firingRows.slice(0, firingSliceLength));
      combined.push(newPlaceVersionRow);
    } else {
      combined.push(...firingRows.slice(0, MAX_VISIBLE_ROWS));
    }
    return combined.map((row) => {
      if (!row.action || row.action.onClick) {
        return row;
      }
      // Firing-alert rows reach here without an onClick; attach the View
      // Chart logger keyed on the alertId encoded in `testId`.
      const { testId } = row;
      if (
        testId === undefined ||
        !testId.startsWith('overview-alert-row-') ||
        testId === 'overview-alert-row-new-place-version'
      ) {
        return row;
      }
      const alertId = testId.replace('overview-alert-row-', '');
      return {
        ...row,
        action: {
          ...row.action,
          onClick: () => logClickOverviewAlertViewChart(unifiedLogger, universeId, alertId),
        },
      };
    });
  }, [firingRows, newPlaceVersionRow, unifiedLogger, universeId]);

  if (!isFiringLoading && visibleRows.length === 0) {
    return null;
  }

  const viewAllAction = (
    <Button
      data-testid='overview-alerts-view-all-link'
      as='a'
      variant='ActionUtility'
      size='XSmall'
      href={`${creatorHub.dashboard.getExperienceAlertsUrl(universeId)}?tab=AlertConfiguration-Analytics`}
      onClick={() => logClickOverviewAlertsViewAll(unifiedLogger, universeId)}>
      {translate(translationKey('Label.ViewAll', TranslationNamespace.Insights))}
    </Button>
  );

  return (
    <Section
      title={translate(translationKey('Heading.Alerts', TranslationNamespace.Navigation))}
      action={viewAllAction}
      alwaysInlineAction>
      <Card
        className='bg-surface-100 width-full'
        style={{ minWidth: CARD_MIN_WIDTH_PX }}
        data-testid='overview-alerts-card'>
        {isFiringLoading && visibleRows.length === 0 ? (
          <ul
            className='margin-none padding-xlarge list-none flex flex-col gap-xlarge'
            style={{ listStyle: 'none' }}>
            {Array.from({ length: NUM_LOADING_SKELETON_ROWS }).map((_, i) => (
              <li
                // oxlint-disable-next-line react/no-array-index-key -- static skeleton placeholders, no semantic identity
                key={`overview-alerts-skeleton-${i}`}>
                <Skeleton animate width='100%' height={20} />
              </li>
            ))}
          </ul>
        ) : (
          <ul
            className='margin-none padding-xlarge list-none flex flex-col gap-xlarge'
            style={{ listStyle: 'none' }}>
            {visibleRows.map((row) => (
              <OverviewAlertRow
                key={row.testId ?? `overview-alert-row-${row.timeAgo ?? ''}`}
                {...row}
              />
            ))}
          </ul>
        )}
      </Card>
    </Section>
  );
};

export default OverviewAlertsCard;
