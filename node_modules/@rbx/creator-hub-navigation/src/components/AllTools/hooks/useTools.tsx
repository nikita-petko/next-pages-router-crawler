import React, { useMemo } from 'react';
import { useTranslation } from '@rbx/intl';
import { useDebounce } from '@rbx/react-utilities';
import { LaunchIcon } from '@rbx/ui';
import useNavigationConfigs from '../../../hooks/useNavigationConfigs';
import { useWorkspaces } from '../../../providers/WorkspaceProvider';
import useProductUrls from '../../../utils/useProductUrls';

export type TTool = {
  key: string;
  label: string;
  href?: string;
  external?: boolean;
  adornment?: React.ReactNode;
  items?: {
    key: string;
    label: string;
    href: string;
    adornment?: React.ReactNode;
    external?: boolean;
  }[];
};

export type TTools = Record<string, TTool>;

export const filterTools = (tools: TTools, searchTerm: string): TTools => {
  if (searchTerm.length < 1) {
    return tools;
  }
  const lowerCaseSearchTerm = searchTerm.toLowerCase();
  const filteredTools: TTools = {};

  Object.entries(tools).forEach(([key, tool]) => {
    const match = (label: string) => {
      const splitToolLabel = label.split(' ');
      return (
        label.toLowerCase().startsWith(lowerCaseSearchTerm) ||
        splitToolLabel.some((l) => l.toLowerCase().startsWith(lowerCaseSearchTerm))
      );
    };
    const searchMatch = match(tool.label);

    if (searchMatch) {
      filteredTools[key] = tool;
      return;
    }

    if (tool.items) {
      const filteredItems = tool.items.filter(({ label }) => match(label));

      if (filteredItems.length > 0) {
        filteredTools[key] = { ...tool, items: filteredItems };
      }
    }
  });

  return filteredTools;
};

export const getTalentHref = (talentHome: string, enableTalentHubV2M2?: boolean): string =>
  enableTalentHubV2M2 ? talentHome.replace(/\/talent\/?$/, '/hire') : talentHome;

const useTools = (searchTerm = '') => {
  const { Dashboard, Documentation, Store, Ads, Roblox, Forum, Talent } = useProductUrls();
  const { currentWorkspace } = useWorkspaces();
  const { enableAdsManager, enableTalentHubV2M2 } = useNavigationConfigs();
  const { translate } = useTranslation();
  const debounceSearchTerm = useDebounce(searchTerm, 100);
  const talentHref = getTalentHref(Talent.home, enableTalentHubV2M2);

  const tools = useMemo(
    () =>
      ({
        creations: {
          key: 'creations',
          label: translate('Heading.Creations'),
          href: Dashboard.creations,
          items: [
            {
              key: 'experience',
              label: translate('Heading.Experiences'),
              href: Dashboard.creations,
            },
            {
              key: 'avatarItems',
              label: translate('Title.AvatarItems'),
              href: Dashboard.avatarItems,
            },
            {
              key: 'developerItems',
              label: translate('Label.DevelopmentItems'),
              href: Dashboard.developerItems,
            },
            {
              key: 'shareLinks',
              label: translate('Heading.ShareLinks'),
              href: Dashboard.shareLinks,
            },
          ],
        },
        apiKeys: { key: 'apiKeys', label: translate('Heading.APIKeys'), href: Dashboard.apiKeys },
        oAuth2: { key: 'oAuth2', label: translate('Heading.OAuth2'), href: Dashboard.oAuth },
        finance: {
          key: 'finance',
          label: translate('Heading.Finance'),
          href: Dashboard.devEx,
          items: [
            {
              key: 'devEx',
              label: translate('Heading.DevEx'),
              href: Dashboard.devEx,
            },
            {
              key: 'payouts',
              label: translate('Heading.Payouts'),
              href: Dashboard.payouts,
            },
            {
              key: 'transactions',
              label: translate('Heading.Transactions'),
              href: Dashboard.transactions,
            },
          ],
        },
        analytics: {
          key: 'analytics',
          label: translate('Heading.Analytics'),
          href: Dashboard.analytics,
        },
        learn: {
          key: 'learn',
          label: translate('Heading.Learn'),
          href: Documentation.home,
          items: [
            {
              key: 'getStarted',
              label: translate('Title.GetStarted'),
              href: Documentation.newToRobloxGetStarted,
            },
            {
              key: 'tutorials',
              label: translate('Title.Tutorials'),
              href: Documentation.newToRobloxTutorials,
            },
            {
              key: 'engineReference',
              label: translate('Label.EngineReference'),
              href: Documentation.engine,
            },
            {
              key: 'openCloudReference',
              label: translate('Label.OpenCloudReference'),
              href: Documentation.cloud,
            },
          ],
        },
        store: {
          key: 'store',
          label: translate('Heading.Store'),
          href: Store.home,
          items: [
            { key: 'models', label: translate('Title.Models'), href: Store.models },
            { key: 'plugins', label: translate('Heading.Plugins'), href: Store.plugins },
            { key: 'audio', label: translate('Title.Audio'), href: Store.audio },
            { key: 'decals', label: translate('Label.Decals'), href: Store.decals },
          ],
        },
        translation: {
          key: 'translation',
          label: translate('Heading.Translation'),
          href: Dashboard.translations,
        },
        licenses: {
          key: 'licenses',
          label: translate('Heading.Licenses'),
          href: Dashboard.licenses,
        },
        ads: {
          key: 'ads',
          label: translate('Title.Ads'),
          href: Ads.home,
          external: true,
          items: [
            {
              key: 'adsManager',
              label: translate('Heading.AdsManager'),
              href: Ads.home,
              external: !enableAdsManager,
              adornment: enableAdsManager ? undefined : <LaunchIcon fontSize='small' />,
            },
            {
              key: 'sponsoredItems',
              label: translate('Heading.SponsoredItems'),
              href:
                currentWorkspace.creatorType === 'Group'
                  ? Roblox.getGroupSponsoredItems(currentWorkspace.creatorId)
                  : Roblox.sponsoredItems,
              external: true,
              adornment: <LaunchIcon fontSize='small' />,
            },
          ],
        },
        collaboration: {
          key: 'collaboration',
          label: translate('Heading.Collaboration'),
          href: Dashboard.groupProfile,
          items: [
            {
              key: 'members',
              label: translate('Label.Members'),
              href: Dashboard.groupMembers,
            },
            {
              key: 'roles',
              label: translate('Label.Roles'),
              href: Dashboard.groupRoles,
            },
            {
              key: 'activityHistory',
              label: translate('Label.ActivityHistory'),
              href: Dashboard.groupActivityHistory,
            },
          ],
        },
        intellectualProperty: {
          key: 'intellectualProperty',
          label: translate('Heading.IP'),
          href: Dashboard.intellectualProperty,
        },
        forum: {
          key: 'forum',
          label: translate('Heading.Forums'),
          href: Forum.home,
        },
        talent: {
          key: 'talent',
          label: translate('Heading.Talent'),
          href: talentHref,
        },
        roadmap: {
          key: 'roadmap',
          label: translate('Heading.Roadmap'),
          href: Dashboard.roadmap,
        },
        changelog: {
          key: 'changelog',
          label: translate('Heading.Changelog'),
          href: Dashboard.updates,
        },
        creatorPrograms: {
          key: 'creatorPrograms',
          label: translate('Title.CreatorPrograms'),
          href: Dashboard.build,
        },
      }) satisfies TTools,
    [
      translate,
      Dashboard.creations,
      Dashboard.avatarItems,
      Dashboard.developerItems,
      Dashboard.shareLinks,
      Dashboard.apiKeys,
      Dashboard.oAuth,
      Dashboard.devEx,
      Dashboard.payouts,
      Dashboard.transactions,
      Dashboard.analytics,
      Dashboard.translations,
      Dashboard.licenses,
      Dashboard.groupProfile,
      Dashboard.groupMembers,
      Dashboard.groupRoles,
      Dashboard.groupActivityHistory,
      Dashboard.intellectualProperty,
      Dashboard.roadmap,
      Dashboard.updates,
      Dashboard.build,
      Documentation.home,
      Documentation.newToRobloxGetStarted,
      Documentation.newToRobloxTutorials,
      Documentation.engine,
      Documentation.cloud,
      Store.home,
      Store.models,
      Store.plugins,
      Store.audio,
      Store.decals,
      Ads.home,
      enableAdsManager,
      currentWorkspace.creatorType,
      currentWorkspace.creatorId,
      Roblox,
      Forum.home,
      talentHref,
    ],
  );

  return useMemo(
    () => filterTools(tools, debounceSearchTerm),
    [debounceSearchTerm, tools],
  ) as Partial<typeof tools>;
};

export default useTools;
