import { useCallback, useState } from 'react';
import { useForm, FormProvider, SubmitHandler, useFormContext } from 'react-hook-form';
import NextLink from 'next/link';
import { Divider } from '@rbx/foundation-ui';
import { Button, FormHelperText, useSnackbar } from '@rbx/ui';
import { Locale, useLocalization, useTranslation } from '@rbx/intl';
import { dashboard } from '@modules/miscellaneous/common/urls/creatorHub';
import {
  useUpdateGamePass,
  type UpdateGamePassRequest,
} from '@modules/passes/queries/useUpdateGamePass';
import { ConfigurePassMetadataFormValues } from '../form-shared/types';
import { PassImageUploader } from '../form-shared/PassImageUploader';
import { DescriptionTextField, NameTextField } from '../form-shared/GamePassFields';

type FormProps = {
  universeId: number;
  passId: number;
  imageAssetId: number;
  lastUpdated: Date;
};

type ContainerProps = {
  name: string;
  description: string;
} & FormProps;

const getPassesUrl = dashboard.getMonetizationPassesUrl;

function ConfigurePassForm({ universeId, passId, imageAssetId, lastUpdated }: FormProps) {
  const { translate } = useTranslation();

  const {
    control,
    setValue,
    formState: { isSubmitting, isValid, isDirty },
    getValues,
    getFieldState,
    reset,
    handleSubmit,
  } = useFormContext<ConfigurePassMetadataFormValues>();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const locale = useLocalization().locale ?? Locale.English;

  const handleFileChange = useCallback(
    (file: File | null) => {
      setValue('file', file, { shouldValidate: true, shouldDirty: true });
    },
    [setValue],
  );

  const { enqueue } = useSnackbar();
  const showSuccessToast = useCallback(() => {
    enqueue(
      { message: translate('Message.PassConfigureSuccess'), autoHide: true },
      (reason) => reason === 'timeout',
    );
  }, [enqueue, translate]);

  const { mutateAsync: updatePass, isPending: isUpdateGamePassPending } = useUpdateGamePass(
    { universeId, gamePassId: passId },
    { onSuccess: showSuccessToast },
  );

  const handleSaveChanges: SubmitHandler<ConfigurePassMetadataFormValues> = useCallback(
    async (data) => {
      setErrorMessage('');
      const request: UpdateGamePassRequest = {};

      try {
        // Get dirty state to only include changed fields
        if (getFieldState('name').isDirty) {
          request.name = getValues('name');
        }
        if (getFieldState('description').isDirty) {
          request.description = getValues('description');
        }
        if (getFieldState('file').isDirty) {
          request.file = getValues('file') ?? undefined;
        }

        await updatePass(request);

        reset(data);
      } catch {
        setErrorMessage(translate('Error.PassConfigureGeneralError'));
      }
    },
    [getFieldState, updatePass, reset, getValues, translate],
  );

  const passesLink = getPassesUrl(universeId);

  return (
    <form className='flex flex-col' onSubmit={handleSubmit(handleSaveChanges)}>
      <div className='flex flex-col margin-bottom-large'>
        <span className='text-body-large'>
          {translate('Message.LastUpdated', {
            localizedDateTime: lastUpdated.toLocaleString(locale),
          })}
        </span>
      </div>

      <PassImageUploader
        control={control}
        onChange={handleFileChange}
        imageAssetId={imageAssetId}
        className='margin-bottom-[40px]'
      />

      <NameTextField
        control={control}
        label={translate('Label.Name')}
        className='margin-bottom-[32px]'
      />

      <DescriptionTextField
        control={control}
        label={translate('Label.Description')}
        className='margin-bottom-[56px]'
      />

      <Divider className='margin-bottom-medium' />

      <div className='flex flex-col-reverse gap-medium padding-y-small medium:flex-row'>
        <Button
          variant='outlined'
          color='primary'
          size='large'
          component={NextLink}
          href={passesLink}
          disabled={isSubmitting}>
          {translate('Action.Cancel')}
        </Button>
        <Button
          type='submit'
          variant='contained'
          size='large'
          disabled={!isDirty || !isValid || isUpdateGamePassPending}
          loading={isSubmitting || isUpdateGamePassPending}>
          {translate('Action.ConfigurePass')}
        </Button>
      </div>

      {errorMessage && (
        <FormHelperText error className='text-caption-medium content-system-alert padding-x-small'>
          {errorMessage}
        </FormHelperText>
      )}
    </form>
  );
}

function ConfigurePassFormContainer(props: ContainerProps) {
  const { name, description } = props;
  const methods = useForm<ConfigurePassMetadataFormValues>({
    mode: 'onChange',
    defaultValues: {
      name: name ?? '',
      description: description ?? '',
      file: null,
    },
  });

  return (
    <FormProvider {...methods}>
      <ConfigurePassForm {...props} />
    </FormProvider>
  );
}

export default ConfigurePassFormContainer;
