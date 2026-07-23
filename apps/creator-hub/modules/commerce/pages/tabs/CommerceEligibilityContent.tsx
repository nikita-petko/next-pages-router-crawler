import { useQuery } from '@tanstack/react-query';
import { useCallback, useMemo, useState, useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { withTranslation, useTranslation } from '@rbx/intl';
import {
  Typography,
  Grid,
  CheckCircleOutlineIcon,
  VerifiedUserOutlinedIcon,
  EmailOutlinedIcon,
  StoreIcon,
  HighlightOffIcon,
  Button,
  OpenInNewIcon,
  Checkbox,
  FormControlLabel,
  Link,
  makeStyles,
  CircularProgress,
  Alert,
  AlertTitle,
} from '@rbx/ui';
import { CreatorContactType } from '@modules/clients/brandPlatform';
import { TermsAcceptanceStatus } from '@modules/clients/commerce';
import { userAgreementsClient, UserAgreementClientType } from '@modules/clients/userAgreements';
import type { AgreementResolutionResponse } from '@modules/clients/userAgreements';
import { getResponseFromError } from '@modules/clients/utils';
import useCreatorAccountInfoQuery from '@modules/creator-account/hooks/useCreatorAccountInfoQuery';
import useCreatorContactInfoQuery from '@modules/creator-account/hooks/useCreatorContactInfoQuery';
import {
  useSubmitCreatorAccountInfo,
  useSubmitCreatorContact,
} from '@modules/creator-account/hooks/useSubmit';
import type { InputFormData } from '@modules/creator-account/types';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import CommerceTabContainer from '../../components/CommerceTabContainer';
import CommerceEligibilityBusinessInfoModal from '../../components/eligibility/CommerceEligibilityBusinessInfoModal';
import useBottomSnackbar from '../../hooks/useBottomSnackbar';
import useCommerce from '../../hooks/useCommerce';
import useCountries from '../../hooks/useCountries';
import useLatest from '../../hooks/useLatest';
import useModal from '../../hooks/useModal';
import isBaselineEligible from '../../utils/isBaselineEligible';

enum EligibilityCheckType {
  IdVerification = 'IdVerification',
  EmailVerification = 'EmailVerification',
  BusinessInfoVerification = 'BusinessInfoVerification',
}

interface EligibilityRowProps {
  isEligible: boolean;
  isFetching: boolean;
  icon: React.JSX.Element;
  headingText: string;
  descriptionText: string;
  buttonText: string;
  onClick: () => void;
  showExternalIcon?: boolean;
}

const useLinkStyles = makeStyles()(() => ({
  root: {
    fontWeight: 300,
    textUnderlineOffset: 2,
  },
}));

const useAlertStyles = makeStyles()((theme) => ({
  fullWidthAlert: {
    width: '100%',
    marginBottom: theme.spacing(2),
  },
}));

const EligibilityRow = ({
  isEligible,
  isFetching,
  icon,
  headingText,
  descriptionText,
  buttonText,
  onClick,
  showExternalIcon,
}: EligibilityRowProps) => {
  const StatusIcon = useMemo(() => {
    if (isFetching) {
      return <CircularProgress size={20} color='secondary' />;
    }

    return isEligible ? (
      <CheckCircleOutlineIcon color='success' data-testid='eligible-icon-id' />
    ) : (
      <HighlightOffIcon color='error' data-testid='ineligible-icon-id' />
    );
  }, [isEligible, isFetching]);

  return (
    <Grid
      container
      direction='row'
      wrap='nowrap'
      alignItems='center'
      justifyContent='space-between'
      paddingTop={1.5}
      paddingBottom={1.5}
      gap={3}>
      <Grid container direction='row' wrap='nowrap' alignItems='center' gap={3}>
        <Grid fontSize={32}>{icon}</Grid>
        <Grid container direction='column' wrap='nowrap' gap={0.5}>
          <Typography variant='h6'>{headingText}</Typography>
          <Typography variant='body2'>{descriptionText}</Typography>
        </Grid>
      </Grid>
      <Grid container direction='row' wrap='nowrap' XSmall='auto' alignItems='center' gap={3}>
        {!isEligible && (
          <Button
            variant='contained'
            color='secondary'
            onClick={onClick}
            endIcon={showExternalIcon ? <OpenInNewIcon /> : undefined}>
            {buttonText}
          </Button>
        )}
        {StatusIcon}
      </Grid>
    </Grid>
  );
};

enum ModalType {
  None,
  BusinessInfo,
}

type ModalState = { type: ModalType.None } | { type: ModalType.BusinessInfo };

const CommerceEligibilityContent = () => {
  const { translate, translateHTML } = useTranslation();
  const { openModal, closeModal, getModalProps } = useModal();
  const { enqueueSnackbar } = useBottomSnackbar();
  const { fetchCommerceEligibilityQuery, eligibilityStatus } = useCommerce();
  const { countries, ...countriesQuery } = useCountries();
  const { classes: linkClasses } = useLinkStyles();
  const { classes: alertClasses } = useAlertStyles();
  const submitCreatorAccountInfo = useSubmitCreatorAccountInfo();
  const submitCreatorContact = useSubmitCreatorContact(CreatorContactType.Legal);

  const [creatorAccountInfoQuery] = useCreatorAccountInfoQuery({
    enabled:
      eligibilityStatus !== undefined && !eligibilityStatus.baselineEligibility.hasBusinessInfo,
    refetchOnWindowFocus:
      eligibilityStatus !== undefined && !eligibilityStatus.baselineEligibility.hasBusinessInfo,
  });
  const { isPending: isAccountInfoPending, data: accountInfoData } = creatorAccountInfoQuery;
  const accountInfo = useLatest(accountInfoData, () => accountInfoData !== undefined);
  const [creatorLegalContactInfoQuery] = useCreatorContactInfoQuery(CreatorContactType.Legal, {
    enabled:
      eligibilityStatus !== undefined && !eligibilityStatus.baselineEligibility.hasBusinessInfo,
    refetchOnWindowFocus:
      eligibilityStatus !== undefined && !eligibilityStatus.baselineEligibility.hasBusinessInfo,
  });
  const { isPending: isLegalInfoPending, data: legalInfoData } = creatorLegalContactInfoQuery;
  const legalInfo = useLatest(legalInfoData, () => legalInfoData !== undefined);

  const { control, watch } = useForm<{ termsAgreement: boolean }>();
  const isTermsAgreementChecked = watch('termsAgreement');

  const [modalState, setModalState] = useState<ModalState>({ type: ModalType.None });
  const [isSubmittingUserAgreementAcceptance, setIsSubmittingUserAgreementAcceptance] =
    useState(false);

  const hasBusinessInfoPermissions = useMemo(() => {
    // Check if either account or legal info query returned 403
    const accountInfoForbidden = creatorAccountInfoQuery.isSuccess
      ? false
      : getResponseFromError(creatorAccountInfoQuery.error)?.status === 403;
    const legalInfoForbidden = creatorLegalContactInfoQuery.isSuccess
      ? false
      : getResponseFromError(creatorLegalContactInfoQuery.error)?.status === 403;

    return !(accountInfoForbidden || legalInfoForbidden);
  }, [
    creatorAccountInfoQuery.isSuccess,
    creatorAccountInfoQuery.error,
    creatorLegalContactInfoQuery.isSuccess,
    creatorLegalContactInfoQuery.error,
  ]);

  const hasPreviouslySubmittedUserAgreementAcceptance =
    eligibilityStatus?.baselineEligibility.termsAcceptanceStatus === TermsAcceptanceStatus.Accepted;

  // Is terms checkbox disabled
  const isTermsAcceptanceDisabled =
    isSubmittingUserAgreementAcceptance ||
    !eligibilityStatus?.baselineEligibility.hasEligibleAge ||
    !eligibilityStatus?.baselineEligibility.hasVerifiedId ||
    !eligibilityStatus?.baselineEligibility.hasVerifiedEmail ||
    !eligibilityStatus?.baselineEligibility.hasBusinessInfo ||
    !eligibilityStatus?.baselineEligibility.hasEligibleModerationHistory;

  const enqueueGenericErrorSnackbar = useCallback(() => {
    enqueueSnackbar(translate('Message.GenericError'), {
      severity: 'error',
    });
  }, [enqueueSnackbar, translate]);

  const fetchUserAgreementsResolutionQuery = useQuery({
    queryKey: ['user-agreements-resolution'],
    queryFn: async () => {
      const response: AgreementResolutionResponse[] = await userAgreementsClient.getUserAgreements({
        clientType: UserAgreementClientType.Commerce,
      });

      if (response.length > 0) {
        return {
          id: response[0].id,
          displayUrl: response[0].displayUrl,
        };
      }
      // Empty if already accepted
      return null;
    },
  });
  const commerceAgreement = useLatest(
    fetchUserAgreementsResolutionQuery.data,
    () => !!fetchUserAgreementsResolutionQuery.data,
  );

  const onSubmitBusinessInfoForm = useCallback(
    async (data: InputFormData) => {
      try {
        const accountInfoPromise = submitCreatorAccountInfo(data);
        const contactInfoPromise = submitCreatorContact(data);
        await Promise.all([accountInfoPromise, contactInfoPromise]);

        const { error } = await fetchCommerceEligibilityQuery.refetch({ cancelRefetch: true });
        if (error) {
          throw error;
        }

        setModalState({ type: ModalType.None });
        enqueueSnackbar(translate('Message.Eligibility.BusinessInfoSubmitted'), {
          severity: 'success',
        });
      } catch {
        enqueueGenericErrorSnackbar();
      }
    },
    [
      enqueueGenericErrorSnackbar,
      enqueueSnackbar,
      fetchCommerceEligibilityQuery,
      submitCreatorAccountInfo,
      submitCreatorContact,
      translate,
    ],
  );

  const onClickUnlockCommerce = useCallback(async () => {
    try {
      setIsSubmittingUserAgreementAcceptance(true);

      if (commerceAgreement === undefined || commerceAgreement === null) {
        enqueueGenericErrorSnackbar();
        return;
      }

      const response = await userAgreementsClient.acceptUserAgreements([commerceAgreement.id]);

      if (response.results?.some((result) => result.errorCode !== 0)) {
        throw new Error('Failed to accept one or more agreements');
      }

      const { data: updatedEligibilityStatus, error } = await fetchCommerceEligibilityQuery.refetch(
        {
          cancelRefetch: true,
        },
      );
      if (error || !isBaselineEligible(updatedEligibilityStatus?.baselineEligibility)) {
        throw new Error('Failed to unlock commerce eligibility');
      }

      enqueueSnackbar(translate('Message.Eligibility.UnlockedAccess'), {
        severity: 'success',
      });
    } catch {
      enqueueGenericErrorSnackbar();
    } finally {
      setIsSubmittingUserAgreementAcceptance(false);
    }
  }, [
    commerceAgreement,
    enqueueGenericErrorSnackbar,
    enqueueSnackbar,
    fetchCommerceEligibilityQuery,
    translate,
  ]);

  const eligibilityCheckConfigs = useMemo(() => {
    return {
      [EligibilityCheckType.IdVerification]: {
        icon: <VerifiedUserOutlinedIcon fontSize='inherit' />,
        keys: {
          heading: 'Heading.Eligibility.IdVerification',
          description: 'Description.Eligibility.IdVerification',
          buttonText: 'Label.Eligibility.IdVerification',
        },
        isEligible:
          eligibilityStatus?.baselineEligibility.hasVerifiedId &&
          eligibilityStatus?.baselineEligibility.hasEligibleAge,
        recourse: {
          showExternalIcon: true,
          onClick: () => {
            window.open(`https://www.${process.env.robloxSiteDomain}/my/account#!/info`);
          },
        },
      },
      [EligibilityCheckType.EmailVerification]: {
        icon: <EmailOutlinedIcon fontSize='inherit' />,
        keys: {
          heading: 'Heading.Eligibility.EmailVerification',
          description: 'Description.Eligibility.EmailVerification',
          buttonText: 'Label.Eligibility.EmailVerification',
        },
        isEligible: eligibilityStatus?.baselineEligibility.hasVerifiedEmail,
        recourse: {
          showExternalIcon: true,
          onClick: () => {
            window.open(`https://www.${process.env.robloxSiteDomain}/my/account#!/info`);
          },
        },
      },
      [EligibilityCheckType.BusinessInfoVerification]: {
        icon: <StoreIcon fontSize='inherit' />,
        keys: {
          heading: 'Heading.Eligibility.BusinessInfoVerification',
          description: 'Description.Eligibility.BusinessInfoVerification',
          buttonText: 'Label.Eligibility.BusinessInfoVerification',
        },
        isEligible: eligibilityStatus?.baselineEligibility.hasBusinessInfo,
        recourse: {
          showExternalIcon: false,
          onClick: () => {
            setModalState({ type: ModalType.BusinessInfo });
          },
        },
      },
    };
  }, [eligibilityStatus?.baselineEligibility]);

  useEffect(() => {
    const resetModalState = () => setModalState({ type: ModalType.None });

    switch (modalState.type) {
      case ModalType.None:
        closeModal();
        break;
      case ModalType.BusinessInfo:
        openModal(
          <CommerceEligibilityBusinessInfoModal
            accountInfo={accountInfo}
            legalContactInfo={legalInfo}
            onCancel={resetModalState}
            onSubmit={onSubmitBusinessInfoForm}
            countries={countries}
            isPending={isAccountInfoPending || isLegalInfoPending}
          />,
          getModalProps({
            maxWidth: 'Large',
            onBackdropClick: resetModalState,
            useHigherContrast: true,
          }),
        );
        break;
      default:
        break;
    }
  }, [
    accountInfo,
    closeModal,
    countries,
    getModalProps,
    legalInfo,
    modalState.type,
    onSubmitBusinessInfoForm,
    openModal,
    isAccountInfoPending,
    isLegalInfoPending,
  ]);

  if (
    (!eligibilityStatus && fetchCommerceEligibilityQuery.error) ||
    (!commerceAgreement && fetchUserAgreementsResolutionQuery.error) ||
    (countries.length === 0 && countriesQuery.error)
  ) {
    return (
      <CommerceTabContainer justifyContent='start' alignItems='stretch'>
        <Alert severity='error'>{translate('Message.GenericError')}</Alert>
      </CommerceTabContainer>
    );
  }

  if (
    eligibilityStatus === undefined ||
    (commerceAgreement === undefined && !hasPreviouslySubmittedUserAgreementAcceptance) ||
    countriesQuery.isPending
  ) {
    return (
      <CommerceTabContainer>
        <CircularProgress color='secondary' />
      </CommerceTabContainer>
    );
  }

  return (
    <CommerceTabContainer justifyContent='start'>
      {!hasBusinessInfoPermissions && (
        <Alert severity='warning' className={alertClasses.fullWidthAlert}>
          <AlertTitle paddingBottom={1}>
            {translate('Heading.Eligibility.CommerceLocked')}
          </AlertTitle>
          {translate('Description.Eligibility.CommerceLocked')}
        </Alert>
      )}

      <Grid item container marginBottom={10} gap={4} paddingLeft={2} paddingRight={2}>
        {Object.entries(eligibilityCheckConfigs).map(([key, config]) => {
          // Only display business info row if user has permissions to edit business info
          if (
            key === EligibilityCheckType.BusinessInfoVerification &&
            !hasBusinessInfoPermissions
          ) {
            return null;
          }

          return (
            <EligibilityRow
              key={key}
              isEligible={config.isEligible ?? false}
              isFetching={fetchCommerceEligibilityQuery.isFetching}
              icon={config.icon}
              headingText={translate(config.keys.heading)}
              descriptionText={translate(config.keys.description)}
              buttonText={translate(config.keys.buttonText)}
              onClick={config.recourse.onClick}
              showExternalIcon={config.recourse.showExternalIcon}
            />
          );
        })}
        {eligibilityStatus.baselineEligibility.termsAcceptanceStatus !==
          TermsAcceptanceStatus.Accepted && (
          <Grid marginLeft={1} marginTop={0.5}>
            <Controller
              name='termsAgreement'
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <Checkbox
                      {...field}
                      id='termsAgreement'
                      color='secondary'
                      disabled={isTermsAcceptanceDisabled}
                    />
                  }
                  label={translateHTML('Message.Eligibility.TermsAgreement', [
                    {
                      opening: 'linkStart',
                      closing: 'linkEnd',
                      content(chunks) {
                        return (
                          <Link
                            href={commerceAgreement?.displayUrl}
                            target='_blank'
                            color='inherit'
                            underline='always'
                            classes={linkClasses}>
                            {chunks}
                          </Link>
                        );
                      },
                    },
                  ])}
                />
              )}
            />
          </Grid>
        )}
        <Grid container justifyContent='end' marginRight={5.5}>
          <Button
            variant='contained'
            disabled={isTermsAcceptanceDisabled || !isTermsAgreementChecked}
            loading={isSubmittingUserAgreementAcceptance}
            onClick={onClickUnlockCommerce}>
            {hasBusinessInfoPermissions
              ? translate('Action.Eligibility.UnlockCommerce')
              : translate('Action.Eligibility.ContinueToCommerce')}
          </Button>
        </Grid>
      </Grid>
    </CommerceTabContainer>
  );
};

export default withTranslation(CommerceEligibilityContent, [TranslationNamespace.Commerce]);
