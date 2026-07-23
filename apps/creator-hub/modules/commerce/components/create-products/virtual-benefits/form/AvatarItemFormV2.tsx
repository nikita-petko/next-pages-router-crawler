import React, {
  ChangeEvent,
  Fragment,
  FunctionComponent,
  useCallback,
  useEffect,
  useState,
} from 'react';
import { useTranslation, withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { Asset, Item } from '@modules/miscellaneous/common';
import itemConfigurationApi from '@modules/clients/itemconfiguration';
import {
  RobloxAvatarMarketplacePublishingAvatarMarketplacePublishingGatewayV1Beta1ItemDelistingStatusStatusEnum as DelistingStatusEnum,
  RobloxItemConfigurationApiMarketplaceItemModerationStatusEnum,
  V1CreationsGetAssetsGetLimitEnum,
} from '@rbx/client-itemconfiguration/v1';
import { useCurrentGroup } from '@modules/providers/groups/GroupsProvider';
import { useFormContext } from 'react-hook-form';
import { catalogClient } from '@modules/clients';
import { RobloxCatalogApiCatalogSearchDetailedResponseItem } from '@rbx/clients/catalogApi';
import { GrantableType } from '@rbx/clients/commerceApi';
import { translateAssetType } from '@modules/creations';
import {
  AvatarItemDropdown,
  AvatarItemDropdownTitles,
  AvatarMenuMap,
  MarketplaceItemsApiLimit,
} from '../../../../constants/avatarItemConfigurationConstants';
import DropdownField from '../../../DropdownField';
import { VirtualBenefitFormType } from '../types';
import GrantableSelection from '../input/GrantableSelection';

interface AvatarItemDetails {
  assetId: number;
  name: string;
  description: string;
}

const AvatarItemFormV2: FunctionComponent = () => {
  const { translate } = useTranslation();
  const currentGroup = useCurrentGroup();
  const { setValue } = useFormContext<VirtualBenefitFormType>();

  const getGroupId = useCallback(() => {
    return currentGroup?.id ?? null;
  }, [currentGroup?.id]);

  const menuItems: AvatarItemDropdown[] = [
    {
      assetType: Asset.TShirtAccessory,
      nameKey: 'Label.Clothing',
    },
    {
      assetType: Asset.Hat,
      nameKey: 'Label.Accessories',
    },
    {
      assetType: Asset.HairAccessory,
      nameKey: 'Label.Bodies',
      itemType: Item.Bundle,
    },
  ];

  const [selectedAssetType, setSelectedAssetType] = useState<AvatarItemDropdown>(menuItems[0]);
  const [dropdownCategorySubmenuType, setDropdownCategorySubmenuType] = useState('');

  const [dropdownOptions, setDropdownOptions] = useState<AvatarItemDropdown[]>(
    AvatarMenuMap[selectedAssetType.assetType ?? Asset.Hat]!,
  );

  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- TODO: add loading state
  const [fetchingCreations, setFetchingCreations] = useState(false);
  const [avatarItemDetails, setAvatarItemDetails] = useState<AvatarItemDetails[]>([]);

  const [previousPageCursor, setPreviousPageCursor] = useState<string | undefined>(undefined);
  const [pagingCursor, setPagingCursor] = useState<string | undefined>(undefined);
  const [nextPageCursor, setNextPageCursor] = useState<string | undefined>(undefined);

  const fetchAvatarItems = useCallback(
    async (
      avatarSubCategoryDetails: AvatarItemDropdown,
      currentPagingCursor: string | undefined,
    ): Promise<{
      avatarItems: AvatarItemDetails[];
      nextCursor: string | undefined;
      previousCursor: string | undefined;
    }> => {
      const avatarItemsToDisplay: AvatarItemDetails[] = [];

      const isBundle = !!avatarSubCategoryDetails.bundleType;
      const {
        items: creationData,
        prevCursor: pCursor,
        nextCursor: nCursor,
      } = await itemConfigurationApi.getItemsByCreator(
        MarketplaceItemsApiLimit as V1CreationsGetAssetsGetLimitEnum,
        currentPagingCursor,
        getGroupId() ?? undefined,
        isBundle ? avatarSubCategoryDetails.bundleType : undefined,
        isBundle ? undefined : translateAssetType(avatarSubCategoryDetails.assetType! as Asset),
      );

      const nextCursor = nCursor;
      const previousCursor = pCursor;

      if (!creationData) {
        return { avatarItems: [], nextCursor: undefined, previousCursor: undefined };
      }

      const [catalogDetails] = await Promise.allSettled([
        catalogClient.postAssetDetails(creationData.map((creation) => Number(creation.id!))),
      ]);

      const catalogDetailsMap = new Map<
        number,
        RobloxCatalogApiCatalogSearchDetailedResponseItem
      >();
      if (catalogDetails.status === 'fulfilled' && catalogDetails.value.data) {
        catalogDetails.value.data.forEach((item) => {
          if (item.id) {
            catalogDetailsMap.set(item.id, item);
          }
        });
      }

      creationData.forEach((item) => {
        if (
          item &&
          item.delistingStatus?.status !== DelistingStatusEnum.NUMBER_1 && // If not delisted
          item.moderationStatus ===
            RobloxItemConfigurationApiMarketplaceItemModerationStatusEnum.NUMBER_3 && // Approved
          item.dynamicPriceConfiguration === undefined &&
          item.price === undefined &&
          item.name !== undefined &&
          item.description !== undefined &&
          item.id !== undefined &&
          catalogDetailsMap.has(Number(item.id)) &&
          catalogDetailsMap.get(Number(item.id))?.isOffSale &&
          catalogDetailsMap.get(Number(item.id))?.price === undefined
        ) {
          avatarItemsToDisplay.push({
            assetId: Number(item.id),
            name: item.name,
            description: item.description,
          });
        }
      });

      return { avatarItems: avatarItemsToDisplay, nextCursor, previousCursor };
    },
    [getGroupId],
  );

  useEffect(() => {
    setDropdownOptions(AvatarMenuMap[selectedAssetType.assetType ?? Asset.Hat]!);
  }, [selectedAssetType]);

  useEffect(() => {
    const fetchCreations = async () => {
      if (selectedAssetType && !!dropdownCategorySubmenuType) {
        setFetchingCreations(true);

        const avatarSubCategoryDetails = dropdownOptions.find(
          (item) => item.nameKey === dropdownCategorySubmenuType,
        );

        if (!avatarSubCategoryDetails || !avatarSubCategoryDetails.assetType) {
          return;
        }

        const {
          avatarItems: avatarItemsToDisplay,
          nextCursor,
          previousCursor,
        } = await fetchAvatarItems(avatarSubCategoryDetails, pagingCursor);

        if (avatarItemsToDisplay.length === 0 && !nextCursor && !previousCursor) {
          setFetchingCreations(false);
          return;
        }

        setAvatarItemDetails(avatarItemsToDisplay);
        setFetchingCreations(false);
        setPagingCursor(nextPageCursor);
        setPreviousPageCursor(previousCursor);
        setNextPageCursor(nextCursor);
      } else {
        setFetchingCreations(false);
        setAvatarItemDetails([]);
      }
    };

    fetchCreations();
  }, [
    selectedAssetType,
    dropdownCategorySubmenuType,
    dropdownOptions,
    pagingCursor,
    nextPageCursor,
    fetchAvatarItems,
  ]);

  function getDropdownKeys() {
    const keys = [] as string[];
    if (dropdownOptions) {
      dropdownOptions.forEach((submenuItem) => {
        if (submenuItem.nameKey === 'Label.Shoes') {
          return;
        }
        keys.push(submenuItem.nameKey);
      });
    }
    return keys;
  }

  return (
    <Fragment>
      <DropdownField
        selectionValue={selectedAssetType.nameKey}
        label={translate('Label.AvatarItemType')}
        listOfInputs={menuItems.map((item) => item.nameKey)}
        handleChange={(event: ChangeEvent<{ value: string }>) => {
          setSelectedAssetType(
            menuItems.find((item) => item.nameKey === event.target.value) ?? menuItems[0],
          );
          setDropdownCategorySubmenuType('');
        }}
      />
      <DropdownField
        selectionValue={dropdownCategorySubmenuType}
        label={translate('Label.CategoryType', {
          categoryNameSingular: translate(
            AvatarItemDropdownTitles[selectedAssetType.assetType ?? Asset.Hat] ?? '',
          ),
        })}
        listOfInputs={getDropdownKeys()}
        handleChange={(event: ChangeEvent<{ value: string }>) => {
          setDropdownCategorySubmenuType(event.target.value);
        }}
      />

      {!!selectedAssetType && !!dropdownCategorySubmenuType && (
        <GrantableSelection
          title={translate(dropdownCategorySubmenuType)}
          hasPrevious={!!pagingCursor || !(!pagingCursor && !previousPageCursor)}
          hasNext={pagingCursor !== nextPageCursor && !!nextPageCursor}
          onSelect={(grantableItem) => {
            if (grantableItem === null || grantableItem === undefined) {
              return;
            }

            setValue('grantableAssetId', grantableItem.grantableAssetId?.toString() ?? '');
            setValue('name', grantableItem.name ?? '');
            setValue('description', grantableItem.description ?? '');
          }}
          onPrevious={() => setPagingCursor(previousPageCursor)}
          onNext={() => setPagingCursor(nextPageCursor)}
          grantableItems={avatarItemDetails.map((detail) => ({
            grantableAssetId: detail.assetId.toString(),
            name: detail.name,
            description: detail.description,
            imageAssetId: detail.assetId,
            grantableType: GrantableType.AvatarItem,
          }))}
        />
      )}
    </Fragment>
  );
};

export default withTranslation(AvatarItemFormV2, [
  TranslationNamespace.Commerce,
  TranslationNamespace.AssetTypes,
  TranslationNamespace.Creations,
]);
