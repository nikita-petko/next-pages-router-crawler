import React, { ChangeEvent, FunctionComponent, useState, useEffect, useRef } from 'react';
import { useTranslation } from '@rbx/intl';
import { Grid, MenuItem, Select, Typography, makeStyles } from '@rbx/ui';
import { AvatarItemDropdown } from '../constants/avatarItemConstants';
import { isValidIndex } from '../utils/avatarMenuMapUtils';

const useStyles = makeStyles()({
  root: {
    marginTop: 0,
    marginBottom: 24,
  },
});

interface DropdownInputs {
  selectionValue: string;
  label: string;
  listOfInputs: string[];
  handleChange: (arg: ChangeEvent<{ value: string }>) => void;
  disabled?: boolean;
  dropdownOptions?: AvatarItemDropdown[];
}

const DropdownField: FunctionComponent<React.PropsWithChildren<DropdownInputs>> = ({
  selectionValue,
  label,
  listOfInputs,
  handleChange,
  disabled,
  dropdownOptions,
}) => {
  const { translate } = useTranslation();
  return (
    <Grid item XSmall={12}>
      <Select
        fullWidth
        label={label}
        margin='normal'
        disabled={disabled}
        value={selectionValue}
        onChange={handleChange}
        variant='outlined'>
        {listOfInputs.map((key) => {
          const option = dropdownOptions?.find(
            (opt) => (opt.isFolder && opt.folderId === key) || opt.nameKey === key,
          );

          if (!option) return null;

          const shouldSkipTranslation = option.skipTranslation;
          const displayText = option.nameKey;

          return (
            <MenuItem key={key} value={key}>
              {shouldSkipTranslation ? displayText : translate(displayText)}
            </MenuItem>
          );
        })}
      </Select>
    </Grid>
  );
};

export interface CreationsDropdownCategorySubmenuProps {
  dropdownTitle: string;
  dropdownOptions: AvatarItemDropdown[] | undefined;
  filterIndex: number;
  isFolderMode: boolean;
  onMenuStateChange: (newDropdownOption: AvatarItemDropdown) => void;
}

const CreationsDropdownCategorySubmenu: FunctionComponent<
  React.PropsWithChildren<CreationsDropdownCategorySubmenuProps>
> = ({ dropdownTitle, dropdownOptions, filterIndex, isFolderMode, onMenuStateChange }) => {
  const {
    classes: { root },
  } = useStyles();
  const { translate } = useTranslation();
  const [dropdownCategorySubmenuType, setDropdownCategorySubmenuType] = useState('');
  const lastFilterIndex = useRef(filterIndex);

  function getDropdownKeys() {
    const keys = [] as string[];
    if (dropdownOptions) {
      dropdownOptions.forEach((submenuItem) => {
        // Folders do not have unique names, so we use folderId
        const key =
          submenuItem.isFolder && submenuItem.folderId ? submenuItem.folderId : submenuItem.nameKey;
        keys.push(key);
      });
    }
    return keys;
  }

  useEffect(() => {
    const initialIndex = isValidIndex(filterIndex, dropdownOptions) ? filterIndex : 0;
    if (dropdownOptions && dropdownOptions[initialIndex]) {
      const initialOption = dropdownOptions[initialIndex];
      const initialValue =
        initialOption.isFolder && initialOption.folderId
          ? initialOption.folderId
          : initialOption.nameKey;

      if (isFolderMode) {
        const currentSelectionExists =
          dropdownCategorySubmenuType &&
          dropdownOptions.find((item) => {
            if (item.folderId) {
              return item.folderId === dropdownCategorySubmenuType;
            }
            return item.nameKey === dropdownCategorySubmenuType;
          });

        // Update if selection doesn't exist OR if filterIndex changed externally (e.g. folder creation)
        if (!currentSelectionExists || lastFilterIndex.current !== filterIndex) {
          setDropdownCategorySubmenuType(initialValue);
          lastFilterIndex.current = filterIndex;
        }
      } else if (
        !dropdownCategorySubmenuType ||
        dropdownOptions.findIndex((item) => item.nameKey === dropdownCategorySubmenuType) !==
          initialIndex
      ) {
        setDropdownCategorySubmenuType(initialValue);
      }
    }
  }, [dropdownOptions, filterIndex, dropdownCategorySubmenuType, isFolderMode]);

  function onDropdownSelect(value: string) {
    if (dropdownOptions) {
      const selectedCategorySubmenu = dropdownOptions.find(
        (submenuItem) =>
          (submenuItem.isFolder && submenuItem.folderId === value) || submenuItem.nameKey === value,
      );
      if (selectedCategorySubmenu) {
        onMenuStateChange(selectedCategorySubmenu);
      }
    }
  }

  return (
    <Grid classes={{ root }} container direction='row' alignItems='center' spacing={3}>
      <Grid item>
        <Typography align='left' variant='body1'>
          {translate('Label.Filters')}
        </Typography>
      </Grid>
      <Grid item XSmall={isFolderMode ? 6 : 3}>
        <DropdownField
          selectionValue={dropdownCategorySubmenuType}
          label={
            isFolderMode
              ? translate(dropdownTitle)
              : translate('Label.CategoryType', {
                  categoryNameSingular: translate(dropdownTitle),
                })
          }
          listOfInputs={getDropdownKeys()}
          dropdownOptions={dropdownOptions}
          handleChange={(event: ChangeEvent<{ value: string }>) => {
            setDropdownCategorySubmenuType(event.target.value);
            onDropdownSelect(event.target.value);
          }}
        />
      </Grid>
    </Grid>
  );
};

export default CreationsDropdownCategorySubmenu;
