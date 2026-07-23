import { useMemo } from 'react';
import { useRouter } from 'next/router';
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
import {
  ChartResourceType,
  DateRangeType,
  GenericCardContentWrapper,
} from '@modules/charts-generic';
import { translationKey } from '@modules/analytics-translations';
import {
  RAQIV2MetricGranularity,
  RAQIV2Metric,
  RAQIV2Dimension,
} from '@rbx/creator-hub-analytics-config';
import { useAuthentication } from '@modules/authentication/providers';
import { useCurrentGroup } from '@modules/providers/groups/GroupsProvider';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import {
  useRAQIV2Request,
  useRAQIV2TranslationDependencies,
  useAnalyticsOwnerOverride,
} from '@modules/experience-analytics-shared';
import usePublishingAdvanceSummaryCardStyles from './PublishingAdvanceSummaryCard.styles';

function PublishingAdvanceSummaryCard() {
  const {
    classes: { card, cardActionArea, cardContent, percentRecovered, progressBar },
  } = usePublishingAdvanceSummaryCardStyles();

  const { translate } = useRAQIV2TranslationDependencies();
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuthentication();
  const currentGroup = useCurrentGroup();
  const { ownerType, ownerId } = useAnalyticsOwnerOverride();

  const resourceId = useMemo(() => {
    if (ownerType && ownerId) return ownerId;
    return currentGroup?.id ?? user?.id ?? 0;
  }, [ownerType, ownerId, currentGroup?.id, user?.id]);

  const resourceType = useMemo(() => {
    if (ownerType) {
      return ownerType === 'Group' ? ChartResourceType.Group : ChartResourceType.User;
    }
    return currentGroup ? ChartResourceType.Group : ChartResourceType.User;
  }, [ownerType, currentGroup]);

  const timeRange = useMemo(
    () => ({
      startTime: new Date('2024-01-01'),
      endTime: new Date(Date.now()),
    }),
    [],
  );

  const baseRequest = useMemo(
    () => ({
      resource: {
        id: resourceId,
        type: resourceType,
      },
      timeSpec: {
        startTime: timeRange.startTime,
        endTime: timeRange.endTime,
        rangeType: DateRangeType.Custom,
      },
      granularity: RAQIV2MetricGranularity.None,
      filter: id
        ? [
            {
              dimension: RAQIV2Dimension.AvatarItemId,
              values: [`${id}`],
            },
          ]
        : [],
    }),
    [resourceId, resourceType, timeRange, id],
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
            title='Publishing Advance'
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
