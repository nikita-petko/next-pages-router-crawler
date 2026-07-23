import { useEffect, useCallback, useState, useMemo, useRef } from 'react';
import { useForm, useFieldArray, FormProvider, Controller, useFormContext } from 'react-hook-form';
import type { IPContent } from '@rbx/client-rights/v1';
import { Button, Icon, IconButton, FeedbackBanner } from '@rbx/foundation-ui';
import { useTranslation, useLocalization } from '@rbx/intl';
import { IXPLayers } from '@modules/clients/ixpExperiments';
import { useIXPParameters } from '@modules/miscellaneous/hooks';
import {
  getMaxLengthValidationRule,
  TextFieldWithEnhancedHelperTextV2,
} from '../../components/TextFieldWithEnhancedHelperTextV2';
import type { ImageAsset } from '../../utils/uploadImageAssetsIfNeeded';
import validateIpContentImage from '../common/validateIpContentImage';
import validateIpContentsCount from '../common/validateIpContentsCount';
import AddAssetSideSheet from '../components/AddAssetSideSheet';
import AssetListItem from '../components/AssetListItem';
import ImageBeforeUploadPreview from '../components/ImageBeforeUploadPreview';
import LanguageSelectV2 from '../components/LanguageSelectV2';
import {
  MAX_IP_CONTENT_IMAGES,
  MAX_PRIMARY_KEYWORD_LENGTH,
  MAX_SECONDARY_KEYWORD_LENGTH,
  MAX_SUPPORTING_DOCUMENT_COUNT,
  MAX_SUPPORTING_DOCUMENT_SIZE_MB,
  MIN_IP_CONTENT_IMAGE_UPLOAD,
  MAX_CITATION_LENGTH,
  MAX_IP_CONTENT_IMAGE_SIZE_MB,
  MAX_FORM_WIDTH_PX,
} from '../constants';
import type { UserAsset } from '../hooks/useUserAssets';

type SupportingDocument = {
  type: 'new';
  file: File;
};

const useCitationHelperText = () => {
  const { locale } = useLocalization();
  const { translate } = useTranslation();
  const localeDefault = locale ?? 'en-US';
  const maxCitationLengthLocalized = new Intl.NumberFormat(localeDefault, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(MAX_CITATION_LENGTH);
  return translate('Label.CitationHelpText', { maxCharacterCount: maxCitationLengthLocalized });
};

export interface FormStore {
  images: { asset: ImageAsset; citation: string }[];
  assets: { assetId: number; name: string; citation: string }[];
  documents: SupportingDocument[];
  ownershipUrls: string;
  primaryKeywords: { keyword: string; language: string }[];
  primaryKeywordCitation: string;
  secondaryKeywords: { keyword: string; language: string; citation: string }[];
}

interface SupportingDocumentationSectionProps {
  isSubmitting: boolean;
  existingOwnershipUrls?: string[];
}

/**
 * Section to upload supporting documentation and ownership URLs.
 */
const SupportingDocumentationSection = ({
  isSubmitting,
  existingOwnershipUrls,
}: SupportingDocumentationSectionProps) => {
  const { translate } = useTranslation();
  const { locale } = useLocalization();
  const { control, formState } = useFormContext<FormStore>();
  const documentInputRef = useRef<HTMLInputElement>(null);

  const documentFields = useFieldArray({
    name: 'documents',
    control,
    rules: {
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

  return (
    <div data-testid='supporting-documents-container'>
      <h2 className='text-title-large content-emphasis margin-none'>
        {translate('Heading.SupportingDocumentation2')}
      </h2>
      <p className='text-body-medium content-muted padding-bottom-large margin-none'>
        {translate('Description.SupportingDocumentation2')}
      </p>
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
          onClick={() => documentInputRef.current?.click()}>
          {translate('Action.Upload2')}
        </Button>
      </div>
      <input
        ref={documentInputRef}
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
            // reset the file input
            // to handle
            // otherwise, the onChange event won't be triggered again
            const inputEl = event.target;
            inputEl.value = '';
          }
        }}
      />
      <p className='text-caption-medium content-muted margin-none padding-top-xsmall'>
        {translate('Label.SupportingDocumentationFileRestrictions', {
          maxFileCount: maxSupportingDocumentCountLocalized,
          maxFileSize: maxSupportingDocumentSizeLocalized,
        })}
      </p>
      {documentFields.fields.length > 0 && (
        <p id='document-errors' className='text-caption-medium content-system-alert margin-none'>
          {documentsError}
        </p>
      )}

      <div className='padding-top-large'>
        {existingOwnershipUrls && existingOwnershipUrls.length > 0 && (
          <div className='flex flex-col items-center justify-between padding-bottom-small padding-top-small'>
            {existingOwnershipUrls.map((url, index) => (
              <div
                // eslint-disable-next-line react/no-array-index-key -- no better key available
                key={index}
                className='flex flex-row items-center justify-between width-full gap-small'>
                <div className='flex flex-row items-center justify-start gap-large padding-y-small clip'>
                  <Icon name='icon-regular-chain-link' size='Medium' />
                  <p className='text-body-medium content-muted margin-none text-truncate-end text-no-wrap'>
                    {url}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
        <Controller
          name='ownershipUrls'
          control={control}
          render={({ field, fieldState: { error } }) => (
            <TextFieldWithEnhancedHelperTextV2
              {...field}
              id='ownership-urls'
              aria-label={translate('Label.LinksOptional')}
              placeholder={translate('Label.LinksOptional')}
              fullWidth
              multiline
              minRows={2}
              className='[&_textarea]:[field-sizing:content] [&_textarea]:[resize:none] [&_textarea]:min-height-1600 [&_.content-system-alert]:text-caption-medium'
              error={!!error}
              helperText={error?.message ?? translate('Label.NewLinkNewLine')}
              disabled={isSubmitting}
              showHelperTextOnlyOnFocusOrError
            />
          )}
        />
      </div>
    </div>
  );
};

interface PrimaryKeywordsSectionProps {
  isSubmitting: boolean;
  existingIpContents: IPContent[];
}

/**
 * Section to upload primary keyword IP contents with locale and citation.
 */
const PrimaryKeywordsSection = ({
  isSubmitting,
  existingIpContents,
}: PrimaryKeywordsSectionProps) => {
  const { translate } = useTranslation();
  const { control, formState, watch } = useFormContext<FormStore>();

  const primaryKeywordFields = useFieldArray({
    name: 'primaryKeywords',
    control,
  });

  const watchedPrimaryKeywords = watch('primaryKeywords');

  const citationHelperText = useCitationHelperText();

  // Collect all errors in this section
  const hasErrors =
    formState.errors.primaryKeywords ??
    (primaryKeywordFields.fields.length > 0 && formState.errors.primaryKeywordCitation);

  return (
    <div>
      <h2 className='text-title-large content-emphasis margin-none'>
        {translate('Heading.PrimaryKeyword')}
      </h2>
      <p className='text-body-medium content-muted padding-bottom-large margin-none'>
        {translate('Description.PrimaryKeyword')}
      </p>
      {hasErrors && formState.isSubmitted && (
        <p className='text-caption-medium content-system-alert padding-bottom-xsmall margin-none'>
          {translate('Error.OneOrMoreSection')}
        </p>
      )}
      {primaryKeywordFields.fields.length > 0 &&
        primaryKeywordFields.fields.map((primaryKeywordField, index) => (
          <div
            // eslint-disable-next-line react/no-array-index-key -- force re-renders on deletion due to Controllers not re-subscribing
            key={`${primaryKeywordField.id}-${index}`}
            className='flex flex-row items-center justify-between'>
            <div className='grid [grid-template-columns:7fr_5fr] gap-small items-start padding-bottom-small grow basis-0 min-width-0'>
              <div>
                <Controller
                  name={`primaryKeywords.${index}.keyword`}
                  control={control}
                  rules={{
                    required: translate('Label.FieldIsRequired'),
                    validate: getMaxLengthValidationRule(MAX_PRIMARY_KEYWORD_LENGTH, translate),
                  }}
                  render={({ field, fieldState }) => (
                    <TextFieldWithEnhancedHelperTextV2
                      {...field}
                      id={`primary-keyword-${index}`}
                      className='[&_.content-system-alert]:text-caption-medium'
                      aria-label={translate('Label.PrimaryKeyword')}
                      placeholder={translate('Label.PrimaryKeyword')}
                      disabled={isSubmitting}
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                      maxLength={MAX_PRIMARY_KEYWORD_LENGTH}
                      fullWidth
                      showCharacterCount
                      showCharacterCountOnlyOnFocusOrError
                    />
                  )}
                />
              </div>
              <div className='flex items-center'>
                <Controller
                  name={`primaryKeywords.${index}.language`}
                  control={control}
                  rules={{
                    required: translate('Label.FieldIsRequired'),
                    validate: (value) => {
                      // Make sure that a primary keyword does not already exist for the locale selected
                      const hasConflictingPrimary = existingIpContents.some(
                        (item) => item.isPrimary && item.locale === value,
                      );
                      if (hasConflictingPrimary) {
                        return translate('Error.PrimaryKeywordExists');
                      }

                      // Check for duplicate locales within the form's primary keywords
                      const duplicateLocaleCount = watchedPrimaryKeywords.filter(
                        (primaryKeyword) => primaryKeyword.language === value,
                      ).length;
                      if (duplicateLocaleCount > 1) {
                        return translate('Error.DuplicatePrimaryKeyword');
                      }

                      return true;
                    },
                  }}
                  render={({ field, fieldState }) => (
                    <LanguageSelectV2
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      disabled={isSubmitting}
                      placeholder={translate('Label.Locale')}
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                    />
                  )}
                />
              </div>
            </div>
            <div className='padding-xsmall'>
              <IconButton
                variant='Utility'
                size='Medium'
                icon='icon-regular-trash-can'
                ariaLabel={translate('Action.Remove')}
                isDisabled={isSubmitting}
                onClick={() => primaryKeywordFields.remove(index)}
              />
            </div>
          </div>
        ))}
      <Button
        type='button'
        variant='Standard'
        size='Medium'
        isDisabled={isSubmitting}
        onClick={() => primaryKeywordFields.append({ keyword: '', language: '' })}>
        {translate('Action.Add')}
      </Button>
      {primaryKeywordFields.fields.length > 0 && (
        <Controller
          name='primaryKeywordCitation'
          control={control}
          rules={{
            required: translate('Label.FieldIsRequired'),
            validate: getMaxLengthValidationRule(MAX_CITATION_LENGTH, translate),
          }}
          render={({ field, fieldState }) => (
            <TextFieldWithEnhancedHelperTextV2
              {...field}
              aria-label={translate('Label.Citation')}
              placeholder={translate('Label.Citation')}
              id='citation'
              maxLength={MAX_CITATION_LENGTH}
              disabled={isSubmitting}
              error={!!fieldState.error}
              className='padding-top-large [&_.content-system-alert]:text-caption-medium'
              fullWidth
              showCharacterCount
              showHelperTextOnlyOnFocusOrError
              helperText={fieldState.error?.message ?? citationHelperText}
            />
          )}
        />
      )}
    </div>
  );
};

interface SecondaryKeywordsSectionProps {
  isSubmitting: boolean;
}

/**
 * Section to upload secondary keyword IP contents with locale and citation.
 */
const SecondaryKeywordsSection = ({ isSubmitting }: SecondaryKeywordsSectionProps) => {
  const { translate } = useTranslation();
  const { control, watch, formState } = useFormContext<FormStore>();

  const secondaryKeywordFields = useFieldArray({
    name: 'secondaryKeywords',
    control,
  });
  const citationHelperText = useCitationHelperText();

  const watchedSecondaryKeywords = watch('secondaryKeywords');

  // Check if there are any errors in this section
  const hasErrors = !!formState.errors.secondaryKeywords;

  return (
    <div>
      <h2 className='text-title-large content-emphasis margin-none'>
        {translate('Heading.SecondaryKeywords')}
      </h2>
      <p className='text-body-medium content-muted padding-bottom-large margin-none'>
        {translate('Description.SecondaryKeywords')}
      </p>
      {hasErrors && formState.isSubmitted && (
        <p className='text-caption-medium content-system-alert padding-bottom-xsmall margin-none'>
          {translate('Error.OneOrMoreSection')}
        </p>
      )}
      {secondaryKeywordFields.fields.length > 0 && (
        <div className='flex flex-col gap-large padding-bottom-small'>
          {secondaryKeywordFields.fields.map((secondaryKeywordField, index) => (
            <div
              // eslint-disable-next-line react/no-array-index-key -- force re-renders on deletion due to Controllers not re-subscribing
              key={`${secondaryKeywordField.id}-${index}`}
              className='flex flex-row items-center justify-between'>
              <div className='flex flex-col gap-small grow min-width-0 basis-0 padding-bottom-small'>
                <div
                  key={secondaryKeywordField.id}
                  className='grid [grid-template-columns:7fr_5fr] gap-small items-start min-width-0'>
                  <div>
                    <Controller
                      name={`secondaryKeywords.${index}.keyword`}
                      control={control}
                      rules={{
                        required: translate('Label.FieldIsRequired'),
                        maxLength: {
                          value: MAX_SECONDARY_KEYWORD_LENGTH,
                          message: translate('Label.SecondaryKeywordMaxLength', {
                            maxLength: MAX_SECONDARY_KEYWORD_LENGTH.toString(),
                          }),
                        },
                      }}
                      render={({ field, fieldState }) => (
                        <TextFieldWithEnhancedHelperTextV2
                          {...field}
                          id={`secondary-keywords-${index}`}
                          className='[&_.content-system-alert]:text-caption-medium'
                          aria-label={translate('Label.SecondaryKeyword')}
                          placeholder={translate('Label.SecondaryKeyword')}
                          error={!!fieldState.error}
                          helperText={fieldState.error?.message}
                          fullWidth
                          disabled={isSubmitting}
                          showCharacterCount
                          maxLength={MAX_SECONDARY_KEYWORD_LENGTH}
                          showCharacterCountOnlyOnFocusOrError
                        />
                      )}
                    />
                  </div>
                  <div className='flex items-center'>
                    <Controller
                      name={`secondaryKeywords.${index}.language`}
                      control={control}
                      rules={{
                        required: translate('Label.FieldIsRequired'),
                      }}
                      render={({ field, fieldState }) => (
                        <LanguageSelectV2
                          value={field.value}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          placeholder={translate('Label.Locale')}
                          disabled={isSubmitting}
                          error={!!fieldState.error}
                          helperText={fieldState.error?.message}
                        />
                      )}
                    />
                  </div>
                </div>
                <Controller
                  name={`secondaryKeywords.${index}.citation`}
                  control={control}
                  rules={{
                    required: translate('Label.FieldIsRequired'),
                    validate: getMaxLengthValidationRule(MAX_CITATION_LENGTH, translate),
                  }}
                  render={({ field, fieldState }) => (
                    <TextFieldWithEnhancedHelperTextV2
                      {...field}
                      aria-label={translate('Label.Citation')}
                      placeholder={translate('Label.Citation')}
                      id={`secondary-keywords-${index}-citation`}
                      className='[&_.content-system-alert]:text-caption-medium'
                      maxLength={MAX_CITATION_LENGTH}
                      error={!!fieldState.error}
                      fullWidth
                      disabled={isSubmitting}
                      showCharacterCount
                      showHelperTextOnlyOnFocusOrError
                      helperText={fieldState.error?.message ?? citationHelperText}
                    />
                  )}
                />
              </div>
              <div className='padding-xsmall'>
                <IconButton
                  variant='Utility'
                  size='Medium'
                  icon='icon-regular-trash-can'
                  ariaLabel={translate('Action.Remove')}
                  isDisabled={isSubmitting}
                  onClick={() => secondaryKeywordFields.remove(index)}
                />
              </div>
            </div>
          ))}
        </div>
      )}
      <div className='flex flex-row gap-large'>
        <Button
          type='button'
          variant='Standard'
          size='Medium'
          isDisabled={isSubmitting}
          onClick={() =>
            secondaryKeywordFields.append({ keyword: '', language: '', citation: '' })
          }>
          {translate('Action.Add')}
        </Button>
        {watchedSecondaryKeywords.length > 0 && (
          <Button
            type='button'
            variant='Standard'
            size='Medium'
            isDisabled={isSubmitting}
            onClick={() =>
              secondaryKeywordFields.append(
                watchedSecondaryKeywords[watchedSecondaryKeywords.length - 1],
              )
            }>
            {translate('Action.Duplicate')}
          </Button>
        )}
      </div>
    </div>
  );
};

interface MediaSectionProps {
  isSubmitting: boolean;
  relevantImagesCount: number;
  existingIpContents: IPContent[];
}

/**
 * Section to upload image IP contents with citation.
 */
const MediaSection = ({
  isSubmitting,
  relevantImagesCount,
  existingIpContents,
}: MediaSectionProps) => {
  const { translate } = useTranslation();
  const { locale } = useLocalization();
  const { control, watch, trigger, formState } = useFormContext<FormStore>();
  const [userDismissedAlert, setUserDismissedAlert] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const imageFields = useFieldArray({
    name: 'images',
    control,
    rules: {
      validate: async (images) => {
        const countValidationMessage = validateIpContentsCount(
          existingIpContents,
          {
            images: images.length,
          },
          translate,
          locale ?? 'en-US',
        );
        if (countValidationMessage) {
          return countValidationMessage;
        }
        return true;
      },
    },
  });

  const watchedImages = watch('images');

  const localeDefault = locale ?? 'en-US';
  const remainingImagesUpload = Math.max(0, MIN_IP_CONTENT_IMAGE_UPLOAD - relevantImagesCount);
  const minImagesLocalized = new Intl.NumberFormat(localeDefault, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(remainingImagesUpload);
  const maxImagesLocalized = new Intl.NumberFormat(localeDefault, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(MAX_IP_CONTENT_IMAGES);
  const maxIpContentImageSizeMBLocalized = new Intl.NumberFormat(localeDefault, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(MAX_IP_CONTENT_IMAGE_SIZE_MB);

  const imageTotalWithUpload = watchedImages.length + relevantImagesCount;
  const hideAlert = userDismissedAlert || imageTotalWithUpload >= MIN_IP_CONTENT_IMAGE_UPLOAD;
  const canKeepUploading = imageTotalWithUpload < MAX_IP_CONTENT_IMAGES;

  const handleCloseAlert = useCallback(() => {
    setUserDismissedAlert(true);
  }, []);

  useEffect(() => {
    if (watchedImages.length > 0) {
      watchedImages.forEach((_, index) => {
        void trigger(`images.${index}.asset`);
      });
    }
  }, [watchedImages, trigger]);

  const citationHelperText = useCitationHelperText();

  const imagesError = formState.errors.images?.root?.message;

  // Check if there are any errors in this section
  const hasErrors = !!formState.errors.images;

  return (
    <div>
      <h2 className='text-title-large content-emphasis margin-none'>
        {translate('Heading.Media')}
      </h2>
      <p className='text-body-medium content-muted padding-bottom-large margin-none'>
        {translate('Description.IpFamilyAddImages')}
      </p>
      {hasErrors && formState.isSubmitted && (
        <p className='text-caption-medium content-system-alert padding-bottom-xsmall margin-none'>
          {translate('Error.OneOrMoreSection')}
        </p>
      )}
      {!hideAlert && (
        <div className='padding-bottom-large'>
          <FeedbackBanner
            title={translate('Title.RecommendedImageUpload', { minImages: minImagesLocalized })}
            severity='Info'
            variant='Standard'
            layout='Inline'
            onDismiss={handleCloseAlert}
            dismissIconAriaLabel={translate('Action.Dismiss')}
          />
        </div>
      )}
      {imageFields.fields.length > 0 && (
        <div className='flex flex-col gap-large padding-top-small'>
          {imageFields.fields.map((item, index) => (
            // eslint-disable-next-line react/no-array-index-key -- force re-renders on deletion due to Controllers not re-subscribing
            <div key={`${item.id}-${index}`} className='flex flex-col gap-small'>
              {/* Thumbnail row: preview left, trash right */}
              <div className='flex items-start justify-between'>
                <Controller
                  name={`images.${index}.asset`}
                  control={control}
                  rules={{
                    validate: async (value) => {
                      if (value.type !== 'new') {
                        return true;
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
                    <div>
                      <div className='width-[136px] shrink-0 basis-[136px] [&_img]:block [&_img]:max-width-[136px] [&_img]:max-height-[68px] [&_img]:radius-small [&_img]:[object-fit:contain]'>
                        {field.value.type === 'new' && (
                          <ImageBeforeUploadPreview file={field.value.file} />
                        )}
                        {fieldState.error && (
                          <p className='text-caption-medium content-system-alert margin-none padding-top-xsmall text-wrap width-full'>
                            {fieldState.error.message}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                />
                <div className='padding-xsmall'>
                  <IconButton
                    variant='Utility'
                    size='Medium'
                    icon='icon-regular-trash-can'
                    ariaLabel={translate('Action.Delete')}
                    isDisabled={isSubmitting}
                    onClick={() => imageFields.remove(index)}
                  />
                </div>
              </div>
              {/* Citation below the thumbnail */}
              <Controller
                name={`images.${index}.citation`}
                control={control}
                rules={{
                  required: translate('Label.FieldIsRequired'),
                  validate: getMaxLengthValidationRule(MAX_CITATION_LENGTH, translate),
                }}
                render={({ field, fieldState }) => (
                  <TextFieldWithEnhancedHelperTextV2
                    {...field}
                    maxLength={MAX_CITATION_LENGTH}
                    aria-label={translate('Label.Citation')}
                    placeholder={translate('Label.Citation')}
                    id={`image-${index}-citation`}
                    className='[&_.content-system-alert]:text-caption-medium'
                    error={!!fieldState.error}
                    fullWidth
                    disabled={isSubmitting}
                    showHelperTextOnlyOnFocusOrError
                    showCharacterCount
                    helperText={fieldState.error?.message ?? citationHelperText}
                  />
                )}
              />
            </div>
          ))}
        </div>
      )}
      <div className='padding-top-small'>
        <Button
          type='button'
          variant='Standard'
          size='Medium'
          isDisabled={!canKeepUploading || isSubmitting}
          onClick={() => imageInputRef.current?.click()}>
          {translate('Action.Upload2')}
        </Button>
        <input
          ref={imageInputRef}
          type='file'
          hidden
          multiple
          accept='image/png, image/jpeg'
          aria-label={translate('Label.UploadImage')}
          aria-describedby='image-errors'
          onChange={async (event) => {
            if (event.target.files) {
              const files = Array.from(event.target.files);
              imageFields.append(
                files.map((file) => ({ asset: { file, type: 'new' }, citation: '' })),
              );
            }
            // reset the file input
            // to handle
            // otherwise, the onChange event won't be triggered again
            const inputEl = event.target;
            inputEl.value = '';
          }}
        />
      </div>
      <p className='text-caption-medium content-muted margin-none padding-top-xsmall'>
        {translate('Label.IpContentImageRestrictions2', {
          maxSize: maxIpContentImageSizeMBLocalized,
        })}
      </p>
      {!canKeepUploading && !imagesError && (
        <p className='text-caption-medium content-system-alert padding-bottom-small'>
          {translate('Error.UploadMediaDisabled', { maxLimit: maxImagesLocalized })}
        </p>
      )}
      {imageFields && (
        <p id='image-errors' className='text-caption-medium content-system-alert margin-none'>
          {imagesError}
        </p>
      )}
    </div>
  );
};

interface AssetsSectionProps {
  isSubmitting: boolean;
}

/**
 * Section to upload Roblox asset IP contents with citation.
 */
const AssetsSection = ({ isSubmitting }: AssetsSectionProps) => {
  const { translate } = useTranslation();
  const { control, getValues } = useFormContext<FormStore>();
  const [isAddSideSheetOpen, setIsAddSideSheetOpen] = useState(false);

  const assetFields = useFieldArray({ name: 'assets', control });

  const citationHelperText = useCitationHelperText();

  const selectedAssets = useMemo(
    () => assetFields.fields.map((f) => ({ assetId: f.assetId, name: f.name })),
    [assetFields.fields],
  );

  const handleConfirm = useCallback(
    (selected: UserAsset[]) => {
      const existingCitations = new Map(getValues('assets').map((f) => [f.assetId, f.citation]));
      assetFields.replace(
        selected.map(({ assetId, name }) => ({
          assetId,
          name,
          citation: existingCitations.get(assetId) ?? '',
        })),
      );
    },
    [assetFields, getValues],
  );

  const handleOpenSideSheet = useCallback(() => {
    setIsAddSideSheetOpen(true);
  }, []);

  const handleCloseSideSheet = useCallback(() => {
    setIsAddSideSheetOpen(false);
  }, []);

  return (
    <div>
      <h2 className='text-title-large content-emphasis margin-none'>
        {translate('Heading.RobloxAssets')}
      </h2>
      <p className='text-body-medium content-muted padding-bottom-large margin-none'>
        {translate('Description.RobloxAssets')}
      </p>
      {assetFields.fields.length > 0 && (
        <div className='flex flex-col gap-large padding-bottom-large padding-top-small'>
          {assetFields.fields.map((assetField, index) => (
            <div key={assetField.id} className='flex flex-col gap-small grow-1 shrink-1 basis-auto'>
              <AssetListItem
                asset={{ assetId: assetField.assetId, name: assetField.name }}
                variant='selected'
                onRemove={() => assetFields.remove(index)}
              />
              <Controller
                name={`assets.${index}.citation`}
                control={control}
                rules={{
                  required: translate('Label.FieldIsRequired'),
                  validate: getMaxLengthValidationRule(MAX_CITATION_LENGTH, translate),
                }}
                render={({ field, fieldState }) => (
                  <TextFieldWithEnhancedHelperTextV2
                    {...field}
                    aria-label={translate('Label.Citation')}
                    placeholder={translate('Label.Citation')}
                    id={`asset-${assetField.assetId}-citation`}
                    className='[&_.content-system-alert]:text-caption-medium'
                    maxLength={MAX_CITATION_LENGTH}
                    error={!!fieldState.error}
                    fullWidth
                    disabled={isSubmitting}
                    showHelperTextOnlyOnFocusOrError
                    showCharacterCount
                    helperText={fieldState.error?.message ?? citationHelperText}
                  />
                )}
              />
            </div>
          ))}
        </div>
      )}
      <div>
        <Button
          type='button'
          variant='Standard'
          size='Medium'
          isDisabled={isSubmitting}
          onClick={handleOpenSideSheet}>
          {translate('Action.Add')}
        </Button>
      </div>
      {isAddSideSheetOpen && (
        <AddAssetSideSheet
          onClose={handleCloseSideSheet}
          selectedAssets={selectedAssets}
          onConfirm={handleConfirm}
        />
      )}
    </div>
  );
};

export interface IpContentsCreateFormProps {
  existingOwnershipUrls?: string[];
  existingIpContents: IPContent[];
  relevantImagesCount: number;
  isSubmitting: boolean;
  onSubmit: (data: FormStore) => void;
  onClickBack: () => void;
}

/**
 * Page to create new copyright IP contents.
 */
const IpContentsCreateForm = ({
  existingOwnershipUrls,
  existingIpContents,
  relevantImagesCount,
  isSubmitting,
  onSubmit,
  onClickBack,
}: IpContentsCreateFormProps) => {
  const { translate } = useTranslation();
  const formMethods = useForm<FormStore>({
    defaultValues: {
      images: [],
      assets: [],
      documents: [],
      ownershipUrls: '',
      primaryKeywords: [],
      primaryKeywordCitation: '',
      secondaryKeywords: [],
    },
    mode: 'onSubmit',
    reValidateMode: 'onBlur',
  });

  const {
    params: { enableTrademark },
  } = useIXPParameters(IXPLayers.RightsManager, {
    restoreInitialValueFromCache: true,
  });

  const {
    handleSubmit,
    formState: { isDirty },
  } = formMethods;

  return (
    <FormProvider {...formMethods}>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className='flex flex-col gap-xxlarge padding-right-xxlarge'
        style={{ maxWidth: MAX_FORM_WIDTH_PX }}>
        <div>
          <h1 className='text-heading-large content-emphasis padding-top-xxlarge margin-none'>
            {enableTrademark
              ? translate('Heading.AddCopyrightedWorks')
              : translate('Heading.AddIp')}
          </h1>
          <p className='text-body-large content-muted padding-top-small margin-none'>
            {translate('Description.IpFamilySubmission')}
          </p>
        </div>

        <SupportingDocumentationSection
          isSubmitting={isSubmitting}
          existingOwnershipUrls={existingOwnershipUrls}
        />

        <PrimaryKeywordsSection
          isSubmitting={isSubmitting}
          existingIpContents={existingIpContents}
        />

        <SecondaryKeywordsSection isSubmitting={isSubmitting} />

        <MediaSection
          isSubmitting={isSubmitting}
          relevantImagesCount={relevantImagesCount}
          existingIpContents={existingIpContents}
        />

        <AssetsSection isSubmitting={isSubmitting} />

        <div className='padding-top-xxlarge'>
          <div className='flex flex-row gap-small'>
            <Button
              type='button'
              variant='Standard'
              size='Medium'
              isDisabled={isSubmitting}
              onClick={onClickBack}>
              {enableTrademark ? translate('Label.Back') : translate('Action.Cancel')}
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

export default IpContentsCreateForm;
