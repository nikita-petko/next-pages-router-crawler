import React, { useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { useTranslation, withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import LeftNavigationMenuV2 from '@modules/navigation/leftNavigation/components/LeftNavigationMenuV2';

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

const UpdatesLeftRail: React.FC = () => {
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

  return (
    <LeftNavigationMenuV2
      activeKey={activeKey}
      header={translateWithNamespace(TranslationNamespace.Navigation, 'Heading.Updates')}
      items={items}
    />
  );
};

export default withTranslation(UpdatesLeftRail, [
  TranslationNamespace.Home,
  TranslationNamespace.Navigation,
  TranslationNamespace.RoadMap,
]);
