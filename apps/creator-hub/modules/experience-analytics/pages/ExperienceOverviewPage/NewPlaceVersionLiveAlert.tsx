import type { FC } from 'react';
import { RAQIV2DateRangeType } from '@rbx/creator-hub-analytics-config';
import { Alert, makeStyles, Typography } from '@rbx/ui';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { useUniverseResource } from '@modules/experience-analytics-shared/hooks/useChartResourceProvider';
import useNewPlaceVersion from '@modules/experience-analytics-shared/hooks/useNewPlaceVersion';
import useRAQIV2TranslationDependencies from '@modules/experience-analytics-shared/hooks/useRAQIV2TranslationDependencies';
import { Link } from '@modules/miscellaneous/components';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { creatorHub } from '@modules/miscellaneous/urls';

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
          pathname: creatorHub.dashboard.getAnalyticsPerformanceUrl(resource.id),
          query: {
            rangeType: RAQIV2DateRangeType.Last1Day,
          },
        }}>
        {translate(translationKey('Action.Monitor', TranslationNamespace.Analytics))}
      </Link>
    </Alert>
  );
};
export default NewPlaceVersionLiveAlert;
