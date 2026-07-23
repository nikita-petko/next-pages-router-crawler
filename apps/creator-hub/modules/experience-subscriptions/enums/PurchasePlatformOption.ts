import type { TranslationKey } from '@modules/analytics-translations/types';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

export enum PurchasePlatform {
  Desktop = 'Desktop',
  Apple = 'Apple',
  Google = 'Google',
  RobloxCredit = 'RobloxCredit',
  Robux = 'Robux',
}

export const PurchasePlatformLabelTranslationKeys: Record<PurchasePlatform, TranslationKey> = {
  Desktop: translationKey('Label.Desktop', TranslationNamespace.ExperienceSubscriptions),
  Apple: translationKey('Label.Apple', TranslationNamespace.ExperienceSubscriptions),
  Google: translationKey('Label.Google', TranslationNamespace.ExperienceSubscriptions),
  RobloxCredit: translationKey('Label.RobloxCredit', TranslationNamespace.ExperienceSubscriptions),
  Robux: translationKey('Label.Robux', TranslationNamespace.ExperienceSubscriptions),
};
