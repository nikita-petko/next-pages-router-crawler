import { useCallback, useState } from 'react';
import { useRouter } from 'next/router';
import type { SubmitHandler } from 'react-hook-form';
import { useForm, useFormContext, FormProvider } from 'react-hook-form';
import type { Category } from '@rbx/client-shops-api/v1';
import { Button, Divider, Icon } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { Alert, AlertTitle } from '@rbx/ui';
import PriceCheckProductCreationWarning from '@modules/dynamic-price-check/components/PriceCheckProductCreationWarning';
import { docs, dashboard } from '@modules/miscellaneous/urls/creatorHub';
import { ButtonLink } from '@modules/monetization-shared/button-link';
import { Link } from '@modules/monetization-shared/link';
import { toast } from '@modules/monetization-shared/snackbar/actions';
import { parseGamePassErrorCode } from '@modules/passes/queries/errors';
import { useCreateGamePass } from '@modules/passes/queries/useCreateGamePass';
import { useBatchUpdateShopItems } from '@modules/shops/queries/useBatchUpdateShopItems';
import {
  buildNewItemCategoryEdits,
  resolveCategorySelection,
} from '@modules/shops/utils/categorySelection';
import {
  DescriptionTextArea,
  NameTextInput,
  ShopCategoryComboboxField,
} from '../form-shared/GamePassFields';
import { PassImageUploader } from '../form-shared/PassImageUploader';
import type { ConfigurePassMetadataFormValues } from '../form-shared/types';

type Props = {
  universeId: number;
  defaultIconId?: number;
  shopId?: number;
  availableCategories?: readonly Category[];
};

const getPassesUrl = dashboard.getMonetizationPassesUrl;
const getPassesDocsUrl = docs.getPassesMonetizationUrl;

const EMPTY_CATEGORIES: readonly Category[] = [];

function CreatePassForm({
  universeId,
  defaultIconId,
  shopId,
  availableCategories = EMPTY_CATEGORIES,
}: Props) {
  const { translate, translateHTML } = useTranslation();

  const router = useRouter();

  const {
    control,
    setValue,
    formState: { isSubmitting, isValid },
    getFieldState,
    handleSubmit,
  } = useFormContext<ConfigurePassMetadataFormValues>();

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { mutateAsync: batchUpdateShopItems } = useBatchUpdateShopItems();

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

  const { mutateAsync: createGamePass, isPending: isCreateGamePassPending } = useCreateGamePass({
    universeId,
    shopId,
  });

  const handleCreatePass: SubmitHandler<ConfigurePassMetadataFormValues> = useCallback(
    async (data) => {
      try {
        setErrorMessage('');
        const created = await createGamePass({
          name: data.name,
          description: data.description,
          imageFile: data.file,
        });

        // TODO: the product already exists, so a failure here must not block navigation or
        // the success toast. Decide how to handle a failure here (let user know and they
        // can make change on shops page)
        if (shopId !== undefined) {
          const selection = resolveCategorySelection(data.categoryName ?? '', availableCategories);
          if (selection) {
            try {
              await batchUpdateShopItems({
                shopId,
                ...buildNewItemCategoryEdits(
                  { type: 'GamePass', id: created.gamePassId.toString() },
                  selection,
                ),
              });
            } catch {
              // Best-effort; pass creation already succeeded.
            }
          }
        }

        toast({ title: translate('Message.PassCreationSuccess') });
        await router.push(passesLink);
      } catch (e) {
        const errorKey = await parseGamePassErrorCode(e);
        setErrorMessage(translate(errorKey ?? 'Error.PassCreationGeneralError'));
      }
    },
    [
      createGamePass,
      router,
      passesLink,
      translate,
      shopId,
      availableCategories,
      batchUpdateShopItems,
    ],
  );

  // Category field only renders when a shop id is available (feature enabled).
  // All combobox logic lives in `ShopCategoryComboboxField`.
  const showCategoryField = shopId !== undefined;
  const isAllPending = isSubmitting || isCreateGamePassPending;

  return (
    <form className='flex flex-col margin-bottom-medium' onSubmit={handleSubmit(handleCreatePass)}>
      <div className='flex flex-col margin-bottom-medium'>
        <span className='text-body-large'>
          {/* TODO(jeminpark): combine into one string and move to page title format */}
          {translateHTML('Message.CreatePassInfoWithIcon', null, {
            robuxIcon: <Icon name='icon-filled-robux' className='text-align-y-bottom' />,
          })}

          <Link href={getPassesDocsUrl()} target='_blank' className='padding-left-xsmall'>
            {translate('Label.LearnMore')}
          </Link>
        </span>

        <PriceCheckProductCreationWarning className='margin-top-medium' />
      </div>

      <Alert severity='info' variant='outlined' className='margin-bottom-medium width-full'>
        <AlertTitle>{translate('Heading.OptionalImage')}</AlertTitle>
        {translate('Label.ImageUploadDescription')}
      </Alert>

      <PassImageUploader
        control={control}
        onChange={handleFileChange}
        imageAssetId={defaultIconId}
        changeLabel={translate('Label.Change')}
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
        className={showCategoryField ? 'margin-bottom-medium' : 'margin-bottom-large'}
      />

      {showCategoryField && (
        <div className='margin-bottom-large'>
          <ShopCategoryComboboxField control={control} availableCategories={availableCategories} />
        </div>
      )}

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
          isDisabled={!isValid || isAllPending}
          isLoading={isAllPending}>
          {translate('Action.CreatePass')}
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

function CreatePassFormContainer(props: Props) {
  const methods = useForm<ConfigurePassMetadataFormValues>({
    mode: 'onChange',
    defaultValues: {
      name: '',
      description: '',
      file: null,
      categoryName: null,
    },
  });

  return (
    <FormProvider {...methods}>
      <CreatePassForm {...props} />
    </FormProvider>
  );
}

export default CreatePassFormContainer;
