import { TranslationNamespace } from '@modules/miscellaneous/localization';

/**
 * This is a list of translation namespaces that are used in analytics components.
 *
 * Ideally soon we will have a functional withNamespaceSwitchedTranslation wrapper that uses
 *  the namespace attached to each key, then this list won't matter except as a fallback.
 *
 * For now, you may need to add your namespace into this list as a consumer of the analytics framework.
 */
const wellKnownAnalyticsTranslationNamespaces = [
  TranslationNamespace.CloudServices,
  TranslationNamespace.Controls,
  TranslationNamespace.Error,
  TranslationNamespace.ImmersiveAdsAnalytics,
  TranslationNamespace.ExperienceSubscriptions,
  TranslationNamespace.Navigation,
  TranslationNamespace.Genres,
  TranslationNamespace.Matchmaking,
  TranslationNamespace.Creations,
  TranslationNamespace.UniverseConfigAndExperimentation,
  TranslationNamespace.AvatarAnalytics,
  TranslationNamespace.Safety,
  TranslationNamespace.RecommendationService,
  // The analytics namespace must be last since it's an analytics component.
  // We don't store resources by namespace; when common keys appear in multiple
  // namespaces, the values from the last namespace override the earlier ones.
  TranslationNamespace.Analytics,
] as const satisfies string[];
export default wellKnownAnalyticsTranslationNamespaces;
