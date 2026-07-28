import type { PageResponse } from '@rbx/core';
import itemconfigurationClient from '@modules/clients/itemconfiguration';
import usersClient from '@modules/clients/users';
import { Item } from '@modules/miscellaneous/common';
import type { AssociatedItemsGridPagingParameters } from '../../common/interfaces/AssociatedItemsGridPagingParameters';
import type CreationData from '../../common/interfaces/CreationData';

export default async function getAvatarCreations(
  currToken: string | undefined,
  parameters: AssociatedItemsGridPagingParameters,
): Promise<PageResponse<CreationData>> {
  const avatarCreations = await itemconfigurationClient.getItemsByToken(
    currToken || '',
    20,
    parameters.cursor,
  );

  const formattedData = avatarCreations.items
    ? await Promise.all(
        avatarCreations.items.map(async (creation): Promise<CreationData> => {
          const creator =
            creation.creator && creation.creator?.user?.userId
              ? await usersClient.getUserById(creation.creator?.user?.userId)
              : { name: 'Unknown' };
          const isBundle = !!creation.marketplaceItemDetails?.bundleDetails;
          return {
            name: creation.name,
            userId: creator.id,
            bundleId: isBundle ? creation.id : undefined,
            assetId: isBundle ? undefined : creation.id,
            creatorName: creator.name,
            isClickable: false,
            isIEC: true,
            itemType: creation.marketplaceItemDetails?.assetDetails
              ? Item.CatalogAsset
              : Item.Bundle,
            price: creation.price,
            universeId: creation.creationUniverseId,
          };
        }),
      )
    : [];

  return {
    nextPageCursor: avatarCreations.nextCursor !== '' ? avatarCreations.nextCursor : undefined,
    items: formattedData,
  };
}
