import { useTranslation } from '@rbx/intl';
import { Grid, Typography, IconButton, EditOutlinedIcon, InputLabel } from '@rbx/ui';
import { FormInput } from '@modules/miscellaneous/components';
import { maxDescriptionLength, descriptionNumRows } from '../../constants/openCloudConstants';
import type InputEditProps from '../../interfaces/InputEditProps';
import useApiKeyInputStyes from './ApiKeyInput.styles';

interface ApiKeyDescriptionInputProps {
  onChange?: (value: string) => void; // forward input change string
  editProps?: Partial<InputEditProps>; // optional additional props for edit
  initialInputValue?: string; // initial input value, or value displayed next to edit icon
}

// Component has stylistic differences at the Grid level depending on whether it is in edit mode or create mode
const ApiKeyDescriptionInput = ({
  onChange,
  editProps,
  initialInputValue,
}: ApiKeyDescriptionInputProps) => {
  const {
    classes: { inputBlock, subLabel, inputWordWrap },
  } = useApiKeyInputStyes();
  const { translate } = useTranslation();

  // if editProps are given, we are using this in edit mode
  const isEditMode = !!editProps;

  return (
    <Grid
      container={!isEditMode}
      justifyContent={isEditMode ? undefined : 'space-between'}
      className={inputBlock}>
      <Grid item XSmall={!isEditMode && 12} Medium={!isEditMode && 7}>
        <InputLabel htmlFor='api-key-description'>
          <Typography color='primary' variant='h6'>
            {translate('Heading.Description')}
            {editProps?.isInputInactive && (
              <IconButton aria-label='edit' onClick={editProps?.onClickEdit} size='large'>
                <EditOutlinedIcon color='action' />
              </IconButton>
            )}
          </Typography>
        </InputLabel>

        {!editProps?.isInputInactive && (
          <Typography className={subLabel} variant='body1' component='p' color='primary'>
            {translate('Description.APIKeyDescription')}
          </Typography>
        )}
      </Grid>
      {editProps?.isInputInactive ? (
        <Grid className={inputWordWrap} item Medium={10}>
          <Typography color='secondary'>{initialInputValue}</Typography>
        </Grid>
      ) : (
        <Grid item XSmall={12} Medium={isEditMode ? 10 : 5}>
          <FormInput
            initialInputValue={initialInputValue}
            onChange={onChange}
            placeholder={translate('Message.APIKeyDescriptionPlaceholder')}
            htmlForAttr='api-key-description'
            maxInputLength={maxDescriptionLength}
            rows={descriptionNumRows}
          />
        </Grid>
      )}
    </Grid>
  );
};

export default ApiKeyDescriptionInput;
