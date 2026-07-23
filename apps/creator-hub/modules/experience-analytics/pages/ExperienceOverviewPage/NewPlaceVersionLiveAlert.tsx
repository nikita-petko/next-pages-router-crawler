import React, { FC } from 'react';
import { Alert, makeStyles, Typography } from '@rbx/ui';
import { translationKey } from '@modules/analytics-translations';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { Link, urls } from '@modules/miscellaneous/common';
import { DateRangeType } from '@modules/charts-generic';
import {
  useRAQIV2TranslationDependencies,
  useUniverseResource,
  useNewPlaceVersion,
} from '@modules/experience-analytics-shared';

const useStyles = makeStyles()(() => {
  return {
    newVersionLiveBanner: {
      marginBottom: '24px',
    },
  };
});

const NewPlaceVersionLiveAlert: FC = () => {
  const {
    classes: { newVersionLiveBanner },
  } = useStyles();
  const translationDependencies = useRAQIV2TranslationDependencies();
  const { translate } = translationDependencies;
  const resource = useUniverseResource();
  const newVersion = useNewPlaceVersion();

  if (newVersion === null) {
    return null;
  }
  return (
    <Alert severity='info' className={newVersionLiveBanner} variant='outlined'>
      <Typography variant='captionHeader'>
        {translate(
          translationKey('Title.NewPlaceVersionLiveBanner', TranslationNamespace.Analytics),
          { versionNumber: `${newVersion}` },
        )}
      </Typography>
      <span>&nbsp;&#183;&nbsp;</span>
      <Link
        color='inherit'
        underline='always'
        href={{
          pathname: urls.creatorHub.dashboard.getAnalyticsPerformanceUrl(resource.id),
          query: {
            rangeType: DateRangeType.Last1Day,
          },
        }}>
        Monitor
      </Link>
    </Alert>
  );
};
export default NewPlaceVersionLiveAlert;
