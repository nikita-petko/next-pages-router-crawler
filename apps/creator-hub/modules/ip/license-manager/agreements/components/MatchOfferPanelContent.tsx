import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useForm, Controller, type FieldErrors, type RegisterOptions } from 'react-hook-form';
import {
  AgreementCandidateType,
  AgreementCandidatePromotionType,
  LicenseDurationType,
  LicenseModerationStatus,
  LicenseType,
  ModerationStatus,
  type AgreementCandidateResponse,
  type AgreementResponse,
  type LicenseResponse,
  type ModerationResponse,
} from '@rbx/client-content-licensing-api/v1';
import { useFlag } from '@rbx/flags';
import { Radio, RadioGroup } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import {
  Typography,
  Select,
  MenuItem,
  FormControl,
  makeStyles,
  Alert,
  FormHelperText,
  Button,
} from '@rbx/ui';
import { isAvatarItemLicensingEnabled as isAvatarItemLicensingEnabledFlag } from '@generated/flags/contentLicensing';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { getResponseFromError } from '@modules/clients/utils';
import useContentModerationMutation from '@modules/licenses/hooks/useContentModerationMutation';
import getKeyFromModerationReason from '@modules/licenses/utils/moderationReason';
import { Link } from '@modules/miscellaneous/components';
import EmptyState from '@modules/miscellaneous/components/EmptyState/EmptyState';
import { Flex } from '@modules/miscellaneous/components/Flex';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { isValidEnumValue } from '@modules/miscellaneous/utils/enumUtils';
import { useSettings } from '@modules/settings/SettingsProvider/SettingsProvider';
import {
  TextFieldWithEnhancedHelperTextV2,
  getMaxLengthValidationRule,
} from '../../../components/TextFieldWithEnhancedHelperTextV2';
import useIpSnackbar from '../../../hooks/useIpSnackbar';
import { useIpFamilyQuery } from '../../../ipFamilies/hooks/ipFamily';
import { ContentTile, ContentType } from '../../components/ContentTile';
import { MAX_IPH_CONDITIONAL_OFFER_FEEDBACK_LENGTH } from '../../constants';
import { IPH_AGREEMENT_DETAILS_HREF, EXTERNAL_EXPERIENCE_HREF, IP_LISTINGS_HREF } from '../../urls';
import { getCreatorDisplayName, normalizeCreatorType } from '../../utils/creatorName';
import {
  LicenseManagerClickEvent,
  LicenseManagerImpressionEvent,
  useLicenseManagerLogger,
  useLicenseManagerLoggerLogOnce,
} from '../../utils/logger';
import {
  useLicenseByIpFamilyIdQuery,
  usePromoteAgreementCandidateMutation,
} from '../hooks/agreements';
import { NO_GAME_FOUND_FOR_ID, useDebouncedGameDetails } from '../hooks/games';
import { foundationRadioLabel } from './foundationRadioLabel';
import LicenseSelect from './LicenseSelect';
import MatchPanelLayout from './MatchPanelLayout';

const useStyles = makeStyles()((theme) => ({
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '200px',
  },
  largeBottomMargin: {
    marginBottom: theme.spacing(3),
  },
  mediumBottomMargin: {
    marginBottom: theme.spacing(2),
  },
  alertActions: {
    flexShrink: 0,
  },
  radioOption: {
    marginTop: theme.spacing(-0.375),
  },
  feedbackSection: {
    marginTop: theme.spacing(2),
  },
}));

/**
 * We'll get a 409 error if an agreement already exists for the given candidate.
 * This is a semi-expected error, so we'll show a different message to the user.
 */
const isExistingAgreementError = (error?: Error | null) => {
  if (!error) {
    return false;
  }
  const response = getResponseFromError(error);
  return response?.status === 409;
};

const MatchOfferPanelError = ({
  error,
  candidateId,
  licenseId,
  analyticsContext,
}: {
  error: Error;
  candidateId: string | undefined;
  licenseId: string | undefined;
  analyticsContext: Record<string, string | number | boolean>;
}) => {
  const { translate } = useTranslation();
  const { logEvent } = useLicenseManagerLogger();
  const hasExistingAgreementError = isExistingAgreementError(error);
  const impressionContextRef = useRef({ analyticsContext, candidateId, licenseId });

  useEffect(() => {
    impressionContextRef.current = { analyticsContext, candidateId, licenseId };
  }, [analyticsContext, candidateId, licenseId]);

  useEffect(() => {
    const {
      analyticsContext: context,
      candidateId: currentCandidateId,
      licenseId: currentLicenseId,
    } = impressionContextRef.current;
    if (hasExistingAgreementError) {
      logEvent(
        LicenseManagerImpressionEvent.UnsuccessfulLicenseOfferAgreementAlreadyExistsErrorImpressionEvent,
        {
          ...context,
          candidateId: currentCandidateId ?? '',
          licenseId: currentLicenseId ?? '',
        },
      );
    } else {
      logEvent(LicenseManagerImpressionEvent.UnsuccessfulLicenseOfferGenericErrorImpressionEvent, {
        ...context,
        candidateId: currentCandidateId ?? '',
        licenseId: currentLicenseId ?? '',
      });
    }
  }, [error, hasExistingAgreementError, logEvent]);

  return (
    <Alert severity='error'>
      {hasExistingAgreementError
        ? translate('Error.AgreementAlreadyExists')
        : translate('Error.LoadingData')}
    </Alert>
  );
};

enum MonitorType {
  MonitorOnly = 'monitor',
  MonitorAndRevshare = 'monitor-revshare',
}

const MONITOR_TYPE_FROM_RADIO_VALUE: Record<string, MonitorType> = {
  [MonitorType.MonitorOnly]: MonitorType.MonitorOnly,
  [MonitorType.MonitorAndRevshare]: MonitorType.MonitorAndRevshare,
};

function monitorTypeFromRadioValue(value: string): MonitorType | null {
  return MONITOR_TYPE_FROM_RADIO_VALUE[value] ?? null;
}

async function getFeedbackModerationErrorMessage(
  message: string,
  moderateMessage: (message: string) => Promise<{ response: ModerationResponse }>,
  translate: (key: string) => string,
): Promise<string | undefined> {
  try {
    const { response } = await moderateMessage(message);

    if (response.status !== ModerationStatus.Accepted) {
      return translate(getKeyFromModerationReason(response.reason));
    }

    return undefined;
  } catch {
    return translate('Error.LoadingData');
  }
}

interface FormData {
  license: string;
  monitorType: MonitorType | null;
  offerType: AgreementCandidatePromotionType | null;
  feedbackText: string;
}

export interface MatchOfferPanelConfiguration {
  applicableLicenseType: LicenseType;
  allowConditionalOffers: boolean;
  allowRevenueSharing: boolean;
  allowChangeRequests: boolean;
  showLicenseDauAndMaturityMetadata: boolean;
}

const DEFAULT_MATCH_OFFER_PANEL_CONFIGURATION: MatchOfferPanelConfiguration = {
  applicableLicenseType: LicenseType.FullExperience,
  allowConditionalOffers: true,
  allowRevenueSharing: true,
  allowChangeRequests: true,
  showLicenseDauAndMaturityMetadata: true,
};
const EMPTY_ANALYTICS_CONTEXT: Record<string, never> = {};

interface Props {
  candidate: AgreementCandidateResponse;
  onSuccess: (agreement: AgreementResponse) => void;
  onClose: () => void;
  candidateType?: AgreementCandidateType;
  analyticsContext?: Record<string, string | number | boolean>;
  onPanelStateChange?: (state: 'loading' | 'ready' | 'error') => void;
  source?: 'sidebar' | 'galleryView' | 'detailsView';
  creationTile?: React.ReactNode;
  creationRequest?: {
    isPending: boolean;
    isError: boolean;
  };
  noLicensesDescription?: React.ReactNode;
  licenseFilter?: (license: LicenseResponse) => boolean;
  noMatchingLicensesDescription?: React.ReactNode;
  configuration?: MatchOfferPanelConfiguration;
}

/**
 * A form to allow IPH to initiate an agreement from `AgreementCandidate`
 */
/* oxlint-disable react/react-compiler -- react-hook-form watch() is incompatible with React Compiler memoization */
const MatchOfferPanelContent = ({
  candidate,
  onSuccess,
  onClose,
  candidateType = AgreementCandidateType.Universe,
  analyticsContext = EMPTY_ANALYTICS_CONTEXT,
  onPanelStateChange,
  source,
  creationTile,
  creationRequest,
  noLicensesDescription,
  licenseFilter,
  noMatchingLicensesDescription,
  configuration = DEFAULT_MATCH_OFFER_PANEL_CONFIGURATION,
}: Props) => {
  const { classes } = useStyles();
  const translation = useTranslation();
  const { translate } = translation;
  const { tPendingTranslation } = useTranslationWrapper(translation);
  const { ready: isAvatarItemLicensingFlagReady, value: isAvatarItemLicensingEnabled } = useFlag(
    isAvatarItemLicensingEnabledFlag,
  );
  const { logEvent } = useLicenseManagerLogger();
  const { logOnce } = useLicenseManagerLoggerLogOnce();
  const panelOpenedAtRef = useRef(Date.now());
  const offerAnalyticsContext = useMemo(
    () => ({
      ...analyticsContext,
      candidateType,
      agreementCandidateId: candidate.id ?? '',
      ipFamilyId: candidate.ipFamilyId ?? '',
      licenseType: configuration.applicableLicenseType,
      ...(source ? { source } : {}),
    }),
    [
      analyticsContext,
      candidate.id,
      candidate.ipFamilyId,
      candidateType,
      configuration.applicableLicenseType,
      source,
    ],
  );

  const usesProvidedCreation = creationRequest != null;
  const experienceId = usesProvidedCreation ? undefined : Number(candidate.candidateId);
  const gameRequest = useDebouncedGameDetails(experienceId);
  const licensesReq = useLicenseByIpFamilyIdQuery(candidate.ipFamilyId ?? '');
  const ipFamilyReq = useIpFamilyQuery(candidate.ipFamilyId ?? undefined);
  const { settings, isFetched } = useSettings();
  const { enableIpPlatformConditionalOffers } = settings;
  const showConditionalOfferSelection =
    configuration.allowConditionalOffers && enableIpPlatformConditionalOffers;

  const { enqueueErrorSnackbar, enqueueWithDefaults } = useIpSnackbar();

  const promoteAgreementMutation = usePromoteAgreementCandidateMutation();
  const contentModerationMutation = useContentModerationMutation();
  const [moderationError, setModerationError] = useState<string | undefined>(undefined);
  const feedbackSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let frameId: number | undefined;

    if (moderationError) {
      frameId = requestAnimationFrame(() => {
        feedbackSectionRef.current?.scrollIntoView({ block: 'end', behavior: 'smooth' });
      });
    }

    return () => {
      if (frameId !== undefined) {
        cancelAnimationFrame(frameId);
      }
    };
  }, [moderationError]);

  const isCandidateContentPending = usesProvidedCreation
    ? creationRequest.isPending
    : gameRequest.isPending;
  const hasCandidateContentError = usesProvidedCreation
    ? creationRequest.isError
    : !!gameRequest.error;
  const isPending = ipFamilyReq.isPending || licensesReq.isPending || isCandidateContentPending;
  const hasError = ipFamilyReq.isError || licensesReq.isError || hasCandidateContentError;

  const { control, handleSubmit, watch, setValue } = useForm<FormData>({
    defaultValues: {
      license: '',
      monitorType: null,
      offerType: null,
      feedbackText: '',
    },
  });

  const selectedLicenseId = watch('license');
  const selectedOfferType = watch('offerType');
  const eligibleLicenses = useMemo(
    () =>
      licensesReq.data?.filter(
        (license) =>
          (license.licenseType ?? LicenseType.FullExperience) ===
            configuration.applicableLicenseType &&
          !license.archived &&
          (!license.moderationStatus ||
            license.moderationStatus === LicenseModerationStatus.Approved) &&
          (!license.licenseDuration?.durationType ||
            license.licenseDuration.durationType !== LicenseDurationType.TimeLimited),
        [],
      ),
    [configuration.applicableLicenseType, licensesReq.data],
  );
  const licenses = useMemo(
    () => (licenseFilter ? eligibleLicenses?.filter(licenseFilter) : eligibleLicenses),
    [eligibleLicenses, licenseFilter],
  );
  const game = gameRequest.data === NO_GAME_FOUND_FOR_ID ? undefined : gameRequest.data;
  const hasNoMatchingLicenses =
    noMatchingLicensesDescription != null &&
    eligibleLicenses != null &&
    eligibleLicenses.length > 0 &&
    (!licenses || licenses.length === 0);
  const hasLicenseOptionsError = !licenses || licenses.length === 0;
  const loadFailureReason = ipFamilyReq.isError
    ? 'ipFamilyRequestError'
    : licensesReq.isError
      ? 'licensesRequestError'
      : hasCandidateContentError
        ? usesProvidedCreation
          ? 'creationRequestError'
          : 'experienceRequestError'
        : !usesProvidedCreation && !isPending && !game
          ? 'missingExperience'
          : undefined;
  const offerPanelState = isPending
    ? 'loading'
    : hasError
      ? 'loadFailure'
      : !eligibleLicenses || eligibleLicenses.length === 0
        ? 'noEligibleLicenses'
        : hasNoMatchingLicenses
          ? 'noCompatibleLicenses'
          : loadFailureReason
            ? 'loadFailure'
            : 'ready';
  const selectedLicense = selectedLicenseId
    ? licenses?.find((license) => license.id === selectedLicenseId)
    : undefined;
  const showLicenseTypeSelection = showConditionalOfferSelection && !!selectedLicense;
  const showFeedbackTextbox =
    showLicenseTypeSelection && selectedOfferType === AgreementCandidatePromotionType.Conditional;
  const selectedLicenseAnalyticsContext = useMemo(
    () => ({
      ...offerAnalyticsContext,
      selectedLicenseType: selectedLicense?.licenseType ?? configuration.applicableLicenseType,
      resellingPermission: selectedLicense?.licenseTerms?.reselling ?? 'unknown',
    }),
    [
      configuration.applicableLicenseType,
      offerAnalyticsContext,
      selectedLicense?.licenseTerms?.reselling,
      selectedLicense?.licenseType,
    ],
  );
  const actionErrorAnalyticsContext = useMemo(
    () => ({
      ...selectedLicenseAnalyticsContext,
      promotionType: selectedOfferType ?? AgreementCandidatePromotionType.Offer,
    }),
    [selectedLicenseAnalyticsContext, selectedOfferType],
  );

  useEffect(() => {
    if (selectedLicense) {
      setValue(
        'monitorType',
        selectedLicense.enableMonetization
          ? MonitorType.MonitorAndRevshare
          : MonitorType.MonitorOnly,
      );
    }
  }, [selectedLicense, setValue]);

  useEffect(() => {
    if (!isFetched || isPending || hasError) {
      return;
    }
    const hasNoPerpetualLicenseOptions = !eligibleLicenses || eligibleLicenses.length === 0;
    if (!hasNoPerpetualLicenseOptions) {
      return;
    }
    logOnce(
      LicenseManagerImpressionEvent.MatchOfferDrawerNoPerpetualLicensesEmptyStateImpressionEvent,
      {
        ...offerAnalyticsContext,
        eligibleLicenseCount: 0,
      },
    );
  }, [eligibleLicenses, hasError, isFetched, isPending, logOnce, offerAnalyticsContext]);

  useEffect(() => {
    if (offerPanelState === 'loading' || !isFetched) {
      onPanelStateChange?.('loading');
      return;
    }

    const panelState = offerPanelState === 'loadFailure' ? 'error' : 'ready';
    onPanelStateChange?.(panelState);
    logOnce(
      LicenseManagerImpressionEvent.MatchOfferPanelImpressionEvent,
      {
        ...offerAnalyticsContext,
        panelState: offerPanelState,
        eligibleLicenseCount: eligibleLicenses?.length ?? 0,
        compatibleLicenseCount: licenses?.length ?? 0,
        timeToStateMs: Math.max(0, Date.now() - panelOpenedAtRef.current),
      },
      `${candidate.id ?? candidate.candidateId ?? 'unknown'}:${offerPanelState}`,
    );

    if (offerPanelState === 'loadFailure') {
      logOnce(
        LicenseManagerImpressionEvent.MatchOfferPanelLoadFailureImpressionEvent,
        {
          ...offerAnalyticsContext,
          failureReason: loadFailureReason ?? 'unknown',
          timeToFailureMs: Math.max(0, Date.now() - panelOpenedAtRef.current),
        },
        `${candidate.id ?? candidate.candidateId ?? 'unknown'}:loadFailure`,
      );
    } else if (offerPanelState === 'noCompatibleLicenses') {
      logOnce(
        LicenseManagerImpressionEvent.MatchOfferPanelNoCompatibleLicensesImpressionEvent,
        {
          ...offerAnalyticsContext,
          eligibleLicenseCount: eligibleLicenses?.length ?? 0,
          compatibleLicenseCount: licenses?.length ?? 0,
        },
        `${candidate.id ?? candidate.candidateId ?? 'unknown'}:noCompatibleLicenses`,
      );
    }
  }, [
    candidate.candidateId,
    candidate.id,
    eligibleLicenses?.length,
    isFetched,
    licenses?.length,
    loadFailureReason,
    logOnce,
    offerAnalyticsContext,
    offerPanelState,
    onPanelStateChange,
  ]);

  const onSubmit = async (data: FormData) => {
    if (!candidate.id) {
      return;
    }

    const isConditionalOffer =
      showLicenseTypeSelection && data.offerType === AgreementCandidatePromotionType.Conditional;
    const feedbackText = data.feedbackText.trim();
    logEvent(LicenseManagerClickEvent.MatchOfferPanelSubmitClickEvent, {
      ...selectedLicenseAnalyticsContext,
      promotionType: data.offerType ?? AgreementCandidatePromotionType.Offer,
      monitorType: data.monitorType ?? 'none',
      hasFeedback: feedbackText.length > 0,
      validationPassed: true,
      timeToSubmitMs: Math.max(0, Date.now() - panelOpenedAtRef.current),
    });

    if (isConditionalOffer) {
      setModerationError(undefined);

      const moderationErrorMessage = await getFeedbackModerationErrorMessage(
        feedbackText,
        contentModerationMutation.mutateAsync,
        translate,
      );

      if (moderationErrorMessage) {
        setModerationError(moderationErrorMessage);
        logEvent(LicenseManagerImpressionEvent.MatchOfferPanelModerationFailureImpressionEvent, {
          ...selectedLicenseAnalyticsContext,
          promotionType: AgreementCandidatePromotionType.Conditional,
          failureReason: 'feedbackRejectedOrRequestFailed',
        });
        return;
      }
    }

    try {
      const agreement = await promoteAgreementMutation.mutateAsync({
        candidateId: candidate.id,
        licenseId: data.license,
        enableMonetization: configuration.allowRevenueSharing
          ? data.monitorType === MonitorType.MonitorAndRevshare
          : (selectedLicense?.enableMonetization ?? false),
        ...(showLicenseTypeSelection && data.offerType != null
          ? {
              promotionType: data.offerType,
              ...(isConditionalOffer ? { feedbackText } : {}),
            }
          : {}),
      });

      onSuccess(agreement);
      const agreementId = agreement.id;
      if (agreementId == null) {
        return;
      }
      logEvent(LicenseManagerImpressionEvent.SuccessfulLicenseOfferImpressionEvent, {
        ...selectedLicenseAnalyticsContext,
        agreementId,
        agreementCandidateId: candidate.id ?? '',
        promotionType: data.offerType ?? AgreementCandidatePromotionType.Offer,
        monitorType: data.monitorType ?? 'none',
        enableMonetization: configuration.allowRevenueSharing
          ? data.monitorType === MonitorType.MonitorAndRevshare
          : (selectedLicense?.enableMonetization ?? false),
        timeToSuccessMs: Math.max(0, Date.now() - panelOpenedAtRef.current),
      });
      if (source && candidateType === AgreementCandidateType.Universe) {
        logEvent(LicenseManagerImpressionEvent.ExperiencePreviewOfferSentImpressionEvent, {
          agreementId,
          agreementCandidateId: candidate.id ?? '',
          source,
        });
      }
      enqueueWithDefaults({
        children: (
          // I initially pulled this out into a new component, but then
          // I have to use a `useTranslation` hook inside of it (unless we pass in all text).
          // This doesn't work well, since this component is rendered outside of our tree
          // so then translations are missing, so inlining here.
          <Alert
            severity='success'
            classes={{
              action: classes.alertActions,
            }}
            action={
              <Button
                color='inherit'
                size='small'
                href={IPH_AGREEMENT_DETAILS_HREF(agreementId)}
                onClick={() => {
                  logEvent(LicenseManagerClickEvent.SuccessfulLicenseOfferViewAgreementClickEvent, {
                    agreementId,
                  });
                }}>
                {translate('Action.View')}
              </Button>
            }>
            <Typography variant='subtitle1' component='div'>
              {translate('Label.AgreementSentToCreator')}
            </Typography>
            <Typography variant='body2'>
              {isConditionalOffer
                ? translate('Description.ConditionalAgreementSentToCreator')
                : translate('Description.AgreementSentToCreator')}
            </Typography>
          </Alert>
        ),
      });
    } catch (error) {
      const err = error instanceof Error ? error : null;
      // 409 is shown inline via actionError / MatchOfferPanelError — avoid a duplicate generic toast.
      if (!isExistingAgreementError(err)) {
        enqueueErrorSnackbar();
      }
      console.error('Failed to promote agreement candidate:', error);
    }
  };

  const onInvalidSubmit = (errors: FieldErrors<FormData>) => {
    logEvent(LicenseManagerClickEvent.MatchOfferPanelSubmitClickEvent, {
      ...selectedLicenseAnalyticsContext,
      validationPassed: false,
      invalidFieldCount: Object.keys(errors).length,
      timeToSubmitMs: Math.max(0, Date.now() - panelOpenedAtRef.current),
    });
  };

  if (isPending || !isFetched) {
    return (
      <MatchPanelLayout title={translate('Heading.NewLicenseOffer')} onClose={onClose} loading />
    );
  }

  if (hasError) {
    return (
      <MatchPanelLayout title={translate('Heading.NewLicenseOffer')} onClose={onClose}>
        <Typography color='error'>{translate('Error.LoadingData')}</Typography>
      </MatchPanelLayout>
    );
  }

  const noLicensesDescriptionContent =
    noLicensesDescription ??
    (isAvatarItemLicensingFlagReady && isAvatarItemLicensingEnabled
      ? tPendingTranslation(
          'In order to send license offers, you need to create at least one perpetual, full game license for this IP Family.',
          'Empty-state description when a rights holder has no perpetual full-game license available for a Universe match offer.',
          translationKey(
            'Description.NoPerpetualFullGameLicensesForIpFamily',
            TranslationNamespace.AgreementsManager,
          ),
        )
      : translate('Description.NoPerpetualLicensesForIpFamily'));

  if (!eligibleLicenses || eligibleLicenses.length === 0) {
    return (
      <MatchPanelLayout title={translate('Heading.NewLicenseOffer')} onClose={onClose}>
        <EmptyState size='small' title='' description={noLicensesDescriptionContent}>
          <Button
            component={Link}
            href={IP_LISTINGS_HREF}
            variant='contained'
            color='primaryBrand'
            onClick={() =>
              logEvent(LicenseManagerClickEvent.MatchOfferPanelCreateLicenseClickEvent, {
                ...offerAnalyticsContext,
                reason: 'noEligibleLicenses',
              })
            }>
            {translate('Button.CreateLicense')}
          </Button>
        </EmptyState>
      </MatchPanelLayout>
    );
  }

  const licenseOptionsErrorDescription = hasNoMatchingLicenses
    ? noMatchingLicensesDescription
    : noLicensesDescriptionContent;

  if (!usesProvidedCreation && !game) {
    return (
      <MatchPanelLayout title={translate('Heading.NewLicenseOffer')} onClose={onClose}>
        <Typography color='error'>
          {translate('Error.ExperienceNotAvailable', {
            id: `${experienceId}`,
          })}
        </Typography>
      </MatchPanelLayout>
    );
  }

  const ipFamilyData = ipFamilyReq.data;

  const feedbackTextRules: RegisterOptions<FormData, 'feedbackText'> | undefined =
    showFeedbackTextbox
      ? {
          required: translate('Error.FieldIsMandatory'),
          validate: getMaxLengthValidationRule(
            MAX_IPH_CONDITIONAL_OFFER_FEEDBACK_LENGTH,
            translate,
          ),
        }
      : undefined;

  const primaryCta = (
    <Button
      variant='contained'
      color='primaryBrand'
      type='submit'
      size='large'
      fullWidth
      disabled={
        hasLicenseOptionsError ||
        isExistingAgreementError(promoteAgreementMutation.error) ||
        !!moderationError
      }
      loading={promoteAgreementMutation.isPending || contentModerationMutation.isPending}>
      {translate('Action.SendOffer')}
    </Button>
  );

  return (
    <MatchPanelLayout
      title={translate('Heading.NewLicenseOffer')}
      onClose={onClose}
      onSubmit={handleSubmit(onSubmit, onInvalidSubmit)}
      actionError={
        promoteAgreementMutation.error && (
          <MatchOfferPanelError
            error={promoteAgreementMutation.error}
            candidateId={candidate.id ?? undefined}
            licenseId={selectedLicenseId}
            analyticsContext={actionErrorAnalyticsContext}
          />
        )
      }
      buttons={primaryCta}>
      <div>
        <Typography color='primary' component='p' className={classes.largeBottomMargin}>
          {translate('Description.AgreementsSentInfo')}
        </Typography>

        <Typography variant='h6' component='h2' gutterBottom>
          {translate('Heading.CreationSendingAgreement')}
        </Typography>
        <div>
          {creationTile ??
            (game && (
              <ContentTile
                header={game.name ?? ''}
                subheader={
                  game.creator?.name
                    ? getCreatorDisplayName(
                        normalizeCreatorType(game.creator.type),
                        game.creator.name,
                      )
                    : ''
                }
                thumbnailTargetId={game.id ?? 0}
                type={ContentType.Universe}
                link={
                  game.rootPlaceId != null ? EXTERNAL_EXPERIENCE_HREF(game.rootPlaceId) : undefined
                }
              />
            ))}
        </div>
      </div>

      <div>
        <Typography variant='h6' component='h2' gutterBottom>
          {translate('Heading.RelatedIpAndLicense')}
        </Typography>

        <Typography color='primary' component='p' className={classes.largeBottomMargin}>
          {translate('Description.ChooseLicenseForAgreement')}
        </Typography>

        <Flex flexDirection='column' gap={12}>
          <Select
            id='ip-select'
            value={ipFamilyData?.name ?? ''}
            label={translate('Label.IpFamily')}
            disabled
            fullWidth>
            <MenuItem value={ipFamilyData?.name ?? ''}>
              {ipFamilyData?.name ?? translate('Label.NoIpAvailable')}
            </MenuItem>
          </Select>

          <Controller
            name='license'
            control={control}
            rules={{ required: translate('Label.FieldIsRequired') }}
            render={({ field, fieldState: { error } }) => (
              <FormControl fullWidth error={hasLicenseOptionsError || !!error}>
                <LicenseSelect
                  {...field}
                  onChange={(event) => {
                    field.onChange(event);
                    const selectedId = event.target.value;
                    const selected = licenses?.find((license) => license.id === selectedId);
                    logEvent(LicenseManagerClickEvent.MatchOfferPanelFieldChangeClickEvent, {
                      ...offerAnalyticsContext,
                      fieldName: 'license',
                      selectedLicenseType:
                        selected?.licenseType ?? configuration.applicableLicenseType,
                      resellingPermission: selected?.licenseTerms?.reselling ?? 'unknown',
                    });
                  }}
                  id='license-select'
                  label={translate('Label.License')}
                  licenses={licenses ?? []}
                  disabled={hasLicenseOptionsError}
                  error={hasLicenseOptionsError}
                  helperText={hasLicenseOptionsError ? licenseOptionsErrorDescription : undefined}
                  showDauAndMaturityMetadata={configuration.showLicenseDauAndMaturityMetadata}
                />
                {error && <FormHelperText>{error.message}</FormHelperText>}
              </FormControl>
            )}
          />
        </Flex>
      </div>

      {showLicenseTypeSelection && (
        <div>
          <Typography variant='h6' component='h2' className={classes.mediumBottomMargin}>
            {translate('Heading.LicenseType')}
          </Typography>

          <Controller
            name='offerType'
            control={control}
            rules={{ required: translate('Error.PleaseSelectALicenseType') }}
            render={({ field, fieldState: { error } }) => (
              <FormControl component='fieldset' error={!!error}>
                <RadioGroup
                  value={field.value ?? ''}
                  onValueChange={(value) => {
                    if (isValidEnumValue(AgreementCandidatePromotionType, value)) {
                      field.onChange(value);
                      logEvent(LicenseManagerClickEvent.MatchOfferPanelFieldChangeClickEvent, {
                        ...offerAnalyticsContext,
                        fieldName: 'promotionType',
                        value,
                      });
                      if (value !== AgreementCandidatePromotionType.Conditional) {
                        setValue('feedbackText', '');
                        setModerationError(undefined);
                      }
                    }
                  }}
                  size='Small'>
                  <Radio
                    value={AgreementCandidatePromotionType.Offer}
                    label={foundationRadioLabel(
                      <>
                        <Typography variant='body1' component='div' className={classes.radioOption}>
                          <strong>{translate('Label.SendPerpetualOffer')}</strong>
                        </Typography>
                        <Typography variant='body2' component='div' color='secondary'>
                          {translate('Description.PerpetualOfferSelection')}
                        </Typography>
                      </>,
                    )}
                  />
                  <Radio
                    value={AgreementCandidatePromotionType.Conditional}
                    label={foundationRadioLabel(
                      <>
                        <Typography variant='body1' component='div' className={classes.radioOption}>
                          <strong>{translate('Label.SendConditionalOffer')}</strong>
                        </Typography>
                        <Typography variant='body2' component='div' color='secondary'>
                          {translate('Description.ConditionalOfferSelection')}
                        </Typography>
                      </>,
                    )}
                  />
                </RadioGroup>
                {error && <FormHelperText error>{error.message}</FormHelperText>}
              </FormControl>
            )}
          />

          {showFeedbackTextbox && (
            <div ref={feedbackSectionRef} className={classes.feedbackSection}>
              <Typography variant='h6' component='h2' gutterBottom>
                {translate('Label.GiveConditionalOfferFeedback')}
              </Typography>
              <Typography color='primary' component='p' className={classes.largeBottomMargin}>
                {translate('Description.GiveConditionalOfferFeedback')}
              </Typography>
              <Controller
                name='feedbackText'
                control={control}
                rules={feedbackTextRules}
                render={({ field, fieldState: { error } }) => (
                  <TextFieldWithEnhancedHelperTextV2
                    {...field}
                    id='offer-feedback-text'
                    label=''
                    placeholder={translate('Message.TypeYourMessageHere')}
                    fullWidth
                    multiline
                    minRows={4}
                    maxRows={15}
                    error={!!error || !!moderationError}
                    helperText={error?.message ?? moderationError}
                    maxLength={MAX_IPH_CONDITIONAL_OFFER_FEEDBACK_LENGTH}
                    showCharacterCount
                    onChange={(e) => {
                      field.onChange(e);
                      if (moderationError) {
                        setModerationError(undefined);
                      }
                    }}
                  />
                )}
              />
            </div>
          )}
        </div>
      )}

      {configuration.allowRevenueSharing &&
        selectedLicense &&
        selectedLicense.royaltyRate !== 0 && (
          <div>
            <Typography variant='h6' component='h2' className={classes.mediumBottomMargin}>
              {translate('Heading.RevenueSharingOptions')}
            </Typography>

            <Controller
              name='monitorType'
              control={control}
              rules={{ required: translate('Error.PleaseSelectType') }}
              render={({ field, fieldState: { error } }) => (
                <FormControl component='fieldset' error={!!error}>
                  <RadioGroup
                    value={field.value ?? ''}
                    onValueChange={(value) => {
                      const monitorType = monitorTypeFromRadioValue(value);
                      field.onChange(monitorType);
                      logEvent(LicenseManagerClickEvent.MatchOfferPanelFieldChangeClickEvent, {
                        ...offerAnalyticsContext,
                        fieldName: 'monitorType',
                        value: monitorType ?? 'unknown',
                      });
                    }}
                    size='Small'>
                    <Radio
                      value={MonitorType.MonitorAndRevshare}
                      label={foundationRadioLabel(
                        <>
                          <Typography
                            variant='body1'
                            component='div'
                            className={classes.radioOption}>
                            <strong>{translate('Label.MonetizeOnActivation')}</strong>
                          </Typography>
                          <Typography variant='body2' component='div' color='secondary'>
                            {translate('Description.MonetizeOnActivation')}
                          </Typography>
                        </>,
                      )}
                    />
                    <Radio
                      value={MonitorType.MonitorOnly}
                      label={foundationRadioLabel(
                        <>
                          <Typography
                            variant='body1'
                            component='div'
                            className={classes.radioOption}>
                            <strong>{translate('Label.MonetizeLater')}</strong>
                          </Typography>
                          <Typography variant='body2' component='div' color='secondary'>
                            {translate('Description.MonetizeLater')}
                          </Typography>
                        </>,
                      )}
                    />
                  </RadioGroup>
                  {error && <FormHelperText error>{error.message}</FormHelperText>}
                </FormControl>
              )}
            />
          </div>
        )}

      {configuration.allowChangeRequests && selectedLicense && (
        <div>
          <Typography variant='h6' component='h2' gutterBottom>
            {translate('Label.ChangeRequests')}
          </Typography>
          <Typography color='primary' component='p' className={classes.largeBottomMargin}>
            {translate('Description.ChangeRequests')}
          </Typography>
        </div>
      )}
    </MatchPanelLayout>
  );
};
/* oxlint-enable react/react-compiler */

export default MatchOfferPanelContent;
