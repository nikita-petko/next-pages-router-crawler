import React, { useCallback, useContext } from 'react';
import { Banner, makeStyles, useTheme } from '@rbx/ui';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { withTranslation } from '@rbx/intl';
import { CreatorHomeClient } from '@modules/clients';
import { useConversionTracker } from '@modules/miscellaneous/hooks';
import { captureHomepageEvent, EHomepageSection } from '../../utils/eventUtils';
import { useCreator } from '../../providers/CreatorProvider';
import Section from '../common/Section';
import BannerImageMap from '../../constants/bannerConstants';
import { BannerContext } from './BannerProvider';
import useBannerTranslation from './useBannerTranslation';
import useBannerGate from './useBannerGate';

const useStyles = makeStyles()({
  section: {
    opacity: 1,
  },
  dismissedSection: {
    opacity: 0,
    height: 0,
    marginBottom: 0,
  },
});

const BannerContainer = () => {
  const { bannerData, clearBannerData } = useContext(BannerContext);
  const { context: creatorContext } = useCreator();
  const { title, subTitle, actionText } = useBannerTranslation(bannerData);
  const isAllowed = useBannerGate(bannerData?.banner ?? '');
  const {
    classes: { section, dismissedSection },
    cx,
  } = useStyles();
  const {
    palette: { mode: themeMode },
  } = useTheme();
  const { ref, onConvert } = useConversionTracker<HTMLDivElement>('PersonalizationBanner', {
    additionalParams: {
      banner: bannerData?.banner ?? '',
      experienceId: bannerData?.messageVariables?.experienceId ?? '',
    },
  });

  const onBannerClick = useCallback(() => {
    if (!bannerData) {
      return;
    }

    onConvert(`${bannerData?.banner ?? ''}_cta`);

    if (bannerData.destinationUrlLink) {
      window.open(bannerData.destinationUrlLink, '_self');
    }
  }, [bannerData, onConvert]);

  const onBannerClose = useCallback(() => {
    let dismissBannerPromise: Promise<void>;
    if (creatorContext.type === 'User') {
      dismissBannerPromise =
        CreatorHomeClient.creatorHomeContentApi.creatorHomeContentDisableCreatorHubBannerByUser({
          userId: Number(creatorContext.id),
          creatorHomeContentDisableCreatorHubBannerByUserRequest: {
            bannerId: bannerData?.banner ?? '',
          },
        });
    } else {
      dismissBannerPromise =
        CreatorHomeClient.creatorHomeContentApi.creatorHomeContentDisableCreatorHubBannerByGroup({
          groupId: Number(creatorContext.id),
          creatorHomeContentDisableCreatorHubBannerByUserRequest: {
            bannerId: bannerData?.banner ?? '',
          },
        });
    }

    // NOTE (@mbae, 2024/08/05): We don't want to stop closing the bannner if the api request fails
    dismissBannerPromise.catch(() => {});

    captureHomepageEvent('closePersonalizationBanner', EHomepageSection.PersonalizationBanner, {
      banner: bannerData?.banner ?? '',
      creatorContext: creatorContext.type,
      bannerContext: bannerData?.visibilityContext?.toString() ?? '',
    });

    clearBannerData(bannerData?.banner);
  }, [
    bannerData?.banner,
    bannerData?.visibilityContext,
    creatorContext.id,
    creatorContext.type,
    clearBannerData,
  ]);

  if (!isAllowed || !title || !subTitle || !actionText || !bannerData?.banner) {
    return null;
  }

  return (
    <Section
      classes={{
        root: cx(section, {
          [dismissedSection]: !bannerData?.banner,
        }),
      }}>
      <Banner
        ref={ref}
        title={title}
        description={subTitle}
        primary={{
          label: actionText,
          onClick: onBannerClick,
          color: 'primary',
        }}
        illustration={{
          src: bannerData?.imageReference
            ? BannerImageMap[bannerData?.imageReference]?.[themeMode]
            : '',
          alt: bannerData?.banner ?? '',
        }}
        onClose={onBannerClose}
      />
    </Section>
  );
};

// NOTE (@mbae, 09/12/24): We need to make sure bannerData is not null before using useConversionTracker
const BannerContainerWrapper = () => {
  const { bannerData } = useContext(BannerContext);
  if (!bannerData?.banner) {
    return null;
  }

  return <BannerContainer />;
};

export default withTranslation(BannerContainerWrapper, [TranslationNamespace.Home]);
