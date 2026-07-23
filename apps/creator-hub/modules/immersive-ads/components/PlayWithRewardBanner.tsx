import { useCallback } from 'react';
import { useTranslation } from '@rbx/intl';
import { useLocalStorage } from '@rbx/react-utilities';
import { Banner } from '@rbx/ui';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { docs } from '@modules/miscellaneous/urls/creatorHub';
import usePlayWithRewardStyles from './PlayWithReward.styles';

interface PlayWithRewardBannerProps {
  createPlacementUrl: string;
}

export const PLAY_WITH_REWARD_BANNER_STORAGE_KEY = 'showPlayWithRewardBanner';

const PlayWithRewardBanner = ({ createPlacementUrl }: PlayWithRewardBannerProps) => {
  const { translate } = useTranslationWrapper(useTranslation());
  const {
    classes: { bannerContainer },
  } = usePlayWithRewardStyles();
  const [showPlayWithRewardBanner] = useLocalStorage(PLAY_WITH_REWARD_BANNER_STORAGE_KEY, true);

  const openDocsLink = useCallback(() => {
    window.open(docs.getExperienceDetailsPageRewardedAdsUrl(), '_blank');
  }, []);

  // TODO: ADS-8577 - add spot illustrations
  return (
    showPlayWithRewardBanner && (
      <Banner
        classes={{ root: bannerContainer }}
        title={translate(
          translationKey('Title.PlayWithRewardBanner', TranslationNamespace.ImmersiveAdsAnalytics),
        )}
        description={translate(
          translationKey(
            'Description.PlayWithRewardBanner',
            TranslationNamespace.ImmersiveAdsAnalytics,
          ),
        )}
        primary={{
          color: 'primaryBrand',
          label: translate(
            translationKey('Label.GetStarted', TranslationNamespace.ImmersiveAdsAnalytics),
          ),
          href: createPlacementUrl,
        }}
        secondary={{
          color: 'secondary',
          label: translate(
            translationKey('Message.Alert.LearnMore', TranslationNamespace.Analytics),
          ),
          onClick: openDocsLink,
        }}
      />
    )
  );
};

export default PlayWithRewardBanner;
