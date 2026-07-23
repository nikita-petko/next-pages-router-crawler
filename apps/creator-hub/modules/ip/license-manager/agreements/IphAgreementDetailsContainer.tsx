import React, { FunctionComponent, useCallback, useEffect } from 'react';
import { Typography, Tabs, Tab, Button } from '@rbx/ui';
import { PageLoading } from '@modules/miscellaneous/common';
import { useTranslation, withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { Flex } from '@modules/miscellaneous/common/components';
import { useQueryParams } from '@modules/miscellaneous/hooks';
import Link from 'next/link';
import { AgreementStatus } from '@rbx/clients/contentLicensingApi/v1';

import { useIpLayoutContext } from '../../IpAppNavigationLayout';
import AmDivider from '../components/AmDivider';
import AgreementBreadcrumbs from './components/AgreementBreadcrumbs';
import IphAgreementActions from './components/IphAgreementActions';
import IphAgreementAlerts from './components/IphAgreementAlerts';
import { useGetIphAgreementDetails } from './hooks/useGetIphAgreementDetails';
import useGetExperienceGuidelines from './hooks/useGetExperienceGuidelines';
import AgreementDetailsTab from './components/AgreementDetailsTab';
import AgreementDetailsAnalytics from './components/AgreementDetailsAnalytics';
import AgreementActivityTab from './components/AgreementActivityTab';
import OverviewCard from '../components/OverviewCard';
import useIpSnackbar from '../../hooks/useIpSnackbar';
import useConfirmation from './hooks/useConfirmation';
import { useEnableAgreementMonetizationMutation } from './hooks/agreements';
import { EXTERNAL_MY_TRANSACTIONS_HREF } from '../urls';
import IpLoadError from '../../components/error/IpLoadError';
import { LicenseManagerClickEvent, useLicenseManagerLogger } from '../utils/logger';
import { RevenueShareRateDisplay } from './components/IphAcceptRequestContent';
import useIphAcknowledgeCompletedChangeRequestMutation from './hooks/useIphAcknowledgeCompletedChangeRequestMutation';
import IphAgreementStatusLabel from './components/IphAgreementStatusLabel';
import { TimelimitedDateRange } from '../utils/timeLimitedLicense';

interface IphAgreementDetailsContainerProps {
  agreementId: string;
}

export enum AgreementDetailsTabs {
  Details = 'Details',
  Activity = 'Activity',
  Analytics = 'Analytics',
}

const IphAgreementDetailsContainer: FunctionComponent<IphAgreementDetailsContainerProps> = ({
  agreementId,
}) => {
  const { translate } = useTranslation();
  const { logEvent } = useLicenseManagerLogger();
  const { enqueueErrorSnackbar } = useIpSnackbar();
  const {
    confirmWithLoading: confirmMonetizationWithLoading,
    confirmationContent: monetizationConfirmationContent,
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
      if (agreementDetailsRequest.data?.agreement) {
        await enableMonetizationMutation.mutate(agreementDetailsRequest.data.agreement.id!);
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
        pages={[{ title: agreementDetailsRequest.data?.license.name || '' }]}
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
  const currentTab =
    AgreementDetailsTabs[queryParams.tab as keyof typeof AgreementDetailsTabs] || defaultTab;

  if (
    agreement.status !== AgreementStatus.Active &&
    currentTab === AgreementDetailsTabs.Analytics
  ) {
    handleTabChange(null, AgreementDetailsTabs.Details);
    return null;
  }

  let transactionsCard = null;
  if (agreement.status === AgreementStatus.Active) {
    if (license.royaltyRate! === 0) {
      // Monitoring only license
      transactionsCard = (
        <OverviewCard
          heading='Heading.Transactions'
          subheading='Label.TransactionsCardMonitoringOnly'
        />
      );
    } else if (license.royaltyRate! > 0) {
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

  return (
    <React.Fragment>
      <Flex flexDirection='column' gap={24}>
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
          listingName={listing.name!}
          handleTabChange={handleTabChange}
          handleCompleteChangeRequest={handleAcknowledgeCompletedChangeRequest}
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
            activityLog={agreement.activityLog!}
            creatorName={universe.creatorName}
            listingName={listing.name!}
            dateRange={
              {
                startDate: agreement.startTime,
                endDate: agreement.endTime,
              } as TimelimitedDateRange
            }
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
    </React.Fragment>
  );
};

export default withTranslation(IphAgreementDetailsContainer, [
  TranslationNamespace.Licenses,
  TranslationNamespace.Error,
  TranslationNamespace.AgreementsManager,
]);
