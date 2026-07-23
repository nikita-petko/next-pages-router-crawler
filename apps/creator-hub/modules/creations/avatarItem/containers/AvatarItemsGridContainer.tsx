import React, { FunctionComponent, useCallback, useEffect, useMemo, useState } from 'react';
import { Grid } from '@rbx/ui';
import { PagingParameters, SortOrder } from '@rbx/core';
import { useTranslation } from '@rbx/intl';
import { useQueryParams } from '@modules/miscellaneous/hooks';
import { Asset, Item } from '@modules/miscellaneous/common';
import AssetCreationEntryway from '@modules/asset-creation/components/AssetCreationEntryway';
import { isCreateAssetAvailable } from '@modules/asset-creation/constants/AssetTypeConstants';
import { useSettings } from '@modules/settings';
import { useAuthentication } from '@modules/authentication/providers';
import {
  getValidTimedOptionsTypes,
  getValidWearTimeTypes,
} from '../../unifiedFeeSystem/helper/UnifiedFeeSystemConstants';
import {
  AssetSorts,
  CreationData,
  useCreationsFilters,
  ItemCardContainer,
  ItemGridContainer,
  CreationsGridEmptyState,
} from '../../common';
import { useCreationsGridContainerStyles } from '../../home';
import {
  loadCreationsByCreator,
  loadCreationsByFolder,
  getFolderDropdownOptions,
  loadLooksByCreator,
  loadLooksByGroup,
} from '../utils/loadAvatarItemsUtils';
import {
  invertAvatarMenuMap,
  serializeMenuMapKey,
  isValidIndex,
} from '../utils/avatarMenuMapUtils';

import AvatarItemsDropdownCategorySubmenu from '../components/AvatarItemsDropdownCategorySubmenu';
import CreateFolderButton from '../components/CreateFolderButton';
import AddItemToFolderButton from '../components/AddItemToFolderButton';
import DeleteFolderButton from '../components/DeleteFolderButton';
import {
  AvatarItemDropdown,
  AvatarItemDropdownTitles,
  AvatarMenuMap,
  UnfolderedDropdownOption,
} from '../constants/avatarItemConstants';
import avatarItemTypeConstants from '../constants/avatarItemTypeConstants';

export interface AvatarItemsGridPagingParameters extends PagingParameters {
  avatarItem: AvatarItemDropdown;
  groupId?: number;
  isActive?: boolean;
  isArchived?: boolean;
  sort: AssetSorts;
  sortOrder: SortOrder;
  isClickable: boolean;
  fromUtc?: Date;
  enableBundlePaginationOffset?: boolean;
}

export interface AvatarItemsGridContainerProps {
  assetType: Asset;
  groupId?: number;
}

const AvatarItemsGridContainer: FunctionComponent<
  React.PropsWithChildren<AvatarItemsGridContainerProps>
> = ({ assetType, groupId }) => {
  const {
    classes: { gridContainer, createButtonContainer, folderActionContainer },
  } = useCreationsGridContainerStyles();
  const { sort, sortOrder, isArchived, isPublicOnly } = useCreationsFilters();
  const { translate } = useTranslation();
  const { settings } = useSettings();
  const { user } = useAuthentication();
  const [{ filterIndex }, setFilterIndexParams] = useQueryParams(['filterIndex']);
  const [{ activeTab }] = useQueryParams(['activeTab']);
  const [hasData, setHasData] = useState<boolean>(false);
  const [fromUtc, setFromUtc] = useState<Date | undefined>(undefined);
  const [folderDropdownOptions, setFolderDropdownOptions] = useState<AvatarItemDropdown[]>([]);
  // Used to trigger a refresh of the grid when folder contents are updated
  const [lastModified, setLastModified] = useState<number>(Date.now());
  const parsedIndex = parseInt(filterIndex?.toString() ?? '', 10);

  // For Asset.All, we need to fetch folders dynamically
  const isAssetAll = assetType === Asset.AllCatalogAsset;
  const menuOptions = isAssetAll ? folderDropdownOptions : AvatarMenuMap[assetType];

  const initialIndex = isValidIndex(parsedIndex, menuOptions) ? parsedIndex : 0;
  const [selectedAvatarItemDropdown, setSelectedAvatarItemDropdown] = useState<AvatarItemDropdown>(
    menuOptions?.[initialIndex] || { nameKey: 'Label.Loading' },
  );
  const invertedMenuMap = invertAvatarMenuMap(AvatarMenuMap);
  useEffect(() => {
    // NOTE (dlevine, 11/03/2022): We need to keep a set date when querying upcoming/past events, so set it once on container load
    setFromUtc(new Date());
    getValidWearTimeTypes();
    getValidTimedOptionsTypes();
  }, []);

  useEffect(() => {
    if (isAssetAll) {
      getFolderDropdownOptions(groupId).then((folders) => {
        setFolderDropdownOptions(folders);
        if (folders.length > 0 && !selectedAvatarItemDropdown.nameKey) {
          setSelectedAvatarItemDropdown(folders[0]);
        }
      });
    }
  }, [isAssetAll, groupId, selectedAvatarItemDropdown.nameKey]);

  useEffect(() => {
    if (menuOptions && menuOptions[initialIndex] !== undefined) {
      setSelectedAvatarItemDropdown(menuOptions[initialIndex]);
    }
  }, [assetType, initialIndex, filterIndex, menuOptions]);

  const pagingParameters = useMemo(() => {
    return {
      avatarItem: selectedAvatarItemDropdown,
      groupId,
      isArchived,
      isActive: isPublicOnly ? true : undefined,
      sort,
      sortOrder,
      isClickable: true,
      fromUtc,
      enableBundlePaginationOffset: settings.enableBundlePaginationOffset ?? false,
      lastModified,
    };
  }, [
    selectedAvatarItemDropdown,
    groupId,
    isArchived,
    isPublicOnly,
    sort,
    sortOrder,
    fromUtc,
    settings.enableBundlePaginationOffset,
    lastModified,
  ]);

  const { itemType, lookType } = selectedAvatarItemDropdown;

  const createInExperienceButton = useMemo(() => {
    if (
      pagingParameters.avatarItem.assetType !== undefined &&
      avatarItemTypeConstants.avatar3DAssetTypes.includes(pagingParameters.avatarItem.assetType)
    ) {
      // Disabling button for now to avoid confusion with groups
      /*
      return (
        <Button
          data-testid='create-avatar-3d-item-in-experience-button'
          variant='contained'
          size='large'
          onClick={handleCreateInExperienceButtonClick}>
          <span>{translate('Label.Create3DClothing')}</span>
          &nbsp;
          <LaunchIcon />
        </Button>
      );
      */
    }
    const currentAssetType = selectedAvatarItemDropdown.assetType
      ? selectedAvatarItemDropdown.assetType
      : assetType;

    if (isCreateAssetAvailable(currentAssetType)) {
      if (!hasData) {
        return <CreationsGridEmptyState assetType={currentAssetType} />;
      }
      return (
        <AssetCreationEntryway assetType={currentAssetType} containerHasData={() => hasData} />
      );
    }
    return undefined;
  }, [pagingParameters, assetType, hasData, selectedAvatarItemDropdown]);

  const createButton = createInExperienceButton;

  const errorContent = useMemo(() => {
    if (isAssetAll) {
      return <CreationsGridEmptyState assetType={Asset.AllCatalogAsset} lookType={lookType} />;
    }
    const selectedAssetType = selectedAvatarItemDropdown.assetType;
    if (
      selectedAvatarItemDropdown.itemType !== undefined ||
      (selectedAssetType !== undefined && !isCreateAssetAvailable(selectedAssetType)) ||
      selectedAvatarItemDropdown.lookType !== undefined
    ) {
      return <CreationsGridEmptyState assetType={selectedAssetType!} lookType={lookType} />;
    }
    return createButton;
  }, [selectedAvatarItemDropdown, createButton, isAssetAll, lookType]);

  const onLoad = useCallback(
    (data: CreationData[]) => {
      setHasData(data.length > 0);
    },
    [setHasData],
  );

  const handleFolderDeleted = useCallback(async () => {
    if (isAssetAll) {
      setSelectedAvatarItemDropdown(UnfolderedDropdownOption);
      setFilterIndexParams({ filterIndex: 0 });
    }
  }, [isAssetAll, setFilterIndexParams]);

  const handleFolderCreated = useCallback(
    async (newFolderId: string) => {
      if (isAssetAll && newFolderId) {
        try {
          const folders = await getFolderDropdownOptions(groupId);
          setFolderDropdownOptions(folders);

          const newIndex = folders.findIndex((folder) => folder.folderId === newFolderId);
          if (newIndex >= 0) {
            setFilterIndexParams({ filterIndex: newIndex });
            setSelectedAvatarItemDropdown(folders[newIndex]);
          }
        } catch {
          setSelectedAvatarItemDropdown(UnfolderedDropdownOption);
        }
      }
    },
    [isAssetAll, groupId, setFilterIndexParams],
  );

  const handleFolderContentsUpdated = useCallback(() => {
    setLastModified(Date.now());
  }, []);

  const handleFolderUpdated = useCallback(
    async (updatedFolderId: string) => {
      if (isAssetAll && updatedFolderId) {
        try {
          const folders = await getFolderDropdownOptions(groupId);
          setFolderDropdownOptions(folders);

          // Find the updated folder and update the selected dropdown
          const updatedFolder = folders.find((folder) => folder.folderId === updatedFolderId);
          if (updatedFolder) {
            setSelectedAvatarItemDropdown(updatedFolder);
          }
        } catch {
          setSelectedAvatarItemDropdown(UnfolderedDropdownOption);
        }
      }
    },
    [isAssetAll, groupId],
  );

  const onMenuStateChange = useCallback(
    (newDropdownOption: AvatarItemDropdown) => {
      if (isAssetAll) {
        const folderIndex = folderDropdownOptions.findIndex(
          (option) => option.folderId === newDropdownOption.folderId,
        );
        const foundIndex = folderIndex >= 0 ? folderIndex : 0;
        setFilterIndexParams({ filterIndex: foundIndex });
        setSelectedAvatarItemDropdown(newDropdownOption);
      } else {
        const key = serializeMenuMapKey(activeTab as string, newDropdownOption.nameKey);
        const foundIndex = invertedMenuMap.has(key) ? invertedMenuMap.get(key) : 0;
        setFilterIndexParams({ filterIndex: foundIndex });
        setSelectedAvatarItemDropdown(newDropdownOption);
      }
    },
    [activeTab, invertedMenuMap, setFilterIndexParams, isAssetAll, folderDropdownOptions],
  );

  const loadCreations = useMemo(() => {
    if (isAssetAll) {
      return loadCreationsByFolder;
    }
    return (creationsParameters: AvatarItemsGridPagingParameters) => {
      if (creationsParameters.avatarItem.lookType !== undefined) {
        if (settings?.enableMakeupAssets) {
          if (groupId !== undefined) {
            return loadLooksByGroup(groupId, creationsParameters);
          }
          return loadLooksByCreator(user?.id ?? 0, creationsParameters);
        }
        // This should never happen
        return Promise.resolve({ items: [], nextPageCursor: undefined });
      }
      return loadCreationsByCreator(creationsParameters, user?.id ?? 0);
    };
  }, [isAssetAll, settings?.enableMakeupAssets, user?.id, groupId]);

  return (
    <React.Fragment>
      <Grid
        container
        item
        className={gridContainer}
        alignItems='center'
        justifyContent='flex-start'
        wrap='nowrap'
        direction='row'>
        <Grid item className={folderActionContainer}>
          <AvatarItemsDropdownCategorySubmenu
            dropdownTitle={AvatarItemDropdownTitles[assetType] ?? ''}
            dropdownOptions={menuOptions}
            isFolderMode={isAssetAll}
            filterIndex={filterIndex ? parseInt(filterIndex.toString(), 10) : 0}
            onMenuStateChange={onMenuStateChange}
          />
        </Grid>
        {isAssetAll && (
          <Grid item className={folderActionContainer}>
            <Grid container item direction='row' spacing={2} justifyContent='flex-end'>
              <CreateFolderButton
                selectedFolderId={selectedAvatarItemDropdown.folderId || ''}
                selectedFolderName={
                  selectedAvatarItemDropdown.isFolder
                    ? selectedAvatarItemDropdown.nameKey
                    : undefined
                }
                onFolderCreated={handleFolderCreated}
                onFolderUpdated={handleFolderUpdated}
                onFolderContentsUpdated={handleFolderContentsUpdated}
                groupId={groupId}
              />
              {!!selectedAvatarItemDropdown.folderId && (
                <AddItemToFolderButton
                  selectedFolderId={selectedAvatarItemDropdown.folderId}
                  onFolderContentsUpdated={handleFolderContentsUpdated}
                />
              )}
              {!!selectedAvatarItemDropdown.folderId && (
                <DeleteFolderButton
                  selectedFolderId={selectedAvatarItemDropdown.folderId}
                  onFolderDeleted={handleFolderDeleted}
                />
              )}
            </Grid>
          </Grid>
        )}
      </Grid>
      <Grid container item className={gridContainer} wrap='nowrap' direction='column'>
        {hasData && createButton && (
          <Grid item className={createButtonContainer}>
            {createButton}
          </Grid>
        )}
        <ItemGridContainer
          pagingParameters={pagingParameters}
          loadItems={loadCreations}
          getItemKey={(item) => (item.assetId || item.bundleId || item.lookId) ?? 0}
          GridItemComponent={ItemCardContainer}
          errorMessage={translate('Message.LoadItemsError', {
            itemType: translate(selectedAvatarItemDropdown.nameKey),
          })}
          emptyMessage={errorContent}
          onLoad={onLoad}
          useWideIcons={itemType === Item.Event}
        />
      </Grid>
    </React.Fragment>
  );
};

export default AvatarItemsGridContainer;
