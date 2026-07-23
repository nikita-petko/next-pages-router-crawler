/* eslint-disable eslint-comments/disable-enable-pair,react-hooks/rules-of-hooks -- TODO: remove eslint-disable with
enableFiatOnboarding */

import React, { Fragment, FunctionComponent, useCallback, useEffect, useState } from 'react';
import { RobloxLocaleApiCountryRegion } from '@rbx/clients/locale';
import {
  Alert,
  Autocomplete,
  Button,
  CircularProgress,
  DialogTemplate,
  Divider,
  Grid,
  OpenInNewIcon,
  TextField,
  Typography,
  useDialog,
  useSnackbar,
} from '@rbx/ui';
import { Restriction } from '@rbx/clients/marketplacePublishingRequirementsApi';
import { urls, FormMode, Link } from '@modules/miscellaneous/common';
import unifiedLoggerClient from '@modules/eventStream/unifiedLoggerClient';
import CreatorDashboardEventType from '@modules/eventStream/enum/CreatorDashboardEventType';

import { useAuthentication } from '@modules/authentication/providers';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useTranslation, withTranslation } from '@rbx/intl';
import { useFetchOnboardingRestrictions } from '@modules/marketplacePublishingRequirements/MarketplacePublishingRequirementsProvider';
import { marketplaceFiatService } from '@modules/clients';
import { RobloxPaymentsSharedV1SellerStatus as SellerStatus } from '@rbx/clients/marketplaceFiatService';

import EligibilityRow, { EligibilityStatus } from '@modules/eligibility/components/EligibilityRow';
import LegalAgreements from '@modules/legal-agreements/components/LegalAgreements';
import { OverviewInlineUrlTranslationLabel } from '@modules/creations/common';

import { FormProvider, useForm } from 'react-hook-form';

import {
  useFetchAuthorizedCountries,
  useFetchSellerStatus,
} from '@modules/marketplaceFiatService/MarketplaceFiatServiceQueries';
import useSellerOnboardingStyles from './SellerOnboarding.styles';
import useCountryRegions from '../context/useCountryRegions';
import OnboardingStatusAlert from './OnboardingStatusAlert';

export type OnboardingFormType = {
  termsOfService: boolean;
};

const {
  www,
  terms,
  creatorHub: { docs },
} = urls;

const SellerOnboarding: FunctionComponent<React.PropsWithChildren<unknown>> = () => {
  const { classes: styles } = useSellerOnboardingStyles();
  const { user } = useAuthentication();
  const { enqueue } = useSnackbar();
  const { translate } = useTranslation();
  const { open, close: closeDialog, configure } = useDialog();

  const [currentCountryCode, setCurrentCountryCode] = useState<RobloxLocaleApiCountryRegion | null>(
    null,
  );
  const [isCountryValid, setIsCountryValid] = useState<boolean>();
  const [isModerationEligible, setIsModerationEligible] = useState<boolean>(false);
  const [isVerified, setIsVerified] = useState<boolean>(false);
  const [isDialogLoading, setIsDialogLoading] = useState<boolean>(false);
  const [legalAgreementsSigned, setLegalAgreementsSigned] = useState(false);

  const {
    data: countryRegionsList,
    hasError: hasCountryRegionsError,
    isLoading: isCountryRegionsLoading,
  } = useCountryRegions();

  const {
    data: authorizedCountriesMap,
    error: hasAuthorizedCountriesMapError,
    isPending: isAuthorizedCountriesMapLoading,
  } = useFetchAuthorizedCountries();

  const {
    data: onboardingRestrictions,
    hasError: hasOnboardingRestrictionsError,
    isLoading: isOnboardingRestrictionsLoading,
  } = useFetchOnboardingRestrictions();

  const {
    data: sellerStatusResponse,
    error: hasSellerStatusError,
    isPending: isSellerStatusLoading,
  } = useFetchSellerStatus();

  const isSetupCompleted = sellerStatusResponse && sellerStatusResponse.setupCompleted;
  const sellerStatus = sellerStatusResponse && sellerStatusResponse.sellerStatus;
  const createdDateTime = sellerStatusResponse && sellerStatusResponse.createdDateTime;
  const isBannerVisible =
    isSetupCompleted ||
    (!isSetupCompleted &&
      (sellerStatus === SellerStatus.Pending || sellerStatus === SellerStatus.Restricted));
  const savedCountry = sellerStatusResponse && sellerStatusResponse.countryCode;
  const isEditAllowed = !isSetupCompleted || sellerStatus === SellerStatus.NotStarted;
  const hasPreviouslySignedLegalAgreements = sellerStatus !== SellerStatus.NotStarted;

  const formMethods = useForm<OnboardingFormType>({
    mode: FormMode.OnChange,
    reValidateMode: FormMode.OnChange,
    shouldUnregister: true,
  });
  const { handleSubmit, formState } = formMethods;
  const { isValid: isAgreementFormValid } = formState;

  const handleChangeCountry = useCallback(
    (event: React.SyntheticEvent, targetCountry: RobloxLocaleApiCountryRegion | null) => {
      setCurrentCountryCode(targetCountry);
      const isValid =
        targetCountry && targetCountry.code
          ? authorizedCountriesMap?.has(targetCountry?.code)
          : false;
      setIsCountryValid(isValid ?? false);

      unifiedLoggerClient.logClickEvent({
        eventName: CreatorDashboardEventType.ClickMarketplaceOnboardingCountry,
        parameters: {
          userId: user?.id?.toString() || '',
          countryCode: targetCountry?.code || '',
        },
      });
    },
    [authorizedCountriesMap, user, setCurrentCountryCode, setIsCountryValid],
  );

  const onClickModerationLearnMoreLink = useCallback(() => {
    window.open(www.getAppealsPortalUrl());
  }, []);

  const onClickIdVerifyLink = useCallback(() => {
    window.open(www.getAccountSettingsUrl());
  }, []);

  const showError = useCallback(
    (errorText?: string) => {
      enqueue(
        {
          anchorOrigin: { vertical: 'bottom', horizontal: 'center' },
          autoHide: false,
          children: (
            <Alert severity='error'>{errorText ?? translate('Response.UnknownError')}</Alert>
          ),
        },
        (reason) => reason === 'timeout',
      );
    },
    [enqueue, translate],
  );

  const handleOnboardingRedirect = useCallback(
    async (countryCode: string) => {
      setIsDialogLoading(true);
      try {
        const isLegalAgreementSigned = hasPreviouslySignedLegalAgreements || legalAgreementsSigned;
        const onboardSellerResponse = await marketplaceFiatService.onboardSeller(
          countryCode,
          isLegalAgreementSigned,
        );
        if (onboardSellerResponse?.onboardingUrl) {
          window.location.assign(onboardSellerResponse.onboardingUrl);
        } else {
          showError();
        }
      } catch (e) {
        // This error occurs if a user cancels the 2sv challenge
        const isChallengeInvalidationError =
          e instanceof Error && e.message === 'challenge error for challenge kind invalidated';
        if (!isChallengeInvalidationError) {
          showError();
        }
        setIsDialogLoading(false);
      }
      // Wait 2 seconds before setting loading to false since users are redirected back to the page after completing the 2sv challenge
      setTimeout(() => {
        setIsDialogLoading(false);
      }, 2000);
    },
    [hasPreviouslySignedLegalAgreements, setIsDialogLoading, legalAgreementsSigned, showError],
  );

  const redirectToOnboardingDialog = useCallback(
    (countryCode: string | null) => {
      if (!countryCode) {
        return null;
      }
      return (
        <DialogTemplate
          cancelText={translate('Action.Cancel')}
          content={
            isSetupCompleted
              ? translate('Message.RedirectNoticeForEdit')
              : translate('Message.RedirectNotice')
          }
          confirmText={translate('Action.OK')}
          loading={isDialogLoading}
          onCancel={closeDialog}
          onConfirm={() => {
            handleOnboardingRedirect(countryCode);
          }}
          title={translate('Heading.RedirectNotice')}
        />
      );
    },
    [closeDialog, handleOnboardingRedirect, isDialogLoading, isSetupCompleted, translate],
  );

  useEffect(() => {
    // NOTE: This is needed so that isDialogLoading reloads on re-render for redirectToOnboardingDialog
    configure(redirectToOnboardingDialog(currentCountryCode?.code ?? savedCountry ?? null), {
      maxWidth: 'Small',
    });
  }, [configure, currentCountryCode?.code, redirectToOnboardingDialog, savedCountry]);

  const handleDialogOpen = useCallback(() => {
    if (!savedCountry) {
      return;
    }
    configure(redirectToOnboardingDialog(savedCountry), { maxWidth: 'Small' });
    open();
  }, [configure, open, redirectToOnboardingDialog, savedCountry]);

  const handleDialogOpenWithDropdownCountry = useCallback(() => {
    if (!currentCountryCode?.code && !savedCountry) {
      return;
    }
    configure(redirectToOnboardingDialog(currentCountryCode?.code ?? savedCountry ?? null), {
      maxWidth: 'Small',
    });
    open();
  }, [configure, currentCountryCode?.code, open, redirectToOnboardingDialog, savedCountry]);

  useEffect(() => {
    setIsModerationEligible(
      !!onboardingRestrictions &&
        ![Restriction.Authorization, Restriction.Moderation, Restriction.ModerationHistory].some(
          (restriction) => onboardingRestrictions.onboardingRestrictions.includes(restriction),
        ),
    );
    setIsVerified(
      !!onboardingRestrictions &&
        !onboardingRestrictions.onboardingRestrictions.includes(Restriction.Verification),
    );
  }, [onboardingRestrictions, setIsModerationEligible, setIsVerified]);

  useEffect(() => {
    if (
      !!hasOnboardingRestrictionsError ||
      !!hasCountryRegionsError ||
      !!hasAuthorizedCountriesMapError ||
      !!hasSellerStatusError
    ) {
      showError();
    }
  }, [
    hasAuthorizedCountriesMapError,
    hasOnboardingRestrictionsError,
    hasCountryRegionsError,
    hasSellerStatusError,
    showError,
  ]);

  return (
    <Fragment>
      {isBannerVisible && (
        <Grid item XSmall className={styles.statusContainer}>
          <OnboardingStatusAlert
            status={sellerStatus}
            handleRedirectToOnboarding={handleDialogOpen}
          />
        </Grid>
      )}
      <FormProvider {...formMethods}>
        <Grid container direction='column' spacing={2}>
          <Grid item container alignItems='flex-start' spacing={2}>
            <Grid
              alignItems='center'
              container
              direction='row'
              item
              justifyContent='space-between'
              spacing={3}>
              <Grid item container XSmall='auto' alignItems='center' spacing={1}>
                {sellerStatus !== SellerStatus.Rejected && isBannerVisible && (
                  <Grid item>
                    <Button
                      className={styles.editButton}
                      color='primaryBrand'
                      data-testid='edit-button-id'
                      endIcon={<OpenInNewIcon />}
                      onClick={handleDialogOpen}
                      size='small'
                      variant='text'>
                      {translate('Action.EditInformation')}
                    </Button>
                  </Grid>
                )}
              </Grid>
              {isSetupCompleted && createdDateTime != null && (
                <Grid item>
                  <Typography variant='body1'>
                    {translate('Label.SellerSince', {
                      date: createdDateTime.toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      }),
                    })}
                  </Typography>
                </Grid>
              )}
            </Grid>
            <Grid item>
              <Grid container>
                <OverviewInlineUrlTranslationLabel
                  anchorTargetUrl={docs.getSellingOnCreatorStoreUrl()}
                  closing='linkEnd'
                  typographyColorOverride='inherit'
                  typographyVariantOverride='body2'
                  linkVariantOverride='body2'
                  opening='linkStart'
                  translationKey='Description.OnboardingRequirementsWithLink'
                />
              </Grid>
            </Grid>
          </Grid>

          <Grid
            container
            item
            className={styles.prerequisitesContainer}
            direction='column'
            spacing={3}>
            <Grid item XSmall>
              <Typography variant='h4'>{translate('Label.Prerequisites')}</Typography>
            </Grid>
            {isOnboardingRestrictionsLoading || hasOnboardingRestrictionsError ? (
              <Grid container item data-testid='eligibility-loading-id'>
                <CircularProgress />
              </Grid>
            ) : (
              <Grid container item data-testid='eligibility-container-id' direction='row'>
                <Grid className={styles.eligibilityContainer} container spacing={4}>
                  <EligibilityRow
                    descriptionText={
                      isModerationEligible ? undefined : (
                        <Typography variant='body2' color='inherit'>
                          <Grid item>{translate('Message.ModerationHistoryDoesNotQualify')}</Grid>
                          <Grid item>
                            <Link href={docs.getSellingOnCreatorStoreUrl()} target='_blank'>
                              {translate('Action.LearnMore')}
                            </Link>
                          </Grid>
                        </Typography>
                      )
                    }
                    headerText={translate('Label.ModerationHistory')}
                    isLowerCaseLink
                    linkText={
                      isModerationEligible ? undefined : translate('Action.ViewModerationHistory')
                    }
                    onClickLink={isModerationEligible ? undefined : onClickModerationLearnMoreLink}
                    status={
                      isModerationEligible ? EligibilityStatus.Completed : EligibilityStatus.Warning
                    }
                  />
                  <EligibilityRow
                    headerText={translate('Label.IdAndAgeVerification')}
                    linkText={isVerified ? undefined : translate('Action.Verify')}
                    onClickLink={isVerified ? undefined : onClickIdVerifyLink}
                    status={isVerified ? EligibilityStatus.Completed : EligibilityStatus.Warning}
                  />
                </Grid>
              </Grid>
            )}
          </Grid>

          {!isEditAllowed && (
            <Grid item>
              <Divider />
            </Grid>
          )}

          <Grid item className={styles.sectionWithVerticalSpacing}>
            <Grid container direction='column' spacing={3}>
              <Grid item XSmall>
                <Typography variant='h4'>{translate('Label.ContactInformation')}</Typography>
              </Grid>
              <Grid item XSmall>
                {!isEditAllowed && (
                  <Grid container direction='column' spacing={1}>
                    <Grid item XSmall>
                      <Typography variant='body2'>
                        {translate('Label.CountryOfResidence')}
                      </Typography>
                    </Grid>
                    <Grid item XSmall>
                      <Typography variant='body1'>{savedCountry}</Typography>
                    </Grid>
                  </Grid>
                )}
                {isEditAllowed && (
                  <Autocomplete
                    data-testid='country-autocomplete-id'
                    getOptionLabel={(option) => option.displayName ?? ''}
                    ListboxProps={{ style: { maxHeight: 120 } }}
                    options={countryRegionsList ?? []}
                    onChange={handleChangeCountry}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        id='language'
                        label={translate('Label.CountryOfResidence')}
                        error={isCountryValid === false}
                        InputProps={{
                          ...params.InputProps,
                          endAdornment: (
                            <React.Fragment>
                              {isCountryRegionsLoading || isAuthorizedCountriesMapLoading ? (
                                <CircularProgress
                                  color='inherit'
                                  data-testid='country-loading-id'
                                  size={20}
                                />
                              ) : null}
                              {params.InputProps.endAdornment}
                            </React.Fragment>
                          ),
                        }}
                      />
                    )}
                    value={currentCountryCode}
                  />
                )}
                {isCountryValid === false && (
                  <Grid className={styles.countryErrorContainer}>
                    <Typography color='error' data-testid='country-invalid-id' variant='footer'>
                      {hasAuthorizedCountriesMapError
                        ? translate('Response.UnknownError')
                        : translate('Message.CountryNotSupported')}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </Grid>
          </Grid>

          {!isEditAllowed && (
            <Grid item>
              <Divider />
            </Grid>
          )}

          <Grid
            container
            item
            className={styles.sectionWithVerticalSpacing}
            direction='column'
            spacing={3}>
            <LegalAgreements
              description={
                hasPreviouslySignedLegalAgreements
                  ? undefined
                  : translate('Description.ReviewStatementsToSubmit')
              }
              isSignatureRequired={false}
              legalStatements={[
                {
                  id: 'termsOfService',
                  text: (
                    <OverviewInlineUrlTranslationLabel
                      anchorTargetUrl={terms.getSellerOnboardingLegalAgreementUrl()}
                      closing='tosLinkEnd'
                      typographyVariantOverride='body1'
                      linkVariantOverride='body1'
                      opening='tosLinkStart'
                      translationKey={
                        hasPreviouslySignedLegalAgreements
                          ? 'Message.AlreadyAgreedToCreatorStoreTOS'
                          : 'Message.AgreeToCreatorStoreTOS'
                      }
                    />
                  ),
                  wasPreviouslySigned: hasPreviouslySignedLegalAgreements,
                },
              ]}
              onFormUpdate={(isAllAgreementsComplete: boolean) => {
                setLegalAgreementsSigned(isAllAgreementsComplete);
              }}
            />
          </Grid>

          {isEditAllowed && (
            <Grid item>
              <Button
                className={styles.continueButton}
                color='primaryBrand'
                data-testid='submit-button-id'
                disabled={
                  isCountryRegionsLoading ||
                  hasOnboardingRestrictionsError ||
                  isOnboardingRestrictionsLoading ||
                  !isCountryValid ||
                  !isModerationEligible ||
                  !isVerified ||
                  !isAgreementFormValid
                }
                loading={isSellerStatusLoading}
                onClick={handleSubmit(handleDialogOpenWithDropdownCountry)}
                size='large'
                variant='contained'>
                {translate('Action.Next')}
              </Button>
            </Grid>
          )}
        </Grid>
      </FormProvider>
    </Fragment>
  );
};

export default withTranslation(SellerOnboarding, [
  TranslationNamespace.Controls,
  TranslationNamespace.Error,
  TranslationNamespace.MarketplaceOnboarding,
  TranslationNamespace.AgreementsUpdate,
]);
