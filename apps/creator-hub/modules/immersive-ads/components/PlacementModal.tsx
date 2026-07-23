import React, { useState, useEffect } from 'react';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useTranslation, withTranslation } from '@rbx/intl';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  makeStyles,
} from '@rbx/ui';

interface PlacementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (inputValue: string) => void;
  title: string;
  description: string;
  initialValue?: string;
  isEdit?: boolean;
}

const MAX_CHARS = 40;

const specialCharacters = ['&', '<', '>', '"', "'"];
const specialCharactersRegex = new RegExp(`[${specialCharacters.join('')}]`);
const hasSpecialCharacters = (input: string) => specialCharactersRegex.test(input);

const PlacementModal: React.FC<PlacementModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  title,
  description,
  initialValue = '',
  isEdit = false,
}) => {
  const {
    classes: { modalContentText, helperText },
  } = makeStyles()(() => ({
    modalContentText: {
      marginTop: '10px',
      marginBottom: '20px',
    },
    helperText: {
      fontSize: '14px',
      textAlign: 'right',
      lineHeight: '140%',
      marginBottom: '-10px',
    },
  }))();
  const [inputValue, setInputValue] = useState(initialValue);
  const [hasError, setHasError] = useState(false);
  const { translate } = useTranslation();

  useEffect(() => {
    if (isOpen) {
      setInputValue(initialValue ? initialValue.slice(0, MAX_CHARS) : '');
    }
  }, [initialValue, isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleSubmit = () => {
    onSubmit(inputValue);
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;
    setInputValue(value);
    setHasError(hasSpecialCharacters(value));
  };

  const submitButtonText = isEdit ? translate('Label.Update') : translate('Label.Create');

  return (
    <Dialog open={isOpen} onClose={onClose} fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <DialogContentText className={modalContentText}>{description}</DialogContentText>
        <TextField
          autoFocus
          margin='dense'
          id='placement-name'
          label='Placement Name'
          type='text'
          fullWidth
          value={inputValue}
          onChange={handleInputChange}
          variant='outlined'
          placeholder='Placement Name'
          inputProps={{ maxLength: MAX_CHARS }}
          error={hasError}
          helperText={
            hasError
              ? `We do not allow these characters for this field: ${specialCharacters.join(' ')}`
              : `${inputValue.length}/${MAX_CHARS}`
          }
          FormHelperTextProps={{
            className: hasError ? undefined : helperText,
          }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color='secondary' size='large' variant='contained'>
          {translate('Label.Cancel')}
        </Button>
        <Button
          onClick={handleSubmit}
          color='primaryBrand'
          size='large'
          variant='contained'
          disabled={!inputValue.trim() || inputValue === initialValue || hasError}>
          {submitButtonText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default withTranslation(PlacementModal, [TranslationNamespace.ImmersiveAdsAnalytics]);
