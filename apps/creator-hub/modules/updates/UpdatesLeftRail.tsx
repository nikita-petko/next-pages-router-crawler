import React, { useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { useTranslation, withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import LeftNavigationMenuV2 from '@modules/navigation/leftNavigation/components/LeftNavigationMenuV2';

export type UpdatesNavigationItem = {
  key: string;
  href: string;
  label: string;
};

export const UPDATES_NAVIGATION_NAMESPACES = [
  TranslationNamespace.Home,
  TranslationNamespace.Navigation,
  TranslationNamespace.RoadMap,
];

const UPDATES_NAV_ITEMS = [
  {
    key: 'changelog',
    href: '/updates',
    labelKey: 'Heading.Changelog',
    namespace: TranslationNamespace.Home,
  },
  {
    key: 'roadmap',
    href: '/updates/roadmap',
    labelKey: 'Label.Roadmap',
    namespace: TranslationNamespace.RoadMap,
  },
] as const;

export function useUpdatesNavigation(): {
  activeItem: UpdatesNavigationItem | undefined;
  activeKey: string;
  items: UpdatesNavigationItem[];
} {
  const { translateWithNamespace } = useTranslation();
  const pathname = usePathname();

  const activeKey = useMemo(() => {
    return pathname.endsWith('/roadmap') ? 'roadmap' : 'changelog';
  }, [pathname]);

  const items = useMemo(
    () =>
      UPDATES_NAV_ITEMS.map((item) => ({
        key: item.key,
        href: item.href,
        label: translateWithNamespace(item.namespace, item.labelKey),
      })),
    [translateWithNamespace],
  );

  const activeItem = useMemo(
    () => items.find((item) => item.key === activeKey),
    [activeKey, items],
  );

  return { activeItem, activeKey, items };
}

const UpdatesLeftRail: React.FC = () => {
  const { translateWithNamespace } = useTranslation();
  const { activeKey, items } = useUpdatesNavigation();

  return (
    <LeftNavigationMenuV2
      activeKey={activeKey}
      header={translateWithNamespace(TranslationNamespace.Navigation, 'Heading.Updates')}
      items={items}
    />
  );
};

export default withTranslation(UpdatesLeftRail, UPDATES_NAVIGATION_NAMESPACES);
