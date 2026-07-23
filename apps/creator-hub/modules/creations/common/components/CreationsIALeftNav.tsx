import type { FunctionComponent } from 'react';
import { useMemo } from 'react';
import { useRouter } from 'next/router';
import { useFlag } from '@rbx/flags';
import { useTranslation } from '@rbx/intl';
import { isAssetAccessRequestsEnabled } from '@generated/flags/contentAccessAndInventory';
import { Asset } from '@modules/miscellaneous/common';
import { isValidEnumValue } from '@modules/miscellaneous/utils/enumUtils';
import LeftNavigationMenuV2, {
  type TMenuItem,
} from '@modules/navigation/leftNavigation/components/LeftNavigationMenuV2';
import { useCurrentGroup } from '@modules/providers/groups/GroupsProvider';
import { useSettings } from '@modules/settings/SettingsProvider/SettingsProvider';
import useMomentsGate from '../../home/hooks/useMomentsGate';
import menuItems from '../../menu/constants/MenuConstants';
import creationsMenuManager from '../../menu/implementations/CreationsMenuManager';

const CREATION_MENU_ITEM_PREFIX = 'creation-';

const creationMenuLabelKeys: Partial<Record<Asset, string>> = {
  [Asset.Place]: 'Label.Experiences',
  [Asset.ShareLink]: 'Heading.ShareLinks',
  [Asset.TShirt]: 'Label.AvatarItems',
  [Asset.Decal]: 'Label.DevelopmentItems',
  [Asset.Moments]: 'Label.Moments',
};

const parseActiveTabQueryParam = (value: string | string[] | undefined): Asset | undefined => {
  const raw = Array.isArray(value) ? value[0] : value;
  if (typeof raw === 'string' && isValidEnumValue(Asset, raw)) {
    return raw;
  }
  return undefined;
};

const getStringQueryParam = (value: string | string[] | undefined): string | undefined =>
  typeof value === 'string' ? value : undefined;

const CreationsIALeftNav: FunctionComponent = () => {
  const router = useRouter();
  const { translate } = useTranslation();
  const { settings } = useSettings();
  const currentGroup = useCurrentGroup();
  const isMomentsTabEnabled = useMomentsGate();
  const { value: isAAREnabled } = useFlag(isAssetAccessRequestsEnabled);

  const creationHref = useMemo(
    () =>
      (activeTab?: Asset, filterIndex?: number): string => {
        const params = new URLSearchParams();
        const groupId = getStringQueryParam(router.query.groupId);

        if (groupId) {
          params.set('groupId', groupId);
        }
        if (activeTab) {
          params.set('activeTab', activeTab);
        }
        if (filterIndex !== undefined) {
          params.set('filterIndex', String(filterIndex));
        }

        const queryString = params.toString();
        return queryString ? `/dashboard/creations?${queryString}` : '/dashboard/creations';
      },
    [router.query.groupId],
  );

  const creationMenuItems = useMemo<TMenuItem[]>(() => {
    return menuItems
      .filter((menuItem) => menuItem.type !== Asset.AssetPermissionRequests || isAAREnabled)
      .filter((menuItem) =>
        creationsMenuManager.isMenuItemEnabled(
          menuItem,
          settings,
          currentGroup,
          undefined,
          undefined,
          isMomentsTabEnabled,
        ),
      )
      .map((menuItem) => {
        const activeTab = menuItem.submenuItems?.[0]?.type ?? menuItem.type;
        const labelKey = creationMenuLabelKeys[menuItem.type];
        return {
          key: `${CREATION_MENU_ITEM_PREFIX}${menuItem.type}`,
          label: labelKey ? translate(labelKey) : translate(menuItem.nameKey),
          href:
            menuItem.type === Asset.Place
              ? creationHref()
              : creationHref(
                  menuItem.type === Asset.TShirt ? Asset.AvatarLooks : activeTab,
                  menuItem.type === Asset.TShirt ? 0 : undefined,
                ),
        };
      });
  }, [creationHref, currentGroup, isAAREnabled, isMomentsTabEnabled, settings, translate]);

  const activeKey = useMemo(() => {
    const activeMenuState = creationsMenuManager.getMenuState(
      parseActiveTabQueryParam(router.query.activeTab),
      [],
    );
    return `${CREATION_MENU_ITEM_PREFIX}${activeMenuState.menuItem.type}`;
  }, [router.query.activeTab]);

  return (
    <LeftNavigationMenuV2
      header={translate('Heading.Creations')}
      activeKey={activeKey}
      items={creationMenuItems}
    />
  );
};

export default CreationsIALeftNav;
