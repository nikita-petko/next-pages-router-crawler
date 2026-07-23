import type { ComponentPropsWithoutRef } from 'react';
import type { Icon } from '@rbx/foundation-ui';
import {
  DashboardOutlinedIcon,
  DescriptionOutlinedIcon,
  LocalMallOutlinedIcon,
  TranslateOutlinedIcon,
  RobuxIcon,
  TimelineOutlinedIcon,
} from '@rbx/ui';
import { blog, creatorHub, studio } from '@modules/miscellaneous/urls';
import englishMetaJson from '../../../../public/metadata/en-US/CreatorDashboard.DeveloperLanding.json';
import {
  rivalsPath,
  scaryShawarmaKioskPath,
  dressToImpressPath,
  drivingEmpirePath,
  duelingGroundsPath,
  dragonAdventuresPath,
  monsterVerzePath,
  pixelQuestPath,
  arcadeBasketballPath,
  conquerTheWorldPath,
} from '../../constants/gameConstants';
import {
  forumImage,
  creatorRoadmapImage,
  robloxBlogImage,
  studioLogoImage,
  rocketLogoImage,
  immersiveAdsImage,
  subsAndPassesImage,
  inExperiencePurchasesImage,
  avatarItemsImage,
  wingsImage,
  globeImage,
  pluginsImage,
} from './assetConstants';

export const metadataConstants: {
  title: string;
  description: string;
} = {
  title: englishMetaJson['Label.MetadataTitle'],
  description: englishMetaJson['Label.MetadataDescription'],
};
export const experienceIds = {
  rivals: 6035872082,
  scaryShawarmaKiosk: 8539298853,
  dressToImpress: 5203828273,
  drivingEmpire: 1202096104,
  duelingGrounds: 9051406594,
  dragonAdventures: 1235188606,
  monsterVerze: 7113705633,
  pixelQuest: 7458874788,
  arcadeBasketball: 7884563721,
  conquertheWorld: 4983034985,
};

export const experienceAssets = {
  rivals: rivalsPath,
  scaryShawarmaKiosk: scaryShawarmaKioskPath,
  dressToImpress: dressToImpressPath,
  drivingEmpire: drivingEmpirePath,
  duelingGrounds: duelingGroundsPath,
  dragonAdventures: dragonAdventuresPath,
  monsterVerze: monsterVerzePath,
  pixelQuest: pixelQuestPath,
  arcadeBasketball: arcadeBasketballPath,
  conquertheWorld: conquerTheWorldPath,
};
export const creatorHubConstants: Array<{
  IconComponent: typeof DashboardOutlinedIcon | typeof RobuxIcon;
  title: string;
  description: string;
  url: string;
  identifier: string;
}> = [
  {
    IconComponent: DashboardOutlinedIcon,
    title: 'Label.Dashboard',
    description: 'Description.Dashboard',
    url: creatorHub.dashboard.getUrl(),
    identifier: 'creatorDashboard',
  },
  {
    IconComponent: DescriptionOutlinedIcon,
    title: 'Label.Documentation',
    description: 'Description.Documentation',
    url: creatorHub.docs.getUrl(),
    identifier: 'creatorDocumentation',
  },
  {
    IconComponent: LocalMallOutlinedIcon,
    title: 'Label.Store',
    description: 'Description.Store',
    url: creatorHub.creatorStore.getUrl(),
    identifier: 'creatorStore',
  },
  {
    IconComponent: TimelineOutlinedIcon,
    title: 'Label.Analytics',
    description: 'Description.Analytics',
    url: creatorHub.dashboard.getAnalyticsOverviewUrl(),
    identifier: 'creatorAnalytics',
  },
  {
    IconComponent: TranslateOutlinedIcon,
    title: 'Label.Translations',
    description: 'Description.Translations',
    url: creatorHub.dashboard.getTranslatorPortalUrl(),
    identifier: 'creatorTranslations',
  },
  {
    IconComponent: RobuxIcon,
    title: 'Label.DeveloperExchange',
    description: 'Description.DeveloperExchange',
    url: creatorHub.dashboard.getDevexUrl(),
    identifier: 'developerExchange',
  },
];

export const latestConstants: Array<{
  image: string;
  title: string;
  description: string;
  link: string;
  url: string;
  identifier: string;
}> = [
  {
    image: robloxBlogImage,
    title: 'Label.RobloxNews',
    link: 'Action.LearnMore',
    description: 'Description.RobloxBlog',
    url: blog.getUrl(),
    identifier: 'robloxBlog',
  },
  {
    image: creatorRoadmapImage,
    title: 'Label.CreatorRoadmap',
    link: 'Action.LearnMore',
    description: 'Description.CreatorRoadmap',
    url: creatorHub.getRoadmapUrl(),
    identifier: 'creatorRoadmap',
  },
  {
    image: forumImage,
    title: 'Label.CommunityForums',
    link: 'Action.LearnMore',
    description: 'Description.CommunityForums',
    url: creatorHub.developerForum.getBaseUrl(),
    identifier: 'communityForums',
  },
];

export const communityConstants: Array<{
  video: string;
  name: string;
  userId: number;
  username: string;
  quote: string;
}> = [
  {
    video: 'https://www.youtube-nocookie.com/embed/IuJWzpvpIa8?rel=0&controls=0',
    name: 'Nosniy',
    userId: 20349956,
    username: 'Nosniy',
    quote: 'Label.NosniyQuote',
  },
  {
    video: 'https://www.youtube-nocookie.com/embed/eph8HDbEs6U?rel=0&controls=0',
    name: 'Mary',
    userId: 51645737,
    username: 'Erythia',
    quote: 'Label.MaryQuote',
  },
];

export const overviewConstants: Array<{
  title: string;
  description: string;
  link: string;
  url: string;
  image: string;
  identifier: string;
  alt: string;
}> = [
  {
    title: 'Heading.Publishing',
    description: 'Description.Publishing',
    link: 'Action.LearnMore',
    url: creatorHub.docs.getStudioUrl(),
    image: wingsImage,
    identifier: 'availableAcrossAllMajorPlatforms',
    alt: 'Wings,',
  },
  {
    title: 'Heading.MultiplayerEngine',
    description: 'Description.MultiplayerEngine',
    link: 'Action.DownloadStudio',
    url: studio.getDownloadUrl() ?? '',
    image: studioLogoImage,
    identifier: 'robloxStudio',
    alt: 'Roblox Studio',
  },
  {
    title: 'Heading.ReachGlobalAudience',
    description: 'Description.ReachGlobalAudience',
    link: 'Action.LearnMore',
    url: creatorHub.docs.getPlatformUrl(),
    image: globeImage,
    identifier: 'massiveGlobalAudience',
    alt: 'Globe',
  },
  {
    title: 'Heading.IterateRapidly',
    description: 'Description.IterateRapidly',
    link: 'Action.LearnMore',
    url: creatorHub.docs.getAnalyticsUrl(),
    image: rocketLogoImage,
    identifier: 'iterateRapidly',
    alt: 'Rocket',
  },
];

export const businessConstants: Array<{
  image: string;
  title: string;
}> = [
  {
    image: inExperiencePurchasesImage,
    title: 'Label.InExperiencePurchases',
  },
  {
    image: subsAndPassesImage,
    title: 'Label.SubscriptionsAndPasses',
  },
  {
    image: avatarItemsImage,
    title: 'Label.AvatarItems',
  },
  {
    image: immersiveAdsImage,
    title: 'Label.ImmersiveAds',
  },
  {
    image: pluginsImage,
    title: 'Label.StudioPlugins',
  },
];

export type TFoundationIconName = ComponentPropsWithoutRef<typeof Icon>['name'];

export const studioConstants: Array<{
  title: string;
  description: string;
}> = [
  {
    title: 'Label.LiveCollaboration',
    description: 'Description.LiveCollaboration',
  },
  {
    title: 'Label.StudioAIAssistant',
    description: 'Description.StudioAIAssistant',
  },
  {
    title: 'Label.CustomizationAndPlugins',
    description: 'Description.StudioCustomization',
  },
];
