import type { BannerConfiguration } from '@rbx/client-creator-home-api/v1';
import { useTranslation } from '@rbx/intl';
import useBannerTranslationParameters from './useBannerTranslationParameters';

const useBannerTranslation = (bannerData?: BannerConfiguration) => {
  const { tags, args } = useBannerTranslationParameters(bannerData);
  const { translateHTML } = useTranslation();

  if (!bannerData) {
    return {
      title: '',
      subTitle: '',
      actionText: '',
    };
  }

  return {
    title: translateHTML(bannerData.titleTextMessage || '', tags, args),
    subTitle: translateHTML(bannerData.subTextMessage || '', tags, args),
    actionText: translateHTML(bannerData.buttonText || '', tags, args),
  };
};

export default useBannerTranslation;
