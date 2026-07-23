import React, { FC, useMemo } from 'react';
import { Card, CardContent, InfoIcon, Link, makeStyles, Typography } from '@rbx/ui';
import { Flex } from '@modules/miscellaneous/common/components';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { translationKey } from '@modules/analytics-translations';
import {
  InsightTypeV2,
  useRAQIV2TranslationDependencies,
  useUniverseResource,
} from '@modules/experience-analytics-shared';
import {
  analyticsFeedbackNavigationItem,
  AnalyticsQueryParams,
  buildExperienceAnalyticsUrlWithParams,
  DateRangeType,
} from '@modules/charts-generic';
import { numberFormatter as localizeNumberString } from '@rbx/core';
import { AssistantSummaryInsightSpec } from '../../../types/AssistantSummaryInsightSpec';

const useInsightDisclaimerAlertV2Styles = makeStyles()((theme) => ({
  card: {
    marginTop: theme.spacing(2),
    backgroundColor: theme.palette.surface[100],
    border: `1px solid ${theme.palette.surface[300]}`,
  },
  cardContent: {
    padding: theme.spacing(2.25),
    '&:last-child': {
      paddingBottom: theme.spacing(2.25),
    },
  },
  icon: {
    color: theme.palette.content.standard,
    marginRight: theme.spacing(1.5),
  },
}));

const InsightDisclaimerAlertV2: FC<{ assistantSummarySpec: AssistantSummaryInsightSpec }> = ({
  assistantSummarySpec,
}) => {
  const {
    classes: { card, cardContent, icon },
    cx,
  } = useInsightDisclaimerAlertV2Styles();
  const { translate, translateHTML } = useRAQIV2TranslationDependencies();
  const { id: universeId } = useUniverseResource();

  const disclaimerMessage = useMemo(() => {
    const { type: assistantInsightType } = assistantSummarySpec;

    switch (assistantInsightType) {
      case InsightTypeV2.SummaryReport:
      case InsightTypeV2.SummaryReport7Days:
      case InsightTypeV2.MetricsSummary:
        return translate(
          translationKey(
            'Label.SummaryReport.DisclaimerMessageV2',
            TranslationNamespace.AnalyticsAssistant,
          ),
        );
      case InsightTypeV2.PlayerFeedbackReport7Days:
      case InsightTypeV2.PlayerFeedbackReport28Days: {
        const priorUri = buildExperienceAnalyticsUrlWithParams(
          analyticsFeedbackNavigationItem,
          {
            [AnalyticsQueryParams.RangeType]:
              assistantInsightType === InsightTypeV2.PlayerFeedbackReport7Days
                ? DateRangeType.Last7Days
                : DateRangeType.Last28Days,
          },
          universeId,
        );
        if (!assistantSummarySpec.exampleCommentsCount) {
          return translateHTML(
            translationKey(
              'Label.PlayerFeedback.DisclaimerTitle',
              TranslationNamespace.AnalyticsAssistant,
            ),
            [
              {
                opening: 'feedbackLinkStart',
                closing: 'feedbackLinkEnd',
                content(chunks) {
                  return (
                    <Link href={priorUri} underline='always' color='inherit'>
                      {chunks}
                    </Link>
                  );
                },
              },
            ],
          );
        }

        const count = localizeNumberString(assistantSummarySpec.exampleCommentsCount, {});
        return translateHTML(
          translationKey(
            'Label.PlayerFeedback.DisclaimerTitleWithCountV2',
            TranslationNamespace.AnalyticsAssistant,
          ),
          [
            {
              opening: 'countStart',
              closing: 'countEnd',
              content() {
                return `${count}`;
              },
            },
            {
              opening: 'feedbackLinkStart',
              closing: 'feedbackLinkEnd',
              content(chunks) {
                return (
                  <Link href={priorUri} underline='always' color='inherit'>
                    {chunks}
                  </Link>
                );
              },
            },
          ],
        );
      }
      default: {
        const exhaustiveCheck: never = assistantInsightType;
        throw new Error(`Unhandled insight type: ${exhaustiveCheck}`);
      }
    }
  }, [assistantSummarySpec, translate, universeId, translateHTML]);

  return (
    <Card className={cx(card)}>
      <CardContent className={cx(cardContent)}>
        <Flex alignItems='center' justifyContent='flex-start'>
          <InfoIcon fontSize='large' className={cx(icon)} />
          <Typography variant='body1'>{disclaimerMessage}</Typography>
        </Flex>
      </CardContent>
    </Card>
  );
};

export default InsightDisclaimerAlertV2;
