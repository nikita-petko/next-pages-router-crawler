import {
  analyticsAssistantNavigationItem,
  AnalyticsQueryParams,
  buildExperienceAnalyticsUrlWithParams,
} from '@modules/charts-generic';
import { FormattedText, translationKey } from '@modules/analytics-translations';
import {
  useRAQIV2TranslationDependencies,
  useUniverseResource,
} from '@modules/experience-analytics-shared';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useRouter } from 'next/router';
import React, { FC, useCallback, useMemo } from 'react';
import { useUnifiedLoggerProvider } from '@modules/miscellaneous/hooks/UnifiedLoggerProvider';
import GenericTile from './GenericTile';
import { logAssistantEvent, AssistantImpressionEventName } from '../../utils/AssistantLogger';

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
