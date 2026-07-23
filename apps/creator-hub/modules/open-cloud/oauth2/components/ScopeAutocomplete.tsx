import { useTranslation } from '@rbx/intl';
import { Autocomplete, Grid, SearchIcon, TextField, Typography } from '@rbx/ui';
import type ScopeOption from '../interfaces/ScopeOptions';
import getDeveloperFacingScopes from '../utils/scopesUtil';

type ScopeAutocompleteProps = {
  isEditActive: boolean | undefined;
  isLoading: boolean;
  scopeOptions: ScopeOption[];
  selectedScopeOptions: ScopeOption[];
  onScopeAdd: (option: ScopeOption) => void;
};

const ScopeAutocomplete = ({
  isEditActive,
  isLoading,
  scopeOptions,
  selectedScopeOptions,
  onScopeAdd,
}: ScopeAutocompleteProps) => {
  const { translate } = useTranslation();

  return (
    <Grid item XSmall={8}>
      <Autocomplete
        data-testid='autocomplete'
        autoHighlight
        openOnFocus
        blurOnSelect
        value={null}
        disabled={!isEditActive}
        loading={isLoading}
        onChange={(_, option) => {
          if (option === null) {
            return;
          }
          onScopeAdd(option);
        }}
        options={scopeOptions}
        getOptionDisabled={(option) => selectedScopeOptions.includes(option)}
        renderInput={(params) => (
          <TextField
            {...params}
            size='small'
            InputProps={{
              ...params.InputProps,
              startAdornment: <SearchIcon />,
            }}
            label={params.inputProps.value ? translate('Label.ScopeSearch') : ''}
            placeholder={translate('Label.ScopeSearch')}
          />
        )}
        renderOption={(props, option) => (
          <li {...props} key={getDeveloperFacingScopes(option.scopeType, option.operation)}>
            <Grid container>
              <Grid item>
                <Grid item container alignItems='center'>
                  <Typography variant='subtitle2' color='primary'>
                    {getDeveloperFacingScopes(option.scopeType, option.operation)}
                  </Typography>
                </Grid>
                <Grid item>
                  <Typography variant='body2' color='secondary'>
                    {option.description}
                  </Typography>
                </Grid>
              </Grid>
            </Grid>
          </li>
        )}
        getOptionLabel={(option) => getDeveloperFacingScopes(option.scopeType, option.operation)}
        componentsProps={{
          popper: {
            modifiers: [
              // forces the dropdown to always be below the button and not flip
              {
                name: 'flip',
                enabled: false,
              },
            ],
          },
        }}
      />
    </Grid>
  );
};

export default ScopeAutocomplete;
