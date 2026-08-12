import { useEffect, type FC } from 'react';
import { useLocalization } from '@rbx/intl';
import TranslationNamespace from '@modules/miscellaneous/localization/enums/TranslationNamespace';
import type TranslationResourceProvider from '@modules/miscellaneous/localization/implementations/TranslationResourceProvider';

export const L2_TRANSLATION_CACHE_NAMESPACES = [
  // Updates
  TranslationNamespace.Home,
  TranslationNamespace.RoadMap,
  // Analytics (beyond Analytics, which layout already loads)
  TranslationNamespace.AvatarAnalytics,
  TranslationNamespace.ShareLinkAnalytics,
  TranslationNamespace.StoreAnalytics,
  TranslationNamespace.Community,
  // Settings
  TranslationNamespace.Notifications,
  TranslationNamespace.Settings,
  TranslationNamespace.SendrNotificationPreferences,
  TranslationNamespace.Preferences,
  TranslationNamespace.Advanced,
  TranslationNamespace.DataCollectionSettings,
  TranslationNamespace.MarketplaceOnboarding,
  TranslationNamespace.FiatPaidAccess,
  TranslationNamespace.PublicPublish,
  TranslationNamespace.DevEx,
  // Translation tool (All Tools → L2)
  TranslationNamespace.GameTranslation,
  TranslationNamespace.GameStringTranslation,
] as const;

type PreloadL2TranslationNamespacesProps = {
  provider: TranslationResourceProvider;
};

const PreloadL2TranslationNamespaces: FC<PreloadL2TranslationNamespacesProps> = ({ provider }) => {
  const { locale } = useLocalization();

  useEffect(() => {
    if (locale == null) {
      return;
    }
    void provider.loadTranslationResources([...L2_TRANSLATION_CACHE_NAMESPACES], locale);
  }, [locale, provider]);

  return null;
};

export default PreloadL2TranslationNamespaces;
