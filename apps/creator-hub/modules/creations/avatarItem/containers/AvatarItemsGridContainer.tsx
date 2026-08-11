import type { FunctionComponent } from 'react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { PagingParameters, SortOrder } from '@rbx/core';
import { useTranslation } from '@rbx/intl';
import { CircularProgress, Grid } from '@rbx/ui';
import AssetCreationEntryway from '@modules/asset-creation/components/AssetCreationEntryway';
import { isCreateAssetAvailable } from '@modules/asset-creation/constants/AssetTypeConstants';
import { useAuthentication } from '@modules/authentication/providers';
import { Asset, Item } from '@modules/miscellaneous/common';
import Look from '@modules/miscellaneous/common/enums/Look';
import { useQueryParams } from '@modules/miscellaneous/hooks';
import { useSettings } from '@modules/settings/SettingsProvider/SettingsProvider';
import CreationsGridEmptyState from '../../common/components/CreationsGridEmptyState/CreationsGridEmptyState';
import ItemCardContainer from '../../common/containers/ItemCardContainer';
import ItemGridContainer from '../../common/containers/ItemGridContainer';
import useCreationsFilters from '../../common/hooks/useCreationsFilters';
import type CreationData from '../../common/interfaces/CreationData';
import type { AssetSorts } from '../../common/interfaces/CreationsFilters';
import useCreationsGridContainerStyles from '../../home/containers/CreationsGridContainer.styles';
import useAvatarLooksGate from '../../home/hooks/useAvatarLooksGate';
import {
  getAllowedMarketplaceItemTypes,
  getDefaultAllowedMarketplaceItemTypes,
} from '../../menu/constants/MenuConstants';
import {
  getValidTimedOptionsTypes,
  getValidWearTimeTypes,
} from '../../unifiedFeeSystem/helper/UnifiedFeeSystemConstants';
import AddItemToFolderButton from '../components/AddItemToFolderButton';
import AvatarItemsDropdownCategorySubmenu from '../components/AvatarItemsDropdownCategorySubmenu';
import CreateFolderButton from '../components/CreateFolderButton';
import DeleteFolderButton from '../components/DeleteFolderButton';
import TaxonomyCategorySelector from '../components/TaxonomyCategorySelector';
import type { AvatarItemDropdown, BundleType } from '../constants/avatarItemConstants';
import {
  AvatarItemDropdownTitles,
  AvatarMenuMap,
  RecentsDropdownOption,
  UnfolderedDropdownOption,
} from '../constants/avatarItemConstants';
import avatarItemTypeConstants from '../constants/avatarItemTypeConstants';
import useTaxonomySelection from '../hooks/useTaxonomySelection';
import useTaxonomyView from '../hooks/useTaxonomyView';
import {
  invertAvatarMenuMap,
  serializeMenuMapKey,
  isValidIndex,
} from '../utils/avatarMenuMapUtils';
import { mapAssetTypeIdToAsset } from '../utils/loadAvatarItemsUtils';
import {
  loadCreationsByCreator,
  loadCreationsByFolder,
  getFolderDropdownOptions,
  loadLooksByCreator,
  loadLooksByGroup,
} from '../utils/loadAvatarItemsUtils';
import { taxonomyOptionValue } from '../utils/taxonomyCategoriesUtils';

const AVATAR_LOOKS_GRID_SELECTION: AvatarItemDropdown = {
  lookType: Look.Avatar,
  nameKey: 'Label.Avatars',
};

const AVATAR_BACKGROUNDS_GRID_SELECTION: AvatarItemDropdown = {
  assetType: Asset.AvatarBackground,
  nameKey: 'Label.Backgrounds',
};

export interface AvatarItemsGridPagingParameters extends PagingParameters {
  avatarItem: AvatarItemDropdown;
  groupId?: number;
  isActive?: boolean;
  isArchived?: boolean;
  sort: AssetSorts;
  sortOrder: SortOrder;
  isClickable: boolean;
  fromUtc?: Date;
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
  const isAvatarLooksEnabled = useAvatarLooksGate();
  const { user } = useAuthentication();
  const [{ filterIndex }, setFilterIndexParams] = useQueryParams(['filterIndex']);
  const [{ activeTab }, setTaxonomyTabParams] = useQueryParams(['activeTab', 'filterIndex']);
  const [lastLoad, setLastLoad] = useState<{ params: unknown; hasItems: boolean }>(() => ({
    params: undefined,
    hasItems: false,
  }));
  const [fromUtc] = useState<Date | undefined>(() => new Date());
  const [folderDropdownOptions, setFolderDropdownOptions] = useState<AvatarItemDropdown[]>([]);
  const [allowedAssetTypes, setAllowedAssetTypes] = useState<Set<Asset>>(() => new Set());
  const [allowedBundleTypes, setAllowedBundleTypes] = useState<Set<BundleType>>(() => new Set());
  // Used to trigger a refresh of the grid when folder contents are updated
  const [lastModified, setLastModified] = useState<number>(() => Date.now());
  const parsedIndex = parseInt(filterIndex?.toString() ?? '', 10);

  // For Asset.All, we need to fetch folders dynamically
  const isAssetAll = assetType === Asset.AllCatalogAsset;
  const isAvatarLooksTab = assetType === Asset.AvatarLooks;
  const isAvatarBackgroundsTab = assetType === Asset.AvatarBackground;

  // `activeTab=AvatarItems` selects the category view, and `AvatarItems-{key}` additionally selects
  // which L1 is active.
  const {
    canUseTaxonomy: taxonomyFlagEnabled,
    isTaxonomyView,
    isRecentsView,
    isAvatarLooksView,
  } = useTaxonomyView(assetType);
  // `filterIndex` addresses the sub-category here, mirroring the item-type view, so a category and
  // its sub-category are both shareable through the URL.
  const {
    activeL1Node,
    l2Options,
    filterIndex: taxonomyFilterIndex,
    selection: effectiveTaxonomySelection,
    isLoading: isTaxonomyLoading,
  } = useTaxonomySelection(taxonomyFlagEnabled);
  // In the category view the grid must not fall back to the item-type query: the asset type is the
  // Avatar Items host tab, so it would briefly show an unrelated category's items on first paint.
  const isAwaitingTaxonomySelection = isTaxonomyView && !effectiveTaxonomySelection;
  // A category backed by exactly one asset type keeps that type's upload / create-asset entry
  // point (e.g. Backgrounds, the classic 2D categories).
  const taxonomyCreateAssetType = useMemo(() => {
    const assetTypeIds = effectiveTaxonomySelection?.taxonomyAssetTypeIds ?? [];
    return assetTypeIds.length === 1 ? mapAssetTypeIdToAsset(assetTypeIds[0]) : undefined;
  }, [effectiveTaxonomySelection]);
  const menuOptions = useMemo((): AvatarItemDropdown[] | undefined => {
    if (isAssetAll) {
      return folderDropdownOptions;
    }
    if (isAvatarLooksTab) {
      return [AVATAR_LOOKS_GRID_SELECTION];
    }
    if (isAvatarBackgroundsTab) {
      return [AVATAR_BACKGROUNDS_GRID_SELECTION];
    }
    return AvatarMenuMap[assetType];
  }, [isAssetAll, isAvatarLooksTab, isAvatarBackgroundsTab, folderDropdownOptions, assetType]);

  const initialIndex = isValidIndex(parsedIndex, menuOptions) ? parsedIndex : 0;
  const [selectedAvatarItemDropdown, setSelectedAvatarItemDropdown] = useState<AvatarItemDropdown>(
    menuOptions?.[initialIndex] ?? { nameKey: 'Label.Loading' },
  );
  const invertedMenuMap = invertAvatarMenuMap(AvatarMenuMap);
  useEffect(() => {
    // NOTE (dlevine, 11/03/2022): We need to keep a set date when querying upcoming/past events, so set it once on container load
    void getValidWearTimeTypes();
    void getValidTimedOptionsTypes();
  }, []);

  useEffect(() => {
    if (isAssetAll || isAvatarLooksTab || isAvatarBackgroundsTab) {
      return () => {};
    }
    let cancelled = false;
    getAllowedMarketplaceItemTypes()
      .then(({ assetTypes, bundleTypes }) => {
        if (!cancelled) {
          setAllowedAssetTypes(assetTypes);
          setAllowedBundleTypes(bundleTypes);
        }
      })
      .catch(() => {
        if (!cancelled) {
          const { assetTypes, bundleTypes } = getDefaultAllowedMarketplaceItemTypes();
          setAllowedAssetTypes(assetTypes);
          setAllowedBundleTypes(bundleTypes);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [isAssetAll, isAvatarLooksTab, isAvatarBackgroundsTab]);

  useEffect(() => {
    if (isAssetAll) {
      void getFolderDropdownOptions(groupId).then((folders) => {
        setFolderDropdownOptions(folders);
        if (folders.length > 0 && !selectedAvatarItemDropdown.nameKey) {
          setSelectedAvatarItemDropdown(folders[0]);
        }
      });
    }
  }, [isAssetAll, groupId, selectedAvatarItemDropdown.nameKey]);

  useEffect(() => {
    if (menuOptions && menuOptions[initialIndex] !== undefined) {
      // oxlint-disable-next-line react/react-compiler -- pre-existing: syncing dropdown to assetType/filterIndex changes
      setSelectedAvatarItemDropdown(menuOptions[initialIndex]);
    }
  }, [assetType, initialIndex, filterIndex, menuOptions]);

  const handleSelectL2 = useCallback(
    (option: AvatarItemDropdown) => {
      const selectedIndex = l2Options.findIndex(
        (candidate) => taxonomyOptionValue(candidate) === taxonomyOptionValue(option),
      );
      if (selectedIndex >= 0) {
        setFilterIndexParams({ filterIndex: selectedIndex });
      }
    },
    [l2Options, setFilterIndexParams],
  );

  const pagingParameters = useMemo(() => {
    return {
      avatarItem: isRecentsView
        ? RecentsDropdownOption
        : isAvatarLooksView
          ? AVATAR_LOOKS_GRID_SELECTION
          : isTaxonomyView
            ? (effectiveTaxonomySelection ?? selectedAvatarItemDropdown)
            : selectedAvatarItemDropdown,
      groupId,
      isArchived,
      isActive: isPublicOnly ? true : undefined,
      sort,
      sortOrder,
      isClickable: true,
      fromUtc,
      lastModified,
    };
  }, [
    selectedAvatarItemDropdown,
    isTaxonomyView,
    isRecentsView,
    isAvatarLooksView,
    effectiveTaxonomySelection,
    groupId,
    isArchived,
    isPublicOnly,
    sort,
    sortOrder,
    fromUtc,
    lastModified,
  ]);

  // Tied to the query it came from rather than tracked separately, so changing category invalidates
  // it by construction. Otherwise the previous result briefly describes the new query and the create
  // button and the empty state render at the same time.
  const hasData = lastLoad.params === pagingParameters && lastLoad.hasItems;

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
    // In the taxonomy view the legacy item-type selection no longer describes what is on screen, so
    // the create/upload entry point follows the selected category instead. Categories that span
    // several asset types have no single entry point, and neither does Recents.
    const currentAssetType = isRecentsView
      ? undefined
      : isTaxonomyView
        ? taxonomyCreateAssetType
        : (selectedAvatarItemDropdown.assetType ?? assetType);

    if (currentAssetType !== undefined && isCreateAssetAvailable(currentAssetType)) {
      if (!hasData) {
        return <CreationsGridEmptyState assetType={currentAssetType} />;
      }
      return (
        <AssetCreationEntryway assetType={currentAssetType} containerHasData={() => hasData} />
      );
    }
    return undefined;
  }, [
    pagingParameters,
    assetType,
    hasData,
    selectedAvatarItemDropdown,
    isTaxonomyView,
    isRecentsView,
    taxonomyCreateAssetType,
  ]);

  const createButton = createInExperienceButton;

  // Names the thing the grid actually tried to load. In the category view that is the selected
  // sub-category, whose name comes from the taxonomy service already localized rather than as a
  // translation key.
  const loadErrorItemLabel = useMemo(() => {
    // Recents spans every type, so it names the section rather than one item type. Reuses the menu's
    // existing label instead of registering a second copy of the chip's pending translation.
    if (isRecentsView) {
      return translate('Label.AvatarItems');
    }
    const selection =
      isTaxonomyView && effectiveTaxonomySelection
        ? effectiveTaxonomySelection
        : selectedAvatarItemDropdown;
    return selection.skipTranslation ? selection.nameKey : translate(selection.nameKey);
  }, [
    isRecentsView,
    isTaxonomyView,
    effectiveTaxonomySelection,
    selectedAvatarItemDropdown,
    translate,
  ]);

  const errorContent = useMemo(() => {
    // Recents spans every type, so there is no type-specific empty state to show.
    if (isRecentsView) {
      return <CreationsGridEmptyState assetType={Asset.AllCatalogAsset} />;
    }
    if (isAssetAll) {
      return <CreationsGridEmptyState assetType={Asset.AllCatalogAsset} lookType={lookType} />;
    }
    if (isTaxonomyView) {
      // Looks are overlaid into the taxonomy sub-selector and have their own empty state.
      const selectedLookType = effectiveTaxonomySelection?.lookType;
      if (selectedLookType !== undefined) {
        return <CreationsGridEmptyState assetType={assetType} lookType={selectedLookType} />;
      }
      // `createButton` already renders the category-specific empty state when one exists; fall back
      // to the generic avatar-items empty state for multi-type categories.
      return createButton ?? <CreationsGridEmptyState assetType={assetType} />;
    }
    const selectedAssetType = selectedAvatarItemDropdown.assetType;
    if (
      selectedAvatarItemDropdown.itemType !== undefined ||
      (selectedAssetType !== undefined && !isCreateAssetAvailable(selectedAssetType)) ||
      selectedAvatarItemDropdown.lookType !== undefined
    ) {
      return (
        <CreationsGridEmptyState assetType={selectedAssetType ?? assetType} lookType={lookType} />
      );
    }
    return createButton;
  }, [
    selectedAvatarItemDropdown,
    createButton,
    isAssetAll,
    lookType,
    assetType,
    isTaxonomyView,
    isRecentsView,
    effectiveTaxonomySelection,
  ]);

  const onLoad = useCallback(
    (data: CreationData[]) => {
      setLastLoad({ params: pagingParameters, hasItems: data.length > 0 });
    },
    [pagingParameters],
  );

  useEffect(() => {
    // Pin the sub-category the grid actually resolved to, so a missing or out-of-range filterIndex
    // becomes a concrete, shareable URL instead of an implicit default. Safe to do here because the
    // view follows activeTab, so nothing else is writing these params concurrently.
    if (!isTaxonomyView || l2Options.length === 0) {
      return;
    }
    if (Number(filterIndex) !== taxonomyFilterIndex) {
      setTaxonomyTabParams({ filterIndex: taxonomyFilterIndex }, { skipHistory: true });
    }
  }, [isTaxonomyView, l2Options.length, filterIndex, taxonomyFilterIndex, setTaxonomyTabParams]);

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
        const foundIndex = Math.max(folderIndex, 0);
        setFilterIndexParams({ filterIndex: foundIndex });
        setSelectedAvatarItemDropdown(newDropdownOption);
      } else {
        const tabKey =
          activeTab == null ? '' : Array.isArray(activeTab) ? (activeTab[0] ?? '') : activeTab;
        const key = serializeMenuMapKey(tabKey, newDropdownOption.nameKey);
        const foundIndex = invertedMenuMap.has(key) ? invertedMenuMap.get(key) : 0;
        setFilterIndexParams({ filterIndex: foundIndex });
        setSelectedAvatarItemDropdown(newDropdownOption);
      }
    },
    [activeTab, invertedMenuMap, setFilterIndexParams, isAssetAll, folderDropdownOptions],
  );

  const loadCreations = useMemo(() => {
    // The taxonomy and Recents views list by creator across every Avatar Items tab, including the
    // folder-backed "All" tab, so neither uses the folder loader.
    if (isAssetAll && !isTaxonomyView && !isRecentsView && !isAvatarLooksView) {
      return loadCreationsByFolder;
    }
    return (creationsParameters: AvatarItemsGridPagingParameters) => {
      if (creationsParameters.avatarItem.lookType !== undefined) {
        const rowLookType = creationsParameters.avatarItem.lookType;
        const looksEnabled =
          rowLookType === Look.Avatar
            ? (isAvatarLooksEnabled ?? false)
            : settings?.enableMakeupAssets;
        if (looksEnabled) {
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
  }, [
    isAssetAll,
    isTaxonomyView,
    isRecentsView,
    isAvatarLooksView,
    settings.enableMakeupAssets,
    isAvatarLooksEnabled,
    user?.id,
    groupId,
  ]);

  return (
    <>
      {/* Recents has no sub-filter, so the whole selector row is omitted for it. */}
      {!isRecentsView &&
        !isAvatarLooksView &&
        (isTaxonomyView || (!isAvatarLooksTab && !isAvatarBackgroundsTab)) && (
          <Grid
            container
            item
            className={gridContainer}
            alignItems='center'
            justifyContent='flex-start'
            wrap='nowrap'
            direction='row'>
            <Grid item className={folderActionContainer}>
              {isTaxonomyView ? (
                <TaxonomyCategorySelector
                  l2Options={l2Options}
                  categoryName={activeL1Node?.name}
                  selectedOptionValue={
                    effectiveTaxonomySelection === undefined
                      ? undefined
                      : taxonomyOptionValue(effectiveTaxonomySelection)
                  }
                  onSelectL2={handleSelectL2}
                  isLoading={isTaxonomyLoading}
                />
              ) : (
                <AvatarItemsDropdownCategorySubmenu
                  dropdownTitle={AvatarItemDropdownTitles[assetType] ?? ''}
                  dropdownOptions={menuOptions}
                  isFolderMode={isAssetAll}
                  filterIndex={filterIndex ? parseInt(filterIndex.toString(), 10) : 0}
                  onMenuStateChange={onMenuStateChange}
                  allowedAssetTypes={allowedAssetTypes}
                  allowedBundleTypes={allowedBundleTypes}
                />
              )}
            </Grid>
            {isAssetAll && !isTaxonomyView && (
              <Grid item className={folderActionContainer}>
                <Grid container item direction='row' spacing={2} justifyContent='flex-end'>
                  <CreateFolderButton
                    selectedFolderId={selectedAvatarItemDropdown.folderId ?? ''}
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
        )}
      <Grid container item className={gridContainer} wrap='nowrap' direction='column'>
        {hasData && createButton && (
          <Grid item className={createButtonContainer}>
            {createButton}
          </Grid>
        )}
        {isAwaitingTaxonomySelection ? (
          <Grid container item justifyContent='center'>
            <CircularProgress />
          </Grid>
        ) : (
          <ItemGridContainer
            pagingParameters={pagingParameters}
            loadItems={loadCreations}
            getItemKey={(item) => item.assetId ?? item.bundleId ?? item.lookId ?? 0}
            GridItemComponent={ItemCardContainer}
            errorMessage={translate('Message.LoadItemsError', { itemType: loadErrorItemLabel })}
            emptyMessage={errorContent}
            onLoad={onLoad}
            useWideIcons={itemType === Item.Event}
          />
        )}
      </Grid>
    </>
  );
};

export default AvatarItemsGridContainer;
