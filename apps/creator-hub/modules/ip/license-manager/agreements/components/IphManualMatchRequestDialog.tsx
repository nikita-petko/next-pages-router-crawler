import React, { useCallback, useMemo, useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  makeStyles,
  Select,
  MenuItem,
  CircularProgress,
  Typography,
  Skeleton,
  Alert,
  FormControl,
  FormHelperText,
  Link,
} from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
import {
  IpFamilyValidity,
  LicenseDurationType,
  LicenseModerationStatus,
  RequestedScanValidity,
} from '@rbx/clients/contentLicensingApi/v1';

import { useForm, FormProvider, Controller } from 'react-hook-form';
import useIpSnackbar from '../../../hooks/useIpSnackbar';
import useCreateManualScanCandidateMutation from '../hooks/useCreateManualScanCandidateMutation';
import { useIpFamiliesQuery } from '../../../ipFamilies/hooks/ipFamily';
import { useLicenseByIpFamilyIdQuery } from '../hooks/agreements';
import LicenseSelect from './LicenseSelect';
import RevShareTimingSelect, { RevShareTiming } from './RevShareTimingSelect';
import ExperienceUrlTextField from './ExperienceUrlTextField';
import useValidateManualScanCombinationMutation from '../hooks/useValidateManualScanCombinationMutation';
import { LicenseManagerImpressionEvent, useLicenseManagerLoggerLogOnce } from '../../utils/logger';
import useValidateIpFamily from '../hooks/useValidateIpFamily';
import { ROBLOX_CREATOR_DOCS_MANUAL_REQUESTS_HREF } from '../../urls';

const useStyles = makeStyles()((theme) => ({
  dialogActions: {
    display: 'flex',
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-space between',
  },
  button: {
    width: '50%',
    padding: theme.spacing(1),
  },
  paddingBottom: {
    paddingBottom: theme.spacing(1),
  },
  alertSection: {
    minHeight: 82,
    paddingBottom: theme.spacing(1),
    alignItems: 'center',
  },
  licenseSection: {
    minHeight: 130,
  },
  revShareSection: {
    minHeight: 110,
  },
}));

/** HTTP status returned by the backend when the user has reached the daily submission limit */
export const DAILY_LIMIT_HTTP_STATUS = 429;

/** Error shape thrown by the API client when the backend returns an HTTP error (e.g. 429) */
export interface ManualScanCandidateHttpError {
  status?: number;
}

/** Shown in the top alert and used for submit / license gating (experience × IP family + daily limit). */
enum ErrorState {
  DailyLimitReached = 'DailyLimitReached',
  MatchAlreadyExists = 'MatchAlreadyExists',
  RequestAlreadyExists = 'RequestAlreadyExists',
  RequestPreviouslyRejected = 'RequestPreviouslyRejected',
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
};

const requestedScanValidityToErrorState: Record<RequestedScanValidity, ErrorState | null> = {
  MatchExists: ErrorState.MatchAlreadyExists,
  RequestExists: ErrorState.RequestAlreadyExists,
  InCooldown: ErrorState.RequestPreviouslyRejected,
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

const IphManualMatchRequestDialog: React.FC<IphManualMatchRequestDialogProps> = ({
  numRequestsSubmittedToday,
  maxDailyLimit,
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
}) => {
  const { classes } = useStyles();
  const { translate } = useTranslation();
  const { logOnce } = useLicenseManagerLoggerLogOnce();
  const { enqueueSuccessSnackbar, enqueueErrorSnackbar } = useIpSnackbar();
  const [errorState, setErrorState] = useState<ErrorState | null>(null);
  const [ipFamilyValidityError, setIpFamilyValidityError] = useState<IpFamilyValidityError | null>(
    null,
  );
  const [isScanValidationPending, setIsScanValidationPending] = useState(false);
  const [isExperienceDetailsPending, setIsExperienceDetailsPending] = useState(false);

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
                validity: String(ipFamilyValidity),
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
                validity: String(ipFamilyValidity),
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
      ) || [],
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

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  const handleExited = useCallback(() => {
    setErrorState(null);
    setIpFamilyValidityError(null);
    setIsScanValidationPending(false);
    setIsExperienceDetailsPending(false);
    reset();
  }, [reset]);

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
      const httpError = error as ManualScanCandidateHttpError;
      if (httpError?.status === DAILY_LIMIT_HTTP_STATUS) {
        logOnce(
          LicenseManagerImpressionEvent.MatchesTableManualScanRequestModalDailyLimitReachedImpressionEvent,
        );
        setErrorState(ErrorState.DailyLimitReached);
      } else {
        enqueueErrorSnackbar();
      }
    }
  };

  if (isIpFamiliesPending) {
    return <CircularProgress />;
  }

  const isSubmitting = isLoading || createManualScanCandidateMutation.isPending;
  const ipFamilies = ipFamiliesData?.ipFamilies ?? [];

  return (
    <FormProvider {...formMethods}>
      <Dialog
        fullWidth
        maxWidth='Medium'
        open={isOpen}
        onClose={handleClose}
        TransitionProps={{ onExited: handleExited }}>
        <DialogTitle>{translate('Heading.ManualMatchRequestModal')}</DialogTitle>

        <DialogContent>
          <div className={classes.alertSection}>
            {!isScanValidationPending && !isExperienceDetailsPending && errorState ? (
              <Alert
                severity={errorStateToContent[errorState].severity}
                variant='standard'
                data-testid='alert-error'>
                <Typography color='primary' variant='h6'>
                  {translate(errorStateToContent[errorState].translationKey, {
                    maxLimit: maxDailyLimit.toString(),
                  })}
                </Typography>
              </Alert>
            ) : (
              <Alert severity='info' variant='standard' data-testid='alert-num-requests-submitted'>
                <Typography color='primary' variant='h6'>
                  {translate('Label.NumManualRequestsSubmitted', {
                    numSubmitted: numRequestsSubmittedToday.toString(),
                    maxLimit: maxDailyLimit.toString(),
                  })}
                </Typography>
              </Alert>
            )}
          </div>

          <DialogContentText className={classes.paddingBottom}>
            {translate('Description.ManualMatchRequestModal')}
          </DialogContentText>

          <DialogContentText className={classes.paddingBottom}>
            <Typography variant='h6' color='primary'>
              {translate('Label.ExperienceUrl')}
            </Typography>
          </DialogContentText>
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
                onChange={(e) => {
                  field.onChange(e);
                }}
                onFocus={() => clearErrors('universeId')}
                className={classes.paddingBottom}
              />
            )}
            rules={{
              required: translate('Label.FieldIsRequired'),
            }}
          />

          <DialogContentText className={classes.paddingBottom}>
            <Typography variant='h6' color='primary'>
              {translate('Label.IPFamily')}
            </Typography>
          </DialogContentText>
          <Controller
            name='ipFamilyId'
            control={control}
            render={({ field, fieldState: { error } }) => {
              let ipFamilyHelper: React.ReactNode = null;
              if (ipFamilies.length === 0) {
                ipFamilyHelper = (
                  <FormHelperText>{translate('Label.NoIpFamiliesFound')}</FormHelperText>
                );
              } else if (ipFamilyValidityError === 'InsufficientContent') {
                ipFamilyHelper = (
                  <FormHelperText error>
                    <React.Fragment>
                      <span>{translate('Label.ErrorIpFamilyHasInsufficientContent')}</span>{' '}
                      <Link
                        href={ROBLOX_CREATOR_DOCS_MANUAL_REQUESTS_HREF}
                        target='_blank'
                        rel='noopener noreferrer'
                        color='inherit'
                        underline='always'>
                        {translate('Label.LearnMore')}
                      </Link>
                    </React.Fragment>
                  </FormHelperText>
                );
              } else if (ipFamilyValidityError === 'Invalid') {
                ipFamilyHelper = (
                  <FormHelperText error>{translate('Label.ErrorInvalidIpFamily')}</FormHelperText>
                );
              } else if (error?.message) {
                ipFamilyHelper = <FormHelperText error>{error.message}</FormHelperText>;
              }

              return (
                <FormControl
                  fullWidth
                  error={!!error || ipFamilies.length === 0 || !!ipFamilyValidityError}
                  className={classes.paddingBottom}>
                  <Select
                    {...field}
                    fullWidth
                    data-testId='ip-family-select'
                    id='ip-family-select'
                    label=''
                    disabled={
                      ipFamilies.length === 0 || errorState === ErrorState.DailyLimitReached
                    }>
                    {ipFamilies.length > 0 ? (
                      ipFamilies.map((family) => (
                        <MenuItem key={family.id} value={family.id}>
                          {family.name}
                        </MenuItem>
                      ))
                    ) : (
                      <MenuItem value=''>{translate('Heading.NoIpFamily')}</MenuItem>
                    )}
                  </Select>
                  {ipFamilyHelper}
                </FormControl>
              );
            }}
            rules={{ required: translate('Label.FieldIsRequired') }}
          />

          {watchedUniverseId &&
          selectedIpFamilyId &&
          !isScanValidationPending &&
          !isExperienceDetailsPending &&
          !ipFamilyValidityError &&
          (!errorState || errorState === ErrorState.DailyLimitReached) ? (
            <div className={classes.licenseSection}>
              <DialogContentText className={classes.paddingBottom}>
                <Typography variant='h6' color='primary'>
                  {translate('Label.License')}
                </Typography>
              </DialogContentText>
              {isLicensesPending ? (
                <Skeleton animate height={90} />
              ) : (
                <Controller
                  name='licenseId'
                  control={control}
                  rules={{ required: translate('Label.FieldIsRequired') }}
                  render={({ field, fieldState: { error } }) => (
                    <LicenseSelect
                      {...field}
                      fullWidth
                      data-testId='license-select'
                      id='license-select'
                      helperText={
                        licenses.length === 0
                          ? translate('Label.NoLicensesForIpFamily')
                          : error?.message
                      }
                      licenses={licenses}
                      error={!!error || licenses.length === 0}
                      disabled={licenses.length === 0 || !!errorState || !!ipFamilyValidityError}
                      className={classes.paddingBottom}
                    />
                  )}
                />
              )}
            </div>
          ) : (
            <div className={classes.licenseSection} aria-hidden />
          )}

          {watchedUniverseId &&
          selectedIpFamilyId &&
          !isScanValidationPending &&
          !isExperienceDetailsPending &&
          !ipFamilyValidityError &&
          (!errorState || errorState === ErrorState.DailyLimitReached) &&
          (selectedLicense?.royaltyRate ?? 0) > 0 ? (
            <div className={classes.revShareSection}>
              <DialogContentText className={classes.paddingBottom}>
                <Typography variant='h6' color='primary'>
                  {translate('Label.RevenueShareTiming')}
                </Typography>
              </DialogContentText>
              <Controller
                name='revShareTiming'
                control={control}
                rules={{ required: translate('Label.FieldIsRequired') }}
                render={({ field, fieldState: { error } }) => (
                  <RevShareTimingSelect
                    {...field}
                    fullWidth
                    data-testId='rev-share-timing-select'
                    id='rev-share-timing-select'
                    error={!!error}
                    helperText={error?.message}
                    label=''
                    className={classes.paddingBottom}
                    revShareTiming={selectedRevShareTiming}
                    disabled={!!errorState || !!ipFamilyValidityError}
                  />
                )}
              />
            </div>
          ) : (
            <div className={classes.revShareSection} aria-hidden />
          )}
        </DialogContent>

        <DialogActions className={classes.dialogActions}>
          <Button
            onClick={handleClose}
            variant='contained'
            color='secondary'
            disabled={isSubmitting}
            className={classes.button}>
            {translate('Action.Cancel')}
          </Button>

          <Button
            onClick={handleSubmitForm(handleSubmitModal)}
            loading={isSubmitting}
            variant='contained'
            color='primaryBrand'
            disabled={
              !!errorState ||
              !!ipFamilyValidityError ||
              isScanValidationPending ||
              isExperienceDetailsPending
            }
            className={classes.button}>
            {translate('Action.Submit')}
          </Button>
        </DialogActions>
      </Dialog>
    </FormProvider>
  );
};

export default IphManualMatchRequestDialog;
