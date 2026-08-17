import { RAQIV2ProductType } from '@rbx/creator-hub-analytics-config';
import { ThumbnailClient, ThumbnailTypes, ReturnPolicy } from '@rbx/thumbnails';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import type { RAQIV2BreakdownValue } from '@modules/clients/analytics';
import { getEnabledItemType } from '@modules/creations/avatarCreationTokens/utils/formHelpers';
import { getAvatarCreationTokenIconPath } from '@modules/creations/avatarCreationTokens/utils/getAvatarCreationTokenIconPath';
import type { CreatorAnalyticsEmbeddedSurfaceConfig } from '@modules/experience-analytics-shared/types/RAQIV2PageConfig';
import type { ItemMetadata } from '@modules/experience-analytics-shared/types/RAQIV2SummaryCardShared';
import { Item } from '@modules/miscellaneous/common';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { getUrlForItemType } from '@modules/miscellaneous/urls';
import { dashboard } from '@modules/miscellaneous/urls/creatorHub';
import type { ItemMonetizationApiClient } from '../../context/ItemMonetizationClientProvider';
import type { ItemMonetizationContentConfig } from '../../utils/buildItemMonetizationPageConfig';
import {
  buildItemMonetizationPageConfig,
  keyToString,
} from '../../utils/buildItemMonetizationPageConfig';
import type { ParsedProductKey } from '../../utils/parseProductKeyBreakdownValue';
import parseProductKeyBreakdownValue from '../../utils/parseProductKeyBreakdownValue';

const getAvatarItemConfigureUrl = (
  universeId: number,
  key: ParsedProductKey,
): string | undefined => {
  if (key.subtype === 'iec') {
    return key.stringId
      ? dashboard.getConfigureAvatarCreationTokenUrl(universeId, key.stringId)
      : undefined;
  }
  return (
    getUrlForItemType(key.subtype === 'bundle' ? Item.Bundle : Item.CatalogAsset, key.itemId) ??
    undefined
  );
};

const makeGetAvatarItemMetadata =
  (universeId: number) =>
  (breakdowns: RAQIV2BreakdownValue[]): Promise<ItemMetadata> => {
    const parsedKey = parseProductKeyBreakdownValue(breakdowns);
    if (!parsedKey) {
      return Promise.resolve({ itemId: 0, itemType: Item.CatalogAsset });
    }
    return Promise.resolve({
      itemId: parsedKey.itemId,
      url: getAvatarItemConfigureUrl(universeId, parsedKey),
      itemType: parsedKey.subtype === 'bundle' ? Item.Bundle : Item.CatalogAsset,
    });
  };

const getAvatarItemThumbnailUrl = async (
  universeId: number,
  client: ItemMonetizationApiClient,
  key: ParsedProductKey,
): Promise<string> => {
  try {
    if (key.subtype === 'iec') {
      const { data } = await client.getCachedAvatarCreationTokens(universeId, [key.stringId ?? '']);
      const itemType = data[0]?.itemType;
      return getAvatarCreationTokenIconPath(itemType ? getEnabledItemType(itemType) : undefined);
    }
    const { imageUrl } = await ThumbnailClient.getThumbnailImage(
      key.subtype === 'bundle' ? ThumbnailTypes.bundleThumbnail : ThumbnailTypes.assetThumbnail,
      key.itemId,
      ReturnPolicy.PlaceHolder,
    );
    return imageUrl ?? '';
  } catch {
    return '';
  }
};

const buildCommissionAvatarPageConfig = (
  universeId: number,
  client: ItemMonetizationApiClient,
  transactionPageUrl: string,
): CreatorAnalyticsEmbeddedSurfaceConfig => {
  const contentConfig: ItemMonetizationContentConfig = {
    productType: RAQIV2ProductType.CommissionAvatar,
    getItemType: (breakdowns) => {
      const parsedKey = parseProductKeyBreakdownValue(breakdowns);
      if (!parsedKey) {
        return Item.CatalogAsset;
      }
      return parsedKey.subtype === 'asset' ? Item.CatalogAsset : Item.Bundle;
    },
    tableKeysPrefix: 'AvatarItemsTable',
    topItemsHeadingKey: translationKey('Heading.TopAvatarItems', TranslationNamespace.Analytics),
    nameColumnTitleKey: translationKey('Label.AvatarItems', TranslationNamespace.Analytics),
    revenueTitleKey: translationKey('Title.TotalRevenue', TranslationNamespace.Analytics),
    salesTitleKey: translationKey('Title.TotalSales', TranslationNamespace.Analytics),
    makeGetItemMetadataForSummaryCard: makeGetAvatarItemMetadata,
    getItemsByIds: async (
      universeIdParam: number,
      keys: ParsedProductKey[],
      apiClient: ItemMonetizationApiClient,
    ) => {
      const assets = keys.filter((key) => key.subtype === 'asset');
      const bundles = keys.filter((key) => key.subtype === 'bundle');
      const tokenIds = keys
        .filter((key) => key.subtype === 'iec')
        .map((key) => key.stringId)
        .filter((tokenId): tokenId is string => tokenId !== undefined && tokenId !== '');

      const [assetsData, bundlesData, tokensData] = await Promise.all([
        apiClient.getCachedAssetDetails(assets.map((key) => key.itemId)),
        apiClient.getCachedBundleDetails(bundles.map((key) => key.itemId)),
        apiClient.getCachedAvatarCreationTokens(universeIdParam, tokenIds),
      ]);

      const catalogItems = [...assetsData.data, ...bundlesData.data].map((d) => ({
        id: keyToString({ itemId: d.itemId }),
        name: d.name,
        priceInRobux: d.price ?? 0,
      }));
      const tokenItems = tokensData.data.map((t) => ({
        id: keyToString({ subtype: 'iec', itemId: 0, stringId: t.tokenId }),
        name: t.name,
        priceInRobux: t.priceInRobux,
      }));

      return [...catalogItems, ...tokenItems];
    },
    getThumbnailUrl: async (key: ParsedProductKey) => {
      return getAvatarItemThumbnailUrl(universeId, client, key);
    },
    getConfigureUrl: (universeIdParam, key) => getAvatarItemConfigureUrl(universeIdParam, key),
  };

  return buildItemMonetizationPageConfig(universeId, client, transactionPageUrl, contentConfig);
};

export default buildCommissionAvatarPageConfig;
