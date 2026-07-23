import type { FC } from 'react';
import React, { Fragment, useCallback, useMemo, useRef, useState } from 'react';
import { FeedbackRating } from '@rbx/conv-ai-provider';
import { Icon } from '@rbx/foundation-ui';
import {
  Card,
  CardContent,
  CardHeader,
  Grid,
  IconButton,
  Typography,
  Divider,
  Select,
  MenuItem,
} from '@rbx/ui';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { formatDateRange } from '@modules/charts-generic/charts/formatters/timeFormatters';
import useImpressionObserver from '@modules/charts-generic/charts/hooks/useImpressionObserver';
import useLocale from '@modules/charts-generic/context/useLocale';
import AnalyticsQueryParams from '@modules/charts-generic/enums/AnalyticsQueryParams';
import OnboardingTipsCarousel from '@modules/experience-analytics-shared/components/OnboardingTips/OnboardingTipsCarousel';
import {
  OnboardingFeatureKey,
  OnboardingStepKey,
} from '@modules/experience-analytics-shared/constants/onboardingTipsConfigs';
import { useUniverseResource } from '@modules/experience-analytics-shared/hooks/useChartResourceProvider';
import useRAQIV2TranslationDependencies from '@modules/experience-analytics-shared/hooks/useRAQIV2TranslationDependencies';
import type {
  SummaryReport7DaysCardSpec,
  SummaryReportCardSpec,
} from '@modules/experience-analytics-shared/types/insights';
import Flex from '@modules/miscellaneous/components/Flex';
import { useQueryParams } from '@modules/miscellaneous/hooks';
import { useUnifiedLoggerProvider } from '@modules/miscellaneous/hooks/UnifiedLoggerProvider';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import AssistantSummaryDisplayConfigs from '../../../constants/AssistantSummaryDisplayConfigs';
import { useAssistantSurfaceContext } from '../../../context/AssistantSurfaceContextProvider';
import type { AssistantSummaryInsightSpec } from '../../../types/AssistantSummaryInsightSpec';
import { isPlayerFeedbackReport } from '../../../types/AssistantSummaryInsightType';
import {
  logAssistantEvent,
  AssistantClickEventName,
  AssistantImpressionEventName,
} from '../../../utils/AssistantLogger';
import useAssistantCardStyles from '../../AssistantCard.styles';
import AssistantDisclaimer from '../../disclaimer/AssistantDisclaimer';
import FeedbackDialog from '../../feedback/FeedbackDialogue';
import FeedbackNegativeIcon from '../../feedback/FeedbackNegativeIcon';
import FeedbackPositiveIcon from '../../feedback/FeedbackPositiveIcon';
import AssistantReportV2 from './AssistantReportV2';
import InsightDisclaimerAlertV2 from './InsightDisclaimerAlertV2';

const FEEDBACK_DIALOGUE_CHARACTER_LIMIT = 500;

const HISTORICAL_REPORT_SELECT_MENU_MAX_HEIGHT_PX = 200;

const AssistantReportCardV2: FC<{
  assistantSummarySpec: AssistantSummaryInsightSpec;
}> = ({ assistantSummarySpec }) => {
  const { historicalSummaryInsights, isHistoricalSummaryReportInsightsLoading } =
    useAssistantSurfaceContext();

  const locale = useLocale();
  const {
    classes: {
      contentContainer,
      headerV2,
      card,
      cardContent,
      titleItem,
      centrallyAlignItems,
      transparent,
      noPadding,
      fullHeight,
    },
    cx,
  } = useAssistantCardStyles();
  const [feedbackDialogueOpen, setFeedbackDialogueOpen] = useState(false);
  const [rating, setRating] = useState<FeedbackRating>();
  const [feedbackId, setFeedbackId] = useState<string>('');
  const { translate } = useRAQIV2TranslationDependencies();
  const { id: universeId } = useUniverseResource();
  const { unifiedLogger } = useUnifiedLoggerProvider();
  const cardRef = useRef<HTMLDivElement>(null);

  const historicalReportLoggingFields = useMemo(() => {
    const newest = historicalSummaryInsights?.[0];
    if (!newest) {
      return { isHistoricalReport: false as const };
    }
    return {
      isHistoricalReport: assistantSummarySpec.insightId !== newest.insightId,
    };
  }, [assistantSummarySpec.insightId, historicalSummaryInsights]);

  const onReportImpression = useCallback(() => {
    logAssistantEvent(unifiedLogger, AssistantImpressionEventName.AssistantReportImpression, {
      universeId,
      insightId: assistantSummarySpec.insightId,
      insightType: assistantSummarySpec.type,
      reportStartDate: assistantSummarySpec.startDate,
      reportEndDate: assistantSummarySpec.endDate,
      isHistoricalReport: historicalReportLoggingFields.isHistoricalReport,
    });
  }, [
    assistantSummarySpec.endDate,
    assistantSummarySpec.insightId,
    assistantSummarySpec.startDate,
    assistantSummarySpec.type,
    historicalReportLoggingFields.isHistoricalReport,
    unifiedLogger,
    universeId,
  ]);
  useImpressionObserver(cardRef, onReportImpression, { resetOncePer: 'callback' });

  const closeFeedbackDialogue = useCallback(() => {
    setFeedbackDialogueOpen(false);
  }, []);
  const handleRatingClick = useCallback(
    (ratingVal: FeedbackRating) => {
      const newFeedbackId = crypto.randomUUID();
      setFeedbackId(newFeedbackId);
      setRating(ratingVal);
      setFeedbackDialogueOpen(true);

      logAssistantEvent(unifiedLogger, AssistantClickEventName.AssistantReportFeedback, {
        universeId,
        insightId: assistantSummarySpec.insightId,
        insightType: assistantSummarySpec.type,
        reportStartDate: assistantSummarySpec.startDate,
        reportEndDate: assistantSummarySpec.endDate,
        isHistoricalReport: historicalReportLoggingFields.isHistoricalReport,
        rating: ratingVal,
        feedbackId: newFeedbackId,
      });
    },
    [
      assistantSummarySpec.endDate,
      assistantSummarySpec.insightId,
      assistantSummarySpec.startDate,
      assistantSummarySpec.type,
      historicalReportLoggingFields.isHistoricalReport,
      unifiedLogger,
      universeId,
    ],
  );

  const {
    summary: { titleKey },
    feedback: { upvoteOptions, downvoteOptions },
  } = useMemo(
    () => AssistantSummaryDisplayConfigs[assistantSummarySpec.type],
    [assistantSummarySpec.type],
  );

  const feedbackActions = useMemo(
    () => (
      <Grid
        container
        justifyContent='flex-end'
        alignItems='center'
        spacing={1}
        sx={{ marginTop: '0', marginLeft: '0', width: '100%' }}>
        <Grid item>
          <Typography variant='caption' color='secondary'>
            {translate(translationKey('Label.Assistant.Feedback', TranslationNamespace.Analytics))}
          </Typography>
        </Grid>
        <Grid item>
          <IconButton
            aria-label='ThumbUp'
            color='secondary'
            size='small'
            onClick={() => handleRatingClick(FeedbackRating.Positive)}>
            <FeedbackPositiveIcon filled={rating === FeedbackRating.Positive} size={20} />
          </IconButton>
        </Grid>
        <Grid item>
          <IconButton
            aria-label='ThumbDown'
            color='secondary'
            size='small'
            onClick={() => handleRatingClick(FeedbackRating.Negative)}>
            <FeedbackNegativeIcon filled={rating === FeedbackRating.Negative} size={20} />
          </IconButton>
        </Grid>
      </Grid>
    ),
    [handleRatingClick, rating, translate],
  );

  const [{ [AnalyticsQueryParams.InsightId]: insightIdParam }, setQueryParamValues] =
    useQueryParams([AnalyticsQueryParams.InsightId]);

  const selectedInsightId = useMemo(() => {
    if (insightIdParam === undefined || insightIdParam === null) {
      return assistantSummarySpec.insightId;
    }
    if (Array.isArray(insightIdParam)) {
      return insightIdParam[0] ?? assistantSummarySpec.insightId;
    }
    return insightIdParam || assistantSummarySpec.insightId;
  }, [insightIdParam, assistantSummarySpec.insightId]);

  const handleHistoricalReportChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const nextInsightId = event.target.value;
      if (!nextInsightId || nextInsightId === selectedInsightId) {
        return;
      }

      logAssistantEvent(unifiedLogger, AssistantClickEventName.AssistantHistoricalReportSelect, {
        universeId,
        fromInsightId: selectedInsightId,
        toInsightId: nextInsightId,
      });
      setQueryParamValues({ [AnalyticsQueryParams.InsightId]: nextInsightId });
    },
    [selectedInsightId, setQueryParamValues, unifiedLogger, universeId],
  );

  const historicalReportSelector = useMemo(() => {
    // When historical summary insights are gated (null), show date range only without dropdown
    const baseOptions = historicalSummaryInsights ?? [];
    if (isPlayerFeedbackReport(assistantSummarySpec.type) || baseOptions.length === 0) {
      return (
        <Typography variant='captionHeader' color='secondary' noWrap>
          {formatDateRange(
            locale,
            assistantSummarySpec.startDate,
            assistantSummarySpec.endDate,
            'UTC',
            true,
            true,
          )}
        </Typography>
      );
    }
    const currentInList = baseOptions.some((s) => s.insightId === selectedInsightId);
    const options = currentInList
      ? baseOptions
      : [
          {
            insightId: selectedInsightId,
            startDate: assistantSummarySpec.startDate,
            endDate: assistantSummarySpec.endDate,
          } as SummaryReportCardSpec | SummaryReport7DaysCardSpec,
          ...baseOptions,
        ];
    return (
      <Flex alignItems='center'>
        <Select
          value={selectedInsightId}
          onChange={handleHistoricalReportChange}
          SelectProps={{
            MenuProps: {
              PaperProps: {
                sx: {
                  maxHeight: HISTORICAL_REPORT_SELECT_MENU_MAX_HEIGHT_PX,
                  overflow: 'auto',
                },
              },
            },
          }}
          sx={{
            '& .MuiSelect-select': {
              py: '4px',
              display: 'flex',
              alignItems: 'center',
            },
          }}>
          {options.map((spec) => (
            <MenuItem key={spec.insightId} value={spec.insightId}>
              <Typography variant='legalDisclaimer' color='secondary' noWrap>
                {formatDateRange(locale, spec.startDate, spec.endDate, 'UTC', true, true)}
              </Typography>
            </MenuItem>
          ))}
        </Select>
        <OnboardingTipsCarousel
          featureKey={OnboardingFeatureKey.CreatorHubAnalyticsHistoricalInsights}
          stepKey={OnboardingStepKey.AssistantHistoricalReportSelector}
          isSingleLineStyle
        />
      </Flex>
    );
  }, [
    assistantSummarySpec.type,
    historicalSummaryInsights,
    locale,
    selectedInsightId,
    assistantSummarySpec.startDate,
    assistantSummarySpec.endDate,
    handleHistoricalReportChange,
  ]);

  const cardHeader = useMemo(() => {
    return (
      <Flex justifyContent='space-between' alignItems='center'>
        <Grid container alignItems='center' direction='row'>
          <Icon name='icon-regular-nebula' size='Small' className={titleItem} />
          <Typography variant='captionHeader' color='secondary' className={titleItem}>
            {translate(titleKey)}
          </Typography>
        </Grid>
        <Grid item>
          {isHistoricalSummaryReportInsightsLoading ? (
            <Typography variant='captionHeader' color='secondary' noWrap>
              {formatDateRange(
                locale,
                assistantSummarySpec.startDate,
                assistantSummarySpec.endDate,
                'UTC',
                true,
                true,
              )}
            </Typography>
          ) : (
            historicalReportSelector
          )}
        </Grid>
      </Flex>
    );
  }, [
    titleItem,
    locale,
    assistantSummarySpec.startDate,
    assistantSummarySpec.endDate,
    translate,
    titleKey,
    isHistoricalSummaryReportInsightsLoading,
    historicalReportSelector,
  ]);

  return (
    <>
      <div className={cx(contentContainer, centrallyAlignItems, fullHeight)}>
        <Card className={cx(card, transparent, fullHeight)} ref={cardRef}>
          <CardHeader className={headerV2} title={cardHeader} />
          <Divider variant='fullWidth' />
          <CardContent className={cx(cardContent, noPadding)}>
            <div key={assistantSummarySpec.insightId}>
              <InsightDisclaimerAlertV2 assistantSummarySpec={assistantSummarySpec} />
              <AssistantReportV2 assistantSummarySpec={assistantSummarySpec} />
            </div>
            {feedbackActions}
          </CardContent>
        </Card>
        <AssistantDisclaimer />
      </div>
      {feedbackDialogueOpen && rating ? (
        <FeedbackDialog
          open={feedbackDialogueOpen}
          rating={rating}
          feedbackId={feedbackId}
          upvoteOptions={upvoteOptions}
          downvoteOptions={downvoteOptions}
          onClose={closeFeedbackDialogue}
          characterLimit={FEEDBACK_DIALOGUE_CHARACTER_LIMIT}
        />
      ) : null}
    </>
  );
};

export default AssistantReportCardV2;
