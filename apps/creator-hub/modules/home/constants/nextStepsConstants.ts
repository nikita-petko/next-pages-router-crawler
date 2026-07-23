import { urls } from '@modules/miscellaneous/common';
import { resolveUrl } from '@rbx/env-utils';
import {
  LibraryAddIcon,
  LocalMallIcon,
  SelectAllIcon,
  DynamicFeedIcon,
  Filter1Icon,
  DescriptionIcon,
  LocalAtmIcon,
  SupervisedUserCircleIcon,
  TranslateOutlinedIcon,
  EventIcon,
  PermContactCalendarIcon,
  RobuxIcon,
  ForumIcon,
} from '@rbx/ui';

const {
  creatorHub: { creatorStore },
} = urls;
export type TNextStepsTopic = {
  id: string;
  title: string;
  // NOTE (jcountryman, 06/16/23): This is related to product requirements
  // 10DAU — A loaded experience has more than 10 DAU
  // 100DAU — A loaded experience has more than 100 DAU
  // 5KROBUX — Loaded experiences have earned more than 5,000 Robux in last 7 days
  requirement?: '10DAU' | '100DAU' | '5KROBUX';
  description: string;
  url: string;
  IconComponent: React.FunctionComponent<React.PropsWithChildren<{ classes?: { root?: string } }>>;
  openInNewTab: boolean;
};

export const nextStepsTopics: TNextStepsTopic[] = [
  {
    id: '1',
    title: 'Heading.CommunityContent',
    description: 'Description.CommunityContentStore',
    url: `${creatorStore.getUrl()}/models/trending?includeOnlyVerifiedCreators=true`,
    IconComponent: LibraryAddIcon,
    openInNewTab: false,
  },
  {
    id: '2',
    title: 'Heading.AvatarItems',
    description: 'Description.AvatarItems',
    url: `${process.env.baseUrl}/dashboard/creations?activeTab=TShirt`,
    IconComponent: LocalMallIcon,
    openInNewTab: false,
  },
  {
    id: '3',
    title: 'Heading.Roadmap',
    description: 'Description.Roadmap',
    url: `${process.env.baseUrl}/roadmap`,
    IconComponent: SelectAllIcon,
    openInNewTab: false,
  },
  {
    id: '4',
    title: 'Heading.BeInspired',
    description: 'Description.BeInspired',
    // This will point to the latest "What are you working on currently?" thread on forum without needing a code change.
    // It can be managed via the Permalinks feature on the forum:
    // https://devforum.roblox.com/admin/customize/permalinks
    url: resolveUrl(
      'devForumWAYWOCInspirationUrl',
      process.env.targetEnvironment,
      process.env.buildTarget,
    ),
    IconComponent: DynamicFeedIcon,
    openInNewTab: true,
  },
  {
    id: '5',
    title: 'Heading.DiscoverCreations',
    description: 'Description.DiscoverCreations',
    url: `https://www.${process.env.robloxSiteDomain}/discover#/`,
    IconComponent: ForumIcon,
    openInNewTab: false,
  },
  {
    id: '6',
    title: 'Heading.CommunityEvents',
    description: 'Description.CommunityEvents',
    url: `https://events.${process.env.robloxSiteDomain}`,
    IconComponent: Filter1Icon,
    openInNewTab: false,
  },

  {
    id: '7',
    title: 'Heading.CommunityTutorials',
    description: 'Description.CommunityTutorials',
    url: 'https://devforum.roblox.com/c/resources/community-tutorials/46/l/top',
    IconComponent: DescriptionIcon,
    openInNewTab: true,
  },
  {
    id: '8',
    title: 'Heading.ExpertsProgram',
    description: 'Description.ExpertsProgram',
    url: `https://devforum.roblox.com/c/resources/roblox-staff/278`,
    IconComponent: SupervisedUserCircleIcon,
    openInNewTab: true,
  },
  {
    id: '9',
    title: 'Heading.SponsoredAds',
    description: 'Description.SponsoredAds',
    requirement: '10DAU',
    url: `https://ads.${process.env.robloxSiteDomain}`,
    IconComponent: LocalAtmIcon,
    openInNewTab: false,
  },
  {
    id: '10',
    title: 'Heading.ExperienceGuidelines',
    description: 'Description.ExperienceGuidelines',
    requirement: '10DAU',
    url: `${process.env.baseUrl}/docs/production/promotion/experience-guidelines`,
    IconComponent: SupervisedUserCircleIcon,
    openInNewTab: false,
  },
  {
    id: '12',
    title: 'Heading.Translations',
    description: 'Description.Translations',
    requirement: '100DAU',
    url: `${process.env.baseUrl}/docs/production/localization`,
    IconComponent: TranslateOutlinedIcon,
    openInNewTab: false,
  },
  {
    id: '13',
    title: 'Heading.Events',
    description: 'Description.Events',
    requirement: '100DAU',
    url: `${process.env.baseUrl}/docs/production/promotion/events-platform`,
    IconComponent: EventIcon,
    openInNewTab: false,
  },
  {
    id: '14',
    title: 'Heading.TalentHub',
    description: 'Description.TalentHub',
    requirement: '100DAU',
    url: `${process.env.baseUrl}/talent/search/jobs?verifiedOnly=false&page=1`,
    IconComponent: PermContactCalendarIcon,
    openInNewTab: false,
  },
  {
    id: '15',
    title: 'Heading.DevEx',
    description: 'Description.DevEx',
    requirement: '5KROBUX',
    url: `${process.env.baseUrl}/dashboard/devex`,
    IconComponent: RobuxIcon,
    openInNewTab: false,
  },
];
