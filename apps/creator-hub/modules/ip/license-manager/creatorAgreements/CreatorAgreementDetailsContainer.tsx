import type { FunctionComponent } from 'react';
import { useEffect, useState, useCallback } from 'react';
import type { DisputeReason } from '@rbx/client-content-licensing-api/v1';
import { AgreementStatus } from '@rbx/client-content-licensing-api/v1';
import { StatusCodes } from '@rbx/core';
import { useTranslation, withTranslation } from '@rbx/intl';
import { Typography, Tabs, Tab } from '@rbx/ui';
import { getResponseFromError } from '@modules/clients/utils';
import { PageLoading } from '@modules/miscellaneous/components';
import { Flex } from '@modules/miscellaneous/components/Flex';
import { ErrorPage } from '@modules/miscellaneous/error';
import { useQueryParams } from '@modules/miscellaneous/hooks';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useSettings } from '@modules/settings/SettingsProvider/SettingsProvider';
import { useCurrentAccountContext } from '../../components/AccountProvider';
import IpLoadError from '../../components/error/IpLoadError';
import useIpSnackbar from '../../hooks/useIpSnackbar';
import { useIpLayoutContext } from '../../IpAppNavigationLayout';
import AgreementActivityTab from '../agreements/components/AgreementActivityTab';
import CreatorAgreementActions from '../agreements/components/CreatorAgreementActions';
import { NO_GAME_FOUND_FOR_ID, useDebouncedGameDetails } from '../agreements/hooks/games';
import { useGetExperienceGuidelines } from '../agreements/hooks/useGetExperienceGuidelines';
import AmDivider from '../components/AmDivider';
import { CREATOR_AGREEMENTS_TAB_HREF } from '../urls';
import { isNextDisputeFinal } from '../utils/disputeReason';
import { LicenseManagerClickEvent, useLicenseManagerLogger } from '../utils/logger';
import CreatorAgreementAlert from './components/CreatorAgreementAlert';
import CreatorAgreementBreadcrumbs from './components/CreatorAgreementBreadcrumbs';
import CreatorAgreementDetailsTabContent from './components/CreatorAgreementDetailsTabContent';
import CreatorAgreementStatusLabel from './components/CreatorAgreementStatusLabel';
import CreatorConfirmCompleteActionModal, {
  CreatorConfirmationType,
} from './components/CreatorConfirmCompleteActionModal';
import CreatorDisputeModal from './components/CreatorDisputeModal';
import { AgreementDetailsTabs, creatorAgreementTabsConfig } from './constants';
import { useCreatorCompleteChangeRequestMutation } from './hooks/useCreatorCompleteChangeRequestMutation';
import { useCreatorCompleteConditionalChangeRequestMutation } from './hooks/useCreatorCompleteConditionalChangeRequestMutation';
import { useCreatorCompleteIpRemovalMutation } from './hooks/useCreatorCompleteIpRemovalMutation';
import { useCreatorDisputeAgreementMutation } from './hooks/useCreatorDisputeAgreementMutation';
import { useGetCreatorAgreementDetails } from './hooks/useGetCreatorAgreementDetails';

export const getBreadcrumbForStatus = (statusEnum: AgreementStatus) => {
  const tabConfig = creatorAgreementTabsConfig.find((config) =>
    config.statusEnums.find((status) => status === statusEnum),
  );
  return tabConfig;
};

interface CreatorAgreementDetailsContainerProps {
  agreementId: string;
}

function isCreatorAgreementDetailsTab(value: string | undefined): value is AgreementDetailsTabs {
  return value === AgreementDetailsTabs.Details || value === AgreementDetailsTabs.Activity;
}

const CreatorAgreementDetailsContainer: FunctionComponent<
  CreatorAgreementDetailsContainerProps
> = ({ agreementId }) => {
  const { translate } = useTranslation();
  const { enqueueErrorSnackbar, enqueueSuccessSnackbar } = useIpSnackbar();
  const { logEvent } = useLicenseManagerLogger();
  const { account } = useCurrentAccountContext();
  const accountId = account?.id;
  const { settings, isFetched } = useSettings();
  const { enableIpPlatformConditionalOffers } = settings;
  const [queryParams, setQueryParams] = useQueryParams(['tab']);
  const rawTab = queryParams.tab;
  const tabParam = Array.isArray(rawTab) ? rawTab[0] : (rawTab ?? undefined);
  const currentTab = isCreatorAgreementDetailsTab(tabParam)
    ? tabParam
    : AgreementDetailsTabs.Details;
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

  const handleCompleteConditionalChangeRequestOpen = useCallback(() => {
    logEvent(
      LicenseManagerClickEvent.CreatorAgreementDetailsPageOpenCompleteChangeRequestModalClickEvent,
      {
        agreementId,
      },
    );
    setConfirmationType(CreatorConfirmationType.ConditionalChangeRequest);
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

  const completeConditionalChangeRequestMutation =
    useCreatorCompleteConditionalChangeRequestMutation(agreementId);
  const handleCompleteConditionalChangeRequest = async () => {
    try {
      await completeConditionalChangeRequestMutation.mutateAsync();
      enqueueSuccessSnackbar('Message.CreatorConditionalChangeRequestCompleted');
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
      enqueueSuccessSnackbar('Message.CreatorIpRemovalCompleted');
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
          { title: agreementDetailsRequest.data?.license.name ?? '' },
        ]}
      />,
    );
  }, [agreementDetailsRequest.data?.license.name, setPageTitle, tabBreadcrumb, translate]);

  if (
    agreementDetailsRequest.isError &&
    getResponseFromError(agreementDetailsRequest.error)?.status === StatusCodes.FORBIDDEN
  ) {
    return <ErrorPage errorCode={StatusCodes.FORBIDDEN} />;
  }
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
  const activityLog = agreement.activityLog ?? [];

  const experienceGuidelines =
    experienceGuidelinesRequest.error || !experienceGuidelinesRequest.data
      ? translate('Label.MaturityRatingNoneAvailable')
      : experienceGuidelinesRequest.data;

  return (
    <Flex flexDirection='column' gap={20}>
      <Flex justifyContent='space-between'>
        <Flex flexDirection='column' gap={8}>
          <Typography variant='h1'>{license.name}</Typography>
          <Typography variant='h6'>{listing.name}</Typography>
          <CreatorAgreementStatusLabel agreement={agreement} />
        </Flex>
        <CreatorAgreementActions agreement={agreement} />
      </Flex>

      <CreatorAgreementAlert
        agreement={agreement}
        listingName={listing.name ?? translate('Label.RightsHolder')}
        handleTabChange={handleTabChange}
        handleCompleteChangeRequest={handleCompleteChangeRequestOpen}
        handleCompleteConditionalChangeRequest={
          enableIpPlatformConditionalOffers ? handleCompleteConditionalChangeRequestOpen : undefined
        }
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
          accountId={accountId}
          agreementId={agreementId}
          isCreator
          activityLog={activityLog}
          creatorName={universe.creator?.name ?? undefined}
          listingName={listing.name ?? undefined}
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
        endDate={agreement.endTime}
        closeModal={handleCompleteActionModalClose}
        submitComplete={
          confirmationType === CreatorConfirmationType.ChangeRequest
            ? handleCompleteChangeRequest
            : confirmationType === CreatorConfirmationType.ConditionalChangeRequest
              ? handleCompleteConditionalChangeRequest
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
