import React, { useCallback, useEffect } from 'react';
import Link from 'next/link';
import { AgreementStatus } from '@rbx/client-content-licensing-api/v1';
import { useTranslation, withTranslation } from '@rbx/intl';
import { Typography, Tabs, Tab, Button } from '@rbx/ui';
import { PageLoading } from '@modules/miscellaneous/components';
import { Flex } from '@modules/miscellaneous/components/Flex';
import { useQueryParams } from '@modules/miscellaneous/hooks';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { isNonEmptyString } from '@modules/miscellaneous/utils';
import { useSettings } from '@modules/settings/SettingsProvider/SettingsProvider';
import { useCurrentAccountContext } from '../../components/AccountProvider';
import IpLoadError from '../../components/error/IpLoadError';
import useIpSnackbar from '../../hooks/useIpSnackbar';
import { useIpLayoutContext } from '../../IpAppNavigationLayout';
import AmDivider from '../components/AmDivider';
import OverviewCard from '../components/OverviewCard';
import { EXTERNAL_MY_TRANSACTIONS_HREF } from '../urls';
import { LicenseManagerClickEvent, useLicenseManagerLogger } from '../utils/logger';
import AgreementActivityTab from './components/AgreementActivityTab';
import AgreementBreadcrumbs from './components/AgreementBreadcrumbs';
import AgreementDetailsAnalytics from './components/AgreementDetailsAnalytics';
import AgreementDetailsTab from './components/AgreementDetailsTab';
import { RevenueShareRateDisplay } from './components/IphAcceptRequestContent';
import IphAgreementActions from './components/IphAgreementActions';
import IphAgreementAlerts from './components/IphAgreementAlerts';
import IphAgreementStatusLabel from './components/IphAgreementStatusLabel';
import AgreementDetailsTabs from './enums/AgreementDetailsTabs';
import { useEnableAgreementMonetizationMutation } from './hooks/agreements';
import useConfirmation from './hooks/useConfirmation';
import { useGetExperienceGuidelines } from './hooks/useGetExperienceGuidelines';
import { useGetIphAgreementDetails } from './hooks/useGetIphAgreementDetails';
import { useIphAcknowledgeCompletedChangeRequestMutation } from './hooks/useIphAcknowledgeCompletedChangeRequestMutation';
import { useIphApproveConditionalChangeRequestMutation } from './hooks/useIphApproveConditionalChangeRequestMutation';
import { useIphRejectConditionalChangeRequestMutation } from './hooks/useIphRejectConditionalChangeRequestMutation';

interface IphAgreementDetailsContainerProps {
  agreementId: string;
}

function isAgreementDetailsTab(value: string | undefined): value is AgreementDetailsTabs {
  return (
    value === AgreementDetailsTabs.Details ||
    value === AgreementDetailsTabs.Activity ||
    value === AgreementDetailsTabs.Analytics
  );
}

const IphAgreementDetailsContainer: React.FunctionComponent<IphAgreementDetailsContainerProps> = ({
  agreementId,
}) => {
  const { translate } = useTranslation();
  const { logEvent } = useLicenseManagerLogger();
  const { enqueueErrorSnackbar, enqueueSuccessSnackbar } = useIpSnackbar();
  const { settings } = useSettings();
  const { enableIpPlatformConditionalOffers } = settings;
  const { account } = useCurrentAccountContext();
  const accountId = account?.id;
  const {
    confirmWithLoading: confirmMonetizationWithLoading,
    confirmationContent: monetizationConfirmationContent,
  } = useConfirmation();
  const {
    confirmWithLoading: confirmConditionalChangeRequestWithLoading,
    confirmationContent: conditionalChangeRequestConfirmationContent,
  } = useConfirmation();
  const [queryParams, setQueryParams] = useQueryParams(['tab']);

  const handleTabChange = useCallback(
    (event: unknown, newTabValue: string) => {
      logEvent(LicenseManagerClickEvent.IphAgreementDetailsPageSelectTabClickEvent, {
        selectedTab: newTabValue,
      });
      setQueryParams({ tab: newTabValue });
    },
    [setQueryParams, logEvent],
  );

  const acknowledgeCompletedChangeRequestMutation =
    useIphAcknowledgeCompletedChangeRequestMutation(agreementId);
  const handleAcknowledgeCompletedChangeRequest = async () => {
    try {
      await acknowledgeCompletedChangeRequestMutation.mutateAsync();
    } catch {
      enqueueErrorSnackbar();
    }
  };

  const approveConditionalChangeRequestMutation =
    useIphApproveConditionalChangeRequestMutation(agreementId);
  const rejectConditionalChangeRequestMutation =
    useIphRejectConditionalChangeRequestMutation(agreementId);

  const handleApproveConditionalChangeRequest = useCallback(async () => {
    const [result, closeConfirmation] = await confirmConditionalChangeRequestWithLoading({
      title: '',
      description: translate('Description.IphConfirmApproveConditionalChangeRequest'),
      primaryActionLabel: translate('Action.Accept'),
    });

    if (!result.confirmed) {
      return;
    }

    try {
      await approveConditionalChangeRequestMutation.mutateAsync();
      enqueueSuccessSnackbar('Message.IphConditionalChangeRequestApproved');
    } catch {
      enqueueErrorSnackbar();
    } finally {
      closeConfirmation();
    }
  }, [
    approveConditionalChangeRequestMutation,
    confirmConditionalChangeRequestWithLoading,
    enqueueErrorSnackbar,
    enqueueSuccessSnackbar,
    translate,
  ]);

  const handleRejectConditionalChangeRequest = useCallback(async () => {
    const [result, closeConfirmation] = await confirmConditionalChangeRequestWithLoading({
      title: '',
      description: translate('Description.IphConfirmRejectConditionalChangeRequest'),
      primaryActionLabel: translate('Action.Reject'),
      isDangerous: true,
    });

    if (!result.confirmed) {
      return;
    }

    try {
      await rejectConditionalChangeRequestMutation.mutateAsync();
      enqueueSuccessSnackbar('Message.IphConditionalChangeRequestRejected');
    } catch {
      enqueueErrorSnackbar();
    } finally {
      closeConfirmation();
    }
  }, [
    confirmConditionalChangeRequestWithLoading,
    enqueueErrorSnackbar,
    enqueueSuccessSnackbar,
    rejectConditionalChangeRequestMutation,
    translate,
  ]);

  const agreementDetailsRequest = useGetIphAgreementDetails({ agreementId });
  const experienceGuidelinesRequest = useGetExperienceGuidelines({
    universeId: agreementDetailsRequest.data?.universe?.id,
  });
  const enableMonetizationMutation = useEnableAgreementMonetizationMutation();

  const handleEnableMonetization = async () => {
    logEvent(
      LicenseManagerClickEvent.IphAgreementDetailsPageOpenEnableMonetizationModalClickEvent,
      {
        agreementId,
      },
    );

    const extraContent = agreementDetailsRequest.data?.agreement.license?.royaltyRate ? (
      <RevenueShareRateDisplay rate={agreementDetailsRequest.data.agreement.license.royaltyRate} />
    ) : undefined;

    const [result, closeConfirmation] = await confirmMonetizationWithLoading({
      title: translate('Heading.ConfirmStartRevShare'),
      description: translate('Message.ConfirmStartRevShare'),
      primaryActionLabel: translate('Label.Confirm'),
      extraContent,
    });

    if (!result.confirmed) {
      logEvent(
        LicenseManagerClickEvent.IphAgreementDetailsPageCloseEnableMonetizationModalClickEvent,
        {
          agreementId,
        },
      );
      return;
    }

    try {
      const agreementForMutation = agreementDetailsRequest.data?.agreement;
      const idForMutation = agreementForMutation?.id;
      if (isNonEmptyString(idForMutation)) {
        await enableMonetizationMutation.mutateAsync(idForMutation);
      }
    } catch {
      enqueueErrorSnackbar('Error.FailedToEnableMonetization');
    } finally {
      closeConfirmation();
    }
  };

  const { setPageTitle } = useIpLayoutContext();
  useEffect(() => {
    setPageTitle(
      <AgreementBreadcrumbs
        pages={[{ title: agreementDetailsRequest.data?.license.name ?? '' }]}
      />,
    );
  }, [agreementDetailsRequest.data?.license.name, setPageTitle]);

  if (agreementDetailsRequest.isPending) {
    return <PageLoading />;
  }

  if (agreementDetailsRequest.isError || !agreementDetailsRequest.data) {
    return <IpLoadError error={agreementDetailsRequest.error} />;
  }

  const { agreement, license, listing, ipFamily, universe } = agreementDetailsRequest.data;
  const experienceGuidelines =
    experienceGuidelinesRequest.error || !experienceGuidelinesRequest.data
      ? translate('Label.MaturityRatingNoneAvailable')
      : experienceGuidelinesRequest.data;

  const defaultTab =
    agreement.status === AgreementStatus.Active
      ? AgreementDetailsTabs.Analytics
      : AgreementDetailsTabs.Details;
  const rawTab = queryParams.tab;
  const tabParam = Array.isArray(rawTab) ? rawTab[0] : (rawTab ?? undefined);
  const currentTab = isAgreementDetailsTab(tabParam) ? tabParam : defaultTab;

  if (
    agreement.status !== AgreementStatus.Active &&
    currentTab === AgreementDetailsTabs.Analytics
  ) {
    handleTabChange(null, AgreementDetailsTabs.Details);
    return null;
  }

  let transactionsCard = null;
  const royaltyRate = license.royaltyRate ?? 0;
  if (agreement.status === AgreementStatus.Active) {
    if (royaltyRate === 0) {
      // Monitoring only license
      transactionsCard = (
        <OverviewCard
          heading='Heading.Transactions'
          subheading='Label.TransactionsCardMonitoringOnly'
        />
      );
    } else if (royaltyRate > 0) {
      if (agreement.enableMonetization) {
        // Rev share now license
        transactionsCard = (
          <OverviewCard
            heading='Heading.Transactions'
            subheading='Label.TransactionsCardRevShareNow'>
            <Button
              component={Link}
              href={EXTERNAL_MY_TRANSACTIONS_HREF()}
              target='_blank'
              variant='contained'
              color='secondary'
              size='medium'
              onClick={() =>
                logEvent(
                  LicenseManagerClickEvent.IphAgreementDetailsPageViewTransactionsClickEvent,
                  {
                    agreementId,
                  },
                )
              }>
              {translate('Action.ViewTransactions')}
            </Button>
          </OverviewCard>
        );
      } else {
        // Rev share later license
        transactionsCard = (
          <OverviewCard
            heading='Heading.Transactions'
            subheading='Label.TransactionsCardRevShareLater'>
            <Button
              variant='contained'
              color='secondary'
              size='medium'
              onClick={handleEnableMonetization}
              loading={enableMonetizationMutation.isPending}>
              {translate('Action.StartMonetization')}
            </Button>
          </OverviewCard>
        );
      }
    }
  }
  const activityLog = agreement.activityLog ?? [];

  return (
    <>
      <Flex flexDirection='column' gap={20}>
        <Flex justifyContent='space-between'>
          <Flex flexDirection='column' gap={8}>
            <Typography variant='h1'>{license.name}</Typography>
            <Typography variant='h6'>{listing.name}</Typography>
            <IphAgreementStatusLabel agreement={agreement} />
          </Flex>
          <IphAgreementActions agreement={agreement} />
        </Flex>

        <IphAgreementAlerts
          agreement={agreement}
          universe={universe}
          listingName={listing.name ?? translate('Label.RightsHolder')}
          handleTabChange={handleTabChange}
          handleCompleteChangeRequest={handleAcknowledgeCompletedChangeRequest}
          handleApproveConditionalChangeRequest={
            enableIpPlatformConditionalOffers ? handleApproveConditionalChangeRequest : undefined
          }
          handleRejectConditionalChangeRequest={
            enableIpPlatformConditionalOffers ? handleRejectConditionalChangeRequest : undefined
          }
        />

        <Flex flexDirection='column'>
          <Tabs value={currentTab} onChange={handleTabChange}>
            <Tab label={translate('Label.Details')} value={AgreementDetailsTabs.Details} />
            <Tab label={translate('Label.Activity')} value={AgreementDetailsTabs.Activity} />
            {agreement.status === AgreementStatus.Active && (
              <Tab label={translate('Label.Analytics')} value={AgreementDetailsTabs.Analytics} />
            )}
          </Tabs>
          <AmDivider />
        </Flex>

        {currentTab === AgreementDetailsTabs.Details && (
          <AgreementDetailsTab
            agreement={agreement}
            license={license}
            listing={listing}
            universe={universe}
            experienceGuidelines={experienceGuidelines}
            transactionsCard={transactionsCard}
          />
        )}
        {currentTab === AgreementDetailsTabs.Activity && (
          <AgreementActivityTab
            accountId={accountId}
            agreementId={agreementId}
            activityLog={activityLog}
            creatorName={universe.creatorName ?? undefined}
            listingName={listing.name ?? undefined}
          />
        )}
        {currentTab === AgreementDetailsTabs.Analytics && (
          <AgreementDetailsAnalytics
            agreement={agreement}
            ipFamily={ipFamily}
            ipListing={listing}
            license={license}
            universe={universe}
            transactionsCard={transactionsCard}
          />
        )}
      </Flex>
      {monetizationConfirmationContent}
      {conditionalChangeRequestConfirmationContent}
    </>
  );
};

export default withTranslation(IphAgreementDetailsContainer, [
  TranslationNamespace.Licenses,
  TranslationNamespace.Error,
  TranslationNamespace.AgreementsManager,
]);
