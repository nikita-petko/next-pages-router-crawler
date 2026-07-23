import { useCallback, useMemo, type FC, type ReactElement } from 'react';
import { useRouter } from 'next/router';
import { subDays } from '@rbx/core';
import {
  RAQIV2DateRangeType,
  RAQIV2Dimension,
  RAQIV2Metric,
  RAQIV2MetricGranularity,
} from '@rbx/creator-hub-analytics-config';
import { useTranslation } from '@rbx/intl';
import { useLocalStorage } from '@rbx/react-utilities';
import { Alert, Button, CloseIcon, Grid, IconButton, InfoOutlinedIcon, Typography } from '@rbx/ui';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { useAuthentication } from '@modules/authentication/providers';
import { getCurrentDate } from '@modules/charts-generic/utils/dateUtils';
import { RAQIV2FilterOperation } from '@modules/clients/analytics';
import { useRAQIV2Client } from '@modules/experience-analytics-shared/context/RAQIV2ClientProvider';
import useApiRequest from '@modules/experience-analytics-shared/hooks/useApiRequest';
import { useUniverseResource } from '@modules/experience-analytics-shared/hooks/useChartResourceProvider';
import { filterBarDimensionToQueryKey } from '@modules/experience-analytics-shared/layout/ExperienceAnalyticsPageControlBar/filterUtils';
import makeRAQIV2Request from '@modules/experience-analytics-shared/utils/makeRAQIV2Request';
import {
  snapToLatestEndTime,
  snapToLatestStartTime,
} from '@modules/experience-analytics-shared/utils/snapToLatestTimestep';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import useNewestLivePlaceVersion, {
  type NewestLivePlaceVersion,
} from './useNewestLivePlaceVersion';

const hasAnyErrorCount = (response: Awaited<ReturnType<typeof makeRAQIV2Request>>) =>
  response.response?.values?.some((metricValue) =>
    metricValue.dataPoints?.some(({ value }) => value !== undefined && value > 0),
  ) ?? false;

const getPlaceVersionQueryValue = (
  placeVersionQueryValue: string | string[] | undefined,
  firstSeenPlaceVersion: number,
) => {
  if (placeVersionQueryValue === undefined) {
    return undefined;
  }

  const values = Array.isArray(placeVersionQueryValue)
    ? placeVersionQueryValue
    : [placeVersionQueryValue];
  const filteredValues = values.filter((value) => {
    const placeVersion = Number(value);
    return Number.isNaN(placeVersion) || placeVersion >= firstSeenPlaceVersion;
  });

  if (filteredValues.length === 0) {
    return undefined;
  }
  if (filteredValues.length === 1) {
    return filteredValues[0];
  }
  return filteredValues;
};

const useNewPlaceVersionHasNewError = (
  newPlaceVersion: NewestLivePlaceVersion | null,
  enabled: boolean,
): boolean | null => {
  const resource = useUniverseResource();
  const { client } = useRAQIV2Client(true);

  const { current, oneDayAgo } = useMemo(() => {
    const currentTime = getCurrentDate();
    return {
      current: currentTime,
      oneDayAgo: subDays(currentTime, 1),
    };
  }, []);

  const makeRequest = useCallback(async () => {
    if (!enabled || newPlaceVersion === null) {
      return false;
    }

    const response = await makeRAQIV2Request(
      {
        metric: RAQIV2Metric.ErrorCount,
        timeSpec: {
          rangeType: RAQIV2DateRangeType.Custom,
          startTime: snapToLatestStartTime(oneDayAgo, RAQIV2MetricGranularity.OneMinute),
          endTime: snapToLatestEndTime(current, RAQIV2MetricGranularity.OneMinute),
        },
        granularity: RAQIV2MetricGranularity.None,
        filter: [
          {
            dimension: RAQIV2Dimension.Place,
            values: [`${newPlaceVersion.placeId}`],
          },
          {
            dimension: RAQIV2Dimension.FirstSeenPlaceVersion,
            values: [`${newPlaceVersion.version}`],
            operation: RAQIV2FilterOperation.Gte,
          },
        ],
        resource,
      },
      client,
    );

    return hasAnyErrorCount(response);
  }, [client, current, enabled, newPlaceVersion, oneDayAgo, resource]);

  const { data, isDataLoading } = useApiRequest(makeRequest, { refetchShouldSetLoading: true });

  return useMemo(() => {
    if (isDataLoading) {
      return null;
    }
    return data;
  }, [data, isDataLoading]);
};

const NewPlaceVersionLiveBannerContent: FC<{
  newPlaceVersion: NewestLivePlaceVersion;
  onDismiss: () => void;
}> = ({ newPlaceVersion, onDismiss }) => {
  const { translate } = useTranslationWrapper(useTranslation());
  const { pathname, push, query } = useRouter();

  const placeVersionQueryKey =
    filterBarDimensionToQueryKey[RAQIV2Dimension.PlaceVersion] ?? 'filter_PlaceVersion';
  const firstSeenPlaceVersionQueryKey =
    filterBarDimensionToQueryKey[RAQIV2Dimension.FirstSeenPlaceVersion] ??
    'filter_FirstSeenPlaceVersion';
  const seeNewErrorsLink = useMemo(
    () => ({
      pathname,
      query: {
        ...query,
        [filterBarDimensionToQueryKey[RAQIV2Dimension.Place] ?? 'filter_Place']:
          newPlaceVersion.placeId,
        [placeVersionQueryKey]: getPlaceVersionQueryValue(
          query[placeVersionQueryKey],
          newPlaceVersion.version,
        ),
        [firstSeenPlaceVersionQueryKey]: newPlaceVersion.version,
        rangeType: RAQIV2DateRangeType.Last1Day,
      },
    }),
    [
      firstSeenPlaceVersionQueryKey,
      newPlaceVersion.placeId,
      newPlaceVersion.version,
      pathname,
      placeVersionQueryKey,
      query,
    ],
  );
  const handleViewNewErrorsClick = useCallback(() => {
    void push(seeNewErrorsLink);
  }, [push, seeNewErrorsLink]);

  return (
    <Grid item XSmall={12}>
      <Alert
        severity='info'
        variant='outlined'
        className='padding-[24px]'
        icon={<InfoOutlinedIcon color='secondary' fontSize='large' />}
        action={
          <IconButton
            aria-label={translate(translationKey('Action.Close', TranslationNamespace.Controls))}
            color='inherit'
            size='small'
            onClick={onDismiss}>
            <CloseIcon fontSize='small' />
          </IconButton>
        }>
        <div className='flex flex-col items-start grow-1 min-width-0'>
          <Typography variant='h5'>
            {translate(
              translationKey(
                'Title.NewPlaceVersionLiveErrorReportBanner',
                TranslationNamespace.Analytics,
              ),
              {
                placeName: newPlaceVersion.placeName,
                versionNumber: `${newPlaceVersion.version}`,
              },
            )}
          </Typography>
          <Typography variant='body1' className='margin-top-[16px]'>
            {translate(
              translationKey(
                'Description.NewPlaceVersionLiveErrorReportBanner',
                TranslationNamespace.Analytics,
              ),
            )}
          </Typography>
          <Button
            color='secondary'
            variant='contained'
            className='margin-top-[16px]'
            onClick={handleViewNewErrorsClick}>
            {translate(
              translationKey(
                'Action.SeeNewErrorsSincePlaceVersion',
                TranslationNamespace.Analytics,
              ),
              { versionNumber: `${newPlaceVersion.version}` },
            )}
          </Button>
        </div>
      </Alert>
    </Grid>
  );
};

export const useNewPlaceVersionLiveBannerElement = (enabled = true): ReactElement | undefined => {
  const { user } = useAuthentication();
  const { id: universeId } = useUniverseResource();
  const newPlaceVersion = useNewestLivePlaceVersion(enabled);
  const hasNewErrorForPlaceVersion = useNewPlaceVersionHasNewError(newPlaceVersion, enabled);
  const dismissalKey =
    newPlaceVersion === null
      ? 'errorReportsNewPlaceVersionLiveBanner.pending'
      : `errorReportsNewPlaceVersionLiveBanner.${universeId}.${newPlaceVersion.placeId}.${newPlaceVersion.version}.${user?.id ?? 'anonymous'}`;
  const [isDismissed, setIsDismissed] = useLocalStorage(dismissalKey, false);

  if (isDismissed || newPlaceVersion === null || hasNewErrorForPlaceVersion !== true) {
    return undefined;
  }

  return (
    <NewPlaceVersionLiveBannerContent
      newPlaceVersion={newPlaceVersion}
      onDismiss={() => setIsDismissed(true)}
    />
  );
};

const NewPlaceVersionLiveBanner: FC = () => useNewPlaceVersionLiveBannerElement() ?? null;

export default NewPlaceVersionLiveBanner;
