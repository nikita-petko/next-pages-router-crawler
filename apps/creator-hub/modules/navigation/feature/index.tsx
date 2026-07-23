import React from 'react';
import {
  CampaignIcon,
  CampaignOutlinedIcon,
  CloudQueueIcon,
  CollectionsIcon,
  CollectionsOutlinedIcon,
  CopyrightIcon,
  HomeIcon,
  HomeOutlinedIcon,
  InsightsIcon,
  LaunchIcon,
  PeopleIcon,
  PeopleOutlineOutlinedIcon,
  SavingsIcon,
  SavingsOutlinedIcon,
  TranslateOutlinedIcon,
} from '@rbx/ui';

import Feature from './interfaces/Feature';
import NavigationFeatureManager from './implementations/NavigationFeatureManager';
import DevexBalance from './components/DevexBalance';
import { collaborationFeatureName } from './constants/featureNames';
import { TCombinedSettings } from '../constants';

export type { Feature };
export { NavigationFeatureManager };
export const featureManagerV2 = new NavigationFeatureManager();

function isSomeSubFeaturesEnabled(
  subFeatures: Feature<TCombinedSettings>[],
  settings?: TCombinedSettings,
) {
  return subFeatures.some(({ isEnabledOnSettings }) =>
    isEnabledOnSettings ? isEnabledOnSettings(settings) : true,
  );
}

const transactionsFeature: Feature<TCombinedSettings> = {
  key: 'transactions',
  nameKey: 'Heading.Transactions',
  path: '/dashboard/transactions',
};

const accountInformationFeature: Feature<TCombinedSettings> = {
  key: 'accountInformation',
  nameKey: 'Heading.AccountInformation',
  path: '/dashboard/account-information',
  isEnabledOnSettings: (settings) => settings?.enableAccountInformation === true,
};

const billingFeature: Feature<TCombinedSettings> = {
  key: 'billing',
  nameKey: 'Heading.Billing',
  path: '/dashboard/billing',
};

const paymentsFeature: Feature<TCombinedSettings> = {
  key: 'payments',
  nameKey: 'Heading.Payments',
  path: '/dashboard/payments',
};

const homeFeature: Feature<TCombinedSettings> = {
  icon: <HomeOutlinedIcon />,
  activeIcon: <HomeIcon />,
  key: 'home',
  nameKey: 'Heading.Home',
  path: '/',
  getQuery: (groupId?: number) => {
    return groupId ? { groupId } : {};
  },
};
const creationsFeatureV2: Feature<TCombinedSettings> = {
  icon: <CollectionsOutlinedIcon />,
  activeIcon: <CollectionsIcon />,
  key: 'creations',
  nameKey: 'Heading.Creations',
  path: '/dashboard/creations',
  getQuery: (groupId?: number) => {
    return groupId ? { groupId } : {};
  },
};

const analyticsFeatureV2: Feature<TCombinedSettings> = {
  icon: <InsightsIcon />,
  activeIcon: <InsightsIcon />,
  key: 'analytics',
  nameKey: 'Heading.Analytics',
  path: '/dashboard/analytics',
  getQuery: (groupId?: number) => {
    return groupId ? { groupId } : {};
  },
  isEnabledOnSettings: (settings) => !settings?.isGroup || !!settings?.canViewAnalytics,
};

const devExFeatureV2: Feature<TCombinedSettings> = {
  key: 'devex',
  nameKey: 'Label.DevEx',
  path: '/dashboard/devex',
  isEnabledOnSettings: (settings) =>
    process.env.buildTarget === 'luobu' ? true : (settings?.isUserEligibleForDevEx ?? false),
  adornment: process.env.buildTarget === 'luobu' && <DevexBalance />,
};

const payoutsFeature: Feature<TCombinedSettings> = {
  key: 'payouts',
  nameKey: 'Heading.Payouts',
  path: '/dashboard/group/payouts',
  isEnabledOnSettings: (settings) => settings?.isGroup === true,
};

const financesFeatureV2: Feature<TCombinedSettings> = {
  icon: <SavingsOutlinedIcon />,
  activeIcon: <SavingsIcon />,
  key: 'finances',
  nameKey: 'Heading.Finances',
  subFeatures: [
    devExFeatureV2,
    transactionsFeature,
    payoutsFeature,
    accountInformationFeature,
    billingFeature,
    paymentsFeature,
  ],
  isEnabledOnSettings: (settings) =>
    financesFeatureV2.subFeatures
      ? isSomeSubFeaturesEnabled(financesFeatureV2.subFeatures, settings)
      : false,
};
const apiKeysFeature: Feature<TCombinedSettings> = {
  key: 'apiKeys',
  nameKey: 'Label.ApiKeys',
  path: '/dashboard/credentials',
  query: { activeTab: 'ApiKeysTab' },
  isEnabledOnSettings: () => process.env.buildTarget === 'global',
};
const oauthFeature: Feature<TCombinedSettings> = {
  key: 'oauthApps',
  nameKey: 'Label.OAuthApps',
  path: '/dashboard/credentials',
  query: { activeTab: 'OAuthTab' },
  isEnabledOnSettings: () => process.env.buildTarget === 'global',
};

const credentialsFeatureV2: Feature<TCombinedSettings> = {
  icon: <CloudQueueIcon />,
  key: 'credentials',
  nameKey: 'Heading.OpenCloud',
  subFeatures: [apiKeysFeature, oauthFeature],
  isEnabledOnSettings: () => process.env.buildTarget === 'global',
};

const translatorPortalFeatureV2: Feature<TCombinedSettings> = {
  icon: <TranslateOutlinedIcon />,
  key: 'translatorPortal',
  nameKey: 'Heading.Localization',
  path: '/dashboard/translator-portal',
};

const intellectualProperty: Feature<TCombinedSettings> = {
  icon: <CopyrightIcon />,
  key: 'ip',
  nameKey: 'Heading.IP',
  path: '/dashboard/ip',
  isEnabledOnSettings: (settings) =>
    process.env.buildTarget !== 'luobu' && settings?.isGroup === false,
  altMatchPaths: [/\/dashboard\/rights-manager\/.*/, /\/dashboard\/license-manager\/.*/],
};

const sponsoredAds: Feature<TCombinedSettings> = {
  key: 'sponsoredAds',
  nameKey: 'Heading.SponsoredItemAds',
  adornment: <LaunchIcon fontSize='small' />,
  getExternalPath: (groupId?: number) => {
    const url = `https://www.${process.env.robloxSiteDomain}/sponsorships/list`;
    if (groupId) {
      return `${url}/group/${groupId}#!/avatar-items`;
    }
    return `${url}#!/avatar-items`;
  },
  isEnabledOnSettings: () => process.env.buildTarget === 'global',
};

const adsManager: Feature<TCombinedSettings> = {
  key: 'adsManager',
  adornment: <LaunchIcon fontSize='small' />,
  nameKey: 'Heading.AdsManager',
  getExternalPath: () => {
    return `https://advertise.${process.env.robloxSiteDomain}`;
  },
  isEnabledOnSettings: () => process.env.buildTarget === 'global',
};

const adsFeatureV2: Feature<TCombinedSettings> = {
  icon: <CampaignOutlinedIcon />,
  activeIcon: <CampaignIcon />,
  key: 'ads',
  nameKey: 'Heading.Ads',
  subFeatures: [adsManager, sponsoredAds],
  isEnabledOnSettings: () => process.env.buildTarget === 'global',
};

const groupMembers: Feature<TCombinedSettings> = {
  key: 'groupMembers',
  nameKey: 'Label.Members',
  path: '/dashboard/group/members',
  query: { activeTab: 'GroupMembersTab' },
};
const groupRoles: Feature<TCombinedSettings> = {
  key: 'groupRoles',
  nameKey: 'Label.Roles',
  path: '/dashboard/group/roles',
  query: { activeTab: 'GroupRolesTab' },
  isEnabledOnSettings: (settings) =>
    settings?.isOwner === true ||
    (settings?.assignableRoleIds && settings?.assignableRoleIds.length > 0) ||
    (settings?.permissionEditableRoleIds !== undefined &&
      settings?.permissionEditableRoleIds?.length > 0) ||
    (settings?.metadataEditableRoleIds !== undefined &&
      settings?.metadataEditableRoleIds?.length > 0),
};
const groupProfile: Feature<TCombinedSettings> = {
  key: 'groupProfile',
  nameKey: 'Label.GroupProfile',
  path: '/dashboard/group/profile',
  query: { activeTab: 'GroupProfileTab' },
  isEnabledOnSettings: (settings) =>
    settings?.canConfigureOrganization === true || settings?.isOwner === true,
};

const groupActivityHistory: Feature<TCombinedSettings> = {
  key: 'groupActivityHistory',
  nameKey: 'Label.ActivityHistory',
  path: '/dashboard/group/activity-history',
  query: { activeTab: 'GroupActivityHistoryTab' },
  isEnabledOnSettings: (settings) => {
    if (!settings) {
      return false;
    }
    // Only the group owner can see the activity history page
    const hasPermission = settings?.isOwner === true || settings?.canViewAuditLogs === true;
    if (!settings?.isGroup || !hasPermission) {
      return false;
    }

    return true;
  },
};

const collaborationFeatureV2: Feature<TCombinedSettings> = {
  icon: <PeopleOutlineOutlinedIcon />,
  activeIcon: <PeopleIcon />,
  key: collaborationFeatureName,
  nameKey: 'Heading.Collaboration',
  subFeatures: [groupMembers, groupRoles, groupProfile, groupActivityHistory],
  // NOTE(blarouche 01-24-2024) Only show if viewing as a group, organization feature is enabled (in settings via IXP), and at least one sub feature is enabled
  isEnabledOnSettings: (settings) =>
    !!settings?.isGroup && collaborationFeatureV2.subFeatures
      ? isSomeSubFeaturesEnabled(collaborationFeatureV2.subFeatures, settings)
      : false,
};

featureManagerV2.addFeature(homeFeature);
featureManagerV2.addFeature(creationsFeatureV2);
featureManagerV2.addFeature(analyticsFeatureV2);
featureManagerV2.addFeature(collaborationFeatureV2);
featureManagerV2.addFeature(financesFeatureV2);
featureManagerV2.addFeature(translatorPortalFeatureV2);
featureManagerV2.addFeature(intellectualProperty);
featureManagerV2.addFeature(adsFeatureV2);
featureManagerV2.addFeature(credentialsFeatureV2);
