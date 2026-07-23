import type { FC } from 'react';
import { useTranslation } from '@rbx/intl';
import { Alert, AlertTitle, Button, Link, Typography } from '@rbx/ui';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import withNamespaceSwitchedTranslation from '@modules/analytics-translations/withNamespaceSwitchedTranslation';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { creatorHub } from '@modules/miscellaneous/urls';
import { useGetUniverseQualityStatus } from '@modules/react-query/contentQuality/contentQualityQueries';
import { useUniverseResource } from '../../hooks/useChartResourceProvider';

export const useIsQualityStatusBannerOn = () => {
  const { id: universeId } = useUniverseResource();
  const { data } = useGetUniverseQualityStatus(universeId);

  return data?.isContentQualityCompliant === false;
};

const QualityStatusBanner: FC = () => {
  const { translate } = useTranslationWrapper(useTranslation());

  return (
    <Alert
      severity='warning'
      variant='standard'
      action={
        <Link href={creatorHub.docs.getDiscoveryBestPracticesUrl()} underline='none'>
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
