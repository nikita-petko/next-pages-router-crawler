import { useEffect, useCallback, useState } from 'react';
import { withTranslation, useTranslation, useLocalization } from '@rbx/intl';
import { Flex } from '@modules/miscellaneous/common/components';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import {
  Grid,
  Typography,
  Button,
  IconButton,
  FileCopyOutlinedIcon,
  FormHelperText,
  makeStyles,
  CircularProgress,
  Alert,
  DeleteIcon,
  LinkIcon,
} from '@rbx/ui';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useForm, useFieldArray, FormProvider, Controller, useFormContext } from 'react-hook-form';
import { useIpLayoutContext } from '@modules/ip/IpAppNavigationLayout';
import { IPContent } from '@rbx/clients/rightsV1';
import {
  getMaxLengthValidationRule,
  TextFieldWithEnhancedHelperText,
} from '../../components/TextFieldWithEnhancedHelperText';
import { ImageAsset } from '../../utils/uploadImageAssetsIfNeeded';
import IpFamiliesBreadcrumbs from '../components/IpFamiliesBreadcrumbs';
import {
  useCreateIpContentsAndAddToIpFamily,
  useIpFamilyQuery,
  useListAllIpContentsByIpFamily,
} from '../hooks/ipFamily';
import useIpSnackbar from '../../hooks/useIpSnackbar';
import ImageBeforeUploadPreview from '../components/ImageBeforeUploadPreview';
import validateIpContentImage from '../common/validateIpContentImage';
import IpLoadError from '../../components/error/IpLoadError';
import validateIpContentsCount from '../common/validateIpContentsCount';
import { IP_FAMILY_DETAILS_HREF } from '../urls';
import {
  MAX_IP_CONTENT_IMAGES,
  MAX_PRIMARY_KEYWORD_LENGTH,
  MAX_SECONDARY_KEYWORD_LENGTH,
  MAX_SUPPORTING_DOCUMENT_COUNT,
  MAX_SUPPORTING_DOCUMENT_SIZE_MB,
  MIN_IP_CONTENT_IMAGE_UPLOAD,
  MAX_CITATION_LENGTH,
  MAX_IP_CONTENT_IMAGE_SIZE_MB,
} from '../constants';
import getApprovedPendingOrBlockedImages from '../common/getApprovedOrPendingImages';
import LanguageSelect from '../components/LanguageSelect';
import ScrollableContainer from '../../components/ScrollableContainer';

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

interface FormStore {
  images: { asset: ImageAsset; citation: string }[];
  documents: SupportingDocument[];
  ownershipUrls: string;
  primaryKeywords: { keyword: string; language: string }[];
  primaryKeywordCitation: string;
  secondaryKeywords: { keyword: string; language: string; citation: string }[];
}

const useStyles = makeStyles()(() => ({
  main: {
    paddingRight: 36,
  },
  imagePreview: {
    width: '136px',
    flexShrink: 0,
    flexBasis: '136px',
    margin: '16px 8px',
    '& img': {
      maxWidth: '136px',
      maxHeight: '68px',
      objectFit: 'contain',
      display: 'block',
      borderRadius: '4px',
    },
  },
  contentEntry: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexDirection: 'row',
  },
  deleteBtn: {
    marginLeft: 8,
  },
  semanticGapLargerBottom: {
    marginBottom: 16,
  },
  semanticGapSmallTop: {
    marginTop: 8,
  },
  semanticGapMediumTop: {
    marginTop: 16,
  },
  semanticGapSmallBottom: {
    marginBottom: 8,
  },
  localeGridItem: {
    display: 'flex',
    alignItems: 'center',
  },
  documentListContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexDirection: 'column',
    gap: '8px',
  },
  documentItemWrapper: {
    width: '100%',
  },
  documentItemContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexDirection: 'row',
    width: '100%',
    paddingTop: '8px',
    paddingBottom: '8px',
    overflow: 'hidden',
  },
  documentDeleteBtn: {
    flexShrink: 0,
    flexBasis: 'auto',
  },
  documentItemContent: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-start',
    flexDirection: 'row',
    flexShrink: 1,
    flexGrow: 1,
    overflow: 'hidden',
  },
  iconMarginRight: {
    marginRight: '16px',
  },
  textEllipsis: {
    textOverflow: 'ellipsis',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
  },
  ownershipUrlsContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexDirection: 'column',
  },
  ownershipUrlItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexDirection: 'row',
    width: '100%',
    gap: '8px',
  },
  ownershipUrlContent: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-start',
    flexDirection: 'row',
    paddingTop: '8px',
    paddingBottom: '8px',
    overflow: 'hidden',
  },
  ownershipUrlsTextField: {
    minHeight: 100,
  },
  flexColumnGapMedium: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  flexRowGapMedium: {
    display: 'flex',
    flexDirection: 'row',
    gap: '16px',
  },
  flexColumnGapSmall: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  imageItemContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexDirection: 'row',
  },
  imageErrorText: {
    textWrap: 'wrap',
    width: '100%',
  },
  imageCitation: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 'auto',
  },
  scroll: {
    maxHeight: 240,
    overflowY: 'auto',
  },
}));

interface SupportingDocumentationSectionProps {
  isSubmitting: boolean;
  existingOwnershipUrls?: string[];
}

const SupportingDocumentationSection = ({
  isSubmitting,
  existingOwnershipUrls,
}: SupportingDocumentationSectionProps) => {
  const { translate } = useTranslation();
  const { locale } = useLocalization();
  const { classes } = useStyles();
  const { control, formState } = useFormContext<FormStore>();

  const documentFields = useFieldArray({
    name: 'documents',
    control,
    rules: {
      maxLength: {
        value: 3,
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
    <Grid item data-testid='supporting-documents-container'>
      <Typography variant='h5' component='h2' gutterBottom>
        {translate('Heading.SupportingDocumentation2')}
      </Typography>
      <Typography
        variant='body1'
        component='p'
        className={`${classes.semanticGapLargerBottom}`}
        color='secondary'>
        {translate('Description.SupportingDocumentation2')}
      </Typography>
      {documentFields.fields.length > 0 && (
        <div className={`${classes.documentListContainer} ${classes.semanticGapSmallTop}`}>
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
                <div className={classes.documentItemWrapper}>
                  <div className={classes.documentItemContainer}>
                    <div className={classes.documentItemContent}>
                      <FileCopyOutlinedIcon className={classes.iconMarginRight} />
                      <Typography
                        variant='body2'
                        component='p'
                        color='secondary'
                        className={classes.textEllipsis}>
                        {document.file.name}
                      </Typography>
                    </div>
                    <IconButton
                      aria-label={translate('Action.Delete')}
                      color='secondary'
                      disabled={isSubmitting}
                      onClick={() => documentFields.remove(index)}
                      className={classes.deleteBtn}>
                      <DeleteIcon />
                    </IconButton>
                  </div>
                  {fieldState.error && (
                    <FormHelperText
                      id='document-errors'
                      error
                      className={classes.semanticGapSmallTop}>
                      {fieldState.error.message}
                    </FormHelperText>
                  )}
                </div>
              )}
            />
          ))}
        </div>
      )}
      <Button
        variant='contained'
        color='secondary'
        size='medium'
        component='label'
        disabled={isSubmitting || documentFields.fields.length >= MAX_SUPPORTING_DOCUMENT_COUNT}>
        <span>{translate('Action.Upload2')}</span>
        <input
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
      </Button>
      <FormHelperText className={classes.semanticGapSmallTop}>
        {translate('Label.SupportingDocumentationFileRestrictions', {
          maxFileCount: maxSupportingDocumentCountLocalized,
          maxFileSize: maxSupportingDocumentSizeLocalized,
        })}
      </FormHelperText>
      {documentFields.fields.length > 0 && (
        <FormHelperText id='document-errors' error className={classes.semanticGapSmallTop}>
          {documentsError}
        </FormHelperText>
      )}

      <div className={classes.semanticGapMediumTop}>
        {existingOwnershipUrls && existingOwnershipUrls.length > 0 && (
          <div
            className={`${classes.ownershipUrlsContainer} ${classes.semanticGapSmallBottom} ${classes.semanticGapSmallTop}`}>
            {existingOwnershipUrls.map((url, index) => (
              // eslint-disable-next-line react/no-array-index-key -- no better key available
              <div className={classes.ownershipUrlItem} key={index}>
                <div className={classes.ownershipUrlContent}>
                  <LinkIcon className={classes.iconMarginRight} />
                  <Typography
                    variant='body1'
                    component='p'
                    color='secondary'
                    className={classes.textEllipsis}>
                    {url}
                  </Typography>
                </div>
              </div>
            ))}
          </div>
        )}
        <Controller
          name='ownershipUrls'
          control={control}
          render={({ field, fieldState: { error } }) => (
            <TextFieldWithEnhancedHelperText
              {...field}
              id='ownership-urls'
              label={translate('Label.LinksOptional')}
              placeholder={`www.example.com\nwww.example2.com`}
              fullWidth
              multiline
              minRows={2}
              className={classes.ownershipUrlsTextField}
              error={!!error}
              helperText={error?.message ?? translate('Label.NewLinkNewLine')}
              disabled={isSubmitting}
              showHelperTextOnlyOnFocusOrError
            />
          )}
        />
      </div>
    </Grid>
  );
};

interface PrimaryKeywordsSectionProps {
  isSubmitting: boolean;
  existingIpContents: IPContent[];
}

const PrimaryKeywordsSection = ({
  isSubmitting,
  existingIpContents,
}: PrimaryKeywordsSectionProps) => {
  const { translate } = useTranslation();
  const { classes } = useStyles();
  const { control, formState, watch } = useFormContext<FormStore>();
  const [shouldScroll, setShouldScroll] = useState(false);

  const primaryKeywordFields = useFieldArray({
    name: 'primaryKeywords',
    control,
  });

  const watchedPrimaryKeywords = watch('primaryKeywords');

  const citationHelperText = useCitationHelperText();

  // Collect all errors in this section
  const hasErrors =
    formState.errors.primaryKeywords ||
    (primaryKeywordFields.fields.length > 0 && formState.errors.primaryKeywordCitation);

  return (
    <Grid item>
      <Typography variant='h5' component='h2' gutterBottom>
        {translate('Heading.PrimaryKeyword')}
      </Typography>
      <Typography
        variant='body1'
        component='p'
        className={classes.semanticGapLargerBottom}
        color='secondary'>
        {translate('Description.PrimaryKeyword')}
      </Typography>
      {hasErrors && formState.isSubmitted && (
        <Typography
          variant='caption'
          component='p'
          color='error'
          className={classes.semanticGapSmallBottom}>
          {translate('Error.OneOrMoreSection')}
        </Typography>
      )}
      <ScrollableContainer
        shouldScroll={shouldScroll}
        onScrollComplete={() => setShouldScroll(false)}
        className={classes.scroll}
        itemsLength={primaryKeywordFields.fields.length}>
        {primaryKeywordFields.fields.length > 0 &&
          primaryKeywordFields.fields.map((primaryKeywordField, index) => (
            // eslint-disable-next-line react/no-array-index-key -- force re-renders on deletion due to Controllers not re-subscribing
            <div key={`${primaryKeywordField.id}-${index}`} className={classes.contentEntry}>
              <Grid
                container
                alignItems='flex-start'
                spacing={1}
                className={classes.semanticGapSmallBottom}>
                <Grid item XSmall={7}>
                  <Controller
                    name={`primaryKeywords.${index}.keyword`}
                    control={control}
                    rules={{
                      required: translate('Label.FieldIsRequired'),
                      validate: getMaxLengthValidationRule(MAX_PRIMARY_KEYWORD_LENGTH, translate),
                    }}
                    render={({ field, fieldState }) => (
                      <TextFieldWithEnhancedHelperText
                        {...field}
                        id={`primary-keyword-${index}`}
                        label={translate('Label.PrimaryKeyword')}
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
                </Grid>
                <Grid item XSmall={5} className={classes.localeGridItem}>
                  <Controller
                    name={`primaryKeywords.${index}.language`}
                    control={control}
                    rules={{
                      required: translate('Label.FieldIsRequired'),
                      validate: (value) => {
                        // Make sure that a primary keyword does not already exist for the locale selected
                        const hasConflictingPrimary = !!existingIpContents.find(
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
                      <LanguageSelect
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        disabled={isSubmitting}
                        label={translate('Label.Locale')}
                        error={!!fieldState.error}
                        helperText={fieldState.error?.message}
                      />
                    )}
                  />
                </Grid>
              </Grid>
              <IconButton
                className={classes.deleteBtn}
                onClick={() => primaryKeywordFields.remove(index)}
                color='secondary'
                disabled={isSubmitting}
                aria-label={translate('Action.Remove')}>
                <DeleteIcon />
              </IconButton>
            </div>
          ))}
      </ScrollableContainer>
      <Button
        variant='contained'
        color='secondary'
        size='medium'
        disabled={isSubmitting}
        onClick={() => {
          setShouldScroll(true);
          primaryKeywordFields.append({ keyword: '', language: '' });
        }}>
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
            <TextFieldWithEnhancedHelperText
              {...field}
              label={translate('Label.Citation')}
              id='citation'
              maxLength={MAX_CITATION_LENGTH}
              disabled={isSubmitting}
              error={!!fieldState.error}
              className={classes.semanticGapMediumTop}
              fullWidth
              showCharacterCount
              showHelperTextOnlyOnFocusOrError
              helperText={fieldState.error?.message ?? citationHelperText}
            />
          )}
        />
      )}
    </Grid>
  );
};

interface SecondaryKeywordsSectionProps {
  isSubmitting: boolean;
}

const SecondaryKeywordsSection = ({ isSubmitting }: SecondaryKeywordsSectionProps) => {
  const { translate } = useTranslation();
  const { classes } = useStyles();
  const { control, watch, formState } = useFormContext<FormStore>();
  const [shouldScroll, setShouldScroll] = useState(false);

  const secondaryKeywordFields = useFieldArray({
    name: 'secondaryKeywords',
    control,
  });
  const citationHelperText = useCitationHelperText();

  const watchedSecondaryKeywords = watch('secondaryKeywords');

  // Check if there are any errors in this section
  const hasErrors = !!formState.errors.secondaryKeywords;

  return (
    <Grid item>
      <Typography variant='h5' component='h2' gutterBottom>
        {translate('Heading.SecondaryKeywords')}
      </Typography>
      <Typography
        variant='body1'
        component='p'
        className={classes.semanticGapLargerBottom}
        color='secondary'>
        {translate('Description.SecondaryKeywords')}
      </Typography>
      {hasErrors && formState.isSubmitted && (
        <Typography
          variant='caption'
          component='p'
          color='error'
          className={classes.semanticGapSmallBottom}>
          {translate('Error.OneOrMoreSection')}
        </Typography>
      )}
      <ScrollableContainer
        shouldScroll={shouldScroll}
        onScrollComplete={() => setShouldScroll(false)}
        className={classes.scroll}
        itemsLength={secondaryKeywordFields.fields.length}>
        {secondaryKeywordFields.fields.length > 0 && (
          <div className={`${classes.flexColumnGapMedium} ${classes.semanticGapSmallBottom}`}>
            {secondaryKeywordFields.fields.map((secondaryKeywordField, index) => (
              // eslint-disable-next-line react/no-array-index-key -- force re-renders on deletion due to Controllers not re-subscribing
              <div key={`${secondaryKeywordField.id}-${index}`} className={classes.contentEntry}>
                <Grid
                  container
                  key={secondaryKeywordField.id}
                  alignItems='flex-start'
                  spacing={1}
                  className={`${classes.semanticGapSmallBottom}`}>
                  <Grid item XSmall={7}>
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
                        <TextFieldWithEnhancedHelperText
                          {...field}
                          id={`secondary-keywords-${index}`}
                          label={translate('Label.SecondaryKeyword')}
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
                  </Grid>
                  <Grid item XSmall={5} className={classes.localeGridItem}>
                    <Controller
                      name={`secondaryKeywords.${index}.language`}
                      control={control}
                      rules={{
                        required: translate('Label.FieldIsRequired'),
                      }}
                      render={({ field, fieldState }) => (
                        <LanguageSelect
                          value={field.value}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          label={translate('Label.Locale')}
                          disabled={isSubmitting}
                          error={!!fieldState.error}
                          helperText={fieldState.error?.message}
                        />
                      )}
                    />
                  </Grid>
                  <Grid item XSmall={12}>
                    <Controller
                      name={`secondaryKeywords.${index}.citation`}
                      control={control}
                      rules={{
                        required: translate('Label.FieldIsRequired'),
                        validate: getMaxLengthValidationRule(MAX_CITATION_LENGTH, translate),
                      }}
                      render={({ field, fieldState }) => (
                        <TextFieldWithEnhancedHelperText
                          {...field}
                          label={translate('Label.Citation')}
                          id={`secondary-keywords-${index}-citation`}
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
                  </Grid>
                </Grid>
                <IconButton
                  className={classes.deleteBtn}
                  onClick={() => secondaryKeywordFields.remove(index)}
                  color='secondary'
                  disabled={isSubmitting}
                  aria-label={translate('Action.Remove')}>
                  <DeleteIcon />
                </IconButton>
              </div>
            ))}
          </div>
        )}
      </ScrollableContainer>
      <div className={classes.flexRowGapMedium}>
        <Button
          variant='contained'
          size='medium'
          color='secondary'
          disabled={isSubmitting}
          onClick={() => {
            setShouldScroll(true);
            secondaryKeywordFields.append({ keyword: '', language: '', citation: '' });
          }}>
          {translate('Action.Add')}
        </Button>
        {watchedSecondaryKeywords.length > 0 && (
          <Button
            variant='contained'
            size='medium'
            color='secondary'
            disabled={isSubmitting}
            onClick={() => {
              setShouldScroll(true);
              secondaryKeywordFields.append(
                watchedSecondaryKeywords[watchedSecondaryKeywords.length - 1],
              );
            }}>
            {translate('Action.Duplicate')}
          </Button>
        )}
      </div>
    </Grid>
  );
};

interface MediaSectionProps {
  isSubmitting: boolean;
  relevantImagesCount: number;
  existingIpContents: IPContent[];
}

const MediaSection = ({
  isSubmitting,
  relevantImagesCount,
  existingIpContents,
}: MediaSectionProps) => {
  const { translate } = useTranslation();
  const { locale } = useLocalization();
  const { classes } = useStyles();
  const { control, watch, trigger, formState } = useFormContext<FormStore>();
  const [shouldScroll, setShouldScroll] = useState(false);

  const [hideAlert, setHideAlert] = useState(false);
  const [canKeepUploading, setCanKeepUploading] = useState(true);

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

  const handleCloseAlert = useCallback(() => {
    setHideAlert(true);
  }, []);

  useEffect(() => {
    if (watchedImages.length > 0) {
      watchedImages.forEach((_, index) => {
        trigger(`images.${index}.asset`);
      });
    }
    const imageTotalWithUpload = watchedImages.length + relevantImagesCount;
    // Controls when alert is shown
    if (imageTotalWithUpload >= MIN_IP_CONTENT_IMAGE_UPLOAD) {
      setHideAlert(true);
    } else {
      setHideAlert(false);
    }

    // Controls if we can keep adding images or will we hit the max allowed
    if (imageTotalWithUpload >= MAX_IP_CONTENT_IMAGES) {
      setCanKeepUploading(false);
    } else {
      setCanKeepUploading(true);
    }
  }, [watchedImages, trigger, relevantImagesCount, remainingImagesUpload]);

  const citationHelperText = useCitationHelperText();

  const imagesError = formState.errors.images?.root?.message;

  // Check if there are any errors in this section
  const hasErrors = !!formState.errors.images;

  return (
    <Grid item>
      <Typography variant='h5' component='h2' gutterBottom>
        {translate('Heading.Media')}
      </Typography>
      <Typography
        variant='body1'
        component='p'
        className={classes.semanticGapLargerBottom}
        color='secondary'>
        {translate('Description.IpFamilyAddImages')}
      </Typography>
      {hasErrors && formState.isSubmitted && (
        <Typography
          variant='caption'
          component='p'
          color='error'
          className={classes.semanticGapSmallBottom}>
          {translate('Error.OneOrMoreSection')}
        </Typography>
      )}
      {!hideAlert && (
        <Alert
          severity='info'
          variant='outlined'
          className={classes.semanticGapLargerBottom}
          onClose={handleCloseAlert}>
          {translate('Title.RecommendedImageUpload', { minImages: minImagesLocalized })}
        </Alert>
      )}
      <Button
        variant='contained'
        color='secondary'
        size='medium'
        component='label'
        disabled={!canKeepUploading || isSubmitting}>
        <span>{translate('Action.Upload2')}</span>
        <input
          type='file'
          hidden
          multiple
          accept='image/png, image/jpeg'
          aria-label={translate('Label.UploadImage')}
          aria-describedby='image-errors'
          onChange={async (event) => {
            if (event.target.files) {
              const files = Array.from(event.target.files);
              setShouldScroll(true);
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
      </Button>
      <FormHelperText className={classes.semanticGapSmallTop}>
        {translate('Label.IpContentImageRestrictions2', {
          maxSize: maxIpContentImageSizeMBLocalized,
        })}
      </FormHelperText>
      {!canKeepUploading && !imagesError && (
        <FormHelperText error className={classes.semanticGapSmallBottom}>
          {translate('Error.UploadMediaDisabled', { maxLimit: maxImagesLocalized })}
        </FormHelperText>
      )}
      {imageFields && (
        <FormHelperText id='image-errors' error className={classes.semanticGapSmallTop}>
          {imagesError}
        </FormHelperText>
      )}
      <ScrollableContainer
        shouldScroll={shouldScroll}
        onScrollComplete={() => setShouldScroll(false)}
        className={classes.scroll}
        itemsLength={imageFields.fields.length}>
        {imageFields.fields.length > 0 && (
          <div
            className={`${classes.flexColumnGapSmall} ${classes.semanticGapLargerBottom} ${classes.semanticGapSmallTop}`}>
            {imageFields.fields.map((item, index) => {
              return (
                // eslint-disable-next-line react/no-array-index-key -- force re-renders on deletion due to Controllers not re-subscribing
                <div key={`${item.id}-${index}`} className={classes.imageItemContainer}>
                  <Controller
                    name={`images.${index}.asset`}
                    control={control}
                    rules={{
                      validate: async (value) => {
                        if (value.type !== 'new') {
                          return undefined;
                        }
                        const validationMessage = await validateIpContentImage(
                          value.file,
                          translate,
                          localeDefault,
                        );
                        return validationMessage || true;
                      },
                    }}
                    render={({ field, fieldState }) => (
                      <div className={classes.semanticGapSmallBottom}>
                        <div className={classes.imagePreview}>
                          {field.value.type === 'new' && (
                            <ImageBeforeUploadPreview file={field.value.file} />
                          )}
                          {fieldState.error && (
                            <FormHelperText
                              error
                              className={`${classes.semanticGapSmallTop} ${classes.imageErrorText}`}>
                              {fieldState.error.message}
                            </FormHelperText>
                          )}
                        </div>
                      </div>
                    )}
                  />
                  <Controller
                    name={`images.${index}.citation`}
                    control={control}
                    rules={{
                      required: translate('Label.FieldIsRequired'),
                      validate: getMaxLengthValidationRule(MAX_CITATION_LENGTH, translate),
                    }}
                    render={({ field, fieldState }) => (
                      <div className={classes.imageCitation}>
                        <TextFieldWithEnhancedHelperText
                          {...field}
                          maxLength={MAX_CITATION_LENGTH}
                          label={translate('Label.Citation')}
                          id={`image-${index}-citation`}
                          error={!!fieldState.error}
                          fullWidth
                          disabled={isSubmitting}
                          showHelperTextOnlyOnFocusOrError
                          showCharacterCount
                          helperText={fieldState.error?.message ?? citationHelperText}
                        />
                      </div>
                    )}
                  />
                  <IconButton
                    aria-label={translate('Action.Delete')}
                    color='secondary'
                    disabled={isSubmitting}
                    onClick={() => imageFields.remove(index)}
                    className={classes.deleteBtn}>
                    <DeleteIcon />
                  </IconButton>
                </div>
              );
            })}
          </div>
        )}
      </ScrollableContainer>
    </Grid>
  );
};

/**
 * Page to create new IP contents.
 */
const IpContentsCreateContainer = () => {
  const { translate } = useTranslation();
  const router = useRouter();
  const { id } = router.query;
  const { classes } = useStyles();
  const { enqueueErrorSnackbar, enqueueSuccessSnackbar } = useIpSnackbar();
  const formMethods = useForm<FormStore>({
    defaultValues: {
      images: [],
      documents: [],
      ownershipUrls: '',
      primaryKeywords: [],
      primaryKeywordCitation: '',
      secondaryKeywords: [],
    },
    mode: 'onSubmit',
  });

  const ipFamilyReq = useIpFamilyQuery(id as string);

  const ipContentsReq = useListAllIpContentsByIpFamily({
    ipFamilyId: id as string,
    pageSize: 500,
  });

  const {
    handleSubmit,
    formState: { isDirty },
  } = formMethods;

  // Calculate how many images are already there otherwise 0
  const relevantImagesCount = getApprovedPendingOrBlockedImages(
    ipContentsReq.data?.ipContents || [],
  ).length;

  const createIpContentsAndAddToIpFamilyMutation = useCreateIpContentsAndAddToIpFamily();

  const handleSave = async (data: FormStore) => {
    // Filter out the empty primary keywords
    const primaryKeywords = data.primaryKeywords
      .filter((keywordData) => keywordData.keyword)
      .map((keywordData) => ({
        ...keywordData,
        citation: data.primaryKeywordCitation,
      }));

    const secondaryKeywords = data.secondaryKeywords.filter((keywordData) => keywordData.keyword);

    const documents = data.documents.map((document) => ({
      key: document.file.name,
      name: document.file.name,
      url: URL.createObjectURL(document.file),
      file: document.file,
    }));

    const ownershipUrls = data.ownershipUrls
      .split('\n')
      .map((url) => url.trim())
      .filter((url) => !!url);

    createIpContentsAndAddToIpFamilyMutation.mutate(
      {
        ipFamilyId: id as string,
        primaryKeywords,
        secondaryKeywords,
        images: data.images,
        additionalDocuments: documents,
        additionalOwnershipUrls: ownershipUrls,
      },
      {
        onSuccess: () => {
          router.push(IP_FAMILY_DETAILS_HREF(id as string));
          enqueueSuccessSnackbar('Message.IpContentSubmitted');
        },
        onError: () => {
          enqueueErrorSnackbar();
        },
      },
    );
  };

  const { setPageTitle } = useIpLayoutContext();

  useEffect(() => {
    const pages: { title: string; href?: string }[] = [{ title: translate('Heading.AddIp') }];
    if (ipFamilyReq.data?.name) {
      pages.unshift({
        title: ipFamilyReq.data.name || '',
        href: IP_FAMILY_DETAILS_HREF(id as string),
      });
    }
    setPageTitle(<IpFamiliesBreadcrumbs pages={pages} />);
  }, [setPageTitle, translate, ipFamilyReq.data?.name, id]);

  const isSubmitting = createIpContentsAndAddToIpFamilyMutation.isPending;

  if (ipContentsReq.error) {
    return <IpLoadError error={ipContentsReq.error} />;
  }
  if (ipFamilyReq.error) {
    return <IpLoadError error={ipFamilyReq.error} />;
  }

  if (!ipContentsReq.data || !ipFamilyReq.data) {
    return <CircularProgress />;
  }

  const ipFamily = ipFamilyReq.data;
  const { ipContents } = ipContentsReq.data;

  return (
    <FormProvider {...formMethods}>
      <Grid
        container
        direction='column'
        spacing={4}
        maxWidth={750}
        component='form'
        className={classes.main}
        onSubmit={handleSubmit(handleSave)}>
        <Grid item>
          <Typography variant='h1' component='h1' gutterBottom>
            {translate('Heading.AddIp')}
          </Typography>
          <Typography variant='body1' component='p' color='secondary'>
            {translate('Description.IpFamilySubmission')}
          </Typography>
        </Grid>

        <SupportingDocumentationSection
          isSubmitting={isSubmitting}
          existingOwnershipUrls={ipFamily.ownershipUrls}
        />

        <PrimaryKeywordsSection isSubmitting={isSubmitting} existingIpContents={ipContents} />

        <SecondaryKeywordsSection isSubmitting={isSubmitting} />

        <MediaSection
          isSubmitting={isSubmitting}
          relevantImagesCount={relevantImagesCount}
          existingIpContents={ipContents}
        />
        <Grid item>
          <Flex gap={8}>
            <Button
              variant='outlined'
              disabled={isSubmitting}
              href={IP_FAMILY_DETAILS_HREF(id as string)}
              component={Link}
              color='secondary'>
              {translate('Action.Cancel')}
            </Button>

            <Button
              variant='contained'
              type='submit'
              disabled={isSubmitting || !isDirty}
              loading={isSubmitting}>
              {translate('Action.Submit')}
            </Button>
          </Flex>
        </Grid>
      </Grid>
    </FormProvider>
  );
};

export default withTranslation(IpContentsCreateContainer, [
  TranslationNamespace.Navigation,
  TranslationNamespace.AgreementsManager,
  TranslationNamespace.RightsPortal,
]);
