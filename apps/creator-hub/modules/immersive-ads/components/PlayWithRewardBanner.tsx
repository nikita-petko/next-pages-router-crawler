import { useTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { translationKey, useTranslationWrapper } from '@modules/analytics-translations';
import { Banner } from '@rbx/ui';
import { useLocalStorage } from '@rbx/react-utilities';
import React, { useCallback } from 'react';
import { docs } from '@modules/miscellaneous/common/urls/creatorHub';
import usePlayWithRewardStyles from './PlayWithReward.styles';

interface PlayWithRewardBannerProps {
  onOpenModal: () => void;
}

const PlayWithRewardBanner = ({ onOpenModal }: PlayWithRewardBannerProps) => {
  const { translate } = useTranslationWrapper(useTranslation());
  const {
    classes: { bannerContainer },
  } = usePlayWithRewardStyles();
  const [showPlayWithRewardBanner, setShowPlayWithRewardBanner] = useLocalStorage(
    'showPlayWithRewardBanner',
    true,
  );

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
            translationKey('Label.Create', TranslationNamespace.ImmersiveAdsAnalytics),
          ),
          onClick: onOpenModal,
        }}
        secondary={{
          color: 'secondary',
          label: translate(
            translationKey('Message.Alert.LearnMore', TranslationNamespace.Analytics),
          ),
          onClick: openDocsLink,
        }}
        onClose={() => {
          setShowPlayWithRewardBanner(false);
        }}
      />
    )
  );
};

export default PlayWithRewardBanner;
