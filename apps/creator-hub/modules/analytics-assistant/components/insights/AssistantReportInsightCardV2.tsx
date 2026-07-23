import React, { useCallback, useMemo, useRef } from 'react';
import { withTranslation } from '@rbx/intl';
import {
  Card,
  CardHeader,
  CardContent,
  Grid,
  Typography,
  makeStyles,
  Link,
  Button,
  Chip,
  BoltIcon,
} from '@rbx/ui';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { formatDateRange } from '@modules/charts-generic/charts/formatters/timeFormatters';
import useImpressionObserver from '@modules/charts-generic/charts/hooks/useImpressionObserver';
import { analyticsAssistantNavigationItem } from '@modules/charts-generic/constants/analyticsNavigationItems';
import useLocale from '@modules/charts-generic/context/useLocale';
import AnalyticsQueryParams from '@modules/charts-generic/enums/AnalyticsQueryParams';
import buildExperienceAnalyticsUrlWithParams from '@modules/charts-generic/utils/analyticsUrlBuilder';
import { useUniverseResource } from '@modules/experience-analytics-shared/hooks/useChartResourceProvider';
import useRAQIV2TranslationDependencies from '@modules/experience-analytics-shared/hooks/useRAQIV2TranslationDependencies';
import type {
  SummaryReport7DaysCardSpec,
  SummaryReportCardSpec,
} from '@modules/experience-analytics-shared/types/insights';
import InsightActionMenu from '@modules/experience-analytics/components/insights/InsightActionMenu';
import Flex from '@modules/miscellaneous/components/Flex';
import { useUnifiedLoggerProvider } from '@modules/miscellaneous/hooks/UnifiedLoggerProvider';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useSnoozeInsight } from '@modules/react-query/universeAnalyticsInsights';
import AssistantSummaryDisplayConfigs from '../../constants/AssistantSummaryDisplayConfigs';
import {
  AssistantClickEventName,
  logAssistantEvent,
  AssistantImpressionEventName,
} from '../../utils/AssistantLogger';
import useAssistantCardStyles from '../AssistantCard.styles';
import MDX from '../markdown/MDX';

const useAssistantReportInsightCardV2Styles = makeStyles()((theme) => ({
  fadeTextContainer: {
    // Sourced from: https://stackoverflow.com/a/58740440
    '-webkit-mask-image': 'linear-gradient(to bottom, black 50%, transparent 100%)',
    'mask-image': 'linear-gradient(to bottom, black 50%, transparent 100%)',
  },
  link: {
    fontWeight: theme.typography.fontWeightBold,
  },
  cardRow: {
    marginTop: theme.spacing(2),
  },
}));

const AssistantReportInsightCardV2: React.FC<{
  spec: SummaryReportCardSpec | SummaryReport7DaysCardSpec;
}> = ({ spec }) => {
  const locale = useLocale();
  const { id: universeId } = useUniverseResource();
  const {
    classes: { header, cardContent, titleItem },
  } = useAssistantCardStyles();
  const {
    classes: { link, cardRow, fadeTextContainer },
  } = useAssistantReportInsightCardV2Styles();
  const { unifiedLogger } = useUnifiedLoggerProvider();
  const { mutate: snoozeInsight } = useSnoozeInsight(universeId, spec.type, spec.snoozeKey);
  const onSnooze = useCallback(() => {
    snoozeInsight();
    logAssistantEvent(unifiedLogger, AssistantClickEventName.AssistantInsightEntrypointSnooze, {
      universe_id: universeId,
      insight_type: spec.type,
    });
  }, [snoozeInsight, unifiedLogger, universeId, spec.type]);
  const { translate } = useRAQIV2TranslationDependencies();
  const { insight, summary } = AssistantSummaryDisplayConfigs[spec.type];
  const { reportSummary, newSignalCount } = spec;

  const titleKey = useMemo(() => {
    if (insight) {
      return insight.titleKey;
    }
    return summary.titleKey;
  }, [insight, summary]);

  const href = useMemo(
    () =>
      buildExperienceAnalyticsUrlWithParams(
        analyticsAssistantNavigationItem,
        {
          [AnalyticsQueryParams.InsightId]: spec.insightId,
        },
        universeId,
      ),
    [spec.insightId, universeId],
  );

  const logPrimaryCTAClick = useCallback(() => {
    logAssistantEvent(unifiedLogger, AssistantClickEventName.AssistantInsightEntrypointPrimaryCTA, {
      universeId,
      insightType: spec.type,
      insightId: spec.insightId,
    });
  }, [unifiedLogger, universeId, spec.type, spec.insightId]);

  const primaryCTA = useMemo(() => {
    return (
      <Link href={href} color='inherit' underline='none' onClick={logPrimaryCTAClick}>
        <Button variant='contained' color='secondary'>
          <Typography variant='body1' className={link}>
            {translate(
              translationKey('Action.SeeFullReport', TranslationNamespace.AnalyticsAssistant),
            )}
          </Typography>
        </Button>
      </Link>
    );
  }, [link, translate, href, logPrimaryCTAClick]);

  const cardRef = useRef<HTMLDivElement>(null);
  const logImpression = useCallback(() => {
    logAssistantEvent(
      unifiedLogger,
      AssistantImpressionEventName.AssistantInsightEntrypointImpression,
      {
        universe_id: universeId,
        insight_type: spec.type,
        insight_id: spec.insightId,
      },
    );
  }, [unifiedLogger, universeId, spec.type, spec.insightId]);
  useImpressionObserver(cardRef, logImpression);

  const adornment = useMemo(() => {
    if (newSignalCount === 0) {
      return null;
    }
    return (
      <Chip
        label={
          <Flex alignItems='center' gap={0.5}>
            <BoltIcon color='inherit' fontSize='small' />
            <Typography variant='smallLabel2'>
              {translate(
                translationKey('Label.NewSignal.Multiple', TranslationNamespace.AnalyticsAssistant),
                { num: newSignalCount.toString() },
              )}
            </Typography>
          </Flex>
        }
        color='secondary'
        size='small'
        className={titleItem}
      />
    );
  }, [newSignalCount, translate, titleItem]);

  return (
    <Card ref={cardRef}>
      <CardHeader
        className={header}
        title={
          <Flex justifyContent='space-between' alignItems='center'>
            <Grid container alignItems='inherit' direction='row'>
              <Typography variant='h6' color='primary' className={titleItem}>
                {translate(titleKey, {
                  dateRange: formatDateRange(
                    locale,
                    spec.startDate,
                    spec.endDate,
                    'UTC',
                    true,
                    true,
                  ),
                })}
              </Typography>
              {adornment}
            </Grid>
            <Grid item>
              {spec.snoozeKey && <InsightActionMenu onSnooze={onSnooze} useVerticalIcon />}
            </Grid>
          </Flex>
        }
      />
      <CardContent className={cardContent}>
        <Typography variant='body1' component='p' className={fadeTextContainer}>
          <MDX content={reportSummary} />
        </Typography>
        <Flex
          classes={{ root: cardRow }}
          justifyContent='space-between'
          alignItems='center'
          flexWrap='wrap'>
          {primaryCTA}
          <Typography variant='legalDisclaimer' color='secondary'>
            {translate(
              translationKey(
                'Label.SummaryReportInsightCard.Disclaimer',
                TranslationNamespace.AnalyticsAssistant,
              ),
            )}
          </Typography>
        </Flex>
      </CardContent>
    </Card>
  );
};

export default withTranslation(AssistantReportInsightCardV2, [
  TranslationNamespace.Analytics,
  TranslationNamespace.Creations,
  TranslationNamespace.Navigation,
  TranslationNamespace.AnalyticsAssistant,
  TranslationNamespace.Insights,
]);
