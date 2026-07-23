import { useFormContext, Controller } from 'react-hook-form';
import { useTranslation, withTranslation } from '@rbx/intl';
import { TextField } from '@rbx/ui';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import type { InputFormData } from '../../../types';

type AccountEntityNameInputProps = {
  helperText?: string;
};

const AccountEntityNameInput = ({ helperText }: AccountEntityNameInputProps) => {
  const { control, formState } = useFormContext<InputFormData>();
  const { translate } = useTranslation();

  return (
    <Controller
      name='accountInfo.entityName'
      control={control}
      defaultValue=''
      rules={{
        required: translate('Message.Account.EntityNameRequired'),
        validate: {
          maxLength: (input: string) => {
            const length = input?.length ?? 0;
            return (length >= 3 && length <= 100) || translate('Message.Account.EntityNameLength');
          },
        },
      }}
      render={({ field }) => (
        <TextField
          {...field}
          fullWidth
          required
          id='accountInfo.entityName'
          label={translate('Label.Account.EntityName')}
          error={!!formState.errors.accountInfo?.entityName}
          helperText={formState.errors.accountInfo?.entityName?.message ?? helperText}
        />
      )}
    />
  );
};

export default withTranslation(AccountEntityNameInput, [TranslationNamespace.CreatorAccount]);
