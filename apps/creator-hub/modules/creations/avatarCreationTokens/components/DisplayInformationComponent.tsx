import React, { FC } from 'react';
import { useTranslation } from '@rbx/intl';
import { Grid, MenuItem, Select, TextField } from '@rbx/ui';
import { Asset } from '@modules/miscellaneous/common';
import { BundleType } from '../../avatarItem/constants/avatarItemConstants';
import useAvatarCreationTokenStyles from './Styles/AvatarCreationTokenStyles.styles';
import {
  TAvatarCreationTokenDispayInformation,
  TItemTypeMetadata,
} from '../constants/AvatarCreationTokenConstants';
import { descriptionMaxLength, nameMaxLength } from '../utils/formHelpers';

export type TDisplayInformationComponentProps = {
  onChange: (inputs: TAvatarCreationTokenDispayInformation) => void;
  value: TAvatarCreationTokenDispayInformation;
  isItemTypeDisabled?: boolean;
  enabledItemTypes: Set<Asset | BundleType>;
  enabledItemTypesMetadata: { [key: string]: TItemTypeMetadata };
};

const DisplayInformationComponent: FC<
  React.PropsWithChildren<TDisplayInformationComponentProps>
> = ({
  onChange,
  value,
  isItemTypeDisabled = false,
  enabledItemTypes,
  enabledItemTypesMetadata,
}) => {
  const {
    classes: { inputForm },
  } = useAvatarCreationTokenStyles();

  const { name, description, itemType } = value;

  const handleValueChange = (newValues: TAvatarCreationTokenDispayInformation) => {
    onChange(newValues);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    const newName = e.target.value;
    handleValueChange({ ...value, name: newName });
  };

  const handleDescriptionChange = (
    e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>,
  ) => {
    const newDescription = e.target.value;
    handleValueChange({ ...value, description: newDescription });
  };

  const handleEnabledItemTypeChange = (e: React.ChangeEvent<{ value: string }>) => {
    const newItemType = e.target.value as Asset | BundleType;
    handleValueChange({ ...value, itemType: newItemType });
  };

  const { translate } = useTranslation();

  return (
    <Grid container item direction='column' XSmall={12} XLarge={6} className={inputForm}>
      <Grid item XSmall={12}>
        <TextField
          value={name}
          fullWidth
          required
          id='name'
          label={translate('Label.Name')}
          FormHelperTextProps={{ 'aria-live': 'polite' }}
          helperText={`${name.length}/${nameMaxLength}`}
          error={name.length > nameMaxLength}
          onChange={handleNameChange}
        />
      </Grid>
      <Grid item XSmall={12}>
        <TextField
          value={description}
          fullWidth
          required
          multiline
          minRows={6}
          id='description'
          label={translate('Label.Description')}
          FormHelperTextProps={{ 'aria-live': 'polite' }}
          helperText={`${description.length}/${descriptionMaxLength}`}
          error={description.length > descriptionMaxLength}
          onChange={handleDescriptionChange}
        />
      </Grid>
      <Grid item XSmall={12}>
        <Select
          fullWidth
          label={translate('Label.ItemType')}
          onChange={handleEnabledItemTypeChange}
          required
          value={itemType || ''}
          disabled={isItemTypeDisabled}>
          {Array.from(enabledItemTypes).map((key) => (
            <MenuItem key={key} value={key}>
              {translate(enabledItemTypesMetadata[key].displayName)}
            </MenuItem>
          ))}
        </Select>
      </Grid>
    </Grid>
  );
};

export default DisplayInformationComponent;
