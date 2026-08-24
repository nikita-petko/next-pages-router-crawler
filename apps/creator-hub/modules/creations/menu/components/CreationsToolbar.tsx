import type { FunctionComponent } from 'react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { SearchSortParameter } from '@rbx/client-universes-api/v1';
import { EventSortBy } from '@rbx/client-virtual-events-api/v1';
import { SortOrder } from '@rbx/core';
import { useFlag } from '@rbx/flags';
import { useTranslation } from '@rbx/intl';
import {
  ArrowDownwardIcon,
  ArrowUpwardIcon,
  Button,
  Divider,
  FormControlLabel,
  IconButton,
  Menu,
  MenuItem,
  Select,
  SettingsIcon,
  Switch,
  Typography,
} from '@rbx/ui';
import { isAutoPublishPreferencesEnabled } from '@generated/flags/avatarMarketplace';
import CreatorDashboardEventType from '@modules/eventStream/enum/CreatorDashboardEventType';
import { Asset } from '@modules/miscellaneous/common';
import { Flex } from '@modules/miscellaneous/components/Flex';
import { useQueryParams } from '@modules/miscellaneous/hooks';
import { useUnifiedLoggerProvider } from '@modules/miscellaneous/hooks/UnifiedLoggerProvider';
import { normalizeSingleQueryParam } from '@modules/miscellaneous/hooks/useQueryParams';
import { useCurrentGroup, useGroups } from '@modules/providers/groups/GroupsProvider';
import { AvatarMenuMap } from '../../avatarItem/constants/avatarItemConstants';
import useTaxonomyView from '../../avatarItem/hooks/useTaxonomyView';
import {
  buildTaxonomyActiveTab,
  TAXONOMY_HOST_ASSET,
} from '../../avatarItem/utils/taxonomyRoutingUtils';
import useCreationsFilters from '../../common/hooks/useCreationsFilters';
import { getSortForAssetType } from '../../common/interfaces/CreationsFilters';
import { getValidTimedOptionsTypes } from '../../unifiedFeeSystem/helper/UnifiedFeeSystemConstants';
import { getIsRentableType } from '../../unifiedFeeSystem/helper/UnifiedFeeSystemHelper';
import { eventSortTranslationKeys, universeSortTranslationKeys } from '../constants/MenuConstants';
import useEnabledSubmenuItems from '../hooks/useEnabledSubmenuItems';
import creationsMenuManager from '../implementations/CreationsMenuManager';
import type MenuState from '../interfaces/MenuState';
import useCreationsToolbarStyles from './CreationsToolbar.styles';
import StudioPublishSettingsModal from './StudioPublishSettingsModal';
import TimedOptionsBulkUpdate from './TimedOptionsBulkUpdate';

export type CreationsToolbarProps = { menuState: MenuState };

const searchSortParameterValues: readonly string[] = Object.values(SearchSortParameter);
const eventSortByValues: readonly string[] = Object.values(EventSortBy);

const isSearchSortParameterValue = (value: string): value is SearchSortParameter =>
  searchSortParameterValues.includes(value);

const isEventSortByValue = (value: string): value is EventSortBy =>
  eventSortByValues.includes(value);

const publishSettingsParamKeys = ['publishSettings'] as const;

const CreationsToolbar: FunctionComponent<React.PropsWithChildren<CreationsToolbarProps>> = ({
  menuState,
}) => {
  const { translate } = useTranslation();
  const { unifiedLogger } = useUnifiedLoggerProvider();
  const { value: autoPublishEnabled } = useFlag(isAutoPublishPreferencesEnabled);
  const { isFetched: isGroupContextFetched } = useGroups();

  const {
    classes: { toolbarContainer, sortContainer, timedOptionsButton, timedOptionsButtonDivider },
  } = useCreationsToolbarStyles();
  const [isTimedOptionsDialogOpen, setIsTimedOptionsDialogOpen] = useState(false);
  const [isPublishSettingsOpen, setIsPublishSettingsOpen] = useState(false);
  const [publishSettingsKey, setPublishSettingsKey] = useState(0);
  const [hasDismissedUrlPublishSettings, setHasDismissedUrlPublishSettings] = useState(false);
  const [timedOptionsTypesLoaded, setTimedOptionsTypesLoaded] = useState(false);
  const [settingsMenuAnchor, setSettingsMenuAnchor] = useState<HTMLElement | null>(null);
  const isSettingsMenuOpen = settingsMenuAnchor != null;

  useEffect(() => {
    void getValidTimedOptionsTypes().then(() => {
      setTimedOptionsTypesLoaded(true);
    });
  }, []);

  const {
    sort,
    setSort,
    sortOrder,
    setSortOrder,
    isArchived,
    setIsArchived,
    isAgeRestrictedCollaboration,
    setIsAgeRestrictedCollaboration,
    isPublicOnly,
    setIsPublicOnly,
    isOnMarketplace,
    setIsOnMarketplace,
  } = useCreationsFilters();

  const [{ filterIndex, publishSettings }] = useQueryParams(['filterIndex', 'publishSettings']);
  const [, setViewParams] = useQueryParams(['activeTab', 'filterIndex']);
  const [, setPublishSettingsParam] = useQueryParams(publishSettingsParamKeys);
  const assetType = useMemo(() => {
    const raw = creationsMenuManager.getAssetType(menuState);
    // The Recents option is index 0 of the All tab's folder dropdown and behaves like the former
    // Recents tab (it lists every avatar item type), so resolve it to the taxonomy host asset type to
    // surface the same toolbar controls (Show Archived, settings, sort). Folders (index > 0) keep the
    // All-tab asset type, which intentionally has no Show Archived toggle.
    const isRecentsInAllTab = raw === Asset.AllCatalogAsset && !(Number(filterIndex) > 0);
    return isRecentsInAllTab ? TAXONOMY_HOST_ASSET : raw;
  }, [menuState, filterIndex]);

  // The All tab (folder view) is not in AvatarMenuMap but is still an avatar-item surface, so its
  // settings gear stays available alongside folders.
  const isAvatarItemTab = assetType in AvatarMenuMap || assetType === Asset.AllCatalogAsset;
  const isAvatarItemSettings = isAvatarItemTab && autoPublishEnabled;

  const requestedPublishSettings = normalizeSingleQueryParam(publishSettings);
  // Held until the group context resolves, because the modal keys its preferences fetch on the
  // current group and its 404 branch leaves whatever the previous fetch loaded on screen. Opening
  // first would show the personal creator's values and let Save write them as the group's.
  // Clearing the param is an async router.replace, so it is still set on the render after close.
  const isPublishSettingsRequestedByUrl =
    !!isAvatarItemSettings &&
    isGroupContextFetched &&
    !hasDismissedUrlPublishSettings &&
    (requestedPublishSettings === 'true' || requestedPublishSettings === '1');

  // Tab switching spreads the current query, so an unhonoured param would ride along and pop the
  // modal open on the first avatar item tab the creator visits, long after they followed the link.
  useEffect(() => {
    if (!isGroupContextFetched || requestedPublishSettings === undefined) {
      return;
    }
    if (!isPublishSettingsRequestedByUrl) {
      setPublishSettingsParam({ publishSettings: null }, { skipHistory: true });
    }
  }, [
    isGroupContextFetched,
    isPublishSettingsRequestedByUrl,
    requestedPublishSettings,
    setPublishSettingsParam,
  ]);

  const handlePublishSettingsClose = useCallback(() => {
    setIsPublishSettingsOpen(false);
    if (isPublishSettingsRequestedByUrl) {
      setHasDismissedUrlPublishSettings(true);
      setPublishSettingsParam({ publishSettings: null }, { skipHistory: true });
    }
  }, [isPublishSettingsRequestedByUrl, setPublishSettingsParam]);

  // Taxonomy is the default view for the Avatar Items tabs it replaces; the URL only records an
  // explicit opt-out back to the legacy item-type view.
  // The toggle tracks the category experience as a whole, not whether the grid happens to be
  // filtering by a category: All Asset Types keeps the chips on screen while filtering by folder, and
  // the switch must still read as on there.
  const { canUseTaxonomy: showTaxonomyToggle, isTaxonomyMode } = useTaxonomyView(assetType);
  const currentGroup = useCurrentGroup();
  const enabledSubmenuItems = useEnabledSubmenuItems(menuState, currentGroup);

  const { isSortable, isArchivable } = useMemo(() => {
    // In the category view `filterIndex` addresses taxonomy sub-categories, not entries in
    // AvatarMenuMap, so resolving it here would look up the wrong option (and hide Show Archived).
    const parsedFilterIndex =
      isTaxonomyMode || filterIndex === undefined || filterIndex === null
        ? undefined
        : Number(filterIndex);
    const isAssetArchivable = creationsMenuManager.isAssetTypeArchivable(
      assetType,
      parsedFilterIndex,
    );
    return {
      isSortable: creationsMenuManager.isAssetTypeSortable(assetType),
      isArchivable:
        isAssetArchivable || creationsMenuManager.isAssetTypeDirectlyArchivable(assetType),
    };
  }, [assetType, filterIndex, isTaxonomyMode]);

  const taxonomyToggleLabel = translate('Label.CategorizeByTaxonomy');

  const handleTaxonomyToggle = useCallback(() => {
    // The view follows activeTab, so switching is just a move between the two namespaces. Replace
    // the current entry rather than pushing: toggling back and forth should not have to be undone
    // one step at a time.
    //
    // Either direction lands on the first tab of the row being switched to, because the two rows
    // list different things and there is no honest mapping between them. Turning the view on uses
    // the keyless taxonomy tab, which resolves to the first L1; turning it off uses the first item
    // type, rather than the asset that happens to host the taxonomy tab.
    // The first tab the user can actually see, not the first in the menu definition: Avatars, Moments
    // and the marketplace types are each gated, so the definition's first entry may not be on screen.
    const firstVisibleAssetType = enabledSubmenuItems[0]?.type;
    const nextActiveTab = isTaxonomyMode
      ? (firstVisibleAssetType ?? assetType)
      : buildTaxonomyActiveTab();
    setViewParams(
      {
        activeTab: nextActiveTab,
        filterIndex: 0,
      },
      { skipHistory: true },
    );
  }, [isTaxonomyMode, assetType, enabledSubmenuItems, setViewParams]);

  const isToolbarHidden = useMemo(
    () =>
      !isSortable &&
      !isArchivable &&
      !showTaxonomyToggle &&
      assetType !== Asset.MyExperiences &&
      assetType !== Asset.SharedExperiences,
    [isSortable, isArchivable, showTaxonomyToggle, assetType],
  );

  const handleMenuOnchange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { value } = event.target;
      if (assetType === Asset.MyExperiences || assetType === Asset.SharedExperiences) {
        if (!isSearchSortParameterValue(value)) {
          return;
        }
        setSort((sorts) => ({
          ...sorts,
          [Asset.Place]: value,
        }));
      } else if (isEventSortByValue(value)) {
        setSort((sorts) => ({
          ...sorts,
          [assetType]: value,
        }));
      }
    },
    [setSort, assetType],
  );

  const handleSortOrderChange = useCallback(() => {
    setSortOrder((prev) => (prev === SortOrder.Asc ? SortOrder.Desc : SortOrder.Asc));
  }, [setSortOrder]);

  const handleTimedOptionsClick = useCallback(() => {
    setIsTimedOptionsDialogOpen(true);
  }, []);

  const handleImpactedFilterChange = useCallback(() => {
    const newValueIsEnabled = !isAgeRestrictedCollaboration;
    unifiedLogger.logClickEvent({
      eventName: CreatorDashboardEventType.ImpactedExperiencesFilterClick,
      parameters: {
        page: 'creations',
        action: newValueIsEnabled ? 'enable' : 'disable',
        assetType: assetType.toString(),
      },
    });
    setIsAgeRestrictedCollaboration((prev) => !prev);
  }, [unifiedLogger, isAgeRestrictedCollaboration, assetType, setIsAgeRestrictedCollaboration]);

  const isSearchSortParameter =
    assetType === Asset.MyExperiences || assetType === Asset.SharedExperiences;
  const sortItems = useMemo(
    () =>
      isSearchSortParameter
        ? Object.values(SearchSortParameter).map((value) => ({
            value,
            labelKey: universeSortTranslationKeys[value],
          }))
        : Object.values(EventSortBy).map((value) => ({
            value,
            labelKey: eventSortTranslationKeys[value],
          })),
    [isSearchSortParameter],
  );
  const sortValue = useMemo(
    () => (isSearchSortParameter ? sort[Asset.Place] : getSortForAssetType(assetType, sort)),
    [isSearchSortParameter, sort, assetType],
  );

  const isRentableType = useMemo(() => {
    if (!timedOptionsTypesLoaded) {
      return false;
    }
    // See the archivable check above: `filterIndex` does not address AvatarMenuMap in the category
    // view, so it must not be used to look up the selected item type here either.
    const parsedFilterIndex =
      isTaxonomyMode || filterIndex === undefined || filterIndex === null
        ? undefined
        : Number(filterIndex);
    if (parsedFilterIndex !== undefined && AvatarMenuMap[assetType]) {
      const menuOptions = AvatarMenuMap[assetType];
      const selectedOption = menuOptions[parsedFilterIndex];
      if (selectedOption) {
        return getIsRentableType(selectedOption.assetType, selectedOption.bundleType);
      }
    }
    return getIsRentableType(menuState.submenuItem?.type ?? assetType, undefined);
  }, [
    assetType,
    filterIndex,
    isTaxonomyMode,
    menuState.submenuItem?.type,
    timedOptionsTypesLoaded,
  ]);

  if (isToolbarHidden) {
    return null;
  }

  const shouldShowFilters =
    assetType === Asset.MyExperiences ||
    assetType === Asset.SharedExperiences ||
    isArchivable ||
    showTaxonomyToggle ||
    assetType === Asset.MeshPart;

  const shouldShowAgeRestrictedCollaborationFilter =
    assetType === Asset.MyExperiences || assetType === Asset.SharedExperiences;

  const shouldShowOnCreatorStoreToggle = assetType === Asset.Decal || assetType === Asset.MeshPart;

  const shouldShowRentablesBulkUpdateButton = isRentableType;

  const isShowingExperienceFilters =
    !isAvatarItemSettings &&
    !shouldShowRentablesBulkUpdateButton &&
    !!(
      assetType === Asset.MyExperiences ||
      shouldShowAgeRestrictedCollaborationFilter ||
      (isArchivable && assetType)
    );

  return (
    <Flex
      flexDirection='row'
      justifyContent='flex-start'
      alignItems='flex-start'
      flexWrap='wrap'
      classes={{ root: toolbarContainer }}>
      {shouldShowFilters && (
        <Flex alignItems='center' gap={1} flexDirection='row'>
          {isShowingExperienceFilters && (
            <Typography marginRight='16px'>{translate('Label.ShowPrefix')}</Typography>
          )}
          {assetType === Asset.MyExperiences && (
            <FormControlLabel
              control={
                <Switch
                  checked={isPublicOnly}
                  onChange={() => setIsPublicOnly((prev) => !prev)}
                  aria-label={translate('Label.Public')}
                />
              }
              label={translate('Label.Public')}
            />
          )}
          {shouldShowAgeRestrictedCollaborationFilter && (
            <FormControlLabel
              control={
                <Switch
                  checked={isAgeRestrictedCollaboration}
                  onChange={handleImpactedFilterChange}
                  aria-label={translate('Label.Impacted')}
                />
              }
              label={translate('Label.Impacted')}
            />
          )}
          {shouldShowRentablesBulkUpdateButton && !isAvatarItemSettings && (
            <>
              <Button
                variant='contained'
                color='secondary'
                onClick={handleTimedOptionsClick}
                classes={{ root: timedOptionsButton }}>
                {translate('Action.TimedOptions')}
              </Button>
              <Divider
                orientation='vertical'
                flexItem
                classes={{ root: timedOptionsButtonDivider }}
              />
            </>
          )}
          {isArchivable && assetType && (
            <FormControlLabel
              control={
                <Switch
                  checked={isArchived}
                  onChange={() => setIsArchived((prev) => !prev)}
                  aria-label={
                    isAvatarItemSettings
                      ? translate('Action.ShowArchived')
                      : translate('Label.Archived')
                  }
                />
              }
              label={
                isAvatarItemSettings
                  ? translate('Action.ShowArchived')
                  : translate('Label.Archived')
              }
            />
          )}
          {showTaxonomyToggle && (
            <FormControlLabel
              control={
                <Switch
                  checked={isTaxonomyMode}
                  onChange={handleTaxonomyToggle}
                  aria-label={taxonomyToggleLabel}
                />
              }
              label={taxonomyToggleLabel}
            />
          )}
          {isAvatarItemSettings && (
            <>
              <Divider
                orientation='vertical'
                flexItem
                classes={{ root: timedOptionsButtonDivider }}
              />
              <IconButton
                aria-label={translate('Label.Settings')}
                size='medium'
                color='secondary'
                onClick={(event) => setSettingsMenuAnchor(event.currentTarget)}>
                <SettingsIcon />
              </IconButton>
              <Menu
                anchorEl={settingsMenuAnchor}
                open={isSettingsMenuOpen}
                onClose={() => setSettingsMenuAnchor(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                className='margin-top-small'>
                {shouldShowRentablesBulkUpdateButton && (
                  <MenuItem
                    onClick={() => {
                      setSettingsMenuAnchor(null);
                      handleTimedOptionsClick();
                    }}>
                    <Typography variant='body1'>{translate('Action.TimedOptions')}</Typography>
                  </MenuItem>
                )}
                <MenuItem
                  onClick={() => {
                    setSettingsMenuAnchor(null);
                    setPublishSettingsKey((prev) => prev + 1);
                    setIsPublishSettingsOpen(true);
                  }}>
                  <Typography variant='body1'>
                    {translate('Action.StudioPublishSettings')}
                  </Typography>
                </MenuItem>
              </Menu>
            </>
          )}
          {shouldShowOnCreatorStoreToggle && (
            <FormControlLabel
              control={
                <Switch
                  aria-label={translate('Label.OnCreatorStore')}
                  checked={isOnMarketplace}
                  onChange={() => setIsOnMarketplace((prev) => !prev)}
                />
              }
              label={translate('Label.OnCreatorStore')}
            />
          )}
        </Flex>
      )}
      {isSortable && (
        <Flex
          flexDirection='row'
          classes={{ root: sortContainer }}
          alignItems='center'
          flexWrap='nowrap'>
          <Select
            variant='outlined'
            margin='dense'
            size='small'
            label={translate('Label.SortBy')}
            value={sortValue}
            onChange={handleMenuOnchange}
            inputProps={{ 'aria-label': translate('Label.SortBy') }}>
            {sortItems.map((sortItem) => (
              <MenuItem key={sortItem.value} value={sortItem.value}>
                {translate(sortItem.labelKey)}
              </MenuItem>
            ))}
          </Select>
          <IconButton
            aria-label={translate('Heading.SortOrder')}
            onClick={handleSortOrderChange}
            size='large'>
            {sortOrder === SortOrder.Asc ? (
              <ArrowUpwardIcon color='secondary' />
            ) : (
              <ArrowDownwardIcon color='secondary' />
            )}
          </IconButton>
        </Flex>
      )}
      <TimedOptionsBulkUpdate
        open={isTimedOptionsDialogOpen}
        onClose={() => setIsTimedOptionsDialogOpen(false)}
      />
      <StudioPublishSettingsModal
        key={publishSettingsKey}
        open={isPublishSettingsOpen || isPublishSettingsRequestedByUrl}
        onClose={handlePublishSettingsClose}
      />
    </Flex>
  );
};

export default CreationsToolbar;
