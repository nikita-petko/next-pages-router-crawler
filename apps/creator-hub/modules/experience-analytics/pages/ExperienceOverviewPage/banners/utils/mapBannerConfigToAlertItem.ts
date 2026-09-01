import type { TranslationKeyToFormattedText } from '@modules/analytics-translations/types';
import type { BannerConfigurationWithoutKeyAndCategory } from '@modules/charts-generic/components/StatusBanner';
import type { UnifiedAlertItem } from '@modules/unified-alerts/types';

interface BannerConfigWithKey extends BannerConfigurationWithoutKeyAndCategory {
  key: string;
}

/**
 * Maps a backend-driven banner configuration (used by SingleStatusBanner)
 * into a UnifiedAlertItem data object.
 */
const mapBannerConfigToAlertItem = (
  config: BannerConfigWithKey,
  translate: TranslationKeyToFormattedText,
): UnifiedAlertItem => {
  return {
    id: config.key,
    title: translate(config.titleKey),
    description: translate(config.descriptionKey),
    learnMoreLink: config.primaryActionConfig?.link || undefined,
    learnMoreText: config.primaryActionConfig
      ? translate(config.primaryActionConfig.text)
      : undefined,
    dismissible: !!config.dismissalKey,
  };
};

export default mapBannerConfigToAlertItem;
