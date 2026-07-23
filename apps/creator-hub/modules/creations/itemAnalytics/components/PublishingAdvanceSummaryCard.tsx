import { useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import {
  RAQIV2DateRangeType,
  RAQIV2Dimension,
  RAQIV2Metric,
  RAQIV2MetricDisplayConfig,
  RAQIV2MetricGranularity,
} from '@rbx/creator-hub-analytics-config';
import {
  Card,
  Typography,
  Grid,
  CardActionArea,
  LinearProgress,
  Tooltip,
  InfoOutlinedIcon,
  RobuxIcon,
} from '@rbx/ui';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { useAuthentication } from '@modules/authentication/providers';
import GenericCardContentWrapper from '@modules/charts-generic/cards/GenericCardContentWrapper';
import ChartResourceType from '@modules/charts-generic/enums/ChartResourceType';
import { useAnalyticsOwnerOverride } from '@modules/experience-analytics-shared/context/AnalyticsOwnerOverrideProvider';
import useRAQIV2Request from '@modules/experience-analytics-shared/hooks/useRAQIV2Request';
import useRAQIV2TranslationDependencies from '@modules/experience-analytics-shared/hooks/useRAQIV2TranslationDependencies';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useCurrentGroup } from '@modules/providers/groups/GroupsProvider';
import usePublishingAdvanceSummaryCardStyles from './PublishingAdvanceSummaryCard.styles';

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;
const PUBLISHING_ADVANCE_METRICS = [
  RAQIV2Metric.ItemPublishAdvance,
  RAQIV2Metric.ItemLifetimeRebateAmount,
  RAQIV2Metric.ItemPublishAdvanceRecoupedPercentage,
] as const;

const getMinimumMetricRetentionStartTime = (
  metrics: readonly RAQIV2Metric[],
  endTime: Date,
): Date => {
  const retentionDurationDays = Math.min(
    ...metrics.map((metric) => RAQIV2MetricDisplayConfig[metric].retentionDurationDays),
  );
  return new Date(endTime.getTime() - (retentionDurationDays - 1) * MILLISECONDS_PER_DAY);
};

function PublishingAdvanceSummaryCard() {
  const {
    classes: { card, cardActionArea, cardContent, percentRecovered, progressBar },
  } = usePublishingAdvanceSummaryCardStyles();

  const { translate } = useRAQIV2TranslationDependencies();
  const router = useRouter();
  const { id } = router.query;
  const avatarItemId = Array.isArray(id) ? id[0] : id;
  const { user } = useAuthentication();
  const currentGroup = useCurrentGroup();
  const { ownerType, ownerId } = useAnalyticsOwnerOverride();

  const resourceId = useMemo(() => {
    if (ownerType && ownerId) {
      return ownerId;
    }
    return currentGroup?.id ?? user?.id ?? 0;
  }, [ownerType, ownerId, currentGroup?.id, user?.id]);

  const resourceType = useMemo(() => {
    if (ownerType) {
      return ownerType === 'Group' ? ChartResourceType.Group : ChartResourceType.User;
    }
    return currentGroup ? ChartResourceType.Group : ChartResourceType.User;
  }, [ownerType, currentGroup]);

  const [timeRange] = useState(() => {
    const endTime = new Date(Date.now());
    return {
      startTime: getMinimumMetricRetentionStartTime(PUBLISHING_ADVANCE_METRICS, endTime),
      endTime,
    };
  });

  const baseRequest = useMemo(
    () => ({
      resource: {
        id: resourceId,
        type: resourceType,
      },
      timeSpec: {
        startTime: timeRange.startTime,
        endTime: timeRange.endTime,
        rangeType: RAQIV2DateRangeType.Custom,
      },
      granularity: RAQIV2MetricGranularity.None,
      filter: avatarItemId
        ? [
            {
              dimension: RAQIV2Dimension.AvatarItemId,
              values: [avatarItemId],
            },
          ]
        : [],
    }),
    [resourceId, resourceType, timeRange, avatarItemId],
  );

  const requestPublishingAdvance = useMemo(
    () => ({
      ...baseRequest,
      metric: RAQIV2Metric.ItemPublishAdvance,
    }),
    [baseRequest],
  );

  const requestLifetimeRebateAmount = useMemo(
    () => ({
      ...baseRequest,
      metric: RAQIV2Metric.ItemLifetimeRebateAmount,
    }),
    [baseRequest],
  );

  const requestPublishAdvanceRecoupedPercentage = useMemo(
    () => ({
      ...baseRequest,
      metric: RAQIV2Metric.ItemPublishAdvanceRecoupedPercentage,
    }),
    [baseRequest],
  );

  const responsePublishingAdvance = useRAQIV2Request(requestPublishingAdvance);
  const responseLifetimeRebateAmount = useRAQIV2Request(requestLifetimeRebateAmount);
  const responsePublishAdvanceRecoupedPercentage = useRAQIV2Request(
    requestPublishAdvanceRecoupedPercentage,
  );
  const publishingAdvance =
    responsePublishingAdvance?.data?.response?.values?.[0]?.dataPoints?.[0]?.value ?? 0;
  const rebateAmount =
    responseLifetimeRebateAmount?.data?.response?.values?.[0]?.dataPoints?.[0]?.value ?? 0;
  const recoupedPercentage =
    responsePublishAdvanceRecoupedPercentage?.data?.response?.values?.[0]?.dataPoints?.[0]?.value ??
    0;

  const { isDataLoading, isResponseFailed, isUserForbidden } = useMemo(
    () => ({
      isDataLoading:
        responsePublishingAdvance?.isDataLoading ||
        responseLifetimeRebateAmount?.isDataLoading ||
        responsePublishAdvanceRecoupedPercentage?.isDataLoading,
      isResponseFailed:
        responsePublishingAdvance?.isResponseFailed ||
        responseLifetimeRebateAmount?.isResponseFailed ||
        responsePublishAdvanceRecoupedPercentage?.isResponseFailed,
      isUserForbidden:
        responsePublishingAdvance?.isUserForbidden ||
        responseLifetimeRebateAmount?.isUserForbidden ||
        responsePublishAdvanceRecoupedPercentage?.isUserForbidden,
    }),
    [
      responsePublishingAdvance,
      responseLifetimeRebateAmount,
      responsePublishAdvanceRecoupedPercentage,
    ],
  );

  return (
    <Card className={card}>
      <CardActionArea disableRipple className={cardActionArea}>
        <GenericCardContentWrapper
          cardContentClass={cardContent}
          isDataLoading={isDataLoading}
          isResponseFailed={isResponseFailed}
          isUserForbidden={isUserForbidden}>
          <Grid container alignItems='center'>
            <Typography variant='h6'>
              {translate(translationKey('Title.PublishingAdvance', TranslationNamespace.Analytics))}
            </Typography>
            <Tooltip
              title={translate(
                translationKey('Description.PublishingAdvance', TranslationNamespace.Analytics),
              )}
              placement='bottom'
              enterTouchDelay={0}
              leaveTouchDelay={3000}>
              <InfoOutlinedIcon fontSize='small' style={{ marginLeft: 4 }} />
            </Tooltip>
          </Grid>

          <div className={percentRecovered}>
            <Typography variant='h4'>
              {recoupedPercentage?.toFixed(2)}%{' '}
              {translate(
                translationKey('Label.PublishingAdvanceRecovered', TranslationNamespace.Analytics),
              )}
            </Typography>
          </div>

          <LinearProgress
            className={progressBar}
            variant='determinate'
            value={Math.min(recoupedPercentage ?? 0, 100)}
            title={translate(
              translationKey('Title.PublishingAdvance', TranslationNamespace.Analytics),
            )}
          />
          <Grid container justifyContent='space-between' marginTop={1}>
            <Typography sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <RobuxIcon fontSize='small' /> {rebateAmount}
            </Typography>
            <Typography sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <RobuxIcon fontSize='small' /> {publishingAdvance}
            </Typography>
          </Grid>
        </GenericCardContentWrapper>
      </CardActionArea>
    </Card>
  );
}

export default PublishingAdvanceSummaryCard;
