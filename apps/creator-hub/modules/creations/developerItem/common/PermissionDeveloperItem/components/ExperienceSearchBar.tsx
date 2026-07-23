import { useTranslation } from '@rbx/intl';
import { Button, FormHelperText, Grid, TextField } from '@rbx/ui';
import React, { FunctionComponent, useCallback, useState } from 'react';
import usePermissionDeveloperItemContainerStyles from '../PermissionDeveloperItemForm.styles';

export type ExperienceSearchBarProps = {
  errorList: string[];
  handleExperienceSubmit: (input: string) => Promise<void>;
  loading?: boolean;
};

const ExperienceSearchBar: FunctionComponent<React.PropsWithChildren<ExperienceSearchBarProps>> = ({
  errorList,
  handleExperienceSubmit,
  loading,
}) => {
  const {
    classes: { buttonText, helperText },
  } = usePermissionDeveloperItemContainerStyles();

  const [textFieldInputValue, setTextFieldInputValue] = useState<string>('');

  const { translate } = useTranslation();
  const handleTextFieldOnChange = useCallback((input: string) => {
    setTextFieldInputValue(input);
  }, []);

  const handleExperienceSearchSubmit = useCallback(
    async (inputTextValue: string) => {
      setTextFieldInputValue('');
      await handleExperienceSubmit(inputTextValue);
    },
    [handleExperienceSubmit],
  );

  return (
    <Grid container spacing={2}>
      <Grid item XSmall={8}>
        <TextField
          error={errorList.length !== 0}
          fullWidth
          id='privateExperienceAccessId'
          inputProps={{ 'data-testid': 'privateExperienceAccessId' }}
          label={translate('Label.UniverseIdTitle')}
          onChange={(event) => handleTextFieldOnChange(event.target.value)}
          size='small'
          value={textFieldInputValue}
        />
        <FormHelperText
          classes={{ root: helperText }}
          component='div'
          error={errorList.length !== 0}>
          {errorList.length === 0 ? (
            translate('Label.SeparateIdsCommas')
          ) : (
            <Grid>
              {errorList.map((value) => (
                <Grid key={value}>{value}</Grid>
              ))}
            </Grid>
          )}
        </FormHelperText>
      </Grid>
      <Grid item XSmall={4}>
        <Button
          classes={{ root: buttonText }}
          color='primary'
          disabled={textFieldInputValue === ''}
          loading={loading}
          onClick={() => handleExperienceSearchSubmit(textFieldInputValue)}
          size='large'
          variant='outlined'>
          {translate('Button.Add')}
        </Button>
      </Grid>
    </Grid>
  );
};

export default ExperienceSearchBar;
