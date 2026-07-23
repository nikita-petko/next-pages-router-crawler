import { useCallback, useState } from 'react';
import type { SubmitHandler } from 'react-hook-form';
import { useForm, FormProvider, useFormContext } from 'react-hook-form';
import { Button, Divider } from '@rbx/foundation-ui';
import { Locale, useLocalization, useTranslation } from '@rbx/intl';
import { dashboard } from '@modules/miscellaneous/urls/creatorHub';
import { ButtonLink } from '@modules/monetization-shared/button-link';
import { toast } from '@modules/monetization-shared/snackbar/actions';
import { parseGamePassErrorCode } from '@modules/passes/queries/errors';
import {
  useUpdateGamePass,
  type UpdateGamePassRequest,
} from '@modules/passes/queries/useUpdateGamePass';
import { DescriptionTextArea, NameTextInput } from '../form-shared/GamePassFields';
import { PassImageUploader } from '../form-shared/PassImageUploader';
import type { ConfigurePassMetadataFormValues } from '../form-shared/types';

type FormProps = {
  universeId: number;
  passId: number;
  imageAssetId: number;
  lastUpdated: Date;
  shopId?: number;
};

type ContainerProps = {
  name: string;
  description: string;
} & FormProps;

const getPassesUrl = dashboard.getMonetizationPassesUrl;

function ConfigurePassForm({ universeId, passId, imageAssetId, lastUpdated, shopId }: FormProps) {
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

  const { mutateAsync: updatePass, isPending: isUpdateGamePassPending } = useUpdateGamePass({
    universeId,
    gamePassId: passId,
    shopId,
  });

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

        toast({ title: translate('Message.PassConfigureSuccess') });
        reset(data);
      } catch (e) {
        const errorKey = await parseGamePassErrorCode(e);
        setErrorMessage(translate(errorKey ?? 'Error.PassConfigureGeneralError'));
      }
    },
    [getFieldState, updatePass, reset, getValues, translate],
  );

  const passesLink = getPassesUrl(universeId);
  const isAllPending = isSubmitting || isUpdateGamePassPending;

  return (
    <form className='flex flex-col margin-bottom-medium' onSubmit={handleSubmit(handleSaveChanges)}>
      <div className='flex flex-col margin-bottom-medium'>
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
        className='margin-bottom-large'
      />

      <NameTextInput
        control={control}
        label={translate('Label.Name')}
        className='margin-bottom-medium'
      />

      <DescriptionTextArea
        control={control}
        label={translate('Label.Description')}
        className='margin-bottom-large'
      />

      <Divider className='margin-bottom-medium' />

      <div className='flex flex-col-reverse gap-medium padding-top-small medium:flex-row'>
        <ButtonLink
          variant='Standard'
          size='Large'
          className='padding-x-xlarge'
          href={passesLink}
          isDisabled={isSubmitting}>
          {translate('Action.Cancel')}
        </ButtonLink>
        <Button
          type='submit'
          variant='Emphasis'
          size='Large'
          className='padding-x-xlarge'
          isDisabled={!isDirty || !isValid || isAllPending}
          isLoading={isAllPending}>
          {translate('Action.ConfigurePass')}
        </Button>
      </div>

      {errorMessage && (
        <span
          aria-live='assertive'
          className='text-caption-medium content-system-alert padding-x-small'>
          {errorMessage}
        </span>
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
      categoryName: null,
    },
  });

  return (
    <FormProvider {...methods}>
      <ConfigurePassForm {...props} />
    </FormProvider>
  );
}

export default ConfigurePassFormContainer;
