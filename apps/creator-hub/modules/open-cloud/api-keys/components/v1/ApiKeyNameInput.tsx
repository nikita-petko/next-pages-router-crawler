import { Fragment } from 'react';
import { useTranslation } from '@rbx/intl';
import { Grid, Typography, IconButton, EditOutlinedIcon } from '@rbx/ui';
import { FormInput, FormLabel } from '@modules/miscellaneous/components';
import { maxNameInputLength } from '../../constants/openCloudConstants';
import type InputEditProps from '../../interfaces/InputEditProps';
import useApiKeyInputStyes from './ApiKeyInput.styles';

interface ApiKeyNameInputProps {
  onChange?: (value: string) => void; // forward input change string
  editProps?: InputEditProps; // optional additional props for edit
  initialInputValue?: string; // initial input value, or value displayed next to edit icon
}

// Component has stylistic differences at the Grid level depending on whether it is in edit mode or create mode
const ApiKeyNameInput = ({ editProps, initialInputValue, onChange }: ApiKeyNameInputProps) => {
  const { translate } = useTranslation();
  const {
    classes: { inputBlock, subLabel, inputWordWrap },
  } = useApiKeyInputStyes();

  // if editProps are given, we are using this in edit mode
  const isEditMode = !!editProps;

  return (
    <>
      {editProps?.isInputInactive ? (
        <Grid item classes={{ root: inputWordWrap }} Medium={10}>
          <Typography variant='h2' component='h2' className={inputBlock}>
            {initialInputValue}
            <IconButton aria-label='edit' onClick={editProps?.onClickEdit} size='large'>
              <EditOutlinedIcon color='action' />
            </IconButton>
          </Typography>
        </Grid>
      ) : (
        <Grid
          item
          className={inputBlock}
          justifyContent={!isEditMode ? 'space-between' : undefined}
          container={!isEditMode}
          XSmall={isEditMode && 12}
          Medium={isEditMode && 10}>
          <Grid item XSmall={!isEditMode && 12} Medium={!isEditMode && 7}>
            <FormLabel
              isRequired
              labelName={translate('Heading.Name')}
              htmlFor='api-key-name'
              requiredText={translate('Label.Required')}
            />

            <Typography className={subLabel} variant='body1' component='p' color='primary'>
              {translate('Description.APIKeyName')}
            </Typography>
          </Grid>

          <Grid item XSmall={!isEditMode && 12} Medium={!isEditMode && 5}>
            <FormInput
              required
              onChange={onChange}
              initialInputValue={initialInputValue}
              emptyInputValueErrorMessage={translate('Message.ApiKeyNameEmptyError')}
              placeholder={translate('Message.APIKeyNamePlaceholder')}
              htmlForAttr='api-key-name'
              maxInputLength={maxNameInputLength}
            />
          </Grid>
        </Grid>
      )}
    </>
  );
};

export default ApiKeyNameInput;
