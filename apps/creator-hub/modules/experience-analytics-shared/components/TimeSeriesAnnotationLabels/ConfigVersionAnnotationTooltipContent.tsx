import React, { FC, useMemo } from 'react';
import { AnnotationType } from '@modules/clients/analytics';
import { makeStyles } from '@rbx/ui';
import { Link } from '@modules/miscellaneous/common';
import {
  TimeSeriesAnnotation,
  analyticsConfigsHistoryNavigationItem,
  AnalyticsQueryParams,
  DateRangeType,
  buildExperienceAnalyticsUrlWithParams,
} from '@modules/charts-generic';
import { useUniverseResource } from '../../hooks/useChartResourceProvider';

const useStyles = makeStyles()(() => ({
  textContainer: {
    padding: '6px 8px',
    fontSize: '12px',
  },
}));

// Buffer around the annotation timestamp to ensure the version is visible in the date range
const DATE_BUFFER_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

type ConfigVersionAnnotationTooltipContentProps = {
  annotation: TimeSeriesAnnotation & { type: AnnotationType.ConfigVersion };
};

const ConfigVersionAnnotationTooltipContent: FC<ConfigVersionAnnotationTooltipContentProps> = ({
  annotation,
}) => {
  const {
    classes: { textContainer },
  } = useStyles();

  const { id: universeId } = useUniverseResource();

  const historyUrl = useMemo(() => {
    // Only build URL if we have a valid version number
    if (annotation.version === undefined) {
      return null;
    }

    // Set date range to include the annotation time with some buffer
    const annotationTime = annotation.startUtc.getTime();
    const minTime = annotationTime - DATE_BUFFER_MS;
    const maxTime = annotationTime + DATE_BUFFER_MS;

    return buildExperienceAnalyticsUrlWithParams(
      analyticsConfigsHistoryNavigationItem,
      {
        [AnalyticsQueryParams.ConfigVersion]: String(annotation.version),
        [AnalyticsQueryParams.MinTime]: String(minTime),
        [AnalyticsQueryParams.MaxTime]: String(maxTime),
        [AnalyticsQueryParams.RangeType]: DateRangeType.Custom,
      },
      universeId,
    );
  }, [annotation.version, annotation.startUtc, universeId]);

  // If no version available, just show plain text without link
  if (!historyUrl) {
    return <div className={textContainer}>{annotation.text}</div>;
  }

  return (
    <div className={textContainer}>
      <Link href={historyUrl} color='inherit' underline='always'>
        {annotation.text}
      </Link>
    </div>
  );
};

export default ConfigVersionAnnotationTooltipContent;
