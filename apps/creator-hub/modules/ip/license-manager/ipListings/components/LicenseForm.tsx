import React, { useState, useCallback } from 'react';
import { useTranslation } from '@rbx/intl';
import {
  Grid,
  Typography,
  Button,
  FormHelperText,
  MenuItem,
  Select,
  FormControl,
  RadioGroup,
  FormControlLabel,
  Radio,
  Link,
  Accordion,
  AccordionSummary,
  ExpandMoreIcon,
  AccordionDetails,
} from '@rbx/ui';
import { useForm, Controller, useFormState } from 'react-hook-form';
import {
  UniverseContentMaturity,
  LicenseVisibility,
  ContentStandardsQuestionAnswer,
  LicenseDurationType,
} from '@rbx/clients/contentLicensingApi/v1';
import { CONTENT_STANDARDS_HREF } from '@modules/licenses/urls';
import downloadPdf from '@modules/licenses/utils/downloadPdf';
import { Flex } from '@modules/miscellaneous/common/components';
import { useSettings } from '@modules/settings';
import { PageLoading } from '@modules/miscellaneous/common';

import useIpSnackbar from '../../../hooks/useIpSnackbar';
import { MinimumDAUValue, MonitorType, MinimumDAU } from './licenseFormTypes';
import {
  TextFieldWithEnhancedHelperText,
  getMaxLengthValidationRule,
} from '../../../components/TextFieldWithEnhancedHelperText';
import {
  MAX_LICENSE_NAME_LENGTH,
  MAX_LICENSE_DESCRIPTION_LENGTH,
  MAX_SCOPE_OF_LICENSE_LENGTH,
  FALLBACK_CONTENT_STANDARDS_ID,
} from '../../constants';
import { maturityRatingOptions } from '../../utils/maturityRating';
import { CONTENT_MATURITY_LABELS_HREF } from '../../urls';
import AmDivider from '../../components/AmDivider';
import ContentStandardsDropdownSelectionModal from './ContentStandardsDropdownSelectionModal';
import { validateDocumentPdf, DocumentValidationError } from '../../utils/validateDocumentPdf';
import {
  LicenseDurationBucket,
  maximumDurationBuckets,
  minimumDurationBuckets,
  getLabelForDurationBucket,
  validateDurationBuckets,
} from '../../utils/timeLimitedLicense';
import useLicenseFormStyles from './LicenseForm.styles';

export interface LicenseFormData {
  name: string;
  description: string;
  revenueShare: number;
  maxMaturityRating: UniverseContentMaturity;
  minimumDAU: MinimumDAUValue;
  contentStandardsFile: File | undefined;
  contentStandardScope: string;
  contentStandardAnswers: ContentStandardsQuestionAnswer[];
  /** Only used for edit mode */
  contentStandardsDocumentId?: string;
  /** Whether to delete the existing content standards document (edit mode only) */
  deleteContentStandardsDocument?: boolean;
  visibility?: LicenseVisibility;
  monitorType: MonitorType | null;
  durationType?: LicenseDurationType;
  minDuration?: LicenseDurationBucket;
  maxDuration?: LicenseDurationBucket;
}

type LicenseFormMode = { type: 'create' } | { type: 'edit'; hasAgreements: boolean };

const CREATE_MODE: LicenseFormMode = { type: 'create' };
export const EDIT_MODE: LicenseFormMode = { type: 'edit', hasAgreements: false };
export const EDIT_WITH_AGREEMENTS_MODE: LicenseFormMode = { type: 'edit', hasAgreements: true };

export interface LicenseFormSubmitOptions {
  /** Whether any moderated fields were changed in this submission */
  hasModeratedChanges: boolean;
}

interface Props {
  defaultValues: LicenseFormData;
  onSubmit: (data: LicenseFormData, options: LicenseFormSubmitOptions) => void;
  onCancel: () => void;
  submitButtonText: string;
  cancelButtonText?: string;
  isSubmitting: boolean;
  onSkip?: () => void;
  mode?: LicenseFormMode;
  /** Whether to show moderation-related UI (warnings about moderated fields) */
  showModerationUI?: boolean;
  /** Whether there are pending edits awaiting moderation (disables moderated fields) */
  hasPendingEdits?: boolean;
  /**
   * Optional callback invoked before submit when moderated fields have changed (edit mode)
   * or when creating a new license (create mode).
   * Returns a promise that resolves to true if submit should proceed, false to cancel.
   */
  onBeforeSubmitModeratedChanges?: () => Promise<boolean>;
}

// Fields that require moderation review when changed
const MODERATED_FIELDS: (keyof LicenseFormData)[] = [
  'name',
  'description',
  'contentStandardsFile',
  'contentStandardScope',
];

interface RevShareTimingOptionsProps {
  isRevShareOnActivation: boolean;
  simple?: boolean;
}

const RevShareTimingOptions: React.FC<RevShareTimingOptionsProps> = ({
  isRevShareOnActivation,
  simple,
}) => {
  const { translate } = useTranslation();
  const { classes } = useLicenseFormStyles();

  return (
    <div className={classes.dropdownOption}>
      <Typography variant='body1'>
        {isRevShareOnActivation
          ? translate('Label.MonetizeOnActivation')
          : translate('Label.MonetizeLater')}
      </Typography>
      {!simple && (
        <div>
          <Typography variant='body2'>
            {isRevShareOnActivation
              ? translate('Label.MonitorRevshare')
              : translate('Label.MonitorOnly')}
          </Typography>
        </div>
      )}
    </div>
  );
};

interface DurationOptionsProps {
  isPerpetual: boolean;
  simple?: boolean;
}

const DurationOptions: React.FC<DurationOptionsProps> = ({ isPerpetual, simple }) => {
  const { translate } = useTranslation();
  const { classes } = useLicenseFormStyles();

  return (
    <div className={classes.dropdownOption}>
      <Typography variant='body1'>
        {isPerpetual ? translate('Label.Perpetual') : translate('Label.TimeLimited')}
      </Typography>
      {!simple && (
        <div>
          <Typography variant='body2'>
            {isPerpetual
              ? translate('Description.DurationTypePerpetual')
              : translate('Description.DurationTypeTimeLimited')}
          </Typography>
        </div>
      )}
    </div>
  );
};

/**
 * Form to create licenses for an IP Listing
 */
const LicenseForm = ({
  defaultValues,
  onSubmit,
  onCancel,
  submitButtonText,
  cancelButtonText,
  isSubmitting,
  onSkip,
  mode = CREATE_MODE,
  showModerationUI = false,
  hasPendingEdits = false,
  onBeforeSubmitModeratedChanges,
}: Props) => {
  const { translate, translateHTML } = useTranslation();
  const { classes } = useLicenseFormStyles();
  const { enqueueErrorSnackbar } = useIpSnackbar();
  const { settings, isFetched } = useSettings();
  const { enableIpPlatformTimeboundLicenses } = settings;

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    register,
    formState,
    getValues,
    setError,
    clearErrors,
  } = useForm<LicenseFormData>({
    defaultValues,
    mode: 'onSubmit',
  });

  const { dirtyFields } = useFormState({ control });
  const areModeratedFieldsDisabled = showModerationUI && hasPendingEdits;

  const applyDurationBucketErrors = useCallback(
    (min: LicenseDurationBucket | undefined, max: LicenseDurationBucket | undefined) => {
      const minResult = validateDurationBuckets(true, max)(min);
      const maxResult = validateDurationBuckets(false, min)(max);
      if (minResult !== true) {
        setError('minDuration', { type: 'durationBuckets', message: translate(minResult) });
      } else {
        clearErrors('minDuration');
      }
      if (maxResult !== true) {
        setError('maxDuration', { type: 'durationBuckets', message: translate(maxResult) });
      } else {
        clearErrors('maxDuration');
      }
    },
    [setError, clearErrors, translate],
  );

  const durationType = watch('durationType');
  const minDuration = watch('minDuration');
  const maxDuration = watch('maxDuration');
  const revenueShare = watch('revenueShare');
  const deleteContentStandardsDocument = watch('deleteContentStandardsDocument');
  const [isMinimumDAUFocused, setIsMinimumDAUFocused] = useState<boolean>(false);
  const [isMaxMaturityRatingFocused, setIsMaxMaturityRatingFocused] = useState<boolean>(false);
  const [isContentStandardsExpanded, setIsContentStandardsExpanded] = useState<boolean>(false);
  const [isBrandGuidelinesExpanded, setIsBrandGuidelinesExpanded] = useState<boolean>(false);
  const [isDropdownSelectionModalOpen, setIsDropdownSelectionModalOpen] = useState<boolean>(false);
  const [contentStandardDropdownSelections, setContentStandardDropdownSelections] = useState<
    ContentStandardsQuestionAnswer[]
  >(defaultValues.contentStandardAnswers);
  const [hideContentStandardsAnswerError, setHideContentStandardsAnswerError] =
    useState<boolean>(false);
  const [documentValidationErrors, setDocumentValidationErrors] = useState<
    DocumentValidationError[]
  >([]);

  const renderRevShareValue = (value: unknown) => {
    if (!value) return null;

    return (
      <RevShareTimingOptions
        isRevShareOnActivation={value === MonitorType.MonitorAndRevshare}
        simple
      />
    );
  };

  const renderDurationValue = (value: unknown) => {
    if (!value) return null;

    return <DurationOptions isPerpetual={value === LicenseDurationType.Perpetual} simple />;
  };

  const handleDocumentDownload = async () => {
    if (!defaultValues.contentStandardsDocumentId) {
      enqueueErrorSnackbar();
      return;
    }
    await downloadPdf(
      CONTENT_STANDARDS_HREF(defaultValues.contentStandardsDocumentId),
      translate('Label.ContentStandardsPdf', {
        licenseName: defaultValues.name,
      }),
    );
  };

  const handleFileChange = useCallback(
    (onChange: (file: File | undefined) => void) =>
      (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
          const file = event.target.files[0];
          const validationError = validateDocumentPdf(file);
          if (validationError) {
            setDocumentValidationErrors([validationError]);
          } else {
            setDocumentValidationErrors([]);
            onChange(file);
            setValue('deleteContentStandardsDocument', false);
          }
        }
        const inputEl = event.target;
        inputEl.value = '';
      },
    [setValue],
  );

  const handleDocumentDelete = useCallback(
    (onChange: (file: File | undefined) => void) => {
      onChange(undefined);
      setValue('deleteContentStandardsDocument', true);
      setDocumentValidationErrors([]);
    },
    [setValue],
  );

  const toggleContentStandardsAccordion = useCallback(() => {
    setIsContentStandardsExpanded(!isContentStandardsExpanded);
  }, [isContentStandardsExpanded]);

  const toggleBrandGuidelinesAccordion = useCallback(() => {
    setIsBrandGuidelinesExpanded(!isBrandGuidelinesExpanded);
  }, [isBrandGuidelinesExpanded]);

  const openDropdownSelectionModal = useCallback(() => {
    setIsDropdownSelectionModalOpen(true);
  }, []);

  const handleNewContentStandardSelections = (selections: ContentStandardsQuestionAnswer[]) => {
    setContentStandardDropdownSelections(selections);
    setValue('contentStandardAnswers', selections, { shouldValidate: true });
    setIsContentStandardsExpanded(true);
    setHideContentStandardsAnswerError(true);
  };

  const handleFormSubmit = useCallback(
    async (data: LicenseFormData) => {
      const hasModeratedFieldChanges =
        mode.type === 'edit' &&
        !hasPendingEdits &&
        MODERATED_FIELDS.some((field) => dirtyFields[field]);

      const shouldShowConfirmation =
        showModerationUI &&
        onBeforeSubmitModeratedChanges &&
        (mode.type === 'create' || hasModeratedFieldChanges);

      if (shouldShowConfirmation) {
        const shouldProceed = await onBeforeSubmitModeratedChanges();
        if (!shouldProceed) {
          return;
        }
      }

      onSubmit(data, { hasModeratedChanges: showModerationUI && hasModeratedFieldChanges });
    },
    [
      mode.type,
      showModerationUI,
      hasPendingEdits,
      dirtyFields,
      onBeforeSubmitModeratedChanges,
      onSubmit,
    ],
  );

  if (!isFetched) {
    return <PageLoading />;
  }

  const isTimeLimitedLicense =
    enableIpPlatformTimeboundLicenses && durationType === LicenseDurationType.TimeLimited;

  return (
    <React.Fragment>
      <Grid
        container
        direction='column'
        spacing={4}
        maxWidth={708}
        component='form'
        onSubmit={handleSubmit(handleFormSubmit)}>
        <Grid item>
          <Typography variant='h5' component='h2' gutterBottom>
            {translate('Heading.LicenseDetails')}
          </Typography>
          <Typography color='secondary' component='p' className={classes.semanticGapLargerBottom}>
            {translate('Description.LicenseDetails')}
          </Typography>

          <FormControl fullWidth>
            <Select
              className={classes.semanticGapLargerBottom}
              id='license-type-select'
              value='Experiences'
              disabled
              label={translate('Label.LicenseType')}>
              <MenuItem value='Experiences'>{translate('Label.FullExperienceLicense')}</MenuItem>
            </Select>
          </FormControl>

          <Controller
            name='name'
            control={control}
            render={({ field, fieldState: { error } }) => (
              <TextFieldWithEnhancedHelperText
                className={classes.semanticGapLargerBottom}
                {...field}
                id='license-create-name'
                label={translate('Label.Name')}
                fullWidth
                error={!!error}
                helperText={
                  areModeratedFieldsDisabled
                    ? translate('Description.FieldLockedPendingReview')
                    : error?.message
                }
                maxLength={MAX_LICENSE_NAME_LENGTH}
                showCharacterCount
                disabled={areModeratedFieldsDisabled}
              />
            )}
            rules={{
              required: translate('Label.FieldIsRequired'),
              validate: getMaxLengthValidationRule(MAX_LICENSE_NAME_LENGTH, translate),
            }}
          />

          <Controller
            name='description'
            control={control}
            render={({ field, fieldState: { error } }) => (
              <TextFieldWithEnhancedHelperText
                {...field}
                id='license-create-description'
                label={translate('Label.Description')}
                fullWidth
                multiline
                rows={3}
                error={!!error}
                helperText={
                  areModeratedFieldsDisabled
                    ? translate('Description.FieldLockedPendingReview')
                    : error?.message
                }
                maxLength={MAX_LICENSE_DESCRIPTION_LENGTH}
                showCharacterCount
                disabled={areModeratedFieldsDisabled}
              />
            )}
            rules={{
              required: translate('Label.FieldIsRequired'),
              validate: getMaxLengthValidationRule(MAX_LICENSE_DESCRIPTION_LENGTH, translate),
            }}
          />
        </Grid>
        {enableIpPlatformTimeboundLicenses && (
          <Grid item>
            <Typography variant='h5' component='h2' className={classes.paddingMediumBtm}>
              {translate('Label.Duration')}
            </Typography>
            <Typography color='secondary' component='p' className={classes.semanticGapLargerBottom}>
              {translate('Description.LicenseFormDuration')}
            </Typography>
            <FormControl fullWidth>
              <Controller
                name='durationType'
                control={control}
                disabled={mode.type === 'edit'}
                render={({ field, fieldState: { error } }) => (
                  <Select
                    {...field}
                    id='duration-type-select'
                    error={!!error}
                    helperText={error?.message}
                    label={translate('Action.SelectDuration')}
                    renderValue={renderDurationValue}>
                    <MenuItem
                      value={LicenseDurationType.TimeLimited}
                      data-testId='time-limited-option'>
                      <DurationOptions isPerpetual={false} />
                    </MenuItem>
                    <MenuItem value={LicenseDurationType.Perpetual} data-testId='perpetual-option'>
                      <DurationOptions isPerpetual />
                    </MenuItem>
                  </Select>
                )}
                rules={{ required: translate('Label.FieldIsRequired') }}
              />
            </FormControl>
          </Grid>
        )}
        {isTimeLimitedLicense && (
          <Grid item>
            <Typography variant='h6' component='h3' className={classes.paddingMediumBtm}>
              {translate('Heading.LicenseFormDurationRange')}
            </Typography>
            <Typography color='secondary' component='p' className={classes.semanticGapLargerBottom}>
              {translate('Description.LicenseFormDurationRange')}
            </Typography>
            <FormControl fullWidth className={classes.semanticGapLargerBottom}>
              <Controller
                name='minDuration'
                control={control}
                disabled={mode.type === 'edit' && mode.hasAgreements}
                render={({ field, fieldState: { error } }) => (
                  <Select
                    {...field}
                    error={!!error}
                    helperText={error?.message}
                    label={translate('Action.SelectDurationMinimum')}
                    onChange={(e) => {
                      field.onChange(e);
                      const newMin = Number(e.target.value) as LicenseDurationBucket;
                      applyDurationBucketErrors(newMin, getValues('maxDuration'));
                    }}>
                    {minimumDurationBuckets.map((value) => (
                      <MenuItem key={value} value={value}>
                        {getLabelForDurationBucket(value, translate)}
                      </MenuItem>
                    ))}
                  </Select>
                )}
                rules={{
                  required: translate('Label.FieldIsRequired'),
                  validate: (value) => {
                    const result = validateDurationBuckets(true, maxDuration)(value);
                    return result === true ? true : translate(result);
                  },
                }}
              />
            </FormControl>
            <FormControl fullWidth>
              <Controller
                name='maxDuration'
                control={control}
                disabled={mode.type === 'edit' && mode.hasAgreements}
                render={({ field, fieldState: { error } }) => (
                  <Select
                    {...field}
                    error={!!error}
                    helperText={error?.message}
                    label={translate('Action.SelectDurationMaximum')}
                    onChange={(e) => {
                      field.onChange(e);
                      const newMax = Number(e.target.value) as LicenseDurationBucket;
                      applyDurationBucketErrors(getValues('minDuration'), newMax);
                    }}>
                    {maximumDurationBuckets.map((value) => (
                      <MenuItem key={value} value={value}>
                        {getLabelForDurationBucket(value, translate)}
                      </MenuItem>
                    ))}
                  </Select>
                )}
                rules={{
                  required: translate('Label.FieldIsRequired'),
                  validate: (value) => {
                    const result = validateDurationBuckets(false, minDuration)(value);
                    return result === true ? true : translate(result);
                  },
                }}
              />
            </FormControl>
          </Grid>
        )}
        <Grid item>
          <Typography variant='h5' component='h2' className={classes.paddingMediumBtm}>
            {translate('Heading.Monetization')}
          </Typography>
          <Typography variant='h6' component='h3' gutterBottom>
            {translate('Label.RevenueShareRate')}
          </Typography>
          <Typography color='secondary' component='p' className={classes.semanticGapLargerBottom}>
            {translate('Description.RevenueShareEditable')}
          </Typography>

          <FormControl fullWidth>
            <Controller
              name='revenueShare'
              control={control}
              disabled={mode.type === 'edit' && mode.hasAgreements}
              render={({ field, fieldState: { error } }) => (
                <Select
                  {...field}
                  id='revenue-share-select'
                  error={!!error}
                  helperText={error?.message}
                  label={translate('Label.RevenueShare')}>
                  {/* 0% to 95% in 5% increments */}
                  {Array.from({ length: 20 }, (_, index) => index).map((value) => (
                    <MenuItem key={value} value={value * 5}>
                      {value * 5}%
                    </MenuItem>
                  ))}
                </Select>
              )}
              rules={{ required: translate('Label.FieldIsRequired') }}
            />
          </FormControl>
        </Grid>
        {revenueShare > 0 && (
          <Grid item>
            <Typography
              variant='h6'
              component='h3'
              className={
                isTimeLimitedLicense ? classes.paddingMediumBtm : classes.semanticGapLargerBottom
              }>
              {translate('Label.DefaultRevenueShareTiming')}
            </Typography>
            {isTimeLimitedLicense && (
              <Typography
                color='secondary'
                component='p'
                className={classes.semanticGapLargerBottom}>
                {translate('Description.TimelimitedRevenueShareTiming')}
              </Typography>
            )}
            <FormControl fullWidth>
              <Controller
                name='monitorType'
                control={control}
                disabled={isTimeLimitedLicense}
                render={({ field, fieldState: { error } }) => (
                  <Select
                    {...field}
                    value={
                      isTimeLimitedLicense
                        ? MonitorType.MonitorAndRevshare // Enforce monetization on activation for Timelimited licenses
                        : field.value
                    }
                    id='revshare-timing-select'
                    error={!!error}
                    helperText={error?.message}
                    label={translate('Label.SelectRevShareTiming')}
                    renderValue={renderRevShareValue}>
                    <MenuItem value={MonitorType.MonitorAndRevshare}>
                      <RevShareTimingOptions isRevShareOnActivation />
                    </MenuItem>
                    <MenuItem value={MonitorType.MonitorOnly}>
                      <RevShareTimingOptions isRevShareOnActivation={false} />
                    </MenuItem>
                  </Select>
                )}
                rules={{ required: translate('Error.PleaseSelectType') }}
              />
            </FormControl>
          </Grid>
        )}
        <Grid item>
          <Typography variant='h5' component='h2' gutterBottom>
            {translate('Heading.ExperienceEligibility')}
          </Typography>
          <Typography color='secondary' component='p' className={classes.semanticGapLargerBottom}>
            {translateHTML('Description.ExperienceEligibilityWithContentMaturityLink', [
              {
                opening: 'ContentMaturityLinkStart',
                closing: 'ContentMaturityLinkEnd',
                content(chunks) {
                  return (
                    <Link
                      href={CONTENT_MATURITY_LABELS_HREF}
                      target='_blank'
                      style={{ textDecoration: 'none' }}>
                      {chunks}
                    </Link>
                  );
                },
              },
            ])}
          </Typography>
          <FormControl fullWidth className={classes.semanticGapLargerBottom}>
            <Controller
              name='minimumDAU'
              control={control}
              disabled={mode.type === 'edit' && mode.hasAgreements}
              render={({ field, fieldState: { error } }) => (
                <Select
                  {...field}
                  id='minimum-dau-select'
                  error={!!error}
                  helperText={
                    error?.message ||
                    (isMinimumDAUFocused ? translate('Description.MinimumDAU') : '')
                  }
                  label={translate('Label.MinimumAverageL7DAU')}
                  onFocus={() => setIsMinimumDAUFocused(true)}
                  onBlur={() => setIsMinimumDAUFocused(false)}>
                  <MenuItem value={MinimumDAU.NoRequirement}>
                    {translate('Label.NoRequirement')}
                  </MenuItem>
                  <MenuItem value={MinimumDAU.Small}>{translate('Label.DauLow')}</MenuItem>
                  <MenuItem value={MinimumDAU.Large}>{translate('Label.DauHigh')}</MenuItem>
                </Select>
              )}
              rules={{ required: translate('Label.FieldIsRequired') }}
            />
          </FormControl>
          <FormControl fullWidth>
            <Controller
              name='maxMaturityRating'
              control={control}
              disabled={mode.type === 'edit' && mode.hasAgreements}
              render={({ field, fieldState: { error } }) => (
                <Select
                  {...field}
                  id='maturity-rating-select'
                  error={!!error}
                  helperText={
                    error?.message ||
                    (isMaxMaturityRatingFocused ? translate('Description.MaxMaturityRating') : '')
                  }
                  label={translate('Label.MaxMaturityRating')}
                  onFocus={() => setIsMaxMaturityRatingFocused(true)}
                  onBlur={() => setIsMaxMaturityRatingFocused(false)}>
                  {maturityRatingOptions.map((item) => (
                    <MenuItem key={item.value} value={item.value}>
                      {translate(item.label)}
                    </MenuItem>
                  ))}
                </Select>
              )}
              rules={{ required: translate('Label.FieldIsRequired') }}
            />
          </FormControl>
        </Grid>
        <Grid item>
          <Typography variant='h5' component='h2' gutterBottom>
            {translate('Heading.GuidelinesRestrictions')}
          </Typography>
          <Typography color='secondary' component='p' className={classes.semanticGapLargerBottom}>
            {translate('Description.GuidelinesRestrictions')}
          </Typography>
          <div>
            <Controller
              name='contentStandardScope'
              control={control}
              render={({ field, fieldState: { error } }) => (
                <TextFieldWithEnhancedHelperText
                  {...field}
                  id='license-scope-of-license'
                  label={translate('Label.ScopeOfLicense')}
                  fullWidth
                  multiline
                  minRows={3}
                  maxRows={6}
                  error={!!error}
                  helperText={
                    areModeratedFieldsDisabled
                      ? translate('Description.FieldLockedPendingReview')
                      : error?.message
                  }
                  maxLength={MAX_SCOPE_OF_LICENSE_LENGTH}
                  disabled={isSubmitting || areModeratedFieldsDisabled}
                  className={classes.paddingMediumBtm}
                  showCharacterCount
                />
              )}
              rules={{
                required: translate('Label.FieldIsRequired'),
                validate: getMaxLengthValidationRule(MAX_SCOPE_OF_LICENSE_LENGTH, translate),
              }}
            />
            <FormControl
              fullWidth
              error={!!formState.errors.contentStandardAnswers && !hideContentStandardsAnswerError}>
              <input
                type='hidden'
                {...register('contentStandardAnswers', {
                  required: translate('Label.FieldIsRequired'),
                  validate: (value: ContentStandardsQuestionAnswer[]) => {
                    return (value && value.length > 0) || translate('Label.FieldIsRequired');
                  },
                })}
              />
              <Accordion
                // Accordion should be expanded if error would be shown
                expanded={
                  (formState.errors.contentStandardAnswers && !hideContentStandardsAnswerError) ||
                  isContentStandardsExpanded
                }
                onChange={toggleContentStandardsAccordion}
                variant='outlined'
                className={classes.accordion}>
                <AccordionSummary
                  data-testid='content-standards-accordion'
                  expandIcon={<ExpandMoreIcon />}
                  className={classes.accordionSummary}>
                  <Typography variant='h6'>{translate('Label.ContentStandards')}</Typography>
                </AccordionSummary>
                <AccordionDetails className={classes.accordionDetails}>
                  <Typography
                    variant='body2'
                    color='secondary'
                    className={classes.semanticGapLargerBottom}>
                    {translate('Description.ContentStandards')}
                  </Typography>
                  <Button
                    variant='outlined'
                    size='small'
                    color='primary'
                    onClick={openDropdownSelectionModal}
                    disabled={isSubmitting}
                    className={classes.contentStandardsButton}>
                    {(contentStandardDropdownSelections?.length || 0) === 0
                      ? translate('Action.Select')
                      : translate('Heading.Edit')}
                  </Button>
                  {formState.errors.contentStandardAnswers && !hideContentStandardsAnswerError && (
                    <FormHelperText>
                      {formState.errors.contentStandardAnswers.message}
                    </FormHelperText>
                  )}
                </AccordionDetails>
              </Accordion>
            </FormControl>
            <AmDivider />
            <div>
              {/* Accordion needs to have a parent to prevent it from moving around during expand/un-expand */}
              <Accordion
                expanded={isBrandGuidelinesExpanded}
                onChange={toggleBrandGuidelinesAccordion}
                variant='outlined'
                className={classes.accordion}>
                <AccordionSummary
                  data-testid='brand-guidelines-accordion'
                  expandIcon={<ExpandMoreIcon />}
                  className={classes.accordionSummary}>
                  <Typography variant='h6'>{translate('Label.BrandGuidelinesOptional')}</Typography>
                </AccordionSummary>
                <AccordionDetails className={classes.accordionDetails}>
                  <Grid container flexDirection='column' spacing={2}>
                    <Grid item>
                      <Typography variant='body2' color='secondary'>
                        {translate('Description.BrandGuidelines')}
                      </Typography>
                    </Grid>
                    <Grid item>
                      <Controller
                        name='contentStandardsFile'
                        control={control}
                        render={({ field, fieldState: { error } }) => {
                          const hasExistingDocument =
                            mode.type === 'edit' &&
                            defaultValues.contentStandardsDocumentId &&
                            defaultValues.contentStandardsDocumentId !==
                              FALLBACK_CONTENT_STANDARDS_ID &&
                            !deleteContentStandardsDocument;
                          const hasNewFile = !!field.value;
                          const showDocument = hasExistingDocument || hasNewFile;

                          return (
                            <React.Fragment>
                              <Flex gap={8} alignItems='center'>
                                {hasExistingDocument && !hasNewFile && (
                                  <Button
                                    variant='outlined'
                                    size='small'
                                    color='primary'
                                    onClick={handleDocumentDownload}>
                                    {translate('Action.Download')}
                                  </Button>
                                )}
                                <Button
                                  variant='outlined'
                                  size='small'
                                  component='label'
                                  color='primary'
                                  disabled={isSubmitting || areModeratedFieldsDisabled}>
                                  <span>
                                    {showDocument
                                      ? translate('Action.Replace')
                                      : translate('Action.UploadFile')}
                                  </span>
                                  <input
                                    type='file'
                                    hidden
                                    accept='application/pdf'
                                    onChange={handleFileChange(field.onChange)}
                                    disabled={areModeratedFieldsDisabled}
                                  />
                                </Button>
                                {showDocument && (
                                  <Button
                                    variant='outlined'
                                    size='small'
                                    color='primary'
                                    disabled={isSubmitting || areModeratedFieldsDisabled}
                                    onClick={() => handleDocumentDelete(field.onChange)}>
                                    {translate('Action.Delete')}
                                  </Button>
                                )}
                                {hasNewFile && field.value && (
                                  <Typography color='primary' variant='body1'>
                                    {field.value.name}
                                  </Typography>
                                )}
                              </Flex>

                              {hasExistingDocument && !hasNewFile && (
                                <Typography color='secondary' variant='body2'>
                                  {translate('Label.ExistingDocumentAttached')}
                                </Typography>
                              )}
                              {deleteContentStandardsDocument && !hasNewFile && (
                                <Typography color='error' variant='body2'>
                                  {translate('Label.DocumentWillBeDeleted')}
                                </Typography>
                              )}
                              <FormHelperText className={classes.semanticGapSmallTop}>
                                {areModeratedFieldsDisabled
                                  ? translate('Description.FieldLockedPendingReview')
                                  : translate('Description.GuidelinesSupportedFormats')}
                              </FormHelperText>
                              {documentValidationErrors.length > 0 && (
                                <FormHelperText error className={classes.semanticGapSmallTop}>
                                  {documentValidationErrors.map((err) => (
                                    <div key={`${err.type}-${err.message}`}>
                                      {translate(err.message)}
                                    </div>
                                  ))}
                                </FormHelperText>
                              )}
                              {error && <FormHelperText error>{error.message}</FormHelperText>}
                            </React.Fragment>
                          );
                        }}
                      />
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>
            </div>
            <AmDivider />
          </div>
        </Grid>
        <Grid item>
          <Typography variant='h5' component='h2' className={classes.semanticGapLargerBottom}>
            {translate('Heading.Privacy')}
          </Typography>
          <Controller
            name='visibility'
            control={control}
            rules={{ required: translate('Label.FieldIsRequired') }}
            render={({ field, fieldState: { error } }) => (
              <FormControl error={!!error}>
                <RadioGroup {...field}>
                  <Grid container direction='column' spacing={2}>
                    <Grid item>
                      <FormControlLabel
                        value={LicenseVisibility.Public}
                        control={<Radio aria-label={translate('Label.Public')} size='medium' />}
                        label={
                          <React.Fragment>
                            <Typography variant='largeLabel2' component='div'>
                              {translate('Label.Public')}
                            </Typography>
                            <Typography variant='largeLabel1' component='div' color='secondary'>
                              {translate('Description.PublicLicense')}
                            </Typography>
                          </React.Fragment>
                        }
                      />
                    </Grid>
                    <Grid item>
                      <FormControlLabel
                        value={LicenseVisibility.Private}
                        control={<Radio aria-label={translate('Label.Private')} />}
                        label={
                          <React.Fragment>
                            <Typography variant='largeLabel2' component='div'>
                              {translate('Label.Private')}
                            </Typography>
                            <Typography variant='largeLabel1' component='div' color='secondary'>
                              {translate('Description.PrivateLicense')}
                            </Typography>
                          </React.Fragment>
                        }
                      />
                    </Grid>
                  </Grid>
                </RadioGroup>
                {error && <FormHelperText error>{error.message}</FormHelperText>}
              </FormControl>
            )}
          />
        </Grid>
        <Grid item container spacing={2}>
          <Grid item>
            <Button
              variant='contained'
              color='secondary'
              onClick={onCancel}
              disabled={isSubmitting}>
              {cancelButtonText || translate('Action.Cancel')}
            </Button>
          </Grid>
          {onSkip && (
            <Grid item>
              <Button variant='contained' color='secondary' onClick={onSkip} loading={isSubmitting}>
                {translate('Action.SkipLicense')}
              </Button>
            </Grid>
          )}
          <Grid item>
            <Button variant='contained' type='submit' loading={isSubmitting}>
              {submitButtonText}
            </Button>
          </Grid>
        </Grid>
      </Grid>
      <ContentStandardsDropdownSelectionModal
        isOpen={isDropdownSelectionModalOpen}
        setOpen={setIsDropdownSelectionModalOpen}
        setSelections={handleNewContentStandardSelections}
        selections={contentStandardDropdownSelections}
      />
    </React.Fragment>
  );
};

export default LicenseForm;
