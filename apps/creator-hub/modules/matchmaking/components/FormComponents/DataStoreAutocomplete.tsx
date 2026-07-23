import { Autocomplete, SearchIcon, TextField } from '@rbx/ui';
import React, { FunctionComponent } from 'react';
import { useTranslation } from '@rbx/intl';
import { Control, Controller, FormState, Path } from 'react-hook-form';
import { PlayerAttributesDetailedInfo } from '../../types/AttributesInfo';

export type DataStoreAutocompleteProps = {
  isEditActive: boolean | undefined;
  isLoading: boolean;
  dataStoreNames: string[];
  selectedDataStoreName?: string;
  onNameSelect: (option: string) => void;
  onInputChange: (param: string) => void;
  formState: FormState<PlayerAttributesDetailedInfo>;
  control: Control<PlayerAttributesDetailedInfo>;
  name: Path<PlayerAttributesDetailedInfo>;
};

const DataStoreAutocomplete: FunctionComponent<
  React.PropsWithChildren<DataStoreAutocompleteProps>
> = ({
  isEditActive,
  isLoading,
  selectedDataStoreName,
  dataStoreNames,
  onNameSelect,
  onInputChange,
  formState,
  control,
  name,
}) => {
  const { errors } = formState;
  const { translate } = useTranslation();

  const fieldRules = {
    required: 'Error.Required',
    maxLength: 100,
  };

  return (
    <Controller
      name={name}
      control={control}
      rules={fieldRules}
      render={({ field }) => (
        <Autocomplete
          {...field}
          fullWidth
          noOptionsText={translate('Label.NoDataStore')}
          data-testid='dataStoreName'
          autoHighlight
          openOnFocus
          blurOnSelect
          value={selectedDataStoreName ?? ''}
          disabled={!isEditActive}
          loading={isLoading}
          onInputChange={(_, value) => {
            onInputChange(value);
          }}
          onChange={(_, option) => {
            if (option === null) {
              return;
            }
            onNameSelect(option);
          }}
          options={dataStoreNames}
          renderInput={(params) => (
            <TextField
              {...params}
              fullWidth
              required
              error={!!errors.dataStoreLocation?.dataStoreName}
              InputProps={{
                ...params.InputProps,
                startAdornment: (
                  <SearchIcon
                    color={errors.dataStoreLocation?.dataStoreName ? 'error' : 'secondary'}
                  />
                ),
              }}
              label={translate('Label.DataStoreName')}
              helperText={
                errors.dataStoreLocation?.dataStoreName &&
                errors.dataStoreLocation?.dataStoreName.message
                  ? translate('Error.Required')
                  : null
              }
            />
          )}
          getOptionLabel={(option) => option}
          componentsProps={{
            popper: {
              modifiers: [
                {
                  name: 'flip',
                  enabled: false,
                },
              ],
            },
          }}
        />
      )}
    />
  );
};

export default DataStoreAutocomplete;
