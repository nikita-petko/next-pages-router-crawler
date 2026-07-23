import React, { FunctionComponent, useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowDownwardIcon,
  ArrowUpwardIcon,
  Button,
  Divider,
  FormControlLabel,
  IconButton,
  MenuItem,
  Select,
  Switch,
  Typography,
} from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
import { eventSortTranslationKeys, universeSortTranslationKeys } from '@modules/creations/menu';
import { SortOrder } from '@rbx/core';
import { Asset } from '@modules/miscellaneous/common';
import { EventSortBy } from '@rbx/clients/virtualEventsApi';
import { SearchSortParameter } from '@rbx/clients/universesApi';
import { Flex } from '@modules/miscellaneous/common/components';
import { useIXPParameters, useQueryParams } from '@modules/miscellaneous/hooks';
import { useSettings } from '@modules/settings';
import { IXPLayers } from '@modules/clients/ixpExperiments';
import { getSortForAssetType } from '../../common/interfaces/CreationsFilters';
import { useCreationsFilters } from '../../common';
import useCreationsToolbarStyles from './CreationsToolbar.styles';
import MenuState from '../interfaces/MenuState';
import creationsMenuManager from '../implementations/CreationsMenuManager';
import TimedOptionsBulkUpdate from './TimedOptionsBulkUpdate';
import { getIsRentableType } from '../../unifiedFeeSystem/helper/UnifiedFeeSystemHelper';
import { AvatarMenuMap } from '../../avatarItem/constants/avatarItemConstants';
import { getValidTimedOptionsTypes } from '../../unifiedFeeSystem/helper/UnifiedFeeSystemConstants';

export type CreationsToolbarProps = { menuState: MenuState };

const CreationsToolbar: FunctionComponent<React.PropsWithChildren<CreationsToolbarProps>> = ({
  menuState,
}) => {
  const { translate } = useTranslation();
  const { settings } = useSettings();
  const {
    params: { enableImpactedExperiencesView },
  } = useIXPParameters(IXPLayers.CreatorDashboard);

  const {
    classes: { toolbarContainer, sortContainer, timedOptionsButton, timedOptionsButtonDivider },
  } = useCreationsToolbarStyles();
  const [isTimedOptionsDialogOpen, setIsTimedOptionsDialogOpen] = useState(false);
  const [timedOptionsTypesLoaded, setTimedOptionsTypesLoaded] = useState(false);

  useEffect(() => {
    getValidTimedOptionsTypes().then(() => {
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
      if (assetType === Asset.MyExperiences || assetType === Asset.SharedExperiences) {
        setSort((sorts) => ({
          ...sorts,
          [Asset.Place]: event.target.value as SearchSortParameter,
        }));
      } else {
        setSort((sorts) => ({
          ...sorts,
          [assetType]: event.target.value as EventSortBy,
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

  const isSearchSortParameter =
    assetType === Asset.MyExperiences || assetType === Asset.SharedExperiences;
  const sortItems = useMemo(
    () => (isSearchSortParameter ? Object.values(SearchSortParameter) : Object.values(EventSortBy)),
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
    enableImpactedExperiencesView &&
    (assetType === Asset.MyExperiences || assetType === Asset.SharedExperiences);

  const shouldShowOnCreatorStoreToggle = assetType === Asset.Decal || assetType === Asset.MeshPart;

  const shouldShowRentablesBulkUpdateButton =
    settings.enableRentablesBulkUpdateButton && isRentableType;

  const isShowingExperienceFilters =
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
                  onChange={() => setIsAgeRestrictedCollaboration((prev) => !prev)}
                  aria-label={translate('Label.Impacted')}
                />
              }
              label={translate('Label.Impacted')}
            />
          )}
          {shouldShowRentablesBulkUpdateButton && (
            <React.Fragment>
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
            </React.Fragment>
          )}
          {isArchivable && assetType && (
            <FormControlLabel
              control={
                <Switch
                  checked={isArchived}
                  onChange={() => setIsArchived((prev) => !prev)}
                  aria-label={translate('Label.Archived')}
                />
              }
              label={translate('Label.Archived')}
            />
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
              <MenuItem key={sortItem} value={sortItem}>
                {isSearchSortParameter
                  ? translate(universeSortTranslationKeys[sortItem as SearchSortParameter])
                  : translate(eventSortTranslationKeys[sortItem as EventSortBy])}
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
    </Flex>
  );
};

export default CreationsToolbar;
