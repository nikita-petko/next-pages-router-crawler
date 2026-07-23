import { useRef } from 'react';
import { useForm, useFieldArray, FormProvider, Controller, useFormContext } from 'react-hook-form';
import type { IPContent } from '@rbx/client-rights/v1';
import { Autocomplete, AutocompleteOption, Button, IconButton, Icon } from '@rbx/foundation-ui';
import { useTranslation, useLocalization } from '@rbx/intl';
import {
  getMaxLengthValidationRule,
  TextFieldWithEnhancedHelperTextV2,
} from '../../components/TextFieldWithEnhancedHelperTextV2';
import useCountryList from '../../rights/hooks/useCountryList';
import type { ImageAsset } from '../../utils/uploadImageAssetsIfNeeded';
import validateIpContentImage from '../common/validateIpContentImage';
import validateIpContentsCount from '../common/validateIpContentsCount';
import ImageBeforeUploadPreview from '../components/ImageBeforeUploadPreview';
import {
  MAX_IP_CONTENT_IMAGES,
  MAX_SUPPORTING_DOCUMENT_COUNT,
  MAX_SUPPORTING_DOCUMENT_SIZE_MB,
  MAX_IP_CONTENT_IMAGE_SIZE_MB,
  MAX_TRADEMARK_FIELD_LENGTH,
  MAX_FORM_WIDTH_PX,
} from '../constants';

type SupportingDocument = {
  type: 'new';
  file: File;
};

export interface TrademarkFormStore {
  image?: ImageAsset;
  trademarkName: string;
  registrationNumber: string;
  registrationCountry: string;
  documents: SupportingDocument[];
}

interface TrademarkRegistrationSectionProps {
  isSubmitting: boolean;
}

/**
 * Section to fill out trademark name, registration number, and registration country.
 */
const TrademarkRegistrationSection = ({ isSubmitting }: TrademarkRegistrationSectionProps) => {
  const { translate } = useTranslation();
  const { control, formState } = useFormContext<TrademarkFormStore>();
  const { countries, isLoading } = useCountryList();

  const hasErrors =
    formState.errors.trademarkName ??
    formState.errors.registrationNumber ??
    formState.errors.registrationCountry;

  return (
    <div data-testid='trademark-registration-container'>
      <h2 className='text-title-large content-emphasis margin-none'>
        {translate('Heading.TrademarkRegistration')}
      </h2>
      <p className='text-body-medium content-muted padding-bottom-large margin-none'>
        {translate('Description.TrademarkRegistration')}
      </p>
      {hasErrors && formState.isSubmitted && (
        <p className='text-caption-medium content-system-alert padding-bottom-xsmall margin-none'>
          {translate('Error.OneOrMoreSection')}
        </p>
      )}
      <div>
        <Controller
          name='trademarkName'
          control={control}
          rules={{
            required: translate('Label.FieldIsRequired'),
            validate: getMaxLengthValidationRule(MAX_TRADEMARK_FIELD_LENGTH, translate),
          }}
          render={({ field, fieldState }) => (
            <TextFieldWithEnhancedHelperTextV2
              {...field}
              id='trademark-name'
              className='[&_.content-system-alert]:text-caption-medium'
              aria-label={translate('Label.NameOfTrademark')}
              placeholder={translate('Label.NameOfTrademark')}
              disabled={isSubmitting}
              error={!!fieldState.error}
              helperText={fieldState.error?.message}
              maxLength={MAX_TRADEMARK_FIELD_LENGTH}
              fullWidth
              showCharacterCount
              showCharacterCountOnlyOnFocusOrError
            />
          )}
        />
      </div>
      <div className='padding-top-large'>
        <Controller
          name='registrationNumber'
          control={control}
          rules={{
            required: translate('Label.FieldIsRequired'),
            validate: getMaxLengthValidationRule(MAX_TRADEMARK_FIELD_LENGTH, translate),
          }}
          render={({ field, fieldState }) => (
            <TextFieldWithEnhancedHelperTextV2
              {...field}
              id='registration-number'
              className='[&_.content-system-alert]:text-caption-medium'
              aria-label={translate('Label.TrademarkRegistrationNumber')}
              placeholder={translate('Label.TrademarkRegistrationNumber')}
              disabled={isSubmitting}
              error={!!fieldState.error}
              helperText={fieldState.error?.message}
              maxLength={MAX_TRADEMARK_FIELD_LENGTH}
              fullWidth
              showCharacterCount
              showCharacterCountOnlyOnFocusOrError
            />
          )}
        />
      </div>
      <div className='padding-top-large'>
        <Controller
          name='registrationCountry'
          control={control}
          rules={{
            required: translate('Label.FieldIsRequired'),
          }}
          render={({ field, fieldState }) => {
            const query = field.value.trim().toLowerCase();
            const filteredCountries = query
              ? countries.filter((country) => country.toLowerCase().includes(query))
              : countries;
            return (
              <Autocomplete
                ref={field.ref}
                id='countryTextField'
                className='[&_.content-system-alert]:text-caption-medium'
                size='Medium'
                aria-label={translate('Label.TrademarkRegistrationCountry')}
                placeholder={translate('Label.TrademarkRegistrationCountry')}
                value={field.value || undefined}
                inputValue={field.value}
                onInputValueChange={field.onChange}
                onBlur={field.onBlur}
                isDisabled={isLoading || isSubmitting}
                error={fieldState.error?.message}
                emptyState={translate('Heading.NoResults')}>
                {filteredCountries.map((country) => (
                  <AutocompleteOption key={country} value={country} title={country} />
                ))}
              </Autocomplete>
            );
          }}
        />
      </div>
    </div>
  );
};

interface SupportingDocumentationSectionProps {
  isSubmitting: boolean;
}

/**
 * Section to upload trademark supporting documentation.
 */
const SupportingDocumentationSection = ({ isSubmitting }: SupportingDocumentationSectionProps) => {
  const { translate } = useTranslation();
  const { locale } = useLocalization();
  const { control, formState } = useFormContext<TrademarkFormStore>();
  const documentsInputRef = useRef<HTMLInputElement>(null);

  const documentFields = useFieldArray({
    name: 'documents',
    control,
    rules: {
      required: translate('Error.AtLeastOneDocumentRequired'),
      minLength: 1,
      maxLength: {
        value: MAX_SUPPORTING_DOCUMENT_COUNT,
        message: translate('Error.MaximumFilesTooltip'),
      },
    },
  });

  const localeDefault = locale ?? 'en-US';
  const maxSupportingDocumentSizeLocalized = new Intl.NumberFormat(localeDefault, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(MAX_SUPPORTING_DOCUMENT_SIZE_MB);
  const maxSupportingDocumentCountLocalized = new Intl.NumberFormat(localeDefault, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(MAX_SUPPORTING_DOCUMENT_COUNT);

  const documentsError = formState.errors.documents?.root?.message;
  const hasErrors = !!formState.errors.documents;

  return (
    <div data-testid='supporting-documents-container'>
      <h2 className='text-title-large content-emphasis margin-none'>
        {translate('Heading.SupportingDocumentation2')}
      </h2>
      <p className='text-body-medium content-muted padding-bottom-large margin-none'>
        {translate('Description.TrademarkSupportingDocuments')}
      </p>
      {hasErrors && formState.isSubmitted && (
        <p className='text-caption-medium content-system-alert padding-bottom-xsmall margin-none'>
          {translate('Error.OneOrMoreSection')}
        </p>
      )}
      {documentFields.fields.length > 0 && (
        <div className='flex flex-col items-center justify-between gap-small'>
          {documentFields.fields.map((document, index) => (
            <Controller
              key={document.id}
              name={`documents.${index}.file`}
              control={control}
              rules={{
                validate: (value) => {
                  if (value.size > MAX_SUPPORTING_DOCUMENT_SIZE_MB * 1024 * 1024) {
                    return translate('Error.FileExceedsMaxSize', {
                      maxSize: maxSupportingDocumentSizeLocalized,
                    });
                  }
                  return true;
                },
              }}
              render={({ fieldState }) => (
                <div className='width-full'>
                  <div className='flex flex-row items-center justify-between gap-small width-full padding-y-small clip'>
                    <div className='flex flex-row items-center justify-start gap-large grow-1 shrink-1 clip'>
                      <Icon name='icon-regular-file-box' size='Medium' />
                      <p className='text-body-medium content-muted margin-none text-truncate-end text-no-wrap'>
                        {document.file.name}
                      </p>
                    </div>
                    <IconButton
                      variant='Utility'
                      size='Medium'
                      icon='icon-regular-trash-can'
                      ariaLabel={translate('Action.Delete')}
                      isDisabled={isSubmitting}
                      onClick={() => documentFields.remove(index)}
                    />
                  </div>
                  {fieldState.error && (
                    <p
                      id='document-errors'
                      className='text-caption-medium content-system-alert margin-none padding-top-xsmall'>
                      {fieldState.error.message}
                    </p>
                  )}
                </div>
              )}
            />
          ))}
        </div>
      )}
      <div
        className={documentFields.fields.length > 0 ? 'padding-top-large' : 'padding-top-xsmall'}>
        <Button
          type='button'
          variant='Standard'
          size='Medium'
          isDisabled={isSubmitting || documentFields.fields.length >= MAX_SUPPORTING_DOCUMENT_COUNT}
          onClick={() => documentsInputRef.current?.click()}>
          {translate('Action.Upload2')}
        </Button>
        <input
          ref={documentsInputRef}
          type='file'
          hidden
          multiple
          accept='application/pdf'
          aria-label={translate('Action.Upload2')}
          disabled={isSubmitting}
          aria-describedby='document-errors'
          onChange={(event) => {
            if (event.target.files) {
              Array.from(event.target.files).forEach((file) => {
                documentFields.append({ type: 'new', file });
              });
              // reset the file input to handle. Otherwise, the onChange event won't be triggered again
              const inputEl = event.target;
              inputEl.value = '';
            }
          }}
        />
      </div>
      <p className='text-caption-medium content-muted margin-none padding-top-xsmall'>
        {translate('Label.SupportingDocumentationFileRestrictions', {
          maxFileCount: maxSupportingDocumentCountLocalized,
          maxFileSize: maxSupportingDocumentSizeLocalized,
        })}
      </p>
      {documentsError && (
        <p id='document-errors' className='text-caption-medium content-system-alert margin-none'>
          {documentsError}
        </p>
      )}
    </div>
  );
};

interface TrademarkContentSectionProps {
  isSubmitting: boolean;
  relevantImagesCount: number;
  existingIpContents: IPContent[];
}

/**
 * Section to upload an optional trademark image.
 */
const TrademarkContentSection = ({
  isSubmitting,
  relevantImagesCount,
  existingIpContents,
}: TrademarkContentSectionProps) => {
  const { translate } = useTranslation();
  const { locale } = useLocalization();
  const { control } = useFormContext<TrademarkFormStore>();
  const imageInputRef = useRef<HTMLInputElement>(null);

  const localeDefault = locale ?? 'en-US';
  const maxIpContentImageSizeMBLocalized = new Intl.NumberFormat(localeDefault, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(MAX_IP_CONTENT_IMAGE_SIZE_MB);
  const maxImagesLocalized = new Intl.NumberFormat(localeDefault, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(MAX_IP_CONTENT_IMAGES);

  return (
    <div data-testid='trademark-content-container'>
      <h2 className='text-title-large content-emphasis margin-none'>
        {translate('Heading.OptionalTrademarkImageUpload')}
      </h2>
      <p className='text-body-medium content-muted padding-bottom-large margin-none'>
        {translate('Description.OptionalTrademarkImageUpload')}
      </p>
      <Controller
        name='image'
        control={control}
        rules={{
          validate: async (value) => {
            if (!value || value.type !== 'new') {
              return true;
            }
            const countValidationMessage = validateIpContentsCount(
              existingIpContents,
              { images: 1 },
              translate,
              localeDefault,
            );
            if (countValidationMessage) {
              return countValidationMessage;
            }
            const validationMessage = await validateIpContentImage(
              value.file,
              translate,
              localeDefault,
            );
            return validationMessage ?? true;
          },
        }}
        render={({ field, fieldState }) => (
          <>
            <Button
              type='button'
              variant='Standard'
              size='Medium'
              isDisabled={
                !!field.value || isSubmitting || relevantImagesCount >= MAX_IP_CONTENT_IMAGES
              }
              onClick={() => imageInputRef.current?.click()}>
              {translate('Action.Upload2')}
            </Button>
            <input
              ref={imageInputRef}
              type='file'
              hidden
              accept='image/png, image/jpeg'
              aria-label={translate('Label.UploadImage')}
              aria-describedby='image-errors'
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) {
                  field.onChange({ type: 'new', file });
                }
                // reset the file input so selecting the same file re-triggers onChange
                const inputEl = event.target;
                inputEl.value = '';
              }}
            />
            <p className='text-caption-medium content-muted margin-none padding-top-xsmall'>
              {translate('Label.IpContentImageRestrictions2', {
                maxSize: maxIpContentImageSizeMBLocalized,
              })}
            </p>
            {relevantImagesCount >= MAX_IP_CONTENT_IMAGES && !fieldState.error && (
              <p className='text-caption-medium content-system-alert padding-bottom-small'>
                {translate('Error.UploadMediaDisabled', { maxLimit: maxImagesLocalized })}
              </p>
            )}
            {field.value?.type === 'new' && (
              <div className='flex items-center gap-small padding-top-xsmall'>
                <div className='width-fit shrink-0 padding-y-large [&_img]:block [&_img]:max-width-[136px] [&_img]:max-height-[68px] [&_img]:radius-small [&_img]:[object-fit:contain]'>
                  <ImageBeforeUploadPreview file={field.value.file} />
                </div>
                <IconButton
                  variant='Utility'
                  size='Medium'
                  icon='icon-regular-trash-can'
                  ariaLabel={translate('Action.Delete')}
                  isDisabled={isSubmitting}
                  onClick={() => field.onChange(undefined)}
                />
              </div>
            )}
            {fieldState.error && (
              <p
                id='image-errors'
                className='text-caption-medium content-system-alert margin-none padding-top-xsmall text-wrap width-full'>
                {fieldState.error.message}
              </p>
            )}
          </>
        )}
      />
    </div>
  );
};

export interface TrademarkCreateFormProps {
  existingIpContents: IPContent[];
  relevantImagesCount: number;
  isSubmitting: boolean;
  onSubmit: (data: TrademarkFormStore) => void;
  onClickBack: () => void;
}

/**
 * Page to create new Trademark IP Content.
 */
const TrademarkCreateForm = ({
  existingIpContents,
  relevantImagesCount,
  isSubmitting,
  onSubmit,
  onClickBack,
}: TrademarkCreateFormProps) => {
  const { translate } = useTranslation();
  const formMethods = useForm<TrademarkFormStore>({
    defaultValues: {
      image: undefined,
      trademarkName: '',
      registrationNumber: '',
      registrationCountry: '',
      documents: [],
    },
    mode: 'onSubmit',
    reValidateMode: 'onBlur',
  });

  const {
    handleSubmit,
    formState: { isDirty },
  } = formMethods;

  return (
    <FormProvider {...formMethods}>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className='flex flex-col padding-right-xxlarge gap-xxlarge'
        style={{ maxWidth: MAX_FORM_WIDTH_PX }}>
        <div>
          <h1 className='text-heading-large content-emphasis padding-top-xxlarge margin-none'>
            {translate('Heading.AddTrademark')}
          </h1>
          <p className='text-body-large content-muted padding-top-small margin-none'>
            {translate('Description.AddTrademarks')}
          </p>
        </div>
        <TrademarkRegistrationSection isSubmitting={isSubmitting} />
        <TrademarkContentSection
          isSubmitting={isSubmitting}
          relevantImagesCount={relevantImagesCount}
          existingIpContents={existingIpContents}
        />
        <SupportingDocumentationSection isSubmitting={isSubmitting} />
        <div className='padding-top-xxlarge'>
          <div className='flex flex-row gap-small'>
            <Button
              type='button'
              variant='Standard'
              size='Medium'
              isDisabled={isSubmitting}
              onClick={onClickBack}>
              {translate('Label.Back')}
            </Button>
            {/* TODO: [CDS-1454] only enable this once all required fields are set, not merely when the form isDirty (williamwu) */}
            <Button
              variant='Emphasis'
              size='Medium'
              type='submit'
              isDisabled={isSubmitting || !isDirty}
              isLoading={isSubmitting}>
              {translate('Action.Submit')}
            </Button>
          </div>
        </div>
      </form>
    </FormProvider>
  );
};

export default TrademarkCreateForm;
