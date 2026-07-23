import React, { useCallback, useMemo, useEffect, useState } from 'react';
import { useForm, FormProvider, Controller } from 'react-hook-form';
import type { IpFamilyValidity, RequestedScanValidity } from '@rbx/client-content-licensing-api/v1';
import { LicenseDurationType, LicenseModerationStatus } from '@rbx/client-content-licensing-api/v1';
import {
  clsx,
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogTitle,
  Dropdown,
  FeedbackBanner,
  Menu,
  MenuItem,
  MenuLabel,
} from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { Button, CircularProgress, FormHelperText, Link, makeStyles } from '@rbx/ui';
import useIpSnackbar from '../../../hooks/useIpSnackbar';
import { useIpFamiliesQuery } from '../../../ipFamilies/hooks/ipFamily';
import { ROBLOX_CREATOR_DOCS_MANUAL_REQUESTS_HREF } from '../../urls';
import { LicenseManagerImpressionEvent, useLicenseManagerLoggerLogOnce } from '../../utils/logger';
import { useLicenseByIpFamilyIdQuery } from '../hooks/agreements';
import useCreateManualScanCandidateMutation from '../hooks/useCreateManualScanCandidateMutation';
import useValidateIpFamily from '../hooks/useValidateIpFamily';
import useValidateManualScanCombinationMutation from '../hooks/useValidateManualScanCombinationMutation';
import ExperienceUrlTextField from './ExperienceUrlTextField';
import LicenseSelect from './LicenseSelect';
import RevShareTimingSelect, { RevShareTiming } from './RevShareTimingSelect';

/** HTTP status returned by the backend when the user has reached the daily submission limit */
export const DAILY_LIMIT_HTTP_STATUS = 429;

/** Error shape thrown by the API client when the backend returns an HTTP error (e.g. 429) */
export interface ManualScanCandidateHttpError {
  status?: number;
}

function isManualScanCandidateHttpError(error: unknown): error is ManualScanCandidateHttpError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    typeof error.status === 'number'
  );
}

/** Shown in the top alert and used for submit / license gating (experience × IP family + daily limit). */
enum ErrorState {
  DailyLimitReached = 'DailyLimitReached',
  MatchAlreadyExists = 'MatchAlreadyExists',
  RequestAlreadyExists = 'RequestAlreadyExists',
  RequestPreviouslyRejected = 'RequestPreviouslyRejected',
  CandidateInOtherActiveAgreement = 'CandidateInOtherActiveAgreement',
}

/** Shown as helper text on the IP Family field only. */
type IpFamilyValidityError = Extract<IpFamilyValidity, 'Invalid' | 'InsufficientContent'>;

type severity = 'error' | 'warning';

interface Content {
  severity: severity;
  translationKey: string;
}

const errorStateToContent: { [key in ErrorState]: Content } = {
  DailyLimitReached: {
    severity: 'error',
    translationKey: 'Label.DailyLimitReached',
  },
  MatchAlreadyExists: {
    severity: 'error',
    translationKey: 'Label.ErrorMatchAlreadyExists',
  },
  RequestAlreadyExists: {
    severity: 'error',
    translationKey: 'Label.ErrorRequestAlreadyExists',
  },
  RequestPreviouslyRejected: {
    severity: 'error',
    translationKey: 'Label.ErrorRequestPreviouslyRejected',
  },
  CandidateInOtherActiveAgreement: {
    severity: 'error',
    translationKey: 'Label.ErrorCandidateInOtherActiveAgreement',
  },
};

const alertSeverityToFeedbackBannerSeverity = {
  error: 'Error',
  warning: 'Warning',
} as const satisfies Record<severity, 'Error' | 'Warning'>;

const requestedScanValidityToErrorState: Record<RequestedScanValidity, ErrorState | null> = {
  MatchExists: ErrorState.MatchAlreadyExists,
  RequestExists: ErrorState.RequestAlreadyExists,
  InCooldown: ErrorState.RequestPreviouslyRejected,
  CandidateConflict: ErrorState.CandidateInOtherActiveAgreement,
  Ok: null,
};

function combinationValidityToErrorState(
  validity: RequestedScanValidity | undefined,
): ErrorState | null {
  if (validity === undefined) {
    return null;
  }
  return requestedScanValidityToErrorState[validity] ?? null;
}

interface ManualScanRequestFormStore {
  universeId: string;
  ipFamilyId: string;
  licenseId: string;
  revShareTiming: RevShareTiming | null;
}

interface IphManualMatchRequestDialogProps {
  numRequestsSubmittedToday: number;
  maxDailyLimit: number;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

/** Aligns helper text below Foundation fields with MUI `FormHelperText` on `ExperienceUrlTextField`. */
const useFieldHelperTextStyles = makeStyles()((theme) => ({
  inset: {
    display: 'block',
    marginTop: theme.spacing(0.5),
    marginLeft: theme.spacing(1.75),
  },
}));

/**
 * Inline `FeedbackBanner` truncates title to one line (`text-no-wrap`, `text-truncate-end`).
 * Put copy in `title` (beside the icon with `gap-medium`), not `description` (extra `gap-xsmall`
 * sibling that can shrink the icon row when long text wraps). Allow the title to wrap.
 */
const useFeedbackBannerStyles = makeStyles()(() => ({
  inlineMultilineTitle: {
    // Defeat Foundation single-line title utilities (higher specificity than global utilities).
    '&& .text-label-medium.text-no-wrap': {
      whiteSpace: 'normal',
    },
    '&& .text-label-medium.text-truncate-end': {
      overflow: 'visible',
      textOverflow: 'clip',
    },
    '&& .text-label-medium': {
      textAlign: 'start',
      flex: '1 1 0',
      minWidth: 0,
      // Foundation adds padding-y-xsmall on inline titles; it offsets text above the icon center.
      paddingTop: 0,
      paddingBottom: 0,
    },
    // Constrain width through the flex chain so title copy wraps instead of truncating.
    '&& .flex.grow-1.min-width-0 > .flex.min-width-0': {
      flex: '1 1 0',
      minWidth: 0,
      width: '100%',
      alignItems: 'center',
    },
    '&& .flex.items-center.gap-xsmall.min-width-0': {
      flex: '1 1 0',
      minWidth: 0,
      width: '100%',
      alignItems: 'center',
    },
    '&& .flex.items-center.gap-medium.min-width-0': {
      flex: '1 1 0',
      minWidth: 0,
      width: '100%',
      alignItems: 'center',
    },
    '&& .flex.items-center.gap-medium.min-width-0 > .shrink-0': {
      flexShrink: 0,
    },
  },
}));

const IphManualMatchRequestDialog: React.FC<IphManualMatchRequestDialogProps> = ({
  numRequestsSubmittedToday,
  maxDailyLimit,
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
}) => {
  const { translate } = useTranslation();
  const { classes: fieldHelperTextClasses } = useFieldHelperTextStyles();
  const { classes: feedbackBannerClasses } = useFeedbackBannerStyles();
  const { logOnce } = useLicenseManagerLoggerLogOnce();
  const { enqueueSuccessSnackbar, enqueueErrorSnackbar } = useIpSnackbar();
  const [errorState, setErrorState] = useState<ErrorState | null>(null);
  const [ipFamilyValidityError, setIpFamilyValidityError] = useState<IpFamilyValidityError | null>(
    null,
  );
  const [isScanValidationPending, setIsScanValidationPending] = useState(false);
  const [isExperienceDetailsPending, setIsExperienceDetailsPending] = useState(false);
  const [hasExperienceUrlValidationError, setHasExperienceUrlValidationError] = useState(false);

  const formMethods = useForm<ManualScanRequestFormStore>({
    defaultValues: {
      universeId: '',
      ipFamilyId: '',
      licenseId: '',
      revShareTiming: null,
    },
    mode: 'onSubmit',
  });
  const {
    control,
    handleSubmit: handleSubmitForm,
    reset,
    watch,
    setValue,
    clearErrors,
    formState: { errors: formErrors },
  } = formMethods;

  const createManualScanCandidateMutation = useCreateManualScanCandidateMutation();
  const getValidIpFamily = useValidateIpFamily();
  const getValidManualScanCombination = useValidateManualScanCombinationMutation();
  const { data: ipFamiliesData, isPending: isIpFamiliesPending } = useIpFamiliesQuery();

  const watchedUniverseId = watch('universeId');
  const selectedIpFamilyId = watch('ipFamilyId');
  const selectedLicenseId = watch('licenseId');
  const selectedRevShareTiming = watch('revShareTiming');

  // Validate IP family whenever one is selected. When a resolved universe id is present, also validate
  // the universe × IP family combination in parallel so both requests run to completion (neither is
  // skipped because the other returned first).
  useEffect(() => {
    let cancelled = false;
    if (!selectedIpFamilyId) {
      setIsScanValidationPending(false);
      setErrorState(null);
      setIpFamilyValidityError(null);
    } else {
      setIpFamilyValidityError(null);
      setErrorState(null);
      setIsScanValidationPending(true);

      const runValidation = async () => {
        try {
          const hasUniverseId = Boolean(watchedUniverseId?.trim());

          const ipFamilyPromise = getValidIpFamily.mutateAsync({
            ipFamilyId: selectedIpFamilyId,
          });
          const combinationPromise = hasUniverseId
            ? getValidManualScanCombination.mutateAsync({
                universeId: watchedUniverseId,
                ipFamilyId: selectedIpFamilyId,
              })
            : Promise.resolve<RequestedScanValidity | undefined>(undefined);

          const [ipFamilyValidity, combinationValidity] = await Promise.all([
            ipFamilyPromise,
            combinationPromise,
          ]);

          if (cancelled) {
            return;
          }

          if (ipFamilyValidity === 'Invalid') {
            logOnce(
              LicenseManagerImpressionEvent.MatchesTableManualScanRequestModalInvalidIpFamilyImpressionEvent,
              {
                validity: ipFamilyValidity,
              },
            );
            setIpFamilyValidityError('Invalid');
            setErrorState(null);
            return;
          }
          if (ipFamilyValidity === 'InsufficientContent') {
            logOnce(
              LicenseManagerImpressionEvent.MatchesTableManualScanRequestModalInvalidIpFamilyImpressionEvent,
              {
                validity: ipFamilyValidity,
              },
            );
            setIpFamilyValidityError('InsufficientContent');
            setErrorState(null);
            return;
          }

          setIpFamilyValidityError(null);

          if (!hasUniverseId) {
            setErrorState(null);
            return;
          }

          const combinationErrorState = combinationValidityToErrorState(combinationValidity);
          if (combinationErrorState) {
            logOnce(
              LicenseManagerImpressionEvent.MatchesTableManualScanRequestModalInvalidCombinationImpressionEvent,
              {
                validity: String(combinationValidity),
              },
            );
            setErrorState(combinationErrorState);
          } else {
            setErrorState(null);
          }
        } catch {
          if (!cancelled) {
            setErrorState(null);
            setIpFamilyValidityError(null);
          }
        } finally {
          if (!cancelled) {
            setIsScanValidationPending(false);
          }
        }
      };

      // eslint-disable-next-line @typescript-eslint/no-floating-promises -- fire-and-forget; errors handled inside runValidation
      runValidation();
    }

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- useMutation should not be included in dependency array
  }, [selectedIpFamilyId, watchedUniverseId]);

  // Only fetch licenses when an IP family is selected
  const { data: licensesData, isPending: isLicensesPending } = useLicenseByIpFamilyIdQuery(
    selectedIpFamilyId || '',
  );
  const licenses = useMemo(
    () =>
      licensesData?.filter(
        (license) =>
          !license.archived &&
          (!license.moderationStatus ||
            license.moderationStatus === LicenseModerationStatus.Approved) &&
          (!license.licenseDuration?.durationType ||
            license.licenseDuration.durationType !== LicenseDurationType.TimeLimited),
      ) ?? [],
    [licensesData],
  );
  // Reset licenseId when ipFamilyId changes
  useEffect(() => {
    setValue('licenseId', '');
  }, [selectedIpFamilyId, setValue]);
  // Reset licenseId when experience URL is cleared
  useEffect(() => {
    if (!watchedUniverseId) {
      setValue('licenseId', '');
    }
  }, [watchedUniverseId, setValue]);
  // Set revShareTiming when selectedLicenseId changes
  // If valid license, then set default to the license preference
  // Otherwise, clear the field
  const selectedLicense = selectedLicenseId
    ? licenses?.find((license) => license.id === selectedLicenseId)
    : undefined;
  useEffect(() => {
    if (selectedLicense) {
      setValue(
        'revShareTiming',
        selectedLicense.enableMonetization ? RevShareTiming.OnActivation : RevShareTiming.Later,
      );
    } else {
      setValue('revShareTiming', null);
    }
  }, [selectedLicense, setValue]);

  const resetDialogState = useCallback(() => {
    setErrorState(null);
    setIpFamilyValidityError(null);
    setIsScanValidationPending(false);
    setIsExperienceDetailsPending(false);
    setHasExperienceUrlValidationError(false);
    reset();
  }, [reset]);

  const handleClose = useCallback(() => {
    resetDialogState();
    onClose();
  }, [onClose, resetDialogState]);

  const handleDialogOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        handleClose();
      }
    },
    [handleClose],
  );

  const handleSubmitModal = async () => {
    try {
      await createManualScanCandidateMutation.mutateAsync({
        ipFamilyId: selectedIpFamilyId,
        licenseId: selectedLicenseId,
        universeId: watchedUniverseId,
      });

      enqueueSuccessSnackbar('Message.IphManualScanRequestSubmitted');
      onConfirm();
      reset();
    } catch (error) {
      if (isManualScanCandidateHttpError(error) && error.status === DAILY_LIMIT_HTTP_STATUS) {
        logOnce(
          LicenseManagerImpressionEvent.MatchesTableManualScanRequestModalDailyLimitReachedImpressionEvent,
        );
        setErrorState(ErrorState.DailyLimitReached);
        return;
      }
      enqueueErrorSnackbar();
    }
  };

  if (isIpFamiliesPending) {
    return <CircularProgress />;
  }

  const isSubmitting = isLoading || createManualScanCandidateMutation.isPending;
  const ipFamilies = ipFamiliesData?.ipFamilies ?? [];
  const selectableIpFamilies = ipFamilies.filter(
    (family): family is (typeof ipFamilies)[number] & { id: string } =>
      typeof family.id === 'string' && family.id.length > 0,
  );

  const isLicenseSectionVisible =
    Boolean(watchedUniverseId) &&
    Boolean(selectedIpFamilyId) &&
    !isScanValidationPending &&
    !isExperienceDetailsPending &&
    !ipFamilyValidityError &&
    (!errorState || errorState === ErrorState.DailyLimitReached);
  const hasNoLicensesForIpFamily =
    Boolean(selectedIpFamilyId) && !isLicensesPending && licenses.length === 0;
  const isLicensesLoading = isLicenseSectionVisible && isLicensesPending;

  return (
    <FormProvider {...formMethods}>
      <Dialog
        open={isOpen}
        onOpenChange={handleDialogOpenChange}
        size='Medium'
        isModal
        hasCloseAffordance={false}>
        <DialogContent>
          <DialogBody className='flex flex-col gap-y-xsmall scroll-y min-height-[0px]'>
            <DialogTitle className='text-heading-small margin-y-none padding-bottom-xsmall'>
              {translate('Heading.ManualMatchRequestModal')}
            </DialogTitle>

            <div className='padding-bottom-xsmall width-full'>
              {!isScanValidationPending && !isExperienceDetailsPending && errorState ? (
                <div data-testid='alert-error' className='width-full'>
                  <FeedbackBanner
                    title={translate(errorStateToContent[errorState].translationKey, {
                      maxLimit: maxDailyLimit.toString(),
                    })}
                    layout='Inline'
                    variant='Standard'
                    severity={
                      alertSeverityToFeedbackBannerSeverity[
                        errorStateToContent[errorState].severity
                      ]
                    }
                    className={clsx('width-full', feedbackBannerClasses.inlineMultilineTitle)}
                  />
                </div>
              ) : (
                <div data-testid='alert-num-requests-submitted' className='width-full'>
                  <FeedbackBanner
                    title={translate('Label.NumManualRequestsSubmitted', {
                      numSubmitted: numRequestsSubmittedToday.toString(),
                      maxLimit: maxDailyLimit.toString(),
                    })}
                    layout='Inline'
                    variant='Standard'
                    severity='Info'
                    className={clsx('width-full', feedbackBannerClasses.inlineMultilineTitle)}
                  />
                </div>
              )}
            </div>

            <span className='text-body-medium content-default margin-none padding-bottom-small'>
              {translate('Description.ManualMatchRequestModal')}
            </span>

            <span className='text-label-large content-emphasis padding-bottom-xsmall'>
              {translate('Label.ExperienceUrl')}
            </span>
            <Controller
              name='universeId'
              control={control}
              render={({ field, fieldState: { error } }) => (
                <ExperienceUrlTextField
                  {...field}
                  data-testId='experience-url-text-field'
                  id='experience-url-text-field'
                  label=''
                  fullWidth
                  error={!!error}
                  helperText={error?.message}
                  disabled={isSubmitting || errorState === ErrorState.DailyLimitReached}
                  onExperienceDetailsPendingChange={setIsExperienceDetailsPending}
                  onValidationErrorChange={setHasExperienceUrlValidationError}
                  onChange={(e) => {
                    field.onChange(e);
                  }}
                  onFocus={() => clearErrors('universeId')}
                  className='padding-bottom-xsmall'
                />
              )}
              rules={{
                required: translate('Label.FieldIsRequired'),
              }}
            />

            <span className='text-label-large content-emphasis padding-bottom-xsmall'>
              {translate('Label.IPFamily')}
            </span>
            <Controller
              name='ipFamilyId'
              control={control}
              render={({ field, fieldState: { error } }) => {
                let ipFamilyHelper: React.ReactNode = null;
                if (ipFamilies.length === 0) {
                  ipFamilyHelper = (
                    <FormHelperText className={fieldHelperTextClasses.inset}>
                      {translate('Label.NoIpFamiliesFound')}
                    </FormHelperText>
                  );
                } else if (ipFamilyValidityError === 'InsufficientContent') {
                  ipFamilyHelper = (
                    <FormHelperText error className={fieldHelperTextClasses.inset}>
                      <>
                        <span>{translate('Label.ErrorIpFamilyHasInsufficientContent')}</span>{' '}
                        <Link
                          href={ROBLOX_CREATOR_DOCS_MANUAL_REQUESTS_HREF}
                          target='_blank'
                          rel='noopener noreferrer'
                          color='inherit'
                          underline='always'>
                          {translate('Label.LearnMore')}
                        </Link>
                      </>
                    </FormHelperText>
                  );
                }

                const hasIpFamilyError =
                  !!error || ipFamilies.length === 0 || !!ipFamilyValidityError;
                const ipFamilyHint =
                  ipFamilyValidityError === 'Invalid'
                    ? translate('Label.ErrorInvalidIpFamily')
                    : error?.message;

                return (
                  <div data-testid='ip-family-select' className='padding-bottom-xsmall width-full'>
                    <Dropdown
                      className='width-full'
                      size='Medium'
                      value={field.value ?? ''}
                      placeholder={
                        ipFamilies.length > 0
                          ? translate('Action.Select')
                          : translate('Heading.NoIpFamily')
                      }
                      isDisabled={
                        ipFamilies.length === 0 || errorState === ErrorState.DailyLimitReached
                      }
                      hasError={hasIpFamilyError}
                      onOpenChange={(open) => {
                        if (!open) {
                          field.onBlur();
                        }
                      }}
                      onValueChange={(value) => {
                        field.onChange(value);
                      }}>
                      <Menu>
                        {selectableIpFamilies.length > 0 ? (
                          selectableIpFamilies.map((family) => (
                            <MenuItem key={family.id} value={family.id} title={family.name ?? ''} />
                          ))
                        ) : (
                          <MenuLabel disabled title={translate('Heading.NoIpFamily')} />
                        )}
                      </Menu>
                    </Dropdown>
                    {ipFamilyHint ? (
                      <span
                        className={clsx(
                          'text-caption-small content-system-alert',
                          fieldHelperTextClasses.inset,
                        )}>
                        {ipFamilyHint}
                      </span>
                    ) : null}
                    {ipFamilyHelper}
                  </div>
                );
              }}
              rules={{ required: translate('Label.FieldIsRequired') }}
            />

            {isLicenseSectionVisible ? (
              <>
                <span className='text-label-large content-emphasis padding-bottom-xsmall'>
                  {translate('Label.License')}
                </span>
                <Controller
                  name='licenseId'
                  control={control}
                  rules={{ required: translate('Label.FieldIsRequired') }}
                  render={({ field, fieldState: { error } }) => {
                    const hasLicenseError = !!error || hasNoLicensesForIpFamily;
                    const licenseHint = error?.message;

                    return (
                      <div
                        data-testid='license-select'
                        className='padding-bottom-xsmall width-full'>
                        <LicenseSelect
                          {...field}
                          useFoundationUiComponents
                          fullWidth
                          id='license-select'
                          licenses={licenses}
                          error={hasLicenseError}
                          disabled={isLicensesPending}
                        />
                        {licenseHint ? (
                          <span
                            className={clsx(
                              'text-caption-small content-system-alert',
                              fieldHelperTextClasses.inset,
                            )}>
                            {licenseHint}
                          </span>
                        ) : null}
                        {hasNoLicensesForIpFamily ? (
                          <FormHelperText error className={fieldHelperTextClasses.inset}>
                            {translate('Label.NoLicensesForIpFamily')}
                          </FormHelperText>
                        ) : null}
                      </div>
                    );
                  }}
                />
              </>
            ) : (
              <div className='min-height-[60px]' aria-hidden />
            )}

            {watchedUniverseId &&
            selectedIpFamilyId &&
            !isScanValidationPending &&
            !isExperienceDetailsPending &&
            !ipFamilyValidityError &&
            (!errorState || errorState === ErrorState.DailyLimitReached) &&
            (selectedLicense?.royaltyRate ?? 0) > 0 ? (
              <>
                <span className='text-label-large content-emphasis padding-bottom-xsmall'>
                  {translate('Label.RevenueShareTiming')}
                </span>
                <Controller
                  name='revShareTiming'
                  control={control}
                  rules={{ required: translate('Label.FieldIsRequired') }}
                  render={({ field, fieldState: { error } }) => (
                    <div
                      data-testid='rev-share-timing-select'
                      className='padding-bottom-xsmall width-full'>
                      <RevShareTimingSelect
                        {...field}
                        useFoundationUiComponents
                        fullWidth
                        id='rev-share-timing-select'
                        error={!!error}
                        helperText={error?.message}
                        revShareTiming={selectedRevShareTiming}
                        disabled={!!errorState || !!ipFamilyValidityError}
                      />
                    </div>
                  )}
                />
              </>
            ) : (
              <div className='min-height-[60px]' aria-hidden />
            )}
          </DialogBody>

          <DialogFooter className='flex flex-row gap-small width-full'>
            <Button
              onClick={handleClose}
              variant='contained'
              color='secondary'
              disabled={isSubmitting || isScanValidationPending || isExperienceDetailsPending}
              className='basis-0 grow-1'>
              {translate('Action.Cancel')}
            </Button>

            <Button
              onClick={handleSubmitForm(handleSubmitModal)}
              loading={
                isSubmitting ||
                isScanValidationPending ||
                isExperienceDetailsPending ||
                isLicensesLoading
              }
              variant='contained'
              color='primaryBrand'
              disabled={
                !!errorState ||
                !!ipFamilyValidityError ||
                !!formErrors.ipFamilyId ||
                !!formErrors.licenseId ||
                hasNoLicensesForIpFamily ||
                hasExperienceUrlValidationError ||
                isScanValidationPending ||
                isExperienceDetailsPending ||
                isLicensesLoading
              }
              className='basis-0 grow-1'>
              {translate('Action.Submit')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </FormProvider>
  );
};

export default IphManualMatchRequestDialog;
