import { useMemo } from 'react';
import { Alert, AlertTitle, Typography } from '@rbx/ui';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import {
  translationKey,
  useTranslationWrapper,
  withNamespaceSwitchedTranslation,
} from '@modules/analytics-translations';
import { useTranslation } from '@rbx/intl';
import { useCurrentGame } from '@modules/providers/game/GameProvider';
import { useIsContentUnderReview } from '../../hooks/useIsContentUnderReview';

export const useIsSequestrationStatusBannerOn = () => {
  const { gameDetails } = useCurrentGame();
  const rootPlaceId = gameDetails?.rootPlaceId;
  const { data, isLoading } = useIsContentUnderReview(
    rootPlaceId ? rootPlaceId.toString() : '',
    1,
    '',
  );

  const shouldShow = useMemo(() => {
    const isUnderReview = data?.isUnderReview;
    return !isLoading && !!isUnderReview;
  }, [isLoading, data]);

  return shouldShow;
};

// This banner displays on the Experience Overview page when the experience is sequestered due to copying 3rd party content
const SequestrationStatusBanner = () => {
  const { translate } = useTranslationWrapper(useTranslation());

  return (
    <Alert severity='warning' variant='standard'>
      <AlertTitle sx={{ paddingBottom: '4px' }}>
        {translate(
          translationKey('Heading.Sequestered.BannerTitle', TranslationNamespace.Analytics),
        )}
      </AlertTitle>
      <Typography variant='body2'>
        {translate(
          translationKey(
            'Description.Sequestered.BannerDescriptionV2',
            TranslationNamespace.Analytics,
          ),
        )}
      </Typography>
    </Alert>
  );
};

export default withNamespaceSwitchedTranslation(SequestrationStatusBanner, [
  TranslationNamespace.Analytics,
]);
