import { useCallback, useState } from 'react';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import { useForm, useFormContext, FormProvider, SubmitHandler } from 'react-hook-form';
import { Icon, Divider } from '@rbx/foundation-ui';
import { Alert, AlertTitle, Button, useSnackbar, FormHelperText } from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
import { docs, dashboard } from '@modules/miscellaneous/common/urls/creatorHub';
import PriceCheckProductCreationWarning from '@modules/dynamic-price-check/components/PriceCheckProductCreationWarning';
import { useCreateGamePass } from '@modules/passes/queries/useCreateGamePass';
import { ConfigurePassMetadataFormValues } from '../form-shared/types';
import { NameTextField, DescriptionTextField } from '../form-shared/GamePassFields';
import { PassImageUploader } from '../form-shared/PassImageUploader';

type Props = {
  universeId: number;
  defaultIconId?: number;
};

const getPassesUrl = dashboard.getMonetizationPassesUrl;
const getPassesDocsUrl = docs.getPassesMonetizationUrl;

function CreatePassForm({ universeId, defaultIconId }: Props) {
  const { translate, translateHTML } = useTranslation();

  const router = useRouter();
  const { enqueue } = useSnackbar();

  const {
    control,
    setValue,
    formState: { isSubmitting, isValid },
    getFieldState,
    handleSubmit,
  } = useFormContext<ConfigurePassMetadataFormValues>();

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFileChange = useCallback(
    (file: File | null) => {
      setValue('file', file, { shouldValidate: true });
      if (!getFieldState('name').isDirty) {
        setValue('name', file ? file.name : '', { shouldValidate: true });
      }
    },
    [setValue, getFieldState],
  );

  const passesLink = getPassesUrl(universeId);

  const showSuccessToast = useCallback(() => {
    enqueue(
      { message: translate('Message.PassCreationSuccess'), autoHide: true },
      (reason) => reason === 'timeout',
    );
  }, [enqueue, translate]);

  const { mutateAsync: createGamePass, isPending: isCreateGamePassPending } = useCreateGamePass(
    { universeId },
    { onSuccess: showSuccessToast },
  );

  const handleCreatePass: SubmitHandler<ConfigurePassMetadataFormValues> = useCallback(
    async (data) => {
      try {
        setErrorMessage('');
        await createGamePass({
          name: data.name,
          description: data.description,
          imageFile: data.file,
        });

        await router.push(passesLink);
      } catch {
        setErrorMessage(translate('Error.PassCreationGeneralError'));
      }
    },
    [createGamePass, router, passesLink, translate],
  );

  return (
    <form className='flex flex-col' onSubmit={handleSubmit(handleCreatePass)}>
      <div className='flex flex-col margin-bottom-large'>
        <span className='text-body-large'>
          {/* TODO(jeminpark): combine into one string and move to page title format */}
          {translateHTML('Message.CreatePassInfoWithIcon', null, {
            robuxIcon: <Icon name='icon-filled-robux' className='text-align-y-bottom' />,
          })}

          <NextLink
            href={getPassesDocsUrl()}
            target='_blank'
            className='padding-left-xsmall content-link no-underline hover:underline'>
            {translate('Label.LearnMore')}
          </NextLink>
        </span>

        <PriceCheckProductCreationWarning className='margin-top-medium' />
      </div>

      <Alert severity='info' variant='outlined' className='margin-bottom-[32px] width-fit'>
        <AlertTitle>{translate('Heading.OptionalImage')}</AlertTitle>
        {translate('Label.ImageUploadDescription')}
      </Alert>

      <PassImageUploader
        control={control}
        onChange={handleFileChange}
        imageAssetId={defaultIconId}
        changeLabel={translate('Label.Change')}
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
          disabled={!isValid || isCreateGamePassPending}
          loading={isSubmitting || isCreateGamePassPending}>
          {translate('Action.CreatePass')}
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

function CreatePassFormContainer(props: Props) {
  const methods = useForm<ConfigurePassMetadataFormValues>({
    mode: 'onChange',
    defaultValues: {
      name: '',
      description: '',
      file: null,
    },
  });

  return (
    <FormProvider {...methods}>
      <CreatePassForm {...props} />
    </FormProvider>
  );
}

export default CreatePassFormContainer;
