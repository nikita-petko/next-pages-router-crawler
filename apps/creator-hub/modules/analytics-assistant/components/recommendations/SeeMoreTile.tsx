import { useRouter } from 'next/router';
import type { FC } from 'react';
import { useCallback, useMemo } from 'react';
import type { FormattedText } from '@modules/analytics-translations/types';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { analyticsAssistantNavigationItem } from '@modules/charts-generic/constants/analyticsNavigationItems';
import AnalyticsQueryParams from '@modules/charts-generic/enums/AnalyticsQueryParams';
import buildExperienceAnalyticsUrlWithParams from '@modules/charts-generic/utils/analyticsUrlBuilder';
import { useUniverseResource } from '@modules/experience-analytics-shared/hooks/useChartResourceProvider';
import useRAQIV2TranslationDependencies from '@modules/experience-analytics-shared/hooks/useRAQIV2TranslationDependencies';
import { useUnifiedLoggerProvider } from '@modules/miscellaneous/hooks/UnifiedLoggerProvider';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { logAssistantEvent, AssistantImpressionEventName } from '../../utils/AssistantLogger';
import GenericTile from './GenericTile';

type SeeMoreTileProps = {
  insightId: string;
  numActions: number;
};

const SeeMoreTile: FC<SeeMoreTileProps> = ({ insightId, numActions }) => {
  const { translate } = useRAQIV2TranslationDependencies();
  const { id: universeId } = useUniverseResource();
  const router = useRouter();
  const { unifiedLogger } = useUnifiedLoggerProvider();

  const header = useMemo(() => {
    return translate(translationKey('Title.SeeMore', TranslationNamespace.AnalyticsAssistant));
  }, [translate]);

  const subheading = useMemo(() => {
    return numActions > 0
      ? translate(translationKey('Description.SeeMore', TranslationNamespace.AnalyticsAssistant), {
          numActions: numActions.toString(),
        })
      : ('' as FormattedText);
  }, [translate, numActions]);

  const href = useMemo(
    () =>
      buildExperienceAnalyticsUrlWithParams(
        analyticsAssistantNavigationItem,
        {
          [AnalyticsQueryParams.InsightId]: insightId,
        },
        universeId,
      ),
    [insightId, universeId],
  );

  const onImpression = useCallback(() => {
    logAssistantEvent(
      unifiedLogger,
      AssistantImpressionEventName.AssistantReportSeeMoreImpression,
      {
        universeId,
        insightId,
      },
    );
  }, [unifiedLogger, universeId, insightId]);

  const onClick = useCallback(() => {
    router.push(href);
  }, [href, router]);

  return (
    <GenericTile
      headerText={header}
      subheadingText={subheading}
      onClick={onClick}
      onImpression={onImpression}
    />
  );
};

export default SeeMoreTile;
