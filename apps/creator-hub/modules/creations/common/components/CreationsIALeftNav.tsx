import type { FunctionComponent } from 'react';
import { useMemo } from 'react';
import { useRouter } from 'next/router';
import { useFlag } from '@rbx/flags';
import { useTranslation } from '@rbx/intl';
import { isAssetAccessRequestsEnabled } from '@generated/flags/contentAccessAndInventory';
import { Asset } from '@modules/miscellaneous/common';
import { isValidEnumValue } from '@modules/miscellaneous/utils/enumUtils';
import { readQueryValue } from '@modules/miscellaneous/utils/queryToString';
import LeftNavigationMenuV2, {
  type TMenuItem,
} from '@modules/navigation/leftNavigation/components/LeftNavigationMenuV2';
import { useCurrentGroup } from '@modules/providers/groups/GroupsProvider';
import { useSettings } from '@modules/settings/SettingsProvider/SettingsProvider';
import {
  AVATAR_ITEMS_ACTIVE_TAB,
  isTaxonomyActiveTab,
  TAXONOMY_HOST_ASSET,
} from '../../avatarItem/utils/taxonomyRoutingUtils';
import useTaxonomyDashboardGate from '../../home/hooks/useTaxonomyDashboardGate';
import menuItems from '../../menu/constants/MenuConstants';
import creationsMenuManager from '../../menu/implementations/CreationsMenuManager';
import useMomentsGate from '../../moments/hooks/useMomentsGate';

const CREATION_MENU_ITEM_PREFIX = 'creation-';

const creationMenuLabelKeys: Partial<Record<Asset, string>> = {
  [Asset.Place]: 'Label.Experiences',
  [Asset.ShareLink]: 'Heading.ShareLinks',
  [Asset.TShirt]: 'Label.AvatarItems',
  [Asset.Decal]: 'Label.DevelopmentItems',
  [Asset.Moments]: 'Label.Moments',
};

const parseActiveTabQueryParam = (value: string | string[] | undefined): Asset | undefined => {
  const raw = readQueryValue(value);
  return raw !== undefined && isValidEnumValue(Asset, raw) ? raw : undefined;
};

const CreationsIALeftNav: FunctionComponent = () => {
  const router = useRouter();
  const { translate } = useTranslation();
  const { settings } = useSettings();
  const currentGroup = useCurrentGroup();
  const isMomentsTabEnabled = useMomentsGate();
  const { value: isAAREnabled } = useFlag(isAssetAccessRequestsEnabled);
  const isTaxonomyEnabled = useTaxonomyDashboardGate();

  const creationHref = useMemo(
    () =>
      (activeTab?: Asset | string, filterIndex?: number): string => {
        const params = new URLSearchParams();
        const groupId = readQueryValue(router.query.groupId);

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
    const items = menuItems
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
        const isAvatarItems = menuItem.type === Asset.TShirt;
        // Avatar Items opens straight into the category view when it is enabled, so the landing URL
        // does not have to be rewritten after the fact. Every other entry is left untouched.
        const avatarItemsActiveTab = isTaxonomyEnabled
          ? AVATAR_ITEMS_ACTIVE_TAB
          : Asset.AvatarLooks;
        return {
          key: `${CREATION_MENU_ITEM_PREFIX}${menuItem.type}`,
          label: labelKey ? translate(labelKey) : translate(menuItem.nameKey),
          href:
            menuItem.type === Asset.Place
              ? creationHref()
              : creationHref(
                  isAvatarItems ? avatarItemsActiveTab : activeTab,
                  isAvatarItems ? 0 : undefined,
                ),
        };
      });
    return items;
  }, [
    creationHref,
    currentGroup,
    isAAREnabled,
    isMomentsTabEnabled,
    isTaxonomyEnabled,
    settings,
    translate,
  ]);

  const activeKey = useMemo(() => {
    // A taxonomy activeTab carries no asset type, so resolve it through the Avatar Items host tab
    // instead of falling back to the default (Experiences) menu item.
    const activeMenuState = creationsMenuManager.getMenuState(
      isTaxonomyActiveTab(router.query.activeTab)
        ? TAXONOMY_HOST_ASSET
        : parseActiveTabQueryParam(router.query.activeTab),
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
