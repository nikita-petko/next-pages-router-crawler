import React, { FC, useMemo } from 'react';
import { Alert, AlertTitle, Button, Link, Typography } from '@rbx/ui';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import {
  translationKey,
  useTranslationWrapper,
  withNamespaceSwitchedTranslation,
} from '@modules/analytics-translations';
import { useTranslation } from '@rbx/intl';
import { urls } from '@modules/miscellaneous/common';
import {
  useGetAnalyticsFeatures,
  AnalyticsFeatureName,
  QualityStatus,
} from '@modules/react-query/analyticsFeatures';
import { useUniverseResource } from '../../hooks/useChartResourceProvider';

export const useIsQualityStatusBannerOn = () => {
  const { id: universeId } = useUniverseResource();
  const { data, isLoading } = useGetAnalyticsFeatures(universeId, [
    AnalyticsFeatureName.QualityStatus,
  ]);

  const shouldShow = useMemo(() => {
    const qualityStatus = data?.get(AnalyticsFeatureName.QualityStatus) as QualityStatus;
    return !isLoading && qualityStatus?.status === 'False';
  }, [isLoading, data]);

  return shouldShow;
};

const QualityStatusBanner: FC = () => {
  const { translate } = useTranslationWrapper(useTranslation());

  return (
    <Alert
      severity='warning'
      variant='standard'
      action={
        <Link href={urls.creatorHub.docs.getDiscoveryBestPracticesUrl()} underline='none'>
          <Button color='primary' size='small'>
            {translate(translationKey('Link.LearnMore', TranslationNamespace.DeveloperItem))}
          </Button>
        </Link>
      }>
      <AlertTitle sx={{ paddingBottom: '4px' }}>
        {translate(
          translationKey('Heading.NoRecommendation.BannerTitle', TranslationNamespace.Analytics),
        )}
      </AlertTitle>
      <Typography variant='body2'>
        {translate(
          translationKey(
            'Description.NoRecommendation.BannerDescription',
            TranslationNamespace.Analytics,
          ),
        )}
      </Typography>
    </Alert>
  );
};

export default withNamespaceSwitchedTranslation(QualityStatusBanner, [
  TranslationNamespace.Analytics,
  TranslationNamespace.DeveloperItem,
]);
