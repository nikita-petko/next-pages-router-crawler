import {
  Button,
  Checkbox,
  Divider,
  FilterListIcon,
  Grid,
  ListItemIcon,
  Menu,
  MenuItem,
  Typography,
} from '@rbx/ui';
import React, { useCallback, useEffect, useMemo, useState, FunctionComponent, useRef } from 'react';
import { useTranslation } from '@rbx/intl';
import unifiedLoggerClient from '@modules/eventStream/unifiedLoggerClient';
import useActivityFeedFilterMenuStyles from './ActivityFeedFilterMenu.styles';
import { Categories, categoriesToTranslationKey } from '../enums/ActivityFeedEnums';

interface ActivityFeedFilterMenuItemProps {
  value?: string;
  selectedItems: string[];
  // NOTE (jcountryman, 2/6/24): Turned off to check in @rbx/ui upgrade. Codeowners is
  // responsible for triaging issue.
  // eslint-disable-next-line react/no-unused-prop-types -- @rbx/ui upgrade triage
  allItems?: string[];
  setSelected: (items: string[]) => void;
  // NOTE (jcountryman, 2/6/24): Turned off to check in @rbx/ui upgrade. Codeowners is
  // responsible for triaging issue.
  // eslint-disable-next-line react/no-unused-prop-types -- @rbx/ui upgrade triage
  isSelectAll?: boolean;
  isCategory?: boolean;
}

const ActivityFeedFilterMenuItem: FunctionComponent<
  React.PropsWithChildren<ActivityFeedFilterMenuItemProps>
> = ({ value = '', selectedItems, setSelected, isCategory = false }) => {
  const [isChecked, setIsChecked] = useState<boolean>(true);
  const { translate } = useTranslation();
  const {
    classes: { filteringMenuOption },
  } = useActivityFeedFilterMenuStyles();

  useEffect(() => {
    setIsChecked(selectedItems.includes(value));
    // NOTE (jcountryman, 2/6/24): Turned off to check in @rbx/ui upgrade. Codeowners is
    // responsible for triaging issue.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- @rbx/ui upgrade triage
  }, [selectedItems]);

  const toggleSelectedItem = () => {
    if (isChecked) {
      setSelected(selectedItems.filter((item) => item !== value));
    } else {
      setSelected([...selectedItems, value]);
    }
  };

  let displayText = value;
  if (isCategory) {
    displayText = translate(categoriesToTranslationKey[value as Categories]);
  }
  return (
    <MenuItem
      onClick={toggleSelectedItem}
      className={filteringMenuOption}
      data-testid={`activity-feed-filter-${displayText}`}>
      <ListItemIcon>
        <Checkbox size='small' checked={isChecked} />
      </ListItemIcon>
      {displayText}
    </MenuItem>
  );
};

export interface ActivityFeedFilterMenuProps {
  allCategories: string[];
  allUsernames: string[];
  allPlaceNames: string[];
  applySelectedItems: (categories: string[], userNames: string[], placeNames: string[]) => void;
}

const ActivityFeedFilterMenu: FunctionComponent<
  React.PropsWithChildren<ActivityFeedFilterMenuProps>
> = ({ allCategories, allUsernames, allPlaceNames, applySelectedItems }) => {
  const {
    classes: { filterMenuHeader, filteringButton, filteringMenuButtons },
  } = useActivityFeedFilterMenuStyles();
  const { translate } = useTranslation();
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedUsernames, setSelectedUsernames] = useState<string[]>([]);
  const [selectedPlaceNames, setSelectedPlaceNames] = useState<string[]>([]);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const showPlaces = useMemo(() => {
    return (
      (selectedCategories.includes(Categories.PlaceConfiguration) ||
        selectedCategories.includes(Categories.PlacePublish)) &&
      allPlaceNames.length !== 0
    );
  }, [allPlaceNames.length, selectedCategories]);

  const useGenerateMenuItems = (
    items: string[],
    selectedItems: string[],
    setSelected: React.Dispatch<React.SetStateAction<string[]>>,
    isCategory = false,
  ) => {
    return useMemo(() => {
      if (items.length === 0) {
        return [];
      }
      return items.map((item) => (
        <ActivityFeedFilterMenuItem
          key={item}
          value={item}
          selectedItems={selectedItems}
          setSelected={setSelected}
          isCategory={isCategory}
        />
      ));
      // NOTE (jcountryman, 2/6/24): Turned off to check in @rbx/ui upgrade. Codeowners is
      // responsible for triaging issue.
      // eslint-disable-next-line react-hooks/exhaustive-deps -- @rbx/ui upgrade triage
    }, [items, selectedItems]);
  };

  const handleOpen = useCallback(() => {
    setIsMenuOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setIsMenuOpen(false);
  }, []);

  const handleApply = useCallback(() => {
    applySelectedItems(selectedCategories, selectedUsernames, selectedPlaceNames);
    handleClose();
    // Log which filters have been selected. For usernames and/or place names, only logs the number of selections since they may
    // be different for every experience.
    unifiedLoggerClient.logClickEvent({
      eventName: 'clickActivityFeedFilter',
      parameters: {
        selectedCategories: selectedCategories.toString(),
        userNamesSelected: selectedUsernames.length.toString(),
        placeNamesSelected: selectedPlaceNames.length.toString(),
      },
    });
    // NOTE (jcountryman, 2/6/24): Turned off to check in @rbx/ui upgrade. Codeowners is
    // responsible for triaging issue.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- @rbx/ui upgrade triage
  }, [selectedCategories, selectedUsernames, selectedPlaceNames]);

  const selectAll = useCallback(() => {
    setSelectedCategories(allCategories);
    setSelectedUsernames(allUsernames);
    setSelectedPlaceNames(allPlaceNames);
  }, [allCategories, allPlaceNames, allUsernames]);
  const deselectAll = useCallback(() => {
    setSelectedCategories([]);
    setSelectedUsernames([]);
    setSelectedPlaceNames([]);
  }, []);

  const filteringHeaders = useCallback(
    (translationKey: string) => {
      return (
        <Grid className={filterMenuHeader}>
          <Typography variant='caption' color='secondary'>
            {translate(translationKey)}
          </Typography>
        </Grid>
      );
    },
    // NOTE (jcountryman, 2/6/24): Turned off to check in @rbx/ui upgrade. Codeowners is
    // responsible for triaging issue.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- @rbx/ui upgrade triage
    [translate],
  );

  const usernameItems = useGenerateMenuItems(allUsernames, selectedUsernames, setSelectedUsernames);

  const placeMenuItems = useGenerateMenuItems(
    allPlaceNames,
    selectedPlaceNames,
    setSelectedPlaceNames,
  );

  const filterCount =
    selectedCategories.length + selectedUsernames.length + selectedPlaceNames.length;

  return (
    <div>
      <Button
        ref={buttonRef}
        onClick={handleOpen}
        variant='outlined'
        color='primary'
        endIcon={<FilterListIcon color={filterCount > 0 ? 'primary' : 'secondary'} />}
        className={filteringButton}>
        <Typography variant='largeLabel2' color='primary'>
          {`${translate('Action.Filters')} ${filterCount > 0 ? `(${filterCount})` : ''}`}
        </Typography>
      </Button>
      <Menu
        open={isMenuOpen}
        anchorEl={buttonRef.current}
        onClose={handleApply}
        variant='selectedMenu'>
        <Grid container justifyContent='space-between' className={filteringMenuButtons}>
          <Grid item>
            <Button onClick={selectAll} color='primary' className={filteringButton}>
              {translate('Action.SelectAll')}
            </Button>
          </Grid>
          <Grid item>
            <Button onClick={deselectAll} className={filteringButton}>
              {translate('Action.Clear')}
            </Button>
          </Grid>
        </Grid>
        <Divider />
        {filteringHeaders('Label.ByType')}
        {useGenerateMenuItems(allCategories, selectedCategories, setSelectedCategories, true)}
        {allUsernames.length !== 0 && (
          <React.Fragment>
            <Divider />
            {filteringHeaders('Label.ByCollaborator')}
            {usernameItems}
          </React.Fragment>
        )}
        {showPlaces && (
          <React.Fragment>
            <Divider />
            {filteringHeaders('Label.ByPlace')}
            {placeMenuItems}
          </React.Fragment>
        )}
      </Menu>
    </div>
  );
};

export default ActivityFeedFilterMenu;
