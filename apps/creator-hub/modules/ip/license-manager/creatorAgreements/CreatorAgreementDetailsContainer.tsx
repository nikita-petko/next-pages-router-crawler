import { FunctionComponent, useEffect, useState, useCallback } from 'react';
import { Typography, Tabs, Tab } from '@rbx/ui';
import { Flex } from '@modules/miscellaneous/common/components';
import { PageLoading } from '@modules/miscellaneous/common';
import { useTranslation, withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { DisputeReason, AgreementStatus } from '@rbx/clients/contentLicensingApi/v1';
import { useQueryParams } from '@modules/miscellaneous/hooks';
import { useSettings } from '@modules/settings';

import { useIpLayoutContext } from '../../IpAppNavigationLayout';
import CreatorDisputeModal from './components/CreatorDisputeModal';
import CreatorAgreementBreadcrumbs from './components/CreatorAgreementBreadcrumbs';
import { useGetCreatorAgreementDetails } from './hooks/useGetCreatorAgreementDetails';
import CreatorAgreementStatusLabel from './components/CreatorAgreementStatusLabel';
import CreatorAgreementAlert from './components/CreatorAgreementAlert';
import CreatorAgreementDetailsTabContent from './components/CreatorAgreementDetailsTabContent';
import { creatorAgreementTabsConfig } from './CreatorAgreementsContainer';
import useCreatorDisputeAgreementMutation from './hooks/useCreatorDisputeAgreementMutation';
import AmDivider from '../components/AmDivider';
import useIpSnackbar from '../../hooks/useIpSnackbar';
import { isNextDisputeFinal } from '../utils/disputeReason';
import { CREATOR_AGREEMENTS_TAB_HREF } from '../urls';
import AgreementActivityTab from '../agreements/components/AgreementActivityTab';
import useGetExperienceGuidelines from '../agreements/hooks/useGetExperienceGuidelines';
import IpLoadError from '../../components/error/IpLoadError';
import { LicenseManagerClickEvent, useLicenseManagerLogger } from '../utils/logger';
import CreatorConfirmCompleteActionModal, {
  CreatorConfirmationType,
} from './components/CreatorConfirmCompleteActionModal';
import useCreatorCompleteChangeRequestMutation from './hooks/useCreatorCompleteChangeRequestMutation';
import useCreatorCompleteIpRemovalMutation from './hooks/useCreatorCompleteIpRemovalMutation';
import { NO_GAME_FOUND_FOR_ID, useDebouncedGameDetails } from '../agreements/hooks/games';
import { TimelimitedDateRange } from '../utils/timeLimitedLicense';
import CreatorAgreementActions from '../agreements/components/CreatorAgreementActions';

export enum AgreementDetailsTabs {
  Details = 'Details',
  Activity = 'Activity',
}

export const getBreadcrumbForStatus = (statusEnum: AgreementStatus) => {
  const tabConfig = creatorAgreementTabsConfig.find((config) =>
    config.statusEnums.find((status) => status === statusEnum),
  );
  return tabConfig;
};

interface CreatorAgreementDetailsContainerProps {
  agreementId: string;
}

const CreatorAgreementDetailsContainer: FunctionComponent<
  CreatorAgreementDetailsContainerProps
> = ({ agreementId }) => {
  const { translate } = useTranslation();
  const { enqueueErrorSnackbar, enqueueSuccessSnackbar } = useIpSnackbar();
  const { logEvent } = useLicenseManagerLogger();
  const { settings, isFetched } = useSettings();
  const { enableIpPlatformTimeboundLicenses } = settings;
  const [queryParams, setQueryParams] = useQueryParams(['tab']);
  const currentTab =
    AgreementDetailsTabs[queryParams.tab as keyof typeof AgreementDetailsTabs] ||
    AgreementDetailsTabs.Details;
  const [isCreatorConfirmCompleteActionModalOpen, setIsCreatorConfirmCompleteActionModalOpen] =
    useState<boolean>(false);
  const [confirmationType, setConfirmationType] = useState<CreatorConfirmationType>(
    CreatorConfirmationType.ChangeRequest,
  );
  const [isCreatorDisputeModalOpen, setIsCreatorDisputeModalOpen] = useState<boolean>(false);

  const handleTabChange = useCallback(
    (event: unknown, newTabValue: string) => {
      logEvent(LicenseManagerClickEvent.CreatorAgreementDetailsPageSelectTabClickEvent, {
        selectedTab: newTabValue,
      });
      setQueryParams({ tab: newTabValue });
    },
    [setQueryParams, logEvent],
  );

  const handleCompleteChangeRequestOpen = useCallback(() => {
    logEvent(
      LicenseManagerClickEvent.CreatorAgreementDetailsPageOpenCompleteChangeRequestModalClickEvent,
      {
        agreementId,
      },
    );
    setConfirmationType(CreatorConfirmationType.ChangeRequest);
    setIsCreatorConfirmCompleteActionModalOpen(true);
  }, [agreementId, logEvent]);

  const handleCompleteActionModalClose = useCallback(() => {
    setIsCreatorConfirmCompleteActionModalOpen(false);
  }, []);

  const completeChangeRequestMutation = useCreatorCompleteChangeRequestMutation(agreementId);
  const handleCompleteChangeRequest = async () => {
    try {
      await completeChangeRequestMutation.mutateAsync();
      enqueueSuccessSnackbar('Message.CreatorChangeRequestCompleted');
    } catch {
      enqueueErrorSnackbar();
    } finally {
      handleCompleteActionModalClose();
    }
  };

  const handleCompleteIpRemovalOpen = useCallback(() => {
    setConfirmationType(CreatorConfirmationType.IpRemoval);
    setIsCreatorConfirmCompleteActionModalOpen(true);
  }, []);

  const completeIpRemovalMutation = useCreatorCompleteIpRemovalMutation(agreementId);
  const handleCompleteIpRemoval = async () => {
    try {
      await completeIpRemovalMutation.mutateAsync();
      // TODO - TIME-110 - aquach - update success message here
      enqueueSuccessSnackbar('Message.CreatorChangeRequestCompleted');
    } catch {
      enqueueErrorSnackbar();
    } finally {
      handleCompleteActionModalClose();
    }
  };

  const disputeMutation = useCreatorDisputeAgreementMutation(agreementId);
  const handleDispute = async (reason: DisputeReason) => {
    try {
      await disputeMutation.mutateAsync(reason);
    } catch {
      enqueueErrorSnackbar();
    }
  };

  const handleDisputeClick = useCallback(() => {
    logEvent(LicenseManagerClickEvent.CreatorAgreementDetailsPageOpenDisputeModalClickEvent, {
      agreementId,
    });
    setIsCreatorDisputeModalOpen(true);
  }, [agreementId, logEvent]);

  const handleDisputeClose = useCallback(() => {
    setIsCreatorDisputeModalOpen(false);
  }, []);

  const agreementDetailsRequest = useGetCreatorAgreementDetails({ agreementId });
  const universeId = agreementDetailsRequest.data?.agreement?.agreementTargets
    ? Number(agreementDetailsRequest.data?.agreement?.agreementTargets?.[0]?.contentId)
    : undefined;
  const universeRequest = useDebouncedGameDetails(universeId);
  const experienceGuidelinesRequest = useGetExperienceGuidelines({
    universeId,
  });

  const { setPageTitle } = useIpLayoutContext();
  const tabBreadcrumb = getBreadcrumbForStatus(
    agreementDetailsRequest.data?.agreement?.status ?? AgreementStatus.Pending,
  );

  useEffect(() => {
    setPageTitle(
      <CreatorAgreementBreadcrumbs
        pages={[
          ...(tabBreadcrumb
            ? [
                {
                  title: translate(tabBreadcrumb.breadcrumbKey),
                  href: CREATOR_AGREEMENTS_TAB_HREF(tabBreadcrumb.keyName),
                },
              ]
            : []),
          { title: agreementDetailsRequest.data?.license.name || '' },
        ]}
      />,
    );
  }, [agreementDetailsRequest.data?.license.name, setPageTitle, tabBreadcrumb, translate]);

  if (!isFetched || agreementDetailsRequest.isPending || universeRequest.isPending) {
    return <PageLoading />;
  }
  if (
    agreementDetailsRequest.isError ||
    !agreementDetailsRequest.data ||
    universeRequest.isError ||
    universeRequest.data === NO_GAME_FOUND_FOR_ID
  ) {
    return <IpLoadError error={agreementDetailsRequest.error} />;
  }

  const { agreement, license, listing } = agreementDetailsRequest.data;
  const universe = universeRequest.data;

  const experienceGuidelines =
    experienceGuidelinesRequest.error || !experienceGuidelinesRequest.data
      ? translate('Label.MaturityRatingNoneAvailable')
      : experienceGuidelinesRequest.data;

  return (
    <Flex flexDirection='column' gap={24}>
      <Flex justifyContent='space-between'>
        <Flex flexDirection='column' gap={8}>
          <Typography variant='h1'>{license.name}</Typography>
          <Typography variant='h6'>{listing.name}</Typography>
          <CreatorAgreementStatusLabel agreement={agreement} />
        </Flex>
        {enableIpPlatformTimeboundLicenses && <CreatorAgreementActions agreement={agreement} />}
      </Flex>

      <CreatorAgreementAlert
        agreement={agreement}
        listingName={listing.name!}
        handleTabChange={handleTabChange}
        handleCompleteChangeRequest={handleCompleteChangeRequestOpen}
        handleCompleteIpRemoval={handleCompleteIpRemovalOpen}
      />

      <Flex flexDirection='column'>
        <Tabs value={currentTab} onChange={handleTabChange}>
          <Tab label={translate('Label.Details')} value={AgreementDetailsTabs.Details} />
          <Tab label={translate('Label.Activity')} value={AgreementDetailsTabs.Activity} />
        </Tabs>
        <AmDivider />
      </Flex>

      {currentTab === AgreementDetailsTabs.Details && (
        <CreatorAgreementDetailsTabContent
          agreement={agreement}
          license={license}
          listing={listing}
          experienceGuidelines={experienceGuidelines}
          universe={universe}
          handleDisputeClick={handleDisputeClick}
        />
      )}

      {currentTab === AgreementDetailsTabs.Activity && (
        <AgreementActivityTab
          isCreator
          activityLog={agreement.activityLog!}
          creatorName={universe.creator?.name}
          listingName={listing.name!}
          dateRange={
            {
              startDate: agreement.startTime,
              endDate: agreement.endTime,
            } as TimelimitedDateRange
          }
        />
      )}

      <CreatorDisputeModal
        agreementId={agreementId}
        isOpen={isCreatorDisputeModalOpen}
        showConfirmation={isNextDisputeFinal(agreement)}
        closeModal={handleDisputeClose}
        submitDispute={handleDispute}
        isSubmitting={disputeMutation.isPending}
      />

      <CreatorConfirmCompleteActionModal
        agreementId={agreementId}
        isOpen={isCreatorConfirmCompleteActionModalOpen}
        confirmationType={confirmationType}
        closeModal={handleCompleteActionModalClose}
        submitComplete={
          confirmationType === CreatorConfirmationType.ChangeRequest
            ? handleCompleteChangeRequest
            : handleCompleteIpRemoval
        }
      />
    </Flex>
  );
};

export default withTranslation(CreatorAgreementDetailsContainer, [
  TranslationNamespace.Licenses,
  TranslationNamespace.Error,
  TranslationNamespace.AgreementsManager,
]);
