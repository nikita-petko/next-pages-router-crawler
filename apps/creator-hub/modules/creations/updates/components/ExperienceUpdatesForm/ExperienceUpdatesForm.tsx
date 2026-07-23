import type { FunctionComponent } from 'react';
import React, { Fragment, useCallback, useState } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { useTranslation } from '@rbx/intl';
import { Button, Divider, FormHelperText, Grid, TextField, Typography } from '@rbx/ui';
import ExperienceUpdatesPreview from '../ExperienceUpdatesPreview/ExperienceUpdatesPreview';
import type { ExperienceUpdatesFormType } from '../types';
import { ExperienceUpdatesFormTextRule } from '../types';
import useExperienceUpdatesFormStyles from './ExperienceUpdatesForm.styles';

export type ExperienceUpdatesFormProps = {
  experienceName: string;
  onPrimaryButtonClick: () => void;
  onSecondaryButtonClick: () => Promise<void>;
  isPreviewShown: boolean;
  errorMsg?: string;
};

const ExperienceUpdatesForm: FunctionComponent<
  React.PropsWithChildren<ExperienceUpdatesFormProps>
> = ({
  experienceName,
  errorMsg,
  isPreviewShown,
  onPrimaryButtonClick,
  onSecondaryButtonClick,
}) => {
  const {
    classes: {
      buttonContainer,
      sendButton,
      errorMessageStyles,
      updateDescriptionContainer,
      textFieldContainer,
    },
  } = useExperienceUpdatesFormStyles();
  const { translate } = useTranslation();
  const { control, formState, watch } = useFormContext<ExperienceUpdatesFormType>();
  const { errors, isDirty, isValid, isValidating, isSubmitting } = formState;
  const updateTextValue = watch('update');
  const [isButtonLoading, setIsButtonLoading] = useState<boolean>(false);

  const handlePreviewButtonClick = useCallback(async () => {
    setIsButtonLoading(true);
    await onSecondaryButtonClick();
    setIsButtonLoading(false);
  }, [onSecondaryButtonClick]);

  return (
    <>
      {!isPreviewShown && (
        <Fragment>
          <Grid item XSmall={12} XLarge={8} classes={{ root: updateDescriptionContainer }}>
            <Typography variant='body1'>{translate('Message.Update')}</Typography>
          </Grid>
          <Grid item XSmall={12} XLarge={8} XXLarge={6} classes={{ root: textFieldContainer }}>
            <Controller
              name='update'
              control={control}
              rules={ExperienceUpdatesFormTextRule}
              render={({ field }) => (
                <TextField
                  {...field}
                  error={!!errors.update}
                  fullWidth
                  multiline
                  required
                  id='update'
                  label={translate('Label.Update')}
                  helperText={
                    errors.update && errors.update.message
                      ? translate(errors.update.message)
                      : translate('Message.CharacterLimit', {
                          limit: '60',
                        })
                  }
                />
              )}
            />
          </Grid>
        </Fragment>
      )}
      {isPreviewShown && (
        <Grid container item XSmall={12} XLarge={8}>
          <ExperienceUpdatesPreview experienceName={experienceName} updateText={updateTextValue} />
        </Grid>
      )}
      <Grid item XSmall={12}>
        <Divider />
      </Grid>
      <Grid container item XSmall={12} className={buttonContainer}>
        <Button
          data-testid='secondary-button'
          variant='outlined'
          color='primary'
          size='large'
          onClick={handlePreviewButtonClick}
          disabled={!isPreviewShown && (!isDirty || (!isValidating && !isValid) || isSubmitting)}
          loading={isButtonLoading}>
          {isPreviewShown ? translate('Action.Back') : translate('Action.Preview')}
        </Button>
        <Button
          data-testid='send-button'
          className={sendButton}
          variant='contained'
          size='large'
          disabled={!isDirty || (!isValidating && !isValid) || isSubmitting}
          onClick={onPrimaryButtonClick}>
          {translate('Action.Send')}
        </Button>
        {errorMsg && <FormHelperText className={errorMessageStyles}>{errorMsg}</FormHelperText>}
      </Grid>
    </>
  );
};

export default ExperienceUpdatesForm;
