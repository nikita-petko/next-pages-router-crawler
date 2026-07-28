import React, { useState, useCallback, useEffect } from 'react';
import { useForm, Controller, useFormState, useWatch } from 'react-hook-form';
import type {
  UniverseContentMaturity,
  ContentStandardsQuestionAnswer,
} from '@rbx/client-content-licensing-api/v1';
import {
  LicenseType,
  LicenseVisibility,
  LicenseDurationType,
} from '@rbx/client-content-licensing-api/v1';
import { Radio, RadioGroup } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import {
  Grid,
  Typography,
  Button,
  FormHelperText,
  MenuItem,
  Select,
  FormControl,
  Link,
  Accordion,
  AccordionSummary,
  ExpandMoreIcon,
  AccordionDetails,
} from '@rbx/ui';
import { CONTENT_STANDARDS_HREF } from '@modules/licenses/urls';
import downloadPdf from '@modules/licenses/utils/downloadPdf';
import { PageLoading } from '@modules/miscellaneous/components';
import { Flex } from '@modules/miscellaneous/components/Flex';
import { useSettings } from '@modules/settings/SettingsProvider/SettingsProvider';
import { FrontendFlagName } from '@modules/toolboxService/toolboxFeatureManagement';
import { useToolboxServiceApiProvider } from '@modules/toolboxService/ToolboxServiceApiProvider';
import {
  TextFieldWithEnhancedHelperText,
  getMaxLengthValidationRule,
} from '../../../components/TextFieldWithEnhancedHelperText';
import useIpSnackbar from '../../../hooks/useIpSnackbar';
import { foundationRadioLabel } from '../../agreements/components/foundationRadioLabel';
import AmDivider from '../../components/AmDivider';
import {
  MAX_LICENSE_NAME_LENGTH,
  MAX_LICENSE_DESCRIPTION_LENGTH,
  MAX_SCOPE_OF_LICENSE_LENGTH,
  FALLBACK_CONTENT_STANDARDS_ID,
} from '../../constants';
import { CONTENT_MATURITY_LABELS_HREF } from '../../urls';
import { LicenseManagerClickEvent, useLicenseManagerLogger } from '../../utils/logger';
import { maturityRatingOptions } from '../../utils/maturityRating';
import type { LicenseDurationBucket } from '../../utils/timeLimitedLicense';
import {
  maximumDurationBuckets,
  minimumDurationBuckets,
  getLabelForDurationBucket,
  validateDurationBuckets,
} from '../../utils/timeLimitedLicense';
import type { DocumentValidationError } from '../../utils/validateDocumentPdf';
import { validateDocumentPdf } from '../../utils/validateDocumentPdf';
import { shouldRevShareOnActivation } from '../utils/shouldRevShareOnActivation';
import ContentStandardsDropdownSelectionModal from './ContentStandardsDropdownSelectionModal';
import useLicenseFormStyles from './LicenseForm.styles';
import { DropdownOptionContent, LicenseFormControlledSelect } from './LicenseFormControlledSelect';
import type { MinimumDAUValue } from './licenseFormTypes';
import { MonitorType, MinimumDAU } from './licenseFormTypes';

const LICENSE_VISIBILITY_FROM_RADIO_VALUE: Record<string, LicenseVisibility> = {
  [LicenseVisibility.Public]: LicenseVisibility.Public,
  [LicenseVisibility.Private]: LicenseVisibility.Private,
};

function licenseVisibilityFromRadioValue(value: string): LicenseVisibility | undefined {
  return LICENSE_VISIBILITY_FROM_RADIO_VALUE[value];
}

export interface LicenseFormData {
  name: string;
  description: string;
  revenueShare: number;
  maxMaturityRating: UniverseContentMaturity;
  minimumDAU: MinimumDAUValue;
  contentStandardsFile: File | undefined;
  contentStandardScope: string;
  contentStandardAnswers: ContentStandardsQuestionAnswer[];
  /** Set when reusing an existing PDF (edit mode or create-from-copy) */
  contentStandardsDocumentId?: string;
  /** Whether to delete the existing content standards document (edit or create-from-copy) */
  deleteContentStandardsDocument?: boolean;
  visibility?: LicenseVisibility;
  monitorType: MonitorType | null;
  durationType?: LicenseDurationType;
  minDuration?: LicenseDurationBucket;
  maxDuration?: LicenseDurationBucket;
  licenseType?: LicenseType;
}

type LicenseFormMode = { type: 'create' } | { type: 'edit'; hasAgreements: boolean };

const CREATE_MODE: LicenseFormMode = { type: 'create' };
export const EDIT_MODE: LicenseFormMode = {
  type: 'edit',
  hasAgreements: false,
};
export const EDIT_WITH_AGREEMENTS_MODE: LicenseFormMode = {
  type: 'edit',
  hasAgreements: true,
};

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

  return (
    <DropdownOptionContent
      simple={simple}
      title={
        isRevShareOnActivation
          ? translate('Label.MonetizeOnActivation')
          : translate('Label.MonetizeLater')
      }
      description={
        isRevShareOnActivation ? translate('Label.MonitorRevshare') : translate('Label.MonitorOnly')
      }
    />
  );
};

interface DurationOptionsProps {
  isPerpetual: boolean;
  simple?: boolean;
}

const DurationOptions: React.FC<DurationOptionsProps> = ({ isPerpetual, simple }) => {
  const { translate } = useTranslation();

  return (
    <DropdownOptionContent
      simple={simple}
      title={isPerpetual ? translate('Label.Perpetual') : translate('Label.TimeLimited')}
      description={
        isPerpetual
          ? translate('Description.DurationTypePerpetual')
          : translate('Description.DurationTypeTimeLimited')
      }
    />
  );
};

interface LicenseTypeOptionsProps {
  licenseType: LicenseType;
  simple?: boolean;
}

const LICENSE_TYPE_TITLE_KEYS: Record<LicenseType, string> = {
  FullExperience: 'Label.FullExperienceLicense',
  CollaborationInExperienceSale: 'Label.CollaborationLicense',
  MarketplaceSale: 'Label.MarketplaceSaleLicense',
};

const LICENSE_TYPE_DESCRIPTION_KEYS: Record<LicenseType, string> = {
  FullExperience: 'Description.LicenseTypeFullExperience',
  CollaborationInExperienceSale: 'Description.LicenseTypeCollaboration',
  MarketplaceSale: 'Description.LicenseTypeMarketplaceSale',
};

const LicenseTypeOptions: React.FC<LicenseTypeOptionsProps> = ({ licenseType, simple }) => {
  const { translate } = useTranslation();

  return (
    <DropdownOptionContent
      simple={simple}
      title={translate(LICENSE_TYPE_TITLE_KEYS[licenseType])}
      description={translate(LICENSE_TYPE_DESCRIPTION_KEYS[licenseType])}
    />
  );
};

const renderRevShareValue = (value: unknown) => {
  if (!value) {
    return null;
  }

  return (
    <RevShareTimingOptions
      isRevShareOnActivation={value === MonitorType.MonitorAndRevshare}
      simple
    />
  );
};

const renderDurationValue = (value: unknown) => {
  if (!value) {
    return null;
  }

  return <DurationOptions isPerpetual={value === LicenseDurationType.Perpetual} simple />;
};

function isLicenseType(value: unknown): value is LicenseType {
  return (
    value === LicenseType.FullExperience ||
    value === LicenseType.CollaborationInExperienceSale ||
    value === LicenseType.MarketplaceSale
  );
}

const renderLicenseTypeValue = (value: unknown) => {
  if (!isLicenseType(value)) {
    return null;
  }

  return <LicenseTypeOptions licenseType={value} simple />;
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
  hasPendingEdits = false,
  onBeforeSubmitModeratedChanges,
}: Props) => {
  const { translate, translateHTML } = useTranslation();
  const { classes } = useLicenseFormStyles();
  const { enqueueErrorSnackbar } = useIpSnackbar();
  const { logEvent } = useLicenseManagerLogger();
  const { isFetched } = useSettings();
  const { frontendFlags, loadingFrontendFlags } = useToolboxServiceApiProvider();
  const enableCollaborationLicensing =
    frontendFlags[FrontendFlagName.FrontendFlagEnableCreatorCollaborationLicensing] ?? false;
  const enableMarketplaceSalesLicensing =
    frontendFlags[FrontendFlagName.FrontendFlagEnableMarketplaceSalesLicensing] ?? false;

  const { control, handleSubmit, setValue, register, formState, getValues, setError, clearErrors } =
    useForm<LicenseFormData>({
      defaultValues,
      mode: 'onSubmit',
    });

  const { dirtyFields } = useFormState({ control });
  const areModeratedFieldsDisabled = hasPendingEdits;

  const applyDurationBucketErrors = useCallback(
    (min: LicenseDurationBucket | undefined, max: LicenseDurationBucket | undefined) => {
      const minResult = validateDurationBuckets(true, max)(min);
      const maxResult = validateDurationBuckets(false, min)(max);
      if (minResult !== true) {
        setError('minDuration', {
          type: 'durationBuckets',
          message: translate(minResult),
        });
      } else {
        clearErrors('minDuration');
      }
      if (maxResult !== true) {
        setError('maxDuration', {
          type: 'durationBuckets',
          message: translate(maxResult),
        });
      } else {
        clearErrors('maxDuration');
      }
    },
    [setError, clearErrors, translate],
  );

  const [
    durationType,
    minDuration,
    maxDuration,
    revenueShare,
    licenseType,
    deleteContentStandardsDocument,
  ] = useWatch({
    control,
    name: [
      'durationType',
      'minDuration',
      'maxDuration',
      'revenueShare',
      'licenseType',
      'deleteContentStandardsDocument',
    ],
  });
  const isTimeLimitedLicense = durationType === LicenseDurationType.TimeLimited;
  const isCollaborationLicense =
    enableCollaborationLicensing && licenseType === LicenseType.CollaborationInExperienceSale;
  const shouldEnforceRevShareOnActivation = shouldRevShareOnActivation({
    durationType,
    licenseType,
    enableCollaborationLicensing,
    enableMarketplaceSalesLicensing,
  });

  useEffect(() => {
    if (shouldEnforceRevShareOnActivation) {
      setValue('monitorType', MonitorType.MonitorAndRevshare);
    }
  }, [shouldEnforceRevShareOnActivation, setValue]);

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
        onBeforeSubmitModeratedChanges && (mode.type === 'create' || hasModeratedFieldChanges);

      if (shouldShowConfirmation) {
        const shouldProceed = await onBeforeSubmitModeratedChanges();
        if (!shouldProceed) {
          return;
        }
      }

      onSubmit(data, { hasModeratedChanges: hasModeratedFieldChanges });
    },
    [mode.type, hasPendingEdits, dirtyFields, onBeforeSubmitModeratedChanges, onSubmit],
  );

  if (!isFetched || loadingFrontendFlags) {
    return <PageLoading />;
  }

  const isEditMode = mode.type === 'edit';
  const areAgreementLockedFieldsDisabled = isEditMode && mode.hasAgreements;

  return (
    <>
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

          {!enableCollaborationLicensing && (
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
          )}

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
                className={enableCollaborationLicensing ? classes.semanticGapLargerBottom : ''}
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

          {enableCollaborationLicensing && (
            <FormControl fullWidth>
              <Controller
                name='licenseType'
                control={control}
                render={({ field, fieldState: { error } }) => (
                  <LicenseFormControlledSelect
                    field={field}
                    id='license-type-select'
                    error={!!error}
                    helperText={error?.message}
                    label={translate('Label.SelectLicenseType')}
                    renderValue={renderLicenseTypeValue}
                    disabled={isEditMode}
                    onChange={(event) => {
                      field.onChange(event);
                      if (mode.type === 'create') {
                        logEvent(LicenseManagerClickEvent.IphLicenseCreateLicenseTypeClickEvent, {
                          licenseType: String(event.target.value),
                        });
                      }
                    }}>
                    <MenuItem
                      value={LicenseType.FullExperience}
                      data-testId='full-experience-option'>
                      <LicenseTypeOptions licenseType={LicenseType.FullExperience} />
                    </MenuItem>
                    <MenuItem
                      value={LicenseType.CollaborationInExperienceSale}
                      data-testId='collaboration-option'>
                      <LicenseTypeOptions licenseType={LicenseType.CollaborationInExperienceSale} />
                    </MenuItem>
                    {enableMarketplaceSalesLicensing && (
                      <MenuItem
                        value={LicenseType.MarketplaceSale}
                        data-testId='marketplace-sale-option'>
                        <LicenseTypeOptions licenseType={LicenseType.MarketplaceSale} />
                      </MenuItem>
                    )}
                  </LicenseFormControlledSelect>
                )}
                rules={{ required: translate('Label.FieldIsRequired') }}
              />
            </FormControl>
          )}
        </Grid>
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
              render={({ field, fieldState: { error } }) => (
                <LicenseFormControlledSelect
                  field={field}
                  id='duration-type-select'
                  error={!!error}
                  helperText={error?.message}
                  label={translate('Action.SelectDuration')}
                  renderValue={renderDurationValue}
                  disabled={isEditMode}
                  onChange={(event) => {
                    field.onChange(event);
                    if (mode.type === 'create') {
                      logEvent(LicenseManagerClickEvent.IphLicenseCreateDurationTypeClickEvent, {
                        durationType: Number(event.target.value),
                      });
                    }
                  }}>
                  <MenuItem
                    value={LicenseDurationType.TimeLimited}
                    data-testId='time-limited-option'>
                    <DurationOptions isPerpetual={false} />
                  </MenuItem>
                  <MenuItem value={LicenseDurationType.Perpetual} data-testId='perpetual-option'>
                    <DurationOptions isPerpetual />
                  </MenuItem>
                </LicenseFormControlledSelect>
              )}
              rules={{ required: translate('Label.FieldIsRequired') }}
            />
          </FormControl>
        </Grid>
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
                render={({ field, fieldState: { error } }) => (
                  <Select
                    {...field}
                    disabled={areAgreementLockedFieldsDisabled}
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
                render={({ field, fieldState: { error } }) => (
                  <Select
                    {...field}
                    disabled={areAgreementLockedFieldsDisabled}
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
              render={({ field, fieldState: { error } }) => (
                <Select
                  {...field}
                  disabled={areAgreementLockedFieldsDisabled}
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
                shouldEnforceRevShareOnActivation
                  ? classes.paddingMediumBtm
                  : classes.semanticGapLargerBottom
              }>
              {translate('Label.DefaultRevenueShareTiming')}
            </Typography>
            {isTimeLimitedLicense && (
              <Typography
                color='secondary'
                component='p'
                className={
                  isCollaborationLicense
                    ? classes.paddingMediumBtm
                    : classes.semanticGapLargerBottom
                }>
                {translate('Description.TimelimitedRevenueShareTiming')}
              </Typography>
            )}
            {isCollaborationLicense && (
              <Typography
                color='secondary'
                component='p'
                className={classes.semanticGapLargerBottom}>
                {translate('Description.CollaborationRevenueShareTiming')}
              </Typography>
            )}
            <FormControl fullWidth>
              <Controller
                name='monitorType'
                control={control}
                render={({ field, fieldState: { error } }) => (
                  <LicenseFormControlledSelect
                    field={field}
                    id='revshare-timing-select'
                    error={!!error}
                    helperText={error?.message}
                    label={translate('Label.SelectRevShareTiming')}
                    renderValue={renderRevShareValue}
                    disabled={shouldEnforceRevShareOnActivation}>
                    <MenuItem value={MonitorType.MonitorAndRevshare}>
                      <RevShareTimingOptions isRevShareOnActivation />
                    </MenuItem>
                    <MenuItem value={MonitorType.MonitorOnly}>
                      <RevShareTimingOptions isRevShareOnActivation={false} />
                    </MenuItem>
                  </LicenseFormControlledSelect>
                )}
                rules={{
                  required: shouldEnforceRevShareOnActivation
                    ? false
                    : translate('Error.PleaseSelectType'),
                }}
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
              render={({ field, fieldState: { error } }) => (
                <Select
                  {...field}
                  disabled={areAgreementLockedFieldsDisabled}
                  id='minimum-dau-select'
                  error={!!error}
                  helperText={
                    error?.message ??
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
              render={({ field, fieldState: { error } }) => (
                <Select
                  {...field}
                  disabled={areAgreementLockedFieldsDisabled}
                  id='maturity-rating-select'
                  error={!!error}
                  helperText={
                    error?.message ??
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
                  !!formState.errors.contentStandardAnswers && !hideContentStandardsAnswerError
                    ? true
                    : isContentStandardsExpanded
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
                            (mode.type === 'edit' ||
                              (mode.type === 'create' &&
                                Boolean(defaultValues.contentStandardsDocumentId))) &&
                            defaultValues.contentStandardsDocumentId &&
                            defaultValues.contentStandardsDocumentId !==
                              FALLBACK_CONTENT_STANDARDS_ID &&
                            !deleteContentStandardsDocument;
                          const hasNewFile = !!field.value;
                          const showDocument = hasExistingDocument ? true : hasNewFile;

                          return (
                            <>
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
                                    aria-label={
                                      showDocument
                                        ? translate('Action.Replace')
                                        : translate('Action.UploadFile')
                                    }
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
                            </>
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
                <RadioGroup
                  value={field.value ?? ''}
                  onValueChange={(value) => {
                    const next = licenseVisibilityFromRadioValue(value);
                    if (next !== undefined) {
                      field.onChange(next);
                    }
                  }}
                  size='Medium'>
                  <Grid container direction='column' spacing={2}>
                    <Grid item>
                      <Radio
                        value={LicenseVisibility.Public}
                        label={foundationRadioLabel(
                          <>
                            <Typography variant='largeLabel2' component='div' gutterBottom>
                              {translate('Label.Public')}
                            </Typography>
                            <Typography variant='largeLabel1' component='div' color='secondary'>
                              {translate('Description.PublicLicense')}
                            </Typography>
                          </>,
                        )}
                      />
                    </Grid>
                    <Grid item>
                      <Radio
                        value={LicenseVisibility.Private}
                        label={foundationRadioLabel(
                          <>
                            <Typography variant='largeLabel2' component='div' gutterBottom>
                              {translate('Label.Private')}
                            </Typography>
                            <Typography variant='largeLabel1' component='div' color='secondary'>
                              {translate('Description.PrivateLicense')}
                            </Typography>
                          </>,
                        )}
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
              {cancelButtonText ?? translate('Action.Cancel')}
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
    </>
  );
};

export default LicenseForm;
