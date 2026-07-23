import React, { Fragment, FunctionComponent, useEffect, useRef, useState } from 'react';
import {
  Button,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  makeStyles,
  TextField,
  Typography,
} from '@rbx/ui';
import { useTranslation, withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { Controller, useForm } from 'react-hook-form';
import { FormMode } from '@modules/miscellaneous/common';

export interface CommerceImportCatalogModalProps {
  onCancel: () => void;
  onComplete: (merchantItemIds: string[]) => void;
  isLoading: boolean;
  translationKeys: {
    modalTitle: string;
    modalDescription: string;
    productIdsLabel: string;
    productIdsHelperText: string;
    productIdsErrorText: string;
  };
  validateMerchantItemId?: ((merchantItemId: string) => boolean) | undefined;
  autoFocusDelay?: number;
}

interface InputFormData {
  input: string;
}

const useStyles = makeStyles()((theme) => {
  return {
    form: {
      marginTop: theme.spacing(4),
      marginBottom: theme.spacing(-1),
    },
  };
});

const FORM_ID = 'import-products';

const CommerceImportCatalogModal: FunctionComponent<CommerceImportCatalogModalProps> = ({
  onCancel,
  onComplete,
  isLoading,
  translationKeys,
  validateMerchantItemId,
  autoFocusDelay = 100,
}) => {
  const { translate } = useTranslation();
  const { classes } = useStyles();
  const { control, handleSubmit, watch } = useForm<InputFormData>({
    mode: FormMode.OnTouched,
    reValidateMode: FormMode.OnChange,
    shouldUnregister: true,
  });
  const [hasValidationError, setHasValidationError] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const input = watch('input');

  // Autofocus on input element after delay (to reduce animation jitter / overlap with modal opening)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, autoFocusDelay);
    return () => clearTimeout(timer); // eslint-disable-next-line react-hooks/exhaustive-deps -- only want to run on mount
  }, []);

  return (
    <Fragment>
      <DialogTitle>{translate(translationKeys.modalTitle)}</DialogTitle>
      <DialogContent>
        <DialogContentText>
          <Typography variant='body1' color='primary'>
            {translate(translationKeys.modalDescription)}
          </Typography>
        </DialogContentText>
        <form
          id={FORM_ID}
          className={classes.form}
          onSubmit={handleSubmit(async (data) => {
            const items = data.input.split(/[,\s]+/).filter(Boolean);
            onComplete(items);
          })}>
          <Controller
            name='input'
            control={control}
            rules={{
              validate: (value) => {
                const merchantItemIds =
                  value
                    ?.split(/[,\s]+/)
                    .map((id) => id.trim())
                    .filter(Boolean) ?? [];
                const isValid = !merchantItemIds.some(
                  (itemId) => !validateMerchantItemId?.(itemId),
                );
                setHasValidationError(!isValid);
                return isValid || translate(translationKeys.productIdsErrorText);
              },
            }}
            render={({ field, fieldState: { error } }) => (
              <TextField
                {...field}
                id='productIds'
                inputRef={inputRef}
                autoComplete='off'
                autoCorrect='off'
                autoCapitalize='none'
                spellCheck={false}
                multiline
                rows={14}
                fullWidth
                label={translate(translationKeys.productIdsLabel)}
                helperText={error?.message || translate(translationKeys.productIdsHelperText)}
                error={!!error}
              />
            )}
          />
        </form>
      </DialogContent>
      <DialogActions>
        <Button variant='contained' color='secondary' onClick={onCancel} size='large'>
          {translate('Action.Cancel')}
        </Button>
        <Button
          variant='contained'
          color='primaryBrand'
          size='large'
          disabled={!input || hasValidationError}
          loading={isLoading}
          form={FORM_ID}
          type='submit'>
          {translate('Action.Import')}
        </Button>
      </DialogActions>
    </Fragment>
  );
};

export default withTranslation(CommerceImportCatalogModal, [TranslationNamespace.Commerce]);
