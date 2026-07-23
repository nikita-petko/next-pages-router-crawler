import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useForm, Controller, type RegisterOptions } from 'react-hook-form';
import {
  AgreementCandidatePromotionType,
  LicenseDurationType,
  LicenseModerationStatus,
  ModerationStatus,
  type AgreementCandidateResponse,
  type AgreementResponse,
  type ModerationResponse,
} from '@rbx/client-content-licensing-api/v1';
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
import { getResponseFromError } from '@modules/clients/utils';
import useContentModerationMutation from '@modules/licenses/hooks/useContentModerationMutation';
import getKeyFromModerationReason from '@modules/licenses/utils/moderationReason';
import { Link } from '@modules/miscellaneous/components';
import EmptyState from '@modules/miscellaneous/components/EmptyState/EmptyState';
import { Flex } from '@modules/miscellaneous/components/Flex';
import { isValidEnumValue } from '@modules/miscellaneous/utils/enumUtils';
import { useSettings } from '@modules/settings/SettingsProvider/SettingsProvider';
import {
  TextFieldWithEnhancedHelperTextV2,
  getMaxLengthValidationRule,
} from '../../../components/TextFieldWithEnhancedHelperTextV2';
import useIpSnackbar from '../../../hooks/useIpSnackbar';
import { useIpFamilyQuery } from '../../../ipFamilies/hooks/ipFamily';
import { ContentTile, ContentType } from '../../components/ContentTile';
import { MAX_IPH_CHANGE_REQUEST_LENGTH } from '../../constants';
import { IPH_AGREEMENT_DETAILS_HREF, EXTERNAL_EXPERIENCE_HREF, IP_LISTINGS_HREF } from '../../urls';
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
}: {
  error: Error;
  candidateId: string | undefined;
  licenseId: string | undefined;
}) => {
  const { translate } = useTranslation();
  const { logEvent } = useLicenseManagerLogger();
  const hasExistingAgreementError = isExistingAgreementError(error);

  useEffect(() => {
    if (hasExistingAgreementError) {
      logEvent(
        LicenseManagerImpressionEvent.UnsuccessfulLicenseOfferAgreementAlreadyExistsErrorImpressionEvent,
        { candidateId: candidateId ?? '', licenseId: licenseId ?? '' },
      );
    } else {
      logEvent(LicenseManagerImpressionEvent.UnsuccessfulLicenseOfferGenericErrorImpressionEvent, {
        candidateId: candidateId ?? '',
        licenseId: licenseId ?? '',
      });
    }
  }, [hasExistingAgreementError, logEvent, candidateId, licenseId]);

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

interface Props {
  candidate: AgreementCandidateResponse;
  onSuccess: (agreement: AgreementResponse) => void;
  onClose: () => void;
}

/**
 * A form to allow IPH to initiate an agreement from `AgreementCandidate`
 */
/* oxlint-disable react/react-compiler -- react-hook-form watch() is incompatible with React Compiler memoization */
const MatchOfferPanelContent = ({ candidate, onSuccess, onClose }: Props) => {
  const { classes } = useStyles();
  const { translate } = useTranslation();
  const { logEvent } = useLicenseManagerLogger();
  const { logOnce } = useLicenseManagerLoggerLogOnce();

  const experienceId = Number(candidate.candidateId);
  const gameRequest = useDebouncedGameDetails(experienceId);
  const licensesReq = useLicenseByIpFamilyIdQuery(candidate.ipFamilyId ?? '');
  const ipFamilyReq = useIpFamilyQuery(candidate.ipFamilyId ?? undefined);
  const { settings, isFetched } = useSettings();
  const { enableIpPlatformConditionalOffers } = settings;
  const showConditionalOfferSelection = enableIpPlatformConditionalOffers;

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

  const isPending = ipFamilyReq.isPending || licensesReq.isPending || gameRequest.isPending;
  const hasError = ipFamilyReq.isError || licensesReq.isError || gameRequest.error;

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
  const licenses = useMemo(
    () =>
      licensesReq.data?.filter(
        (license) =>
          !license.archived &&
          (!license.moderationStatus ||
            license.moderationStatus === LicenseModerationStatus.Approved) &&
          (!license.licenseDuration?.durationType ||
            license.licenseDuration.durationType !== LicenseDurationType.TimeLimited),
        [],
      ),
    [licensesReq.data],
  );
  const selectedLicense =
    !!selectedLicenseId && licenses?.find((license) => license.id === selectedLicenseId);
  const showLicenseTypeSelection = showConditionalOfferSelection && !!selectedLicense;
  const showFeedbackTextbox =
    showLicenseTypeSelection && selectedOfferType === AgreementCandidatePromotionType.Conditional;

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
    const hasNoPerpetualLicenseOptions = !licenses || licenses.length === 0;
    if (!hasNoPerpetualLicenseOptions) {
      return;
    }
    logOnce(
      LicenseManagerImpressionEvent.MatchOfferDrawerNoPerpetualLicensesEmptyStateImpressionEvent,
      {
        candidateId: candidate.id ?? '',
        ipFamilyId: candidate.ipFamilyId ?? '',
      },
    );
  }, [candidate.id, candidate.ipFamilyId, hasError, isFetched, isPending, licenses, logOnce]);

  const onSubmit = async (data: FormData) => {
    if (!candidate.id) {
      return;
    }

    const isConditionalOffer =
      showLicenseTypeSelection && data.offerType === AgreementCandidatePromotionType.Conditional;
    const feedbackText = data.feedbackText.trim();

    if (isConditionalOffer) {
      setModerationError(undefined);

      const moderationErrorMessage = await getFeedbackModerationErrorMessage(
        feedbackText,
        contentModerationMutation.mutateAsync,
        translate,
      );

      if (moderationErrorMessage) {
        setModerationError(moderationErrorMessage);
        return;
      }
    }

    try {
      const agreement = await promoteAgreementMutation.mutateAsync({
        candidateId: candidate.id,
        licenseId: data.license,
        enableMonetization: data.monitorType === MonitorType.MonitorAndRevshare,
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
        agreementId,
      });
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
      enqueueErrorSnackbar();
      console.error('Failed to promote agreement candidate:', error);
    }
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

  const game = gameRequest.data;

  if (!licenses || licenses.length === 0) {
    return (
      <MatchPanelLayout title={translate('Heading.NewLicenseOffer')} onClose={onClose}>
        <EmptyState
          size='small'
          title=''
          description={translate('Description.NoPerpetualLicensesForIpFamily')}>
          <Button component={Link} href={IP_LISTINGS_HREF} variant='contained' color='primaryBrand'>
            {translate('Button.CreateLicense')}
          </Button>
        </EmptyState>
      </MatchPanelLayout>
    );
  }

  if (!game || game === NO_GAME_FOUND_FOR_ID) {
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
          validate: getMaxLengthValidationRule(MAX_IPH_CHANGE_REQUEST_LENGTH, translate),
        }
      : undefined;

  const primaryCta = (
    <Button
      variant='contained'
      color='primaryBrand'
      type='submit'
      size='large'
      fullWidth
      disabled={isExistingAgreementError(promoteAgreementMutation.error) || !!moderationError}
      loading={promoteAgreementMutation.isPending || contentModerationMutation.isPending}>
      {translate('Action.SendOffer')}
    </Button>
  );

  return (
    <MatchPanelLayout
      title={translate('Heading.NewLicenseOffer')}
      onClose={onClose}
      onSubmit={handleSubmit(onSubmit)}
      actionError={
        promoteAgreementMutation.error && (
          <MatchOfferPanelError
            error={promoteAgreementMutation.error}
            candidateId={candidate.id ?? undefined}
            licenseId={selectedLicenseId}
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
          <ContentTile
            header={game.name ?? ''}
            subheader={game.creator?.name ? `@${game.creator?.name}` : ''}
            thumbnailTargetId={game.id ?? 0}
            type={ContentType.Universe}
            link={game.rootPlaceId != null ? EXTERNAL_EXPERIENCE_HREF(game.rootPlaceId) : undefined}
          />
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
              <FormControl fullWidth error={!!error}>
                <LicenseSelect
                  {...field}
                  id='license-select'
                  label={translate('Label.License')}
                  licenses={licenses}
                  disabled={licenses.length === 0}
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
        </div>
      )}

      {selectedLicense && selectedLicense.royaltyRate !== 0 && (
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
                  onValueChange={(value) => field.onChange(monitorTypeFromRadioValue(value))}
                  size='Small'>
                  <Radio
                    value={MonitorType.MonitorAndRevshare}
                    label={foundationRadioLabel(
                      <>
                        <Typography variant='body1' component='div' className={classes.radioOption}>
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
                        <Typography variant='body1' component='div' className={classes.radioOption}>
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

      {showFeedbackTextbox && (
        <div ref={feedbackSectionRef}>
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
                maxLength={MAX_IPH_CHANGE_REQUEST_LENGTH}
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

      {selectedLicense && (
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
