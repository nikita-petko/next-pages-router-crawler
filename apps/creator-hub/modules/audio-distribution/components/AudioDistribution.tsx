import type { FunctionComponent } from 'react';
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { Restriction } from '@rbx/client-marketplace-publishing-requirements-api/v1';
import { ClientType } from '@rbx/client-user-agreements-service/v1';
import { useTranslation, withTranslation } from '@rbx/intl';
import { Button, CircularProgress, Grid, Typography } from '@rbx/ui';
import { useAuthentication } from '@modules/authentication/providers';
import { userAgreementsClient } from '@modules/clients/userAgreements';
import type { AgreementResolutionResponse } from '@modules/clients/userAgreements';
import OverviewInlineUrlTranslationLabel from '@modules/creations/common/components/OverviewInlineUrlTranslationLabel';
import EligibilityRow, { EligibilityStatus } from '@modules/eligibility/components/EligibilityRow';
import LegalAgreements from '@modules/legal-agreements/components/LegalAgreements';
import { useFetchOnboardingRestrictions } from '@modules/marketplacePublishingRequirements/MarketplacePublishingRequirementsProvider';
import { FormMode } from '@modules/miscellaneous/common';
import PageNotLoading from '@modules/miscellaneous/error/components/PageNotLoading';
import { useUnifiedLoggerProvider } from '@modules/miscellaneous/hooks/UnifiedLoggerProvider';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { terms, www } from '@modules/miscellaneous/urls';
import getDistributionStatus, { EDistributionStatus } from '../hooks/getDistributionStatus';
import useMessageSnackbar from '../hooks/useMessageSnackbar';
import useAudioDistributionStyles from './AudioDistribution.styles';
import DistributionStatusModal from './DistributionStatusModal';

const maxUpdateRetryCount = 3;

export type OnboardingFormType = {
  termsOfService: boolean;
};

const AudioDistribution: FunctionComponent<React.PropsWithChildren> = () => {
  const { unifiedLogger } = useUnifiedLoggerProvider();
  const { showError } = useMessageSnackbar();
  const { translate } = useTranslation();
  const {
    classes: { eligibilityContainer },
  } = useAudioDistributionStyles();
  const { user } = useAuthentication();
  const isAgreementFetched = useRef(false);
  const [updatingAgreements, setUpdatingAgreements] = useState<boolean>(false);
  const [legalAgreementsSigned, setLegalAgreementsSigned] = useState<boolean>(false);
  const [updateAgreements, setUpdateAgreements] = useState<AgreementResolutionResponse[]>([]);

  const onClickIdVerifyLink = useCallback(() => {
    window.open(www.getAccountSettingsUrl());
  }, []);

  const formMethods = useForm<OnboardingFormType>({
    mode: FormMode.OnChange,
    reValidateMode: FormMode.OnChange,
    shouldUnregister: true,
  });

  const emitSaveOnboardingEvent = useCallback(() => {
    unifiedLogger.logClickEvent({
      eventName: 'clickSaveOnboarding.audioDistribution.success',
    });
  }, [unifiedLogger]);

  const {
    data: onboardingRestrictions,
    hasError: hasOnboardingRestrictionsError,
    isLoading: isOnboardingRestrictionsLoading,
  } = useFetchOnboardingRestrictions();

  const isIdVerified =
    !!onboardingRestrictions &&
    !onboardingRestrictions.onboardingRestrictions.includes(Restriction.Verification);
  const isTosSigned = isAgreementFetched.current && updateAgreements.length === 0;

  const [distributionStatus, setDistributionStatus] = useState<EDistributionStatus>(() =>
    getDistributionStatus(isIdVerified, isTosSigned),
  );
  const hasUserOnboarded = distributionStatus !== EDistributionStatus.NotStarted;
  const hasPreviouslySignedLegalAgreements = distributionStatus !== EDistributionStatus.NotStarted;

  const tryUpdateAgreements = useCallback(
    async (agreementIds: string[]) => {
      async function updateAcceptanceWithRetry(ids: string[], retryTimes: number) {
        if (retryTimes <= 0) {
          showError(translate('Description.BadRequest'));
          return;
        }
        try {
          const response = await userAgreementsClient.acceptUserAgreements(ids);
          const failedAgreementIds = response.results?.reduce((prevValue, currentItem) => {
            if (currentItem.errorCode !== 0) {
              prevValue.push(currentItem.agreementId);
            }
            return prevValue;
          }, [] as string[]);
          if (failedAgreementIds && failedAgreementIds.length > 0) {
            await updateAcceptanceWithRetry(failedAgreementIds, retryTimes - 1);
          } else {
            setDistributionStatus(EDistributionStatus.Pending);
          }
        } catch {
          showError(translate('Description.BadRequest'));
        }
      }
      await updateAcceptanceWithRetry(agreementIds, maxUpdateRetryCount);
    },
    [showError, translate],
  );

  const handleConfirm = useCallback(async () => {
    const agreementIdsNeedsUpdate = updateAgreements.map((agreements) => agreements.id);
    setUpdatingAgreements(true);
    await tryUpdateAgreements(agreementIdsNeedsUpdate);
    emitSaveOnboardingEvent();
    setUpdatingAgreements(false);
  }, [emitSaveOnboardingEvent, tryUpdateAgreements, updateAgreements]);

  const fetchUpdateUserAgreements = useCallback(async () => {
    try {
      const response = await userAgreementsClient.getUserAgreements({
        clientType: ClientType.AudioDistribution,
      });
      if (response.length > 0) {
        setUpdateAgreements([...response]);
      } else {
        setDistributionStatus(EDistributionStatus.Approved);
      }
    } catch {
      showError(translate('Description.BadRequest'));
    }
  }, [showError, translate]);

  useEffect(() => {
    if (user?.id !== undefined && !isAgreementFetched.current && !hasUserOnboarded) {
      void fetchUpdateUserAgreements();
      isAgreementFetched.current = true;
    }
  }, [user, fetchUpdateUserAgreements, hasUserOnboarded]);

  return (
    <FormProvider {...formMethods}>
      {hasOnboardingRestrictionsError ? (
        <PageNotLoading />
      ) : (
        <Grid container direction='column' spacing={6}>
          <Grid item container direction='column' paddingBottom={5} spacing={5}>
            {hasUserOnboarded && isIdVerified && (
              <Grid data-testid='status-modal-id' item XSmall>
                <DistributionStatusModal status={distributionStatus} />
              </Grid>
            )}
            <Grid container item XSmall>
              <Typography variant='body2'>
                {translate('Description.AudioDistributionOnboardingRequirements')}
              </Typography>
            </Grid>
            {isOnboardingRestrictionsLoading ? (
              <Grid container data-testid='loading-id' item>
                <CircularProgress />
              </Grid>
            ) : (
              <Grid item>
                <Grid container direction='column' spacing={3}>
                  <Grid item XSmall>
                    <Typography variant='h4'>{translate('Label.Prerequisites')}</Typography>
                  </Grid>
                  <Grid item>
                    <Typography variant='body2'>
                      {translate('Description.IdAndAgeVerification')}
                    </Typography>
                  </Grid>
                  <Grid data-testid='eligibility-container-id' container direction='row' item>
                    <Grid className={eligibilityContainer} container spacing={3}>
                      <EligibilityRow
                        headerText={translate('Label.IdAndAgeVerification')}
                        linkText={isIdVerified ? undefined : translate('Action.Verify')}
                        onClickLink={isIdVerified ? undefined : onClickIdVerifyLink}
                        status={
                          isIdVerified ? EligibilityStatus.Completed : EligibilityStatus.Warning
                        }
                      />
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>
            )}

            <Grid
              container
              item
              direction='column'
              data-testid='legal-agreements-container-id'
              spacing={2}>
              <LegalAgreements
                description={
                  hasPreviouslySignedLegalAgreements
                    ? undefined
                    : translate('Description.ReviewStatementsToSubmit')
                }
                isSignatureRequired={false}
                statementSpacing={2}
                legalStatements={[
                  {
                    id: 'termsOfService',
                    text: (
                      <OverviewInlineUrlTranslationLabel
                        anchorTargetUrl={terms.getAudioDistributionOnboardingLegalAgreementUrl()}
                        closing='tosLinkEnd'
                        typographyVariantOverride='body1'
                        typographyColorOverride='inherit'
                        linkVariantOverride='body1'
                        opening='tosLinkStart'
                        translationKey='Message.AgreeToAudioDistributionTOS'
                      />
                    ),
                    wasPreviouslySigned: hasPreviouslySignedLegalAgreements,
                  },
                  {
                    id: 'lawfulContentOwner',
                    text: (
                      <Typography variant='body1'>
                        {translate('Message.AgreeToLawfulOwnership')}
                      </Typography>
                    ),
                    wasPreviouslySigned: hasPreviouslySignedLegalAgreements,
                  },
                  {
                    id: 'noninfringement',
                    text: (
                      <Typography variant='body1'>
                        {translate('Message.AgreeToNoninfringement')}
                      </Typography>
                    ),
                    wasPreviouslySigned: hasPreviouslySignedLegalAgreements,
                  },
                  {
                    id: 'grantLicense',
                    text: (
                      <Typography variant='body1'>
                        {translate('Message.AgreeToGranting')}
                      </Typography>
                    ),
                    wasPreviouslySigned: hasPreviouslySignedLegalAgreements,
                  },
                ]}
                onFormUpdate={(isAllAgreementsComplete: boolean) => {
                  setLegalAgreementsSigned(isAllAgreementsComplete);
                }}
              />
            </Grid>

            {!hasUserOnboarded && (
              <Grid item>
                <Grid item paddingRight={5} paddingTop={5}>
                  <Button
                    color='primaryBrand'
                    size='large'
                    variant='contained'
                    data-testid='submit-button-id'
                    disabled={
                      hasOnboardingRestrictionsError ||
                      isOnboardingRestrictionsLoading ||
                      !isIdVerified ||
                      !legalAgreementsSigned
                    }
                    loading={updatingAgreements}
                    onClick={handleConfirm}>
                    {translate('Button.Submit')}
                  </Button>
                </Grid>
              </Grid>
            )}
          </Grid>
        </Grid>
      )}
    </FormProvider>
  );
};

export default withTranslation(AudioDistribution, [
  TranslationNamespace.AgreementsUpdate,
  TranslationNamespace.DeveloperQuestionnaire,
  TranslationNamespace.Error,
  TranslationNamespace.MarketplaceOnboarding,
]);
