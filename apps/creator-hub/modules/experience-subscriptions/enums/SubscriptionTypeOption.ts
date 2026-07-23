import { TranslationKey, translationKey } from '@modules/analytics-translations';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

export enum SubscriptionType {
  FirstTime = 'FirstTime',
  Renewal = 'Renewal',
  Resurrection = 'Resurrection',
}

export const SubscriptionTypeLabelTranslationKeys: Record<SubscriptionType, TranslationKey> = {
  FirstTime: translationKey('Label.FirstTime', TranslationNamespace.ExperienceSubscriptions),
  Renewal: translationKey('Label.Renewal', TranslationNamespace.ExperienceSubscriptions),
  Resurrection: translationKey('Label.Resurrected', TranslationNamespace.ExperienceSubscriptions),
};
