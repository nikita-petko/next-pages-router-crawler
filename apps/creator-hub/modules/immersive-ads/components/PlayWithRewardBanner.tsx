import { useCallback } from 'react';
import { useTranslation } from '@rbx/intl';
import { useThemeMode } from '@rbx/settings';
import { Banner } from '@rbx/ui';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { docs } from '@modules/miscellaneous/urls/creatorHub';

interface PlayWithRewardBannerProps {
  createPlacementUrl: string;
}

const PLAY_WITH_REWARD_BANNER_LIGHT_ILLUSTRATION = `${process.env.assetPathPrefix}/immersive-ads/join-with-reward-banner-spot-light.png`;
const PLAY_WITH_REWARD_BANNER_DARK_ILLUSTRATION = `${process.env.assetPathPrefix}/immersive-ads/join-with-reward-banner-spot-dark.png`;

const PlayWithRewardBanner = ({ createPlacementUrl }: PlayWithRewardBannerProps) => {
  const { translate } = useTranslationWrapper(useTranslation());
  const { themeMode } = useThemeMode();

  const openDocsLink = useCallback(() => {
    window.open(docs.getExperienceDetailsPageRewardedAdsUrl(), '_blank');
  }, []);

  return (
    <Banner
      classes={{ root: 'margin-top-small stroke-standard stroke-muted' }}
      title={translate(
        translationKey('Title.PlayWithRewardBanner', TranslationNamespace.ImmersiveAdsAnalytics),
      )}
      description={translate(
        translationKey(
          'Description.PlayWithRewardBanner',
          TranslationNamespace.ImmersiveAdsAnalytics,
        ),
      )}
      illustration={{
        src:
          themeMode === 'dark'
            ? PLAY_WITH_REWARD_BANNER_DARK_ILLUSTRATION
            : PLAY_WITH_REWARD_BANNER_LIGHT_ILLUSTRATION,
        alt: '',
      }}
      primary={{
        color: 'primaryBrand',
        label: translate(
          translationKey('Label.GetStarted', TranslationNamespace.ImmersiveAdsAnalytics),
        ),
        href: createPlacementUrl,
      }}
      secondary={{
        color: 'secondary',
        label: translate(translationKey('Message.Alert.LearnMore', TranslationNamespace.Analytics)),
        onClick: openDocsLink,
      }}
    />
  );
};

export default PlayWithRewardBanner;
