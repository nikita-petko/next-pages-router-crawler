import { TNavigationSettings } from '../hooks/navigationSettings';

export const pageIds = [
  'root',
  'analytics',
  'content',
  'monetization',
  'services',
  'settings',
  'places',
  'badges',
  'passes',
  'developerProducts',
  'subscriptions',
] as const;

export const experienceBasePath = '/dashboard/creations/experiences/[id]';
export const passesBasePath = `${experienceBasePath}/passes/[passId]`;
export const placesBasePath = `${experienceBasePath}/places/[placeId]`;
export const badgesBasePath = `${experienceBasePath}/badges/[badgeId]`;
export const developerProductsBasePath = `${experienceBasePath}/developer-products/[productId]`;
export const subscriptionsBasePath = `${experienceBasePath}/experience-subscriptions/[subscriptionId]`;
export const environmentsBasePath = `${experienceBasePath}/environments/[environmentId]`;

export const rootPages = {
  overview: {
    pathname: `${experienceBasePath}/overview`,
    label: 'Heading.Overview',
  },
  moderation: {
    pathname: `${experienceBasePath}/moderation/bans`,
    label: 'Heading.Moderation',
  },
  activityHistory: {
    pathname: `${experienceBasePath}/activity-history`,
    label: 'Label.ActivityHistory',
  },
} as const;

export const analyticsPages = {
  'analytics.dashboards.engagement': {
    pathname: `${experienceBasePath}/analytics/engagement`,
    label: 'Heading.Engagement',
    isEnabledOnSettings: ({ userCanViewAnalyticsForUniverse }: TNavigationSettings) =>
      userCanViewAnalyticsForUniverse,
  },
  'analytics.dashboards.retention': {
    pathname: `${experienceBasePath}/analytics/retention`,
    label: 'Heading.Retention',
    isEnabledOnSettings: ({ userCanViewAnalyticsForUniverse }: TNavigationSettings) =>
      userCanViewAnalyticsForUniverse,
  },
  'analytics.dashboards.userAcquisition': {
    pathname: `${experienceBasePath}/analytics/acquisition`,
    label: 'Heading.Acquisition',
    isEnabledOnSettings: ({ userCanViewAnalyticsForUniverse }: TNavigationSettings) =>
      userCanViewAnalyticsForUniverse,
  },
  'analytics.dashboards.performance': {
    pathname: `${experienceBasePath}/analytics/performance`,
    label: 'Heading.Performance',
    isEnabledOnSettings: ({ userCanViewAnalyticsForUniverse }: TNavigationSettings) =>
      userCanViewAnalyticsForUniverse,
  },
  'analytics.eventTracking.funnels': {
    pathname: `${experienceBasePath}/analytics/funnels`,
    label: 'Heading.Funnels',
    isEnabledOnSettings: ({ userCanViewAnalyticsForUniverse }: TNavigationSettings) =>
      userCanViewAnalyticsForUniverse,
  },
  'analytics.eventTracking.economy': {
    pathname: `${experienceBasePath}/analytics/economy`,
    label: 'Heading.Economy',
    isEnabledOnSettings: ({ userCanViewAnalyticsForUniverse }: TNavigationSettings) =>
      userCanViewAnalyticsForUniverse,
  },
  'analytics.eventTracking.custom': {
    pathname: `${experienceBasePath}/analytics/custom`,
    label: 'Heading.Custom',
    isEnabledOnSettings: ({ userCanViewAnalyticsForUniverse }: TNavigationSettings) =>
      userCanViewAnalyticsForUniverse,
  },
  'analytics.audience.demographics': {
    pathname: `${experienceBasePath}/analytics/audience`,
    label: 'Heading.Demographics',
    isEnabledOnSettings: ({ userCanViewAnalyticsForUniverse }: TNavigationSettings) =>
      userCanViewAnalyticsForUniverse,
  },
  'analytics.audience.feedback': {
    pathname: `${experienceBasePath}/feedback`,
    label: 'Heading.Feedback',
    isEnabledOnSettings: ({
      enablePlayerFeedback,
      userCanViewAnalyticsForUniverse,
    }: TNavigationSettings) => enablePlayerFeedback && userCanViewAnalyticsForUniverse,
  },
  'analytics.dashboards.selectEligibility': {
    pathname: `${experienceBasePath}/analytics/select-eligibility`,
    label: 'Title.SelectEligibility',
    isEnabledOnSettings: ({
      canConfigure,
      enableCoreContentStatusLabelLink,
      canGetSelectEligibilityData,
    }: TNavigationSettings) =>
      (canConfigure && enableCoreContentStatusLabelLink && canGetSelectEligibilityData) ?? false,
  },
} as const;

export const safetyPages = {
  'safety.overview': {
    pathname: `${experienceBasePath}/safety/overview`,
    label: 'Heading.Safety',
    isEnabledOnSettings: ({ userCanViewAnalyticsForUniverse }: TNavigationSettings) =>
      userCanViewAnalyticsForUniverse,
  },
  'safety.collaborators': {
    pathname: `${experienceBasePath}/safety/collaborators`,
    label: 'Tab.Collaborators',
    isEnabledOnSettings: () => true,
  },
} as const;

export const contentPages = {
  'content.build.places': {
    pathname: `${experienceBasePath}/places`,
    label: 'Heading.Places',
    isEnabledOnSettings: ({ canConfigure }: TNavigationSettings) => canConfigure,
  },
  'content.build.assets': {
    pathname: `${experienceBasePath}/permissions`,
    label: 'Heading.Assets',
    isEnabledOnSettings: ({ canConfigure }: TNavigationSettings) => canConfigure,
  },
  'content.build.badges': {
    pathname: `${experienceBasePath}/associated-items`,
    queryParams: { activeTab: 'Badge' },
    label: 'Heading.Badges',
    isEnabledOnSettings: ({ canConfigure }: TNavigationSettings) => canConfigure,
  },
  'content.build.environments': {
    pathname: `${experienceBasePath}/environments`,
    label: 'Heading.Environments',
    isEnabledOnSettings: ({ canConfigure, enableEnvironments }: TNavigationSettings) =>
      canConfigure && enableEnvironments,
  },
  'content.engage.eventsUpdates': {
    pathname: `${experienceBasePath}/events`,
    label: 'Heading.EventsUpdates',
    isEnabledOnSettings: ({
      canConfigureExperienceEvents,
      isOwner,
      userCanViewAnalyticsForUniverse,
    }: TNavigationSettings) =>
      (canConfigureExperienceEvents && isOwner) || userCanViewAnalyticsForUniverse,
  },
  'content.engage.referralRewards': {
    pathname: `${experienceBasePath}/referral-reward-details`,
    label: 'Heading.ReferralRewards',
    isEnabledOnSettings: ({ canConfigure, isOwner }: TNavigationSettings) =>
      canConfigure && isOwner,
  },
  'content.engage.notifications': {
    pathname: `${experienceBasePath}/notifications`,
    label: 'Heading.Notifications',
    isEnabledOnSettings: ({ canConfigure }: TNavigationSettings) => canConfigure,
  },
  'content.engage.guildedCommunity': {
    pathname: `${experienceBasePath}/community`,
    label: 'Heading.GuildedCommunity',
    isEnabledOnSettings: ({ canConfigure, locale, isLuobu }: TNavigationSettings) =>
      !isLuobu && canConfigure && (locale?.startsWith('en-') ?? false),
  },
  'content.engage.recommendationService': {
    pathname: `${experienceBasePath}/recommendation-service`,
    label: 'Heading.RecommendationService',
    isEnabledOnSettings: ({
      userCanViewAnalyticsForUniverse,
      recommendationServiceEnabled,
    }: TNavigationSettings) => userCanViewAnalyticsForUniverse && recommendationServiceEnabled,
  },
  'content.build.translations': {
    pathname: `${experienceBasePath}/localization`,
    label: 'Heading.Translate',
    isEnabledOnSettings: ({ canConfigure }: TNavigationSettings) => canConfigure ?? false,
  },
} as const;

export const monetizationPages = {
  'monetization.overview': {
    pathname: `${experienceBasePath}/monetization/overview`,
    label: 'Heading.Overview',
    isEnabledOnSettings: ({ userCanViewAnalyticsForUniverse }: TNavigationSettings) =>
      userCanViewAnalyticsForUniverse,
  },
  'monetization.priceOptimization': {
    pathname: `${experienceBasePath}/monetization/price-optimization`,
    label: 'Heading.PriceOptimization',
    isEnabledOnSettings: ({ canConfigure, isPriceOptimizationEnabled }: TNavigationSettings) =>
      canConfigure && isPriceOptimizationEnabled,
  },
  'monetization.inExperience.developerProducts': {
    pathname: `${experienceBasePath}/monetization/developer-products`,
    label: 'Label.DeveloperProducts',
    isEnabledOnSettings: ({ canConfigure, userCanViewAnalyticsForUniverse }: TNavigationSettings) =>
      canConfigure || userCanViewAnalyticsForUniverse,
  },
  'monetization.inExperience.gamePass': {
    pathname: `${experienceBasePath}/monetization/passes`,
    label: 'Heading.GamePass',
    isEnabledOnSettings: ({ canConfigure, userCanViewAnalyticsForUniverse }: TNavigationSettings) =>
      canConfigure || userCanViewAnalyticsForUniverse,
  },
  'monetization.inExperience.subscriptions': {
    pathname: `${experienceBasePath}/monetization/subscriptions`,
    label: 'Heading.Subscriptions',
    isEnabledOnSettings: ({ canConfigure, userCanViewAnalyticsForUniverse }: TNavigationSettings) =>
      canConfigure || userCanViewAnalyticsForUniverse,
  },
  'monetization.inExperience.immersiveAds': {
    pathname: `${experienceBasePath}/monetization/immersive-ads`,
    label: 'Heading.Ads',
    isEnabledOnSettings: ({ canConfigure, userCanViewAnalyticsForUniverse }: TNavigationSettings) =>
      canConfigure && userCanViewAnalyticsForUniverse,
  },
  'monetization.inExperience.commerce': {
    pathname: `${experienceBasePath}/monetization/commerce`,
    label: 'Heading.Commerce',
    isEnabledOnSettings: ({
      canConfigure,
      enableCommerce,
      isCommercePilotEnabled,
    }: TNavigationSettings) => canConfigure && (enableCommerce || isCommercePilotEnabled),
  },
  'monetization.avatar.avatarItems': {
    pathname: `${experienceBasePath}/monetization/avatar-items`,
    label: 'Label.AvatarItems',
    isEnabledOnSettings: ({ canConfigure, userCanViewAnalyticsForUniverse }: TNavigationSettings) =>
      canConfigure && userCanViewAnalyticsForUniverse,
  },
  'monetization.avatar.avatarCreationTokens': {
    pathname: `${experienceBasePath}/monetization/avatar-creation-tokens`,
    label: 'Heading.CreationTokens',
    isEnabledOnSettings: ({ isAvatarCreationTokensEnabled }: TNavigationSettings) =>
      isAvatarCreationTokensEnabled,
  },
  'monetization.inExperience.creatorRewards': {
    pathname: `${experienceBasePath}/monetization/creator-rewards`,
    label: 'Heading.CreatorRewards',
    isEnabledOnSettings: ({ userCanViewAnalyticsForUniverse }: TNavigationSettings) =>
      userCanViewAnalyticsForUniverse ?? false,
  },
} as const;

export const servicesPages = {
  'services.extendedServicesUnlock': {
    pathname: `${experienceBasePath}/extended-services`,
    label: 'Heading.ExtendedServices',
    isEnabledOnSettings: ({ canConfigure }: TNavigationSettings) => canConfigure,
  },
  'services.infrastructure.dataStores': {
    pathname: `${experienceBasePath}/analytics/data-stores`,
    label: 'Heading.DataStores',
    isEnabledOnSettings: ({ userCanViewAnalyticsForUniverse }: TNavigationSettings) =>
      userCanViewAnalyticsForUniverse,
  },
  'services.infrastructure.dataStoresManager': {
    pathname: `${experienceBasePath}/data-stores`,
    label: 'Heading.DataStoresManager',
    isEnabledOnSettings: ({ canConfigure }: TNavigationSettings) => canConfigure,
  },
  'services.infrastructure.memoryStores': {
    pathname: `${experienceBasePath}/analytics/memory-stores`,
    label: 'Heading.MemoryStores',
    isEnabledOnSettings: ({ userCanViewAnalyticsForUniverse }: TNavigationSettings) =>
      userCanViewAnalyticsForUniverse,
  },
  'services.infrastructure.speechToText': {
    pathname: `${experienceBasePath}/analytics/speech-to-text`,
    label: 'Heading.SpeechToText',
    isEnabledOnSettings: ({
      showSpeechToTextDashboard,
      userCanViewAnalyticsForUniverse,
    }: TNavigationSettings) => showSpeechToTextDashboard && userCanViewAnalyticsForUniverse,
  },
  'services.infrastructure.textToSpeech': {
    pathname: `${experienceBasePath}/analytics/text-to-speech`,
    label: 'Heading.TextToSpeech',
    isEnabledOnSettings: ({
      showTextToSpeechDashboard,
      userCanViewAnalyticsForUniverse,
    }: TNavigationSettings) => showTextToSpeechDashboard && userCanViewAnalyticsForUniverse,
  },
  'services.infrastructure.errorReports': {
    pathname: `${experienceBasePath}/analytics/errors`,
    label: 'Heading.ErrorReports',
    isEnabledOnSettings: ({ userCanViewAnalyticsForUniverse }: TNavigationSettings) =>
      userCanViewAnalyticsForUniverse,
  },
  'services.integrations.apiSettings': {
    pathname: `${experienceBasePath}/api-settings`,
    label: 'Heading.APISettings',
    isEnabledOnSettings: ({ canConfigure, isLuobu }: TNavigationSettings) =>
      !isLuobu && canConfigure,
  },
  'services.integrations.secrets': {
    pathname: `${experienceBasePath}/secrets`,
    label: 'Heading.Secrets',
    isEnabledOnSettings: ({ canConfigure, isLuobu }: TNavigationSettings) =>
      !isLuobu && canConfigure,
  },
  'services.integrations.webhooks': {
    pathname: `${experienceBasePath}/webhooks`,
    label: 'Heading.Webhooks',
    isEnabledOnSettings: ({
      canManageWebhooks,
      isLuobu,
      isExperienceWebhooksEnabled,
    }: TNavigationSettings) => !isLuobu && canManageWebhooks && isExperienceWebhooksEnabled,
  },
  'services.logicGameplay.matchmaking': {
    pathname: `${experienceBasePath}/matchmaking`,
    label: 'Heading.CustomMatchmaking',
    isEnabledOnSettings: ({ canConfigure }: TNavigationSettings) => canConfigure,
  },
  'services.logicGameplay.remoteConfigs': {
    pathname: `${experienceBasePath}/analytics/configs`,
    label: 'Heading.Configs',
    isEnabledOnSettings: ({
      userCanViewAnalyticsForUniverse,
      remoteConfigsEnabled,
    }: TNavigationSettings) => userCanViewAnalyticsForUniverse && remoteConfigsEnabled,
  },
} as const;

export const settingsPages = {
  'settings.general': {
    pathname: `${experienceBasePath}/configure`,
    label: 'Heading.General',
    isEnabledOnSettings: ({ canConfigure }: TNavigationSettings) => canConfigure,
  },
  'settings.access': {
    pathname: `${experienceBasePath}/access`,
    label: 'Heading.Access',
    isEnabledOnSettings: ({ isLuobu, canConfigure }: TNavigationSettings) =>
      !isLuobu && canConfigure,
  },
  'settings.maturityCompliance': {
    pathname: `${experienceBasePath}/experience-questionnaire`,
    label: 'Heading.MaturityAndCompliance',
    isEnabledOnSettings: ({
      isLuobu,
      canConfigure,
      shouldUseQuestionnaireV2,
    }: TNavigationSettings) => !isLuobu && canConfigure && !shouldUseQuestionnaireV2,
  },
  'settings.maturityComplianceV2': {
    pathname: `${experienceBasePath}/experience-questionnaire`,
    label: 'Heading.MaturityAndComplianceQuestionnaireV2',
    isEnabledOnSettings: ({
      isLuobu,
      canConfigure,
      shouldUseQuestionnaireV2,
    }: TNavigationSettings) => !isLuobu && canConfigure && !!shouldUseQuestionnaireV2,
  },
  'settings.matureLanguage': {
    pathname: `${experienceBasePath}/communication-settings`,
    label: 'Heading.MatureLanguage',
    isEnabledOnSettings: ({ isLuobu, canConfigure }: TNavigationSettings) =>
      !isLuobu && canConfigure,
  },
  'settings.collaborators': {
    pathname: `${experienceBasePath}/collaborators`,
    label: 'Tab.Collaborators',
    isEnabledOnSettings: () => true,
  },
} as const;

const placesPages = {
  'places.basicSettings': {
    pathname: `${placesBasePath}/configure`,
    label: 'Heading.BasicSettings',
  },
  'places.icon': {
    pathname: `${placesBasePath}/icon`,
    label: 'Heading.Icon',
  },
  'places.thumbnails': {
    pathname: `${placesBasePath}/thumbnails`,
    label: 'Heading.Thumbnails',
  },
  'places.access': {
    pathname: `${placesBasePath}/access`,
    label: 'Heading.Access',
  },
  'places.versionHistory': {
    pathname: `${placesBasePath}/version-history`,
    label: 'Heading.VersionHistory',
  },
  'places.permission': {
    pathname: `${placesBasePath}/permissions`,
    label: 'Heading.Permissions',
  },
} as const;

const badgesPages = {
  'badges.overview': {
    pathname: `${badgesBasePath}/overview`,
    label: 'Heading.Overview',
  },
  'badges.basicSettings': {
    pathname: `${badgesBasePath}/configure`,
    label: 'Heading.Settings',
  },
} as const;

const passesPages = {
  'passes.basicSettings': {
    pathname: `${passesBasePath}/configure`,
    label: 'Heading.BasicSettings',
  },
  'passes.sales': {
    pathname: `${passesBasePath}/sales`,
    label: 'Heading.Sales',
  },
  'passes.promotions': {
    pathname: `${passesBasePath}/promotions`,
    label: 'Heading.Promotions',
  },
} as const;

const developerProductsPages = {
  'developerProducts.basicSettings': {
    pathname: `${developerProductsBasePath}/configure`,
    label: 'Heading.BasicSettings',
  },
} as const;

const subscriptionsPages = {
  'subscriptions.updateSubscription': {
    pathname: `${subscriptionsBasePath}/configure`,
    label: 'Heading.UpdateSubscription',
  },
} as const;

export const pages = {
  ...rootPages,
  ...analyticsPages,
  ...contentPages,
  ...monetizationPages,
  ...safetyPages,
  ...servicesPages,
  ...settingsPages,
  ...placesPages,
  ...badgesPages,
  ...passesPages,
  ...developerProductsPages,
  ...subscriptionsPages,
} as const;

export type TPageIds = (typeof pageIds)[number];
export type TLinkNodeIds = keyof typeof pages;
