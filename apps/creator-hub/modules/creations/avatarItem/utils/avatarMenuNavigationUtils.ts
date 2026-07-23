import { Asset } from '@modules/miscellaneous/common';
import { AvatarMenuMap, BundleType } from '../constants/avatarItemConstants';

const creationsBasePath = '/dashboard/creations';
const defaultActiveTab = Asset.HairAccessory;

function getCreationsRouteString(activeTab?: string, filterIndex?: number, groupId?: number) {
  const searchParams = new URLSearchParams();

  searchParams.append('activeTab', activeTab || defaultActiveTab);
  if (filterIndex !== undefined) {
    searchParams.append('filterIndex', filterIndex.toString());
  }
  if (groupId !== undefined) {
    searchParams.append('groupId', groupId.toString());
  }

  return `${creationsBasePath}?${searchParams.toString()}`;
}

export default function getRouteToAvatarItemCreationsPage(
  itemType?: string,
  groupId?: number,
): string {
  if (itemType) {
    // Find the matching dropdown and item
    const matchingEntry = Object.entries(AvatarMenuMap).find(([, dropdownItems]) =>
      dropdownItems.some(
        (item) =>
          item.assetType === itemType ||
          BundleType[item.bundleType ?? -1] === itemType ||
          item.lookType === itemType,
      ),
    );

    if (matchingEntry) {
      const [dropdownTitle, dropdownItems] = matchingEntry;
      const itemIndex = dropdownItems.findIndex(
        (item) =>
          item.assetType === itemType ||
          BundleType[item.bundleType ?? -1] === itemType ||
          item.lookType === itemType,
      );
      return getCreationsRouteString(dropdownTitle, itemIndex, groupId);
    }
  }
  return getCreationsRouteString(undefined, undefined, groupId);
}
