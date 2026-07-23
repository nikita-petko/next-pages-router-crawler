import { useRouter } from 'next/router';
import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import { RobloxPaidAccessFiatPaidAccessServiceV1FiatPayoutAccountStatus as PayoutAccountStatus } from '@rbx/client-fiat-paid-access-service/v1';
import { Restriction } from '@rbx/client-marketplace-publishing-requirements-api/v1';
import { useTranslation } from '@rbx/intl';
import { Button, Dialog, DialogTemplate, Grid, OpenInNewIcon, Typography } from '@rbx/ui';
import { AccountSettingsClient } from '@modules/clients/accountSettings';
import EligibilityRow, { EligibilityStatus } from '@modules/eligibility/components/EligibilityRow';
import { useFetchOnboardingRestrictions } from '@modules/marketplacePublishingRequirements/MarketplacePublishingRequirementsProvider';
import { PageLoading } from '@modules/miscellaneous/components';
import { www } from '@modules/miscellaneous/urls';
import { useGetPayoutAccountStatus } from '@modules/react-query/fiatPaidAccess/fiatPaidAccessQueries';
import { EligibilitySettingsLink } from '../../constants/links';
import type {
  EligibilityCheckIntlKeyProps,
  EligibilityCheckProps,
} from '../../constants/PaidAccessChecksConstants';
import {
  EligibilityCheckIntlKeys,
  EligibilityCheckType,
} from '../../constants/PaidAccessChecksConstants';
import PaymentSetupModal from '../PaymentSetupModal/PaymentSetupModal';
import useFiatPaidAccessChecksStyles from './PaidAccessChecks.styles';

interface PaidAccessChecksProps {
  isCardComponent?: boolean;
  isOpen?: boolean;
  setIsEligible?: (open: boolean) => void;
}

const PayoutStatusMap = new Map<string, PayoutAccountStatus>([
  ['FIAT_PAYOUT_ACCOUNT_STATUS_INVALID', PayoutAccountStatus.Invalid],
  ['FIAT_PAYOUT_ACCOUNT_STATUS_REQUESTED', PayoutAccountStatus.Requested],
  ['FIAT_PAYOUT_ACCOUNT_STATUS_APPROVED', PayoutAccountStatus.Approved],
  ['FIAT_PAYOUT_ACCOUNT_STATUS_REJECTED', PayoutAccountStatus.Rejected],
  ['FIAT_PAYOUT_ACCOUNT_STATUS_NOT_REQUESTED', PayoutAccountStatus.NotRequested],
  ['FIAT_PAYOUT_ACCOUNT_STATUS_INACTIVE', PayoutAccountStatus.Inactive],
]);

const FiatPaidAccessChecks = ({
  isCardComponent = false,
  isOpen = true,
  setIsEligible = () => {},
}: PaidAccessChecksProps) => {
  const { ready: areTranslationsReady, translate } = useTranslation();

  const { classes } = useFiatPaidAccessChecksStyles();

  const router = useRouter();

  const [isIdVerified, setIsIdVerified] = useState<boolean>(false);
  const [isEmailVerificationLoading, setIsEmailVerificationLoading] = useState<boolean>(true);
  const [isEmailVerified, setIsEmailVerified] = useState<boolean>(false);
  const [emailAddress, setEmailAddress] = useState<string>('');
  const [isModerationHistoryClean, setIsModerationHistoryClean] = useState<boolean>(false);
  const [isTipaltiConnectionLoading, setIsTipaltiConnectionLoading] = useState<boolean>(true);
  const [isTipaltiConnected, setIsTipaltiConnected] = useState<boolean>(false);
  const [tipaltiAccountStatus, setTipaltiAccountStatus] = useState<PayoutAccountStatus>(
    PayoutAccountStatus.Invalid,
  );
  const [isPaymentSetupModalOpen, setIsPaymentSetupModalOpen] = useState<boolean>(false);
  const [isPaymentErrorModalOpen, setIsPaymentErrorModalOpen] = useState<boolean>(false);

  const { mutateAsync: getPayoutAccountStatus } = useGetPayoutAccountStatus();

  const {
    data: onboardingRestrictions,
    hasError: isErrorOnboardingRestrictions,
    isLoading: isLoadingOnboardingRestrictions,
  } = useFetchOnboardingRestrictions();

  const modalSubmitted = () => {
    setTipaltiAccountStatus(PayoutAccountStatus.Requested);
  };

  const handleError = () => {
    setIsPaymentSetupModalOpen(false);
    setIsPaymentErrorModalOpen(true);
  };

  // Check moderation history and id verification
  useEffect(() => {
    setIsModerationHistoryClean(
      !!onboardingRestrictions &&
        ![Restriction.Authorization, Restriction.Moderation, Restriction.ModerationHistory].some(
          (restriction) => onboardingRestrictions.onboardingRestrictions.includes(restriction),
        ),
    );
    setIsIdVerified(
      !!onboardingRestrictions &&
        !onboardingRestrictions.onboardingRestrictions.includes(Restriction.Verification),
    );
  }, [onboardingRestrictions, setIsModerationHistoryClean, setIsIdVerified]);

  // Check email verification
  useEffect(() => {
    const fetchEmailStatus = async () => {
      const emailResponse = await AccountSettingsClient.emailApi.v1EmailGet();
      setIsEmailVerified(emailResponse.verified ?? false);
      setEmailAddress(emailResponse.emailAddress ?? '');
      setIsEmailVerificationLoading(false);
    };
    fetchEmailStatus();
  }, []);

  // Check tipalti setup
  useEffect(() => {
    const fetchTipaltiStatus = async () => {
      await getPayoutAccountStatus().then((res) => {
        const accountStatus = PayoutStatusMap.get(
          res.accountStatus ?? 'FIAT_PAYOUT_ACCOUNT_STATUS_INVALID',
        );
        const newAccountStatus = accountStatus ?? PayoutAccountStatus.Invalid;
        setTipaltiAccountStatus(newAccountStatus);
        setIsTipaltiConnected(newAccountStatus === PayoutAccountStatus.Approved);
      });
      setIsTipaltiConnectionLoading(false);
    };
    fetchTipaltiStatus();
  }, [getPayoutAccountStatus]);

  // Check if all eligibilty checks are complete to pass back to parent
  useEffect(() => {
    const isEligible =
      isIdVerified && isEmailVerified && isModerationHistoryClean && isTipaltiConnected;
    setIsEligible(isEligible);
  }, [setIsEligible, isIdVerified, isEmailVerified, isModerationHistoryClean, isTipaltiConnected]);

  const onClickVerifyLink = useCallback(() => {
    window.open(www.getAccountSettingsUrl());
  }, []);

  const onClickSendRequest = useCallback(() => {
    setIsPaymentSetupModalOpen(true);
  }, [setIsPaymentSetupModalOpen]);

  const onEligibilitySettingsClick = useCallback(() => {
    router.push(EligibilitySettingsLink);
  }, [router]);

  const isEligibleForTipaltiSetup = isIdVerified && isEmailVerified && isModerationHistoryClean;

  const isLoading =
    !areTranslationsReady ||
    isLoadingOnboardingRestrictions ||
    isEmailVerificationLoading ||
    isTipaltiConnectionLoading;

  const eligibilityCheckPropsMap = useMemo(() => {
    const propsMap = new Map<EligibilityCheckType, EligibilityCheckProps>([
      [
        EligibilityCheckType.IDVerification,
        {
          isVerified: isIdVerified,
          verifyLink: isCardComponent || isIdVerified ? undefined : onClickVerifyLink,
        },
      ],

      [
        EligibilityCheckType.EmailVerification,
        {
          isVerified: isEmailVerified,
          verifyLink: isCardComponent || isEmailVerified ? undefined : onClickVerifyLink,
        },
      ],
      [
        EligibilityCheckType.ModerationHistory,
        { isVerified: isModerationHistoryClean, verifyLink: undefined },
      ],
      [
        EligibilityCheckType.ConnectTipalti,
        { isVerified: isTipaltiConnected, verifyLink: onClickSendRequest },
      ],
    ]);

    return propsMap;
  }, [
    isIdVerified,
    isCardComponent,
    onClickVerifyLink,
    isEmailVerified,
    isModerationHistoryClean,
    isTipaltiConnected,
    onClickSendRequest,
  ]);

  const renderEligibilityCheck = (type: EligibilityCheckType) => {
    const { isVerified, verifyLink } = eligibilityCheckPropsMap.get(type)!;
    const showButton = !isVerified && !!verifyLink;
    const canSendTipalti =
      isEligibleForTipaltiSetup &&
      (tipaltiAccountStatus === PayoutAccountStatus.NotRequested ||
        tipaltiAccountStatus === PayoutAccountStatus.Rejected ||
        tipaltiAccountStatus === PayoutAccountStatus.Inactive);
    const { title, description, titleShort, descriptionShort, buttonText } =
      EligibilityCheckIntlKeys.get(type) as EligibilityCheckIntlKeyProps;
    const linkText =
      type === EligibilityCheckType.ConnectTipalti &&
      tipaltiAccountStatus === PayoutAccountStatus.Requested
        ? translate('Label.RequestSent')
        : translate(buttonText);
    return (
      <EligibilityRow
        key={type}
        headerText={translate(isCardComponent ? titleShort : title)}
        descriptionText={
          <Typography variant='body2' color='inherit'>
            {translate(isCardComponent ? descriptionShort : description)}
          </Typography>
        }
        status={isVerified ? EligibilityStatus.Completed : EligibilityStatus.Warning}
        linkText={showButton ? linkText : undefined}
        onClickLink={showButton ? verifyLink : undefined}
        isLowerCaseLink
        isOpenInNewLink={type !== EligibilityCheckType.ConnectTipalti}
        buttonSize={isCardComponent ? 'small' : 'medium'}
        buttonDisabled={type === EligibilityCheckType.ConnectTipalti && !canSendTipalti}
        buttonStyle={{ marginLeft: isCardComponent ? '12px' : '24px', alignSelf: 'center' }}
      />
    );
  };

  if (isLoading || isErrorOnboardingRestrictions) {
    return <PageLoading />;
  }

  return isOpen ? (
    <>
      <Grid
        container
        item
        spacing={isCardComponent ? 2 : 4}
        className={isCardComponent ? classes.cardContainer : classes.eligibilityContainer}>
        {isCardComponent ? (
          <Grid item className={classes.headerContainer}>
            <Typography variant='h5' component='h5'>
              {translate('Heading.PaymentSettings')}
            </Typography>
            <Typography variant='body2' component='p' className={classes.subheaderText}>
              {translate('Description.PaymentSettings')}
            </Typography>
          </Grid>
        ) : null}
        {Object.values(EligibilityCheckType).map((check) => renderEligibilityCheck(check))}
        {isCardComponent ? (
          <Grid item>
            <Button
              color='secondary'
              variant='contained'
              onClick={onEligibilitySettingsClick}
              endIcon={<OpenInNewIcon />}>
              {translate('Label.EligibilitySettings')}
            </Button>
          </Grid>
        ) : null}
      </Grid>

      <PaymentSetupModal
        emailAddress={emailAddress}
        isOpen={isPaymentSetupModalOpen}
        setOpen={setIsPaymentSetupModalOpen}
        modalSubmitted={modalSubmitted}
        handleError={handleError}
      />
      <Dialog open={isPaymentErrorModalOpen}>
        <DialogTemplate
          title={translate('Heading.UnknownError')}
          content={translate('Error.RequestFailed')}
          confirmText={translate('Action.Retry')}
          cancelText={translate('Action.Close')}
          onConfirm={() => {
            setIsPaymentErrorModalOpen(false);
            setIsPaymentSetupModalOpen(true);
          }}
          onCancel={() => setIsPaymentErrorModalOpen(false)}
        />
      </Dialog>
    </>
  ) : null;
};

export default FiatPaidAccessChecks;
