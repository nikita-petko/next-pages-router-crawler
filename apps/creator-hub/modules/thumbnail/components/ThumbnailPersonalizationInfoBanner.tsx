import type { FC } from 'react';
import { useMemo } from 'react';
import { dateTimeFormatter } from '@rbx/core';
import { RAQIV2Metric, RAQIV2MetricGranularity } from '@rbx/creator-hub-analytics-config';
import { useTranslation } from '@rbx/intl';
import {
  Alert,
  AlertTitle,
  Button,
  Collapse,
  makeStyles,
  Typography,
  useMediaQuery,
} from '@rbx/ui';
import type { FormattedText } from '@modules/analytics-translations/types';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import useLocale from '@modules/charts-generic/context/useLocale';
import useIsAboveAndEqualToDAUThreshold from '@modules/experience-analytics-shared/hooks/useIsAboveAndEqualToDAUThreshold';
import useMetricLatestAvailableTime from '@modules/experience-analytics-shared/hooks/useMetricLatestAvailableTime';
import { snapToLatestStartTime } from '@modules/experience-analytics-shared/utils/snapToLatestTimestep';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { creatorHub } from '@modules/miscellaneous/urls';
import { useGetHomepageThumbnailsQuery } from '@modules/react-query/thumbnailPersonalization';

const useStyles = makeStyles()(() => ({
  alertContainer: {
    marginBottom: '16px',
  },
  alertTitle: {
    lineHeight: 'unset',
  },
  action: {
    paddingTop: 'unset',
    alignItems: 'center',
    flex: '0 0 fit-content',
  },
}));

const ThumbnailPersonalizationInfoBanner: FC<{ universeId: number; createdTimeUtc?: Date }> = ({
  universeId,
  createdTimeUtc,
}) => {
  const isCompactView = useMediaQuery((theme) => theme.breakpoints.down('Medium'));
  const { translate } = useTranslationWrapper(useTranslation());
  const locale = useLocale();
  const {
    classes: { alertContainer, alertTitle, action },
  } = useStyles();
  const { data, isPending } = useGetHomepageThumbnailsQuery(universeId);
  const isPersonalizationOn = useMemo(() => {
    const activeThumbnails = data?.thumbnails.filter((thumbnail) => thumbnail.active);
    return activeThumbnails && activeThumbnails.length > 1;
  }, [data?.thumbnails]);

  const {
    data: lastUpdatedThumbnailImpressionTime,
    isPending: isLoadingLastUpdatedThumbnailImpressionTime,
  } = useMetricLatestAvailableTime(RAQIV2Metric.ThumbnailImpressions);

  const DAUThreshold = 1000;
  const { isAboveAndEqualToDAUThreshold, isLoadingDAU } = useIsAboveAndEqualToDAUThreshold(
    universeId,
    DAUThreshold,
  );

  const {
    title,
    subTitle,
    alertColor,
  }: {
    title: FormattedText;
    subTitle: FormattedText;
    alertColor: 'info' | 'warning';
  } = useMemo(() => {
    if (isPersonalizationOn) {
      // lastUpdatedThumbnailImpressionTime is always rounded down to the closest hour
      // whereas createdTimeUtc is the exact time when the personalization was turned on.
      // To avoid showing 'no data' in banner while data exists in table, we snap createdTimeUtc
      // to the closest hour before comparing it with lastUpdatedThumbnailImpressionTime.
      const dataIsReady =
        createdTimeUtc &&
        lastUpdatedThumbnailImpressionTime &&
        lastUpdatedThumbnailImpressionTime >=
          snapToLatestStartTime(createdTimeUtc, RAQIV2MetricGranularity.OneHour);

      return {
        title: dataIsReady
          ? translate(
              translationKey(
                'Description.ThumbnailPersonalizationOn',
                TranslationNamespace.PlaceThumbnails,
              ),
              {
                time: dateTimeFormatter(locale).getCustomDateTime(
                  lastUpdatedThumbnailImpressionTime,
                  {
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: 'numeric',
                  },
                ),
              },
            )
          : translate(
              translationKey(
                'Description.ThumbnailPersonalizationOnWaitingForData',
                TranslationNamespace.PlaceThumbnails,
              ),
            ),
        subTitle: translate(
          translationKey(
            'Description.ThumbnailPersonalizationOnSubtitle',
            TranslationNamespace.PlaceThumbnails,
          ),
        ),
        alertColor: 'info',
      };
    }

    return {
      title: isAboveAndEqualToDAUThreshold
        ? translate(
            translationKey(
              'Description.ThumbnailPersonalizationOff',
              TranslationNamespace.PlaceThumbnails,
            ),
          )
        : translate(
            translationKey(
              'Description.ThumbnailPersonalizationOffBelowDAU',
              TranslationNamespace.PlaceThumbnails,
            ),
          ),
      subTitle: isAboveAndEqualToDAUThreshold
        ? translate(
            translationKey(
              'Description.ThumbnailPersonalizationOffSubtitle',
              TranslationNamespace.PlaceThumbnails,
            ),
          )
        : translate(
            translationKey(
              'Description.ThumbnailPersonalizationOffBelowDAUSubtitle',
              TranslationNamespace.PlaceThumbnails,
            ),
            {
              threshold: `>${DAUThreshold}`,
            },
          ),
      alertColor: isAboveAndEqualToDAUThreshold ? 'info' : 'warning',
    };
  }, [
    createdTimeUtc,
    isAboveAndEqualToDAUThreshold,
    isPersonalizationOn,
    lastUpdatedThumbnailImpressionTime,
    locale,
    translate,
  ]);

  return (
    <Collapse
      in={!isPending && !isLoadingDAU && !isLoadingLastUpdatedThumbnailImpressionTime}
      mountOnEnter>
      <Alert
        severity={alertColor}
        variant='outlined'
        classes={{ root: alertContainer, action }}
        action={
          isCompactView ? undefined : (
            <Button
              size='small'
              color='secondary'
              variant='contained'
              component='a'
              target='_blank'
              href={creatorHub.docs.getPromotionalThumbnailsUrl()}>
              {translate(
                translationKey(
                  'Label.ThumbnailPersonalizationNUXBanner',
                  TranslationNamespace.PlaceThumbnails,
                ),
              )}
            </Button>
          )
        }>
        <AlertTitle classes={{ root: alertTitle }}>{title}</AlertTitle>
        {!isCompactView && (
          <Typography component='div' marginTop='6px' variant='smallLabel1'>
            {subTitle}
          </Typography>
        )}
      </Alert>
    </Collapse>
  );
};

export default ThumbnailPersonalizationInfoBanner;
