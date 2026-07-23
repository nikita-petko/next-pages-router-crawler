import React, { useEffect, useMemo } from 'react';
import {
  Typography,
  Select,
  MenuItem,
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
  makeStyles,
  Alert,
  FormHelperText,
  Button,
} from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
import { useForm, Controller } from 'react-hook-form';
import {
  LicenseDurationType,
  LicenseModerationStatus,
  type AgreementCandidateResponse,
  type AgreementResponse,
} from '@rbx/clients/contentLicensingApi/v1';
import { EmptyState, Flex } from '@modules/miscellaneous/common/components';
import { getResponseFromError } from '@modules/clients/utils';
import { Link } from '@modules/miscellaneous/common';
import { useSettings } from '@modules/settings';

import { useIpFamilyQuery } from '../../../ipFamilies/hooks/ipFamily';
import {
  usePromoteAgreementCandidateMutation,
  useLicenseByIpFamilyIdQuery,
} from '../hooks/agreements';
import { NO_GAME_FOUND_FOR_ID, useDebouncedGameDetails } from '../hooks/games';
import LicenseSelect from './LicenseSelect';
import useIpSnackbar from '../../../hooks/useIpSnackbar';
import { IPH_AGREEMENT_DETAILS_HREF, EXTERNAL_EXPERIENCE_HREF, IP_LISTINGS_HREF } from '../../urls';
import { ContentTile, ContentType } from '../../components/ContentTile';
import MatchDrawerLayout from './MatchDrawerLayout';
import {
  LicenseManagerClickEvent,
  LicenseManagerImpressionEvent,
  useLicenseManagerLogger,
} from '../../utils/logger';

const useStyles = makeStyles()(() => ({
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '200px',
  },
  semanticGapLargerBottom: {
    marginBottom: 24,
  },
  alertActions: {
    flexShrink: 0,
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

const MatchOfferDrawerError = ({
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

interface FormData {
  license: string;
  monitorType: MonitorType | null;
}

interface Props {
  candidate: AgreementCandidateResponse;
  onSuccess: (agreement: AgreementResponse) => void;
  onClose: () => void;
}

/**
 * A form to allow IPH to initiate an agreement from `AgreementCandidate`
 */
const MatchOfferDrawerContent = ({ candidate, onSuccess, onClose }: Props) => {
  const { classes } = useStyles();
  const { translate, translateHTML } = useTranslation();
  const { logEvent } = useLicenseManagerLogger();

  const experienceId = Number(candidate.candidateId);
  const gameRequest = useDebouncedGameDetails(experienceId);
  const licensesReq = useLicenseByIpFamilyIdQuery(candidate.ipFamilyId!);
  const ipFamilyReq = useIpFamilyQuery(candidate.ipFamilyId ?? undefined);
  const { settings, isFetched } = useSettings();
  const { enableIpPlatformTimeboundLicenses } = settings;

  const { enqueueErrorSnackbar, enqueueWithDefaults } = useIpSnackbar();

  const promoteAgreementMutation = usePromoteAgreementCandidateMutation();

  const isPending = ipFamilyReq.isPending || licensesReq.isPending || gameRequest.isPending;
  const hasError = ipFamilyReq.isError || licensesReq.isError || gameRequest.error;

  const { control, handleSubmit, watch, setValue } = useForm<FormData>({
    defaultValues: {
      license: '',
      monitorType: null,
    },
  });

  const selectedLicenseId = watch('license');
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

  const onSubmit = async (data: FormData) => {
    if (!candidate.id) {
      return;
    }

    try {
      const agreement = await promoteAgreementMutation.mutateAsync({
        candidateId: candidate.id,
        licenseId: data.license,
        enableMonetization: data.monitorType === MonitorType.MonitorAndRevshare,
      });

      onSuccess(agreement);
      logEvent(LicenseManagerImpressionEvent.SuccessfulLicenseOfferImpressionEvent, {
        agreementId: agreement.id!,
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
                href={IPH_AGREEMENT_DETAILS_HREF(agreement.id!)}
                onClick={() => {
                  logEvent(LicenseManagerClickEvent.SuccessfulLicenseOfferViewAgreementClickEvent, {
                    agreementId: agreement.id!,
                  });
                }}>
                {translate('Action.View')}
              </Button>
            }>
            <Typography variant='subtitle1' component='div'>
              {translate('Label.AgreementSentToCreator')}
            </Typography>
            <Typography variant='body2'>
              {translate('Description.AgreementSentToCreator')}
            </Typography>
          </Alert>
        ),
      });
    } catch (error) {
      enqueueErrorSnackbar();
      // eslint-disable-next-line no-console -- TODO: [future] remove once we have proper error handling
      console.error('Failed to promote agreement candidate:', error);
    }
  };

  if (isPending || !isFetched) {
    return (
      <MatchDrawerLayout title={translate('Heading.NewLicenseOffer')} onClose={onClose} loading />
    );
  }

  if (hasError) {
    return (
      <MatchDrawerLayout title={translate('Heading.NewLicenseOffer')} onClose={onClose}>
        <Typography color='error'>{translate('Error.LoadingData')}</Typography>
      </MatchDrawerLayout>
    );
  }

  const game = gameRequest.data;

  if (!licenses || licenses.length === 0) {
    return (
      <MatchDrawerLayout title={translate('Heading.NewLicenseOffer')} onClose={onClose}>
        <EmptyState
          size='small'
          title=''
          description={translate(
            enableIpPlatformTimeboundLicenses
              ? 'Description.NoPerpetualLicensesForIpFamily'
              : 'Description.NoLicensesForIpFamily',
          )}>
          <Button component={Link} href={IP_LISTINGS_HREF} variant='contained' color='primaryBrand'>
            {translate('Button.CreateLicense')}
          </Button>
        </EmptyState>
      </MatchDrawerLayout>
    );
  }

  if (!game || game === NO_GAME_FOUND_FOR_ID) {
    return (
      <MatchDrawerLayout title={translate('Heading.NewLicenseOffer')} onClose={onClose}>
        <Typography color='error'>
          {translate('Error.ExperienceNotAvailable', {
            id: `${experienceId}`,
          })}
        </Typography>
      </MatchDrawerLayout>
    );
  }

  const ipFamilyData = ipFamilyReq.data;

  const buttons = (
    <React.Fragment>
      <Button
        variant='outlined'
        color='secondary'
        onClick={onClose}
        size='large'
        disabled={promoteAgreementMutation.isPending}>
        {translate('Action.Close')}
      </Button>
      <Button
        variant='contained'
        color='primaryBrand'
        type='submit'
        size='large'
        disabled={isExistingAgreementError(promoteAgreementMutation.error)}
        loading={promoteAgreementMutation.isPending}>
        {translate('Action.SendOffer')}
      </Button>
    </React.Fragment>
  );

  return (
    <MatchDrawerLayout
      title={translate('Heading.NewLicenseOffer')}
      onClose={onClose}
      onSubmit={handleSubmit(onSubmit)}
      actionError={
        promoteAgreementMutation.error && (
          <MatchOfferDrawerError
            error={promoteAgreementMutation.error}
            candidateId={candidate.id ?? undefined}
            licenseId={selectedLicenseId}
          />
        )
      }
      buttons={buttons}>
      <div>
        <Typography color='secondary' component='p' className={classes.semanticGapLargerBottom}>
          {translate('Description.AgreementsSentInfo')}
        </Typography>

        <Typography variant='h5' component='h2' className={classes.semanticGapLargerBottom}>
          {translate('Heading.CreationSendingAgreement')}
        </Typography>
        <div>
          <ContentTile
            header={game.name!}
            subheader={`@${game.creator?.name}`}
            thumbnailTargetId={game.id!}
            type={ContentType.Universe}
            link={EXTERNAL_EXPERIENCE_HREF(game.rootPlaceId!)}
          />
        </div>
      </div>

      <div>
        <Typography variant='h5' component='h2' gutterBottom>
          {translate('Heading.RelatedIpAndLicense')}
        </Typography>

        <Typography color='secondary' component='p' className={classes.semanticGapLargerBottom}>
          {translate('Description.ChooseLicenseForAgreement')}
        </Typography>

        <Flex flexDirection='column' gap={24}>
          <Select
            id='ip-select'
            value={ipFamilyData?.name || ''}
            label={translate('Label.IP')}
            disabled
            fullWidth>
            <MenuItem value={ipFamilyData?.name || ''}>
              {ipFamilyData?.name || translate('Label.NoIpAvailable')}
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

      {selectedLicense && selectedLicense.royaltyRate !== 0 && (
        <div>
          <Typography variant='h5' component='h2' className={classes.semanticGapLargerBottom}>
            {translate('Heading.RevenueSharingOptions')}
          </Typography>

          <Controller
            name='monitorType'
            control={control}
            rules={{ required: translate('Error.PleaseSelectType') }}
            render={({ field, fieldState: { error } }) => (
              <FormControl component='fieldset' error={!!error}>
                <RadioGroup {...field}>
                  <FormControlLabel
                    value={MonitorType.MonitorAndRevshare}
                    control={<Radio aria-label={translate('Label.MonetizeOnActivation')} />}
                    label={translateHTML('Label.MonetizeOnActivationWithInfo', [
                      {
                        opening: 'boldStart',
                        closing: 'boldEnd',
                        content(chunks) {
                          return <strong>{chunks}</strong>;
                        },
                      },
                    ])}
                  />
                  <FormControlLabel
                    value={MonitorType.MonitorOnly}
                    control={<Radio aria-label={translate('Label.MonetizeLater')} />}
                    label={translateHTML('Label.MonetizeLaterWithInfo', [
                      {
                        opening: 'boldStart',
                        closing: 'boldEnd',
                        content(chunks) {
                          return <strong>{chunks}</strong>;
                        },
                      },
                    ])}
                  />
                </RadioGroup>
                {error && <FormHelperText error>{error.message}</FormHelperText>}
              </FormControl>
            )}
          />
        </div>
      )}

      <div>
        <Typography variant='h5' component='h2' gutterBottom>
          {translate('Label.ChangeRequests')}
        </Typography>
        <Typography color='secondary' component='p' className={classes.semanticGapLargerBottom}>
          {translate('Description.ChangeRequests')}
        </Typography>
      </div>
    </MatchDrawerLayout>
  );
};

export default MatchOfferDrawerContent;
