import {
  DashboardOutlinedIcon,
  DescriptionOutlinedIcon,
  LocalMallOutlinedIcon,
  TranslateOutlinedIcon,
  RobuxIcon,
  TimelineOutlinedIcon,
  PeopleOutlineOutlinedIcon,
  ExtensionIcon,
} from '@rbx/ui';
import type { ComponentPropsWithoutRef } from 'react';
import type { Icon } from '@rbx/foundation-ui';
import { urls } from '@modules/miscellaneous/common';

import {
  bloxFruitsPath,
  adoptMePath,
  bedWarsPath,
  petSimulatorPath,
  doorsPath,
  murderMystery2Path,
  dressToImpressPath,
  fischPath,
  gunfightArenaPath,
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
import englishMetaJson from '../../../../public/locales/en-US/CreatorDashboard.DeveloperLanding.json';

const { creatorHub, blog, studio } = urls;

export const metadataConstants: {
  title: string;
  description: string;
} = {
  title: englishMetaJson['Label.MetadataTitle'],
  description: englishMetaJson['Label.MetadataDescription'],
};
export const experienceIds = {
  doors: 2440500124,
  bloxFruits: 994732206,
  petSimulator: 3317771874,
  murderMystery2: 66654135,
  gunfightArena: 5012222382,
  fisch: 5750914919,
  dressToImpress: 5203828273,
  adoptMe: 383310974,
  bedWars: 2619619496,
};

export const experienceAssets = {
  doors: doorsPath,
  bloxFruits: bloxFruitsPath,
  petSimulator: petSimulatorPath,
  murderMystery2: murderMystery2Path,
  gunfightArena: gunfightArenaPath,
  fisch: fischPath,
  dressToImpress: dressToImpressPath,
  adoptMe: adoptMePath,
  bedWars: bedWarsPath,
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
    title: 'Label.RobloxBlog',
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
    video:
      'https://www.youtube-nocookie.com/embed/gPqqEyu8bNo?si=1Awg25WFLg86uJSc&amp;rel=0&controls=0',
    name: 'Jessica',
    userId: 2992823703,
    username: 'designcheeeese',
    quote: 'Label.JessicaQuote',
  },
  {
    video:
      'https://www.youtube-nocookie.com/embed/lFN22-p8_Bw?si=O8c5d_cz-zmamyWF&amp;rel=0&controls=0',
    name: 'Shawn',
    userId: 16222847,
    username: 'shawnyg',
    quote: 'Label.ShawnQuote',
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
  IconComponent: typeof PeopleOutlineOutlinedIcon | TFoundationIconName;
}> = [
  {
    title: 'Label.LiveCollaboration',
    description: 'Description.LiveCollaboration',
    IconComponent: PeopleOutlineOutlinedIcon,
  },
  {
    title: 'Label.AiTools',
    description: 'Description.AiTools',
    IconComponent: 'icon-regular-nebula',
  },
  {
    title: 'Label.CustomizationAndPlugins',
    description: 'Description.StudioCustomization',
    IconComponent: ExtensionIcon,
  },
];
