import React, { useState, useCallback, useEffect } from 'react';
import type { FieldErrors } from 'react-hook-form';
import { useForm, Controller, useFormState, useWatch } from 'react-hook-form';
import type {
  CreatorEarningsBucket,
  UniverseContentMaturity,
  ContentStandardsQuestionAnswer,
} from '@rbx/client-content-licensing-api/v1';
import {
  CreatorEarningsBucket as CreatorEarningsBucketValue,
  LicenseType,
  LicenseVisibility,
  LicenseDurationType,
} from '@rbx/client-content-licensing-api/v1';
import { useFlag } from '@rbx/flags';
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
import { isIphInGameSalesAvatarMarketplaceSalesLicenseCreationEnabled } from '@generated/flags/contentLicensing';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { CONTENT_STANDARDS_HREF } from '@modules/licenses/urls';
import downloadPdf from '@modules/licenses/utils/downloadPdf';
import { PageLoading } from '@modules/miscellaneous/components';
import { Flex } from '@modules/miscellaneous/components/Flex';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useSettings } from '@modules/settings/SettingsProvider/SettingsProvider';
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
import {
  LicenseManagerClickEvent,
  LicenseManagerImpressionEvent,
  useLicenseManagerLogger,
  useLicenseManagerLoggerLogOnce,
} from '../../utils/logger';
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
  licenseType?: LicenseType | null;
  licenseCategory?: LicenseCategory;
  resellPreference?: ResellPreference;
  minimumCreatorEarningsBucket?: CreatorEarningsBucket;
}

const LICENSE_CATEGORY = {
  FullGame: 'FullGame',
  Collab: 'Collab',
} as const;

type LicenseCategory = (typeof LICENSE_CATEGORY)[keyof typeof LICENSE_CATEGORY];

export const RESELL_PREFERENCE = {
  Yes: 'Yes',
  No: 'No',
} as const;

type ResellPreference = (typeof RESELL_PREFERENCE)[keyof typeof RESELL_PREFERENCE];

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

export type LicenseFormAction = 'create' | 'update' | 'copy';

export interface LicenseFormAnalyticsContext {
  formAction: LicenseFormAction;
  entrySource: 'listingDetails';
  listingId?: string;
  licenseId?: string;
  sourceLicenseId?: string;
  hasAgreements?: boolean;
  hasPendingEdits?: boolean;
}

interface Props {
  defaultValues: LicenseFormData;
  onSubmit: (data: LicenseFormData, options: LicenseFormSubmitOptions) => void;
  onCancel: () => void;
  submitButtonText: string;
  cancelButtonText?: string;
  isSubmitting: boolean;
  mode?: LicenseFormMode;
  /** Whether there are pending edits awaiting moderation (disables moderated fields) */
  hasPendingEdits?: boolean;
  /**
   * Optional callback invoked before submit when moderated fields have changed (edit mode)
   * or when creating a new license (create mode).
   * Returns a promise that resolves to true if submit should proceed, false to cancel.
   */
  onBeforeSubmitModeratedChanges?: () => Promise<boolean>;
  analyticsContext?: LicenseFormAnalyticsContext;
}

// Fields that require moderation review when changed
const MODERATED_FIELDS: (keyof LicenseFormData)[] = [
  'name',
  'description',
  'contentStandardsFile',
  'contentStandardScope',
];

export const buildLicenseFormAnalyticsParameters = (
  context: LicenseFormAnalyticsContext,
  data?: LicenseFormData,
) => ({
  formAction: context.formAction,
  entrySource: context.entrySource,
  ...(context.listingId ? { listingId: context.listingId } : {}),
  ...(context.licenseId ? { licenseId: context.licenseId } : {}),
  ...(context.sourceLicenseId ? { sourceLicenseId: context.sourceLicenseId } : {}),
  ...(context.hasAgreements !== undefined ? { hasAgreements: context.hasAgreements } : {}),
  ...(context.hasPendingEdits !== undefined ? { hasPendingEdits: context.hasPendingEdits } : {}),
  ...(data?.licenseType != null ? { licenseType: data.licenseType } : {}),
  ...(data?.durationType != null ? { durationType: data.durationType } : {}),
  ...(data?.visibility != null ? { visibility: data.visibility } : {}),
});

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
  const translation = useTranslation();
  const { translate } = translation;
  const { tPendingTranslation } = useTranslationWrapper(translation);

  return (
    <DropdownOptionContent
      simple={simple}
      title={isPerpetual ? translate('Label.Perpetual') : translate('Label.TimeLimited')}
      description={
        isPerpetual
          ? tPendingTranslation(
              'Perpetual licenses allow use of your IP from the date an agreement is active until terminated',
              'Description text shown as part of the Perpetual Option for the Duration Type Dropdown List.',
              translationKey(
                'Description.DurationTypePerpetual',
                TranslationNamespace.AgreementsManager,
              ),
            )
          : tPendingTranslation(
              'Time-limited licenses allows use (if full game license) or sale (if collab license) of your IP within defined date boundaries',
              'Description text shown as part of the Perpetual Option for the Duration Type Dropdown List.',
              translationKey(
                'Description.DurationTypeTimeLimited',
                TranslationNamespace.AgreementsManager,
              ),
            )
      }
    />
  );
};

interface LicenseCategoryOptionsProps {
  licenseCategory: LicenseCategory;
  simple?: boolean;
}

const LicenseCategoryOptions: React.FC<LicenseCategoryOptionsProps> = ({
  licenseCategory,
  simple,
}) => {
  const { tPendingTranslation } = useTranslationWrapper(useTranslation());

  if (licenseCategory === LICENSE_CATEGORY.FullGame) {
    return (
      <DropdownOptionContent
        simple={simple}
        title={tPendingTranslation(
          'Full game',
          'Title for the license type that applies IP usage and revenue share to a full game.',
          translationKey('Label.FullGame', TranslationNamespace.AgreementsManager),
        )}
        description={tPendingTranslation(
          'Creators must use your IP as a central part of their game. Revenue share applies to all game earnings.',
          'Description for the full-game license type option.',
          translationKey('Description.LicenseTypeFullGame', TranslationNamespace.AgreementsManager),
        )}
      />
    );
  }

  return (
    <DropdownOptionContent
      simple={simple}
      title={tPendingTranslation(
        'Collab',
        'Title for the license type that permits limited IP collaboration.',
        translationKey('Label.Collab', TranslationNamespace.AgreementsManager),
      )}
      description={tPendingTranslation(
        'Creators can use your IP in a limited way, such as selling IP-based items. Revenue share applies only to sold items that use your IP.',
        'Description for the collaboration license type option.',
        translationKey('Description.LicenseTypeCollab', TranslationNamespace.AgreementsManager),
      )}
    />
  );
};

interface SaleLocationOptionsProps {
  licenseType: LicenseType;
  simple?: boolean;
}

const SaleLocationOptions: React.FC<SaleLocationOptionsProps> = ({ licenseType, simple }) => {
  const { tPendingTranslation } = useTranslationWrapper(useTranslation());

  if (licenseType === LicenseType.CollaborationInExperienceSale) {
    return (
      <DropdownOptionContent
        simple={simple}
        title={tPendingTranslation(
          'In-game',
          'Title for the sale location where IP-based items are sold inside a game.',
          translationKey('Label.InGame', TranslationNamespace.AgreementsManager),
        )}
        description={tPendingTranslation(
          'Creators can sell IP-based items in-game.',
          'Description for the in-game sale location option.',
          translationKey('Description.SaleLocationInGame', TranslationNamespace.AgreementsManager),
        )}
      />
    );
  }

  return (
    <DropdownOptionContent
      simple={simple}
      title={tPendingTranslation(
        'Avatar marketplace',
        'Title for the sale location where IP-based items are sold on Avatar Marketplace.',
        translationKey('Label.AvatarMarketplace', TranslationNamespace.AgreementsManager),
      )}
      description={tPendingTranslation(
        'Creators can sell IP-based items on the Roblox Marketplace including games that include Marketplace sales.',
        'Description for the Avatar Marketplace sale location option.',
        translationKey(
          'Description.SaleLocationAvatarMarketplace',
          TranslationNamespace.AgreementsManager,
        ),
      )}
    />
  );
};

interface VisibilityOptionsProps {
  visibility: LicenseVisibility;
  simple?: boolean;
}

const VISIBILITY_TITLE_KEYS: Record<LicenseVisibility, string> = {
  [LicenseVisibility.Public]: 'Label.Public',
  [LicenseVisibility.Private]: 'Label.Private',
};

const VISIBILITY_DESCRIPTION_KEYS: Record<LicenseVisibility, string> = {
  [LicenseVisibility.Public]: 'Description.PublicLicense',
  [LicenseVisibility.Private]: 'Description.PrivateLicense',
};

const VisibilityOptions: React.FC<VisibilityOptionsProps> = ({ visibility, simple }) => {
  const { translate } = useTranslation();

  return (
    <DropdownOptionContent
      simple={simple}
      title={translate(VISIBILITY_TITLE_KEYS[visibility])}
      description={translate(VISIBILITY_DESCRIPTION_KEYS[visibility])}
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

function isLicenseCategory(value: unknown): value is LicenseCategory {
  return value === LICENSE_CATEGORY.FullGame || value === LICENSE_CATEGORY.Collab;
}

const renderLicenseCategoryValue = (value: unknown) => {
  if (!isLicenseCategory(value)) {
    return null;
  }

  return <LicenseCategoryOptions licenseCategory={value} simple />;
};

function isSaleLocationLicenseType(value: unknown): value is LicenseType {
  return (
    value === LicenseType.CollaborationInExperienceSale || value === LicenseType.MarketplaceSale
  );
}

const renderSaleLocationValue = (value: unknown) => {
  if (!isSaleLocationLicenseType(value)) {
    return null;
  }

  return <SaleLocationOptions licenseType={value} simple />;
};

function getLicenseCategory(licenseType: LicenseType | undefined): LicenseCategory | undefined {
  if (
    licenseType === LicenseType.CollaborationInExperienceSale ||
    licenseType === LicenseType.MarketplaceSale
  ) {
    return LICENSE_CATEGORY.Collab;
  }
  if (licenseType === LicenseType.FullExperience) {
    return LICENSE_CATEGORY.FullGame;
  }
  return undefined;
}

function isLicenseVisibility(value: unknown): value is LicenseVisibility {
  return value === LicenseVisibility.Public || value === LicenseVisibility.Private;
}

const renderVisibilityValue = (value: unknown) => {
  if (!isLicenseVisibility(value)) {
    return null;
  }

  return <VisibilityOptions visibility={value} simple />;
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
  mode = CREATE_MODE,
  hasPendingEdits = false,
  onBeforeSubmitModeratedChanges,
  analyticsContext,
}: Props) => {
  const translation = useTranslation();
  const { translate, translateHTML, translateWithNamespace } = translation;
  const { tPendingTranslation } = useTranslationWrapper(translation);
  const { classes } = useLicenseFormStyles();
  const { enqueueErrorSnackbar } = useIpSnackbar();
  const { logEvent } = useLicenseManagerLogger();
  const { logOnce } = useLicenseManagerLoggerLogOnce();
  const { isFetched } = useSettings();
  const { ready: isLicenseCreationFlagReady, value: licenseCreationFlagValue } = useFlag(
    isIphInGameSalesAvatarMarketplaceSalesLicenseCreationEnabled,
  );
  const isLicenseCreationEnabled = licenseCreationFlagValue ?? false;
  const unknownDurationLabel = translate('Label.Unknown');
  const resellPreferenceYesLabel = translateWithNamespace(
    TranslationNamespace.Controls,
    'Action.Yes',
  );
  const resellPreferenceNoLabel = translateWithNamespace(
    TranslationNamespace.Controls,
    'Action.No',
  );
  const renderResellPreferenceValue = useCallback(
    (value: unknown) => {
      if (value === RESELL_PREFERENCE.Yes) {
        return resellPreferenceYesLabel;
      }
      if (value === RESELL_PREFERENCE.No) {
        return resellPreferenceNoLabel;
      }
      return null;
    },
    [resellPreferenceNoLabel, resellPreferenceYesLabel],
  );

  const { control, handleSubmit, setValue, register, formState, getValues, setError, clearErrors } =
    useForm<LicenseFormData>({
      defaultValues: {
        ...defaultValues,
        licenseCategory: getLicenseCategory(defaultValues.licenseType ?? undefined),
      },
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
    licenseCategory,
    deleteContentStandardsDocument,
  ] = useWatch({
    control,
    name: [
      'durationType',
      'minDuration',
      'maxDuration',
      'revenueShare',
      'licenseType',
      'licenseCategory',
      'deleteContentStandardsDocument',
    ],
  });
  const isTimeLimitedLicense = durationType === LicenseDurationType.TimeLimited;
  const shouldShowExperienceEligibility =
    !isLicenseCreationEnabled ||
    licenseType === LicenseType.FullExperience ||
    licenseType === LicenseType.CollaborationInExperienceSale;
  const shouldShowCreatorEligibility =
    isLicenseCreationEnabled && licenseType === LicenseType.MarketplaceSale;
  const licenseTypeRevenueShareTimingDescription = (() => {
    if (!isLicenseCreationEnabled) {
      return null;
    }
    if (licenseType === LicenseType.CollaborationInExperienceSale) {
      return tPendingTranslation(
        'For in-game sales licenses, revenue share will only start when the asset associated with the license has been sold or otherwise distributed in the game. The creator will designate, and you will be able to see, the asset ID that will be used in connection with the sublicense.',
        'Explanatory text shown in the revenue share timing section when the rights holder has selected their license type to be In-game sales type',
        translationKey(
          'Description.CollaborationRevenueShareTiming',
          TranslationNamespace.AgreementsManager,
        ),
      );
    }
    if (licenseType === LicenseType.MarketplaceSale) {
      return tPendingTranslation(
        'Avatar marketplace licenses will only monetize when the avatar item associated with the license has been sold either through Avatar Marketplace or in games that contain a marketplace.',
        'Explanatory text shown in the revenue share timing section when the rights holder has selected their license type to be Marketplace sales license aka Avatar marketplace sales license.',
        translationKey(
          'Description.MarketplaceSalesRevenueShareTiming',
          TranslationNamespace.AgreementsManager,
        ),
      );
    }
    return null;
  })();
  const shouldEnforceRevShareOnActivation = shouldRevShareOnActivation({
    durationType,
    licenseType: licenseType ?? undefined,
    enableCollaborationLicensing: isLicenseCreationEnabled,
    enableMarketplaceSalesLicensing: isLicenseCreationEnabled,
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

  useEffect(() => {
    if (!isFetched || !isLicenseCreationFlagReady || !analyticsContext) {
      return;
    }
    logOnce(
      LicenseManagerImpressionEvent.IphLicenseFormImpressionEvent,
      {
        ...buildLicenseFormAnalyticsParameters(analyticsContext, defaultValues),
        isLicenseCreationEnabled,
      },
      `${analyticsContext.formAction}:${analyticsContext.licenseId ?? analyticsContext.sourceLicenseId ?? analyticsContext.listingId ?? 'new'}`,
    );
  }, [
    analyticsContext,
    defaultValues,
    isFetched,
    isLicenseCreationEnabled,
    isLicenseCreationFlagReady,
    logOnce,
  ]);

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

      if (analyticsContext) {
        logEvent(LicenseManagerClickEvent.IphLicenseFormSubmitClickEvent, {
          ...buildLicenseFormAnalyticsParameters(analyticsContext, data),
          validationPassed: true,
          hasModeratedChanges: hasModeratedFieldChanges,
          confirmationRequired: Boolean(shouldShowConfirmation),
        });
      }

      if (shouldShowConfirmation) {
        const shouldProceed = await onBeforeSubmitModeratedChanges();
        if (!shouldProceed) {
          return;
        }
      }

      onSubmit(data, { hasModeratedChanges: hasModeratedFieldChanges });
    },
    [
      analyticsContext,
      mode.type,
      hasPendingEdits,
      dirtyFields,
      onBeforeSubmitModeratedChanges,
      onSubmit,
      logEvent,
    ],
  );

  const handleInvalidSubmit = useCallback(
    (errors: FieldErrors<LicenseFormData>) => {
      if (!analyticsContext) {
        return;
      }
      const parameters = {
        ...buildLicenseFormAnalyticsParameters(analyticsContext, getValues()),
        validationPassed: false,
        errorFieldCount: Object.keys(errors).length,
      };
      logEvent(LicenseManagerClickEvent.IphLicenseFormSubmitClickEvent, parameters);
      logEvent(
        LicenseManagerImpressionEvent.IphLicenseFormValidationFailureImpressionEvent,
        parameters,
      );
    },
    [analyticsContext, getValues, logEvent],
  );

  const handleCancel = useCallback(() => {
    if (analyticsContext) {
      logEvent(
        LicenseManagerClickEvent.IphLicenseFormCancelClickEvent,
        buildLicenseFormAnalyticsParameters(analyticsContext, getValues()),
      );
    }
    onCancel();
  }, [analyticsContext, getValues, logEvent, onCancel]);

  if (!isFetched || !isLicenseCreationFlagReady) {
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
        onSubmit={handleSubmit(handleFormSubmit, handleInvalidSubmit)}>
        {isLicenseCreationEnabled && (
          <Grid item>
            <Typography variant='h5' component='h2' gutterBottom>
              {tPendingTranslation(
                'License terms',
                'Heading for the section where a rights holder sets the terms of a license.',
                translationKey('Heading.LicenseTerms', TranslationNamespace.AgreementsManager),
              )}
            </Typography>
            <Typography color='secondary' component='p' className={classes.semanticGapLargerBottom}>
              {tPendingTranslation(
                'These terms will apply to all agreements created under this license.',
                'Description for the section where a rights holder sets the terms of a license.',
                translationKey('Description.LicenseTerms', TranslationNamespace.AgreementsManager),
              )}
            </Typography>
            <FormControl
              fullWidth
              className={
                licenseCategory === LICENSE_CATEGORY.Collab
                  ? classes.semanticGapLargerBottom
                  : undefined
              }>
              <Controller
                name='licenseCategory'
                control={control}
                render={({ field, fieldState: { error } }) => (
                  <LicenseFormControlledSelect
                    field={field}
                    id='license-type-select'
                    error={!!error}
                    helperText={error?.message}
                    label={translate('Label.SelectLicenseType')}
                    renderValue={renderLicenseCategoryValue}
                    disabled={isEditMode}
                    onChange={(event) => {
                      field.onChange(event);
                      const selectedCategory = event.target.value;
                      if (selectedCategory === LICENSE_CATEGORY.FullGame) {
                        setValue('licenseType', LicenseType.FullExperience);
                        clearErrors('licenseType');
                      } else if (selectedCategory === LICENSE_CATEGORY.Collab) {
                        setValue('licenseType', null);
                        clearErrors('licenseType');
                      }
                      setValue('resellPreference', undefined);
                      clearErrors('resellPreference');
                      setValue('minimumCreatorEarningsBucket', undefined);
                      clearErrors('minimumCreatorEarningsBucket');
                      if (
                        mode.type === 'create' &&
                        selectedCategory === LICENSE_CATEGORY.FullGame
                      ) {
                        logEvent(LicenseManagerClickEvent.IphLicenseCreateLicenseTypeClickEvent, {
                          licenseType: LicenseType.FullExperience,
                        });
                      }
                    }}>
                    <MenuItem
                      value={LICENSE_CATEGORY.FullGame}
                      data-testid='full-experience-option'>
                      <LicenseCategoryOptions licenseCategory={LICENSE_CATEGORY.FullGame} />
                    </MenuItem>
                    <MenuItem value={LICENSE_CATEGORY.Collab} data-testid='collaboration-option'>
                      <LicenseCategoryOptions licenseCategory={LICENSE_CATEGORY.Collab} />
                    </MenuItem>
                  </LicenseFormControlledSelect>
                )}
                rules={{ required: translate('Label.FieldIsRequired') }}
              />
            </FormControl>
            {licenseCategory === LICENSE_CATEGORY.Collab && (
              <>
                <Typography
                  color='secondary'
                  component='p'
                  className={classes.semanticGapLargerBottom}>
                  {tPendingTranslation(
                    'Where can creators sell IP-based content to players?',
                    'Prompt shown above the sale location dropdown for collaboration licenses.',
                    translationKey(
                      'Description.SelectSaleLocation',
                      TranslationNamespace.AgreementsManager,
                    ),
                  )}
                </Typography>
                <FormControl
                  fullWidth
                  className={
                    licenseType === LicenseType.MarketplaceSale
                      ? classes.semanticGapLargerBottom
                      : undefined
                  }>
                  <Controller
                    name='licenseType'
                    control={control}
                    render={({ field, fieldState: { error } }) => (
                      <LicenseFormControlledSelect
                        field={field}
                        id='sale-location-select'
                        error={!!error}
                        helperText={error?.message}
                        label={tPendingTranslation(
                          'Select sale location',
                          'Label for the dropdown used to choose where IP-based content may be sold.',
                          translationKey(
                            'Label.SelectSaleLocation',
                            TranslationNamespace.AgreementsManager,
                          ),
                        )}
                        renderValue={renderSaleLocationValue}
                        disabled={isEditMode}
                        onChange={(event) => {
                          field.onChange(event);
                          if (event.target.value !== LicenseType.MarketplaceSale) {
                            setValue('resellPreference', undefined);
                            clearErrors('resellPreference');
                            setValue('minimumCreatorEarningsBucket', undefined);
                            clearErrors('minimumCreatorEarningsBucket');
                          }
                          if (mode.type === 'create') {
                            logEvent(
                              LicenseManagerClickEvent.IphLicenseCreateLicenseTypeClickEvent,
                              {
                                licenseType: String(event.target.value),
                              },
                            );
                          }
                        }}>
                        <MenuItem
                          value={LicenseType.CollaborationInExperienceSale}
                          data-testid='in-game-sale-location-option'>
                          <SaleLocationOptions
                            licenseType={LicenseType.CollaborationInExperienceSale}
                          />
                        </MenuItem>
                        <MenuItem
                          value={LicenseType.MarketplaceSale}
                          data-testid='avatar-marketplace-sale-location-option'>
                          <SaleLocationOptions licenseType={LicenseType.MarketplaceSale} />
                        </MenuItem>
                      </LicenseFormControlledSelect>
                    )}
                    rules={{ required: translate('Label.FieldIsRequired') }}
                  />
                </FormControl>
                {licenseType === LicenseType.MarketplaceSale && (
                  <>
                    <Typography
                      color='secondary'
                      component='p'
                      className={classes.semanticGapLargerBottom}>
                      {tPendingTranslation(
                        'Can creators re-sell IP-based items?',
                        'Prompt shown above the re-sell preference dropdown for Avatar Marketplace licenses.',
                        translationKey(
                          'Description.ResellPreference',
                          TranslationNamespace.AgreementsManager,
                        ),
                      )}
                    </Typography>
                    <FormControl fullWidth>
                      <Controller
                        name='resellPreference'
                        control={control}
                        render={({ field, fieldState: { error } }) => (
                          <LicenseFormControlledSelect
                            field={field}
                            id='resell-preference-select'
                            error={!!error}
                            helperText={error?.message}
                            label={tPendingTranslation(
                              'Select re-sell preference',
                              'Label for choosing whether Creators may re-sell IP-based items.',
                              translationKey(
                                'Label.SelectResellPreference',
                                TranslationNamespace.AgreementsManager,
                              ),
                            )}
                            renderValue={renderResellPreferenceValue}
                            disabled={areAgreementLockedFieldsDisabled}>
                            <MenuItem
                              value={RESELL_PREFERENCE.Yes}
                              data-testid='resell-preference-yes-option'>
                              {resellPreferenceYesLabel}
                            </MenuItem>
                            <MenuItem
                              value={RESELL_PREFERENCE.No}
                              data-testid='resell-preference-no-option'>
                              {resellPreferenceNoLabel}
                            </MenuItem>
                          </LicenseFormControlledSelect>
                        )}
                        rules={{
                          required: areAgreementLockedFieldsDisabled
                            ? false
                            : translate('Label.FieldIsRequired'),
                        }}
                      />
                    </FormControl>
                  </>
                )}
              </>
            )}
          </Grid>
        )}
        <Grid item>
          <Typography variant='h5' component='h2' gutterBottom>
            {translate('Heading.LicenseDetails')}
          </Typography>
          <Typography color='secondary' component='p' className={classes.semanticGapLargerBottom}>
            {translate('Description.LicenseDetails')}
          </Typography>

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
                className={isLicenseCreationEnabled ? '' : classes.semanticGapLargerBottom}
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

          {!isLicenseCreationEnabled && (
            <FormControl fullWidth>
              <Select
                id='license-type-select'
                value='Experiences'
                disabled
                label={translate('Label.LicenseType')}>
                <MenuItem value='Experiences'>{translate('Label.FullExperienceLicense')}</MenuItem>
              </Select>
            </FormControl>
          )}
        </Grid>
        <Grid item>
          <Typography variant='h5' component='h2' className={classes.paddingMediumBtm}>
            {translate('Label.Duration')}
          </Typography>
          <Typography color='secondary' component='p' className={classes.semanticGapLargerBottom}>
            {tPendingTranslation(
              'Licenses can be time-limited or perpetual. This field cannot be changed after submission.',
              'Description text shown in the section where a user would decide the duration type for a license agreement. Possible license duration types are time-limited (meaning that there is a defined time boundary that the agreement can be active for, such as 3 days to 7 days) or perpetual (meaning that the agreement can be active forever without any time boundaries defined).',
              translationKey(
                'Description.LicenseFormDuration',
                TranslationNamespace.AgreementsManager,
              ),
            )}
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
                    data-testid='time-limited-option'>
                    <DurationOptions isPerpetual={false} />
                  </MenuItem>
                  <MenuItem value={LicenseDurationType.Perpetual} data-testid='perpetual-option'>
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
              {tPendingTranslation(
                'If you selected the time-limited option, select the specified range below. This value will not be editable once there is any sublicense with a creator. The creator will specify a start and end date within this boundary when they request this license.',
                "Description text shown to designate the duration range section of the form. This is where the user will make selections to define a time boundary for their license's active period. A license is an entity that permits an experience to use the user's intellectual property.",
                translationKey(
                  'Description.LicenseFormDurationRange',
                  TranslationNamespace.AgreementsManager,
                ),
              )}
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
                      const newMin = Number(e.target.value);
                      applyDurationBucketErrors(newMin, getValues('maxDuration'));
                    }}>
                    {minimumDurationBuckets.map((value) => (
                      <MenuItem key={value} value={value}>
                        {getLabelForDurationBucket(value, translate, unknownDurationLabel)}
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
                      const newMax = Number(e.target.value);
                      applyDurationBucketErrors(getValues('minDuration'), newMax);
                    }}>
                    {maximumDurationBuckets.map((value) => (
                      <MenuItem key={value} value={value}>
                        {getLabelForDurationBucket(value, translate, unknownDurationLabel)}
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
            {translateWithNamespace(
              TranslationNamespace.AgreementsManager,
              'Label.RevenueShareRate',
            )}
          </Typography>
          <Typography color='secondary' component='p' className={classes.semanticGapLargerBottom}>
            {tPendingTranslation(
              "Set the revenue share for this license. This value will not be editable once there is any sublicense with a creator. This is the percentage you’ll receive from the creator's gross Robux earned under this license after platform fees. However, not all creations earn on Roblox.",
              'Description for revenue share form',
              translationKey(
                'Description.RevenueShareEditable',
                TranslationNamespace.AgreementsManager,
              ),
            )}
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
            {(isTimeLimitedLicense || licenseTypeRevenueShareTimingDescription != null) && (
              <div className={classes.revenueShareTimingDescriptions}>
                {isTimeLimitedLicense && (
                  <Typography color='secondary' component='p'>
                    {translate('Description.TimelimitedRevenueShareTiming')}
                  </Typography>
                )}
                {licenseTypeRevenueShareTimingDescription != null && (
                  <Typography color='secondary' component='p'>
                    {licenseTypeRevenueShareTimingDescription}
                  </Typography>
                )}
              </div>
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
        {shouldShowExperienceEligibility && (
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
        )}
        {shouldShowCreatorEligibility && (
          <Grid item>
            <Typography variant='h5' component='h2' gutterBottom>
              {tPendingTranslation(
                'Creator eligibility',
                'Heading for the section where a rights holder sets creator eligibility criteria.',
                translationKey(
                  'Heading.CreatorEligibility',
                  TranslationNamespace.AgreementsManager,
                ),
              )}
            </Typography>
            <Typography color='secondary' component='p' className={classes.semanticGapLargerBottom}>
              {tPendingTranslation(
                'Set the criteria creators must meet to use this license.',
                'Description for the creator eligibility section.',
                translationKey(
                  'Description.CreatorEligibility',
                  TranslationNamespace.AgreementsManager,
                ),
              )}
            </Typography>
            <FormControl fullWidth>
              <Controller
                name='minimumCreatorEarningsBucket'
                control={control}
                render={({ field, fieldState: { error } }) => (
                  <Select
                    {...field}
                    id='minimum-creator-earnings-select'
                    error={!!error}
                    helperText={error?.message}
                    disabled={areAgreementLockedFieldsDisabled}
                    label={tPendingTranslation(
                      'Select minimum 90 day earnings',
                      'Label for selecting the minimum creator earnings over the last 90 days.',
                      translationKey(
                        'Label.SelectMinimum90DayEarnings',
                        TranslationNamespace.AgreementsManager,
                      ),
                    )}>
                    <MenuItem value={CreatorEarningsBucketValue.NotApplicable}>
                      {translate('Label.NoRequirement')}
                    </MenuItem>
                    <MenuItem value={CreatorEarningsBucketValue.Small}>
                      {tPendingTranslation(
                        'Greater than 1,000 Robux',
                        'Greater than 1,000 Robux',
                        translationKey(
                          'Label.CreatorEarningsSmallRange',
                          TranslationNamespace.Licenses,
                        ),
                      )}
                    </MenuItem>
                    <MenuItem value={CreatorEarningsBucketValue.Medium}>
                      {tPendingTranslation(
                        'Greater than 10,000 Robux',
                        'Greater than 10,000 Robux',
                        translationKey(
                          'Label.CreatorEarningsMediumRange',
                          TranslationNamespace.Licenses,
                        ),
                      )}
                    </MenuItem>
                    <MenuItem value={CreatorEarningsBucketValue.Large}>
                      {tPendingTranslation(
                        'Greater than 100,000 Robux',
                        'Greater than 100,000 Robux',
                        translationKey(
                          'Label.CreatorEarningsLargeRange',
                          TranslationNamespace.Licenses,
                        ),
                      )}
                    </MenuItem>
                  </Select>
                )}
                rules={{
                  required: areAgreementLockedFieldsDisabled
                    ? false
                    : translate('Label.FieldIsRequired'),
                }}
              />
            </FormControl>
          </Grid>
        )}
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
          <Typography variant='h5' component='h2' gutterBottom>
            {translate('Heading.Privacy')}
          </Typography>
          <Typography color='secondary' component='p' className={classes.semanticGapLargerBottom}>
            {tPendingTranslation(
              'Choose whether creators can find this license or you offer it directly.',
              'Description for the privacy section where a rights holder chooses public or private license visibility.',
              translationKey('Description.Privacy', TranslationNamespace.AgreementsManager),
            )}
          </Typography>
          <Controller
            name='visibility'
            control={control}
            rules={{ required: translate('Label.FieldIsRequired') }}
            render={({ field, fieldState: { error } }) =>
              isLicenseCreationEnabled ? (
                <FormControl fullWidth>
                  <LicenseFormControlledSelect
                    field={field}
                    id='visibility-select'
                    error={!!error}
                    helperText={error?.message}
                    label={tPendingTranslation(
                      'Select visibility',
                      'Label for the dropdown used to choose whether a license is public or private.',
                      translationKey(
                        'Label.SelectVisibility',
                        TranslationNamespace.AgreementsManager,
                      ),
                    )}
                    renderValue={renderVisibilityValue}>
                    <MenuItem
                      value={LicenseVisibility.Public}
                      data-testid='public-visibility-option'>
                      <VisibilityOptions visibility={LicenseVisibility.Public} />
                    </MenuItem>
                    <MenuItem
                      value={LicenseVisibility.Private}
                      data-testid='private-visibility-option'>
                      <VisibilityOptions visibility={LicenseVisibility.Private} />
                    </MenuItem>
                  </LicenseFormControlledSelect>
                </FormControl>
              ) : (
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
              )
            }
          />
        </Grid>
        <Grid item container spacing={2}>
          <Grid item>
            <Button
              variant='contained'
              color='secondary'
              onClick={handleCancel}
              disabled={isSubmitting}>
              {cancelButtonText ?? translate('Action.Cancel')}
            </Button>
          </Grid>
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
