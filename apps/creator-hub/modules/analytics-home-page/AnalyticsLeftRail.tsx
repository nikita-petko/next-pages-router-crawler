import React, { useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { useFlag } from '@rbx/flags';
import { useTranslation, withTranslation } from '@rbx/intl';
import { creatorAnalytics } from '@generated/flags/communities';
import { isIpLicensingEarningsEnabled } from '@generated/flags/contentLicensing';
import AnalyticsQueryParams from '@modules/charts-generic/enums/AnalyticsQueryParams';
import { AnalyticsHomeTab } from '@modules/clients/analytics';
import useCurrentAccount from '@modules/ip/rights/hooks/useCurrentAccount';
import { useQueryParams } from '@modules/miscellaneous/hooks';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import LeftNavigationMenuV2 from '@modules/navigation/leftNavigation/components/LeftNavigationMenuV2';
import { useCurrentGroup } from '@modules/providers/groups/GroupsProvider';

export type AnalyticsRailItem = {
  key: string;
  href: string;
  label: string;
};

export const ANALYTICS_NAVIGATION_NAMESPACES = [
  TranslationNamespace.Analytics,
  TranslationNamespace.AvatarAnalytics,
  TranslationNamespace.Community,
  TranslationNamespace.Navigation,
  TranslationNamespace.ShareLinkAnalytics,
  TranslationNamespace.StoreAnalytics,
];

const ANALYTICS_BASE_PATH = '/dashboard/analytics';
const IP_EARNINGS_PATH = `${ANALYTICS_BASE_PATH}/ip-earnings`;
const missingGroupFlagContext = { groupId: 0 };

const ANALYTICS_NAV_ITEMS = [
  {
    key: AnalyticsHomeTab.Experience,
    labelKey: 'Heading.ExperiencesTab',
    namespace: TranslationNamespace.Analytics,
  },
  {
    key: 'ShareLinks',
    labelKey: 'Heading.ShareLinks',
    namespace: TranslationNamespace.ShareLinkAnalytics,
  },
  {
    key: AnalyticsHomeTab.Avatar,
    labelKey: 'Heading.AvatarItems',
    namespace: TranslationNamespace.AvatarAnalytics,
  },
  {
    key: 'Store',
    labelKey: 'Heading.StoreItems',
    namespace: TranslationNamespace.StoreAnalytics,
  },
] as const;

function buildAnalyticsTabHref(tabKey: string): string {
  return `${ANALYTICS_BASE_PATH}?${AnalyticsQueryParams.Tab}=${tabKey}`;
}

export function useAnalyticsNavigation(): {
  activeItem: AnalyticsRailItem | undefined;
  activeKey: string;
  items: AnalyticsRailItem[];
} {
  const { translateWithNamespace } = useTranslation();
  const pathname = usePathname();
  const currentGroup = useCurrentGroup();
  const { features: accountFeatures } = useCurrentAccount();
  const [query] = useQueryParams([AnalyticsQueryParams.Tab]);
  const { ready: isCommunityFlagReady, value: isCreatorAnalyticsEnabled } = useFlag(
    creatorAnalytics,
    currentGroup ? { groupId: currentGroup.id } : missingGroupFlagContext,
  );
  const showCommunitiesTab = Boolean(
    currentGroup && isCommunityFlagReady && isCreatorAnalyticsEnabled,
  );

  const { ready: isIpLicensingFlagReady, value: isIpLicensingEnabled } = useFlag(
    isIpLicensingEarningsEnabled,
  );
  const showIpLicensingTab =
    isIpLicensingFlagReady && isIpLicensingEnabled && accountFeatures.enableAgreements;

  const selectedKey = useMemo(() => {
    if (pathname === IP_EARNINGS_PATH || pathname.endsWith('/ip-earnings')) {
      return 'IpLicensing';
    }
    const raw = Array.isArray(query.tab) ? query.tab[0] : query.tab;
    return typeof raw === 'string' && raw.length > 0 ? raw : undefined;
  }, [pathname, query.tab]);

  const activeKey = selectedKey ?? AnalyticsHomeTab.Experience;

  const items = useMemo(() => {
    const navItems: AnalyticsRailItem[] = ANALYTICS_NAV_ITEMS.map((item) => ({
      key: item.key,
      href: buildAnalyticsTabHref(item.key),
      label: translateWithNamespace(item.namespace, item.labelKey),
    }));

    if (showCommunitiesTab) {
      navItems.push({
        key: 'Communities',
        href: buildAnalyticsTabHref('Communities'),
        label: translateWithNamespace(TranslationNamespace.Community, 'Heading.Communities'),
      });
    }

    if (showIpLicensingTab) {
      navItems.push({
        key: 'IpLicensing',
        href: buildAnalyticsTabHref('IpLicensing'),
        label: translateWithNamespace(TranslationNamespace.Analytics, 'Heading.Licenses'),
      });
    }

    return navItems;
  }, [showCommunitiesTab, showIpLicensingTab, translateWithNamespace]);

  const activeItem = useMemo(
    () => (selectedKey === undefined ? undefined : items.find((item) => item.key === selectedKey)),
    [items, selectedKey],
  );

  return { activeItem, activeKey, items };
}

const AnalyticsLeftRail: React.FC = () => {
  const { translateWithNamespace } = useTranslation();
  const { activeKey, items } = useAnalyticsNavigation();

  return (
    <LeftNavigationMenuV2
      activeKey={activeKey}
      header={translateWithNamespace(TranslationNamespace.Navigation, 'Heading.Analytics')}
      items={items}
    />
  );
};

export default withTranslation(AnalyticsLeftRail, ANALYTICS_NAVIGATION_NAMESPACES);
