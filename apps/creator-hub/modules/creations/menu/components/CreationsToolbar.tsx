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
import { AvatarMenuMap } from '../../avatarItem/constants/avatarItemConstants';
import useCreationsFilters from '../../common/hooks/useCreationsFilters';
import { getSortForAssetType } from '../../common/interfaces/CreationsFilters';
import { getValidTimedOptionsTypes } from '../../unifiedFeeSystem/helper/UnifiedFeeSystemConstants';
import { getIsRentableType } from '../../unifiedFeeSystem/helper/UnifiedFeeSystemHelper';
import { eventSortTranslationKeys, universeSortTranslationKeys } from '../constants/MenuConstants';
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

const CreationsToolbar: FunctionComponent<React.PropsWithChildren<CreationsToolbarProps>> = ({
  menuState,
}) => {
  const { translate } = useTranslation();
  const { unifiedLogger } = useUnifiedLoggerProvider();
  const { value: autoPublishEnabled } = useFlag(isAutoPublishPreferencesEnabled);

  const {
    classes: { toolbarContainer, sortContainer, timedOptionsButton, timedOptionsButtonDivider },
  } = useCreationsToolbarStyles();
  const [isTimedOptionsDialogOpen, setIsTimedOptionsDialogOpen] = useState(false);
  const [isPublishSettingsOpen, setIsPublishSettingsOpen] = useState(false);
  const [publishSettingsKey, setPublishSettingsKey] = useState(0);
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

  const [{ filterIndex }] = useQueryParams(['filterIndex']);
  const { assetType, isSortable, isArchivable } = useMemo(() => {
    const type = creationsMenuManager.getAssetType(menuState);
    const isAssetSortable = creationsMenuManager.isAssetTypeSortable(type);
    const parsedFilterIndex =
      filterIndex !== undefined && filterIndex !== null ? Number(filterIndex) : undefined;
    const isAssetArchivable = creationsMenuManager.isAssetTypeArchivable(type, parsedFilterIndex);
    const isAssetDirectlyArchivable = creationsMenuManager.isAssetTypeDirectlyArchivable(type);
    return {
      assetType: type,
      isSortable: isAssetSortable,
      isArchivable: isAssetArchivable || isAssetDirectlyArchivable,
    };
  }, [menuState, filterIndex]);

  const isToolbarHidden = useMemo(
    () =>
      !isSortable &&
      !isArchivable &&
      assetType !== Asset.MyExperiences &&
      assetType !== Asset.SharedExperiences,
    [isSortable, isArchivable, assetType],
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
    const parsedFilterIndex =
      filterIndex !== undefined && filterIndex !== null ? Number(filterIndex) : undefined;
    if (parsedFilterIndex !== undefined && AvatarMenuMap[assetType]) {
      const menuOptions = AvatarMenuMap[assetType];
      const selectedOption = menuOptions[parsedFilterIndex];
      if (selectedOption) {
        return getIsRentableType(selectedOption.assetType, selectedOption.bundleType);
      }
    }
    return getIsRentableType(menuState.submenuItem?.type ?? assetType, undefined);
  }, [assetType, filterIndex, menuState.submenuItem?.type, timedOptionsTypesLoaded]);

  if (isToolbarHidden) {
    return null;
  }

  const shouldShowFilters =
    assetType === Asset.MyExperiences ||
    assetType === Asset.SharedExperiences ||
    isArchivable ||
    assetType === Asset.MeshPart;

  const shouldShowAgeRestrictedCollaborationFilter =
    assetType === Asset.MyExperiences || assetType === Asset.SharedExperiences;

  const shouldShowOnCreatorStoreToggle = assetType === Asset.Decal || assetType === Asset.MeshPart;

  const shouldShowRentablesBulkUpdateButton = isRentableType;

  const isAvatarItemTab = assetType in AvatarMenuMap;
  const isAvatarItemSettings = isAvatarItemTab && autoPublishEnabled;

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
        open={isPublishSettingsOpen}
        onClose={() => setIsPublishSettingsOpen(false)}
      />
    </Flex>
  );
};

export default CreationsToolbar;
