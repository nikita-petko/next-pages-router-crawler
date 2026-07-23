import { Button, Link, Tooltip } from '@rbx/ui';
import { noop } from 'lodash';
import { useRouter } from 'next/router';
import { ReactNode, useCallback, useEffect } from 'react';

import { EventName, unifiedLogger } from '@clients/unifiedLogger';
import Routes from '@constants/routes';
import { usdToMicroUsd } from '@modules/clients/ads/serverClientTransformationUtilities';
import useCreateButtonStyles from '@modules/creation/components/createButton.styles';
import CreateNewAdOrAdSetPrompt, {
  EntityTypeEnum,
} from '@modules/creation/components/createNewAdOrAdSetPrompt';
import { GetTooltipText } from '@modules/miscellaneous/utils/tooltipStrings';
import { useLimitInfoStore } from '@modules/stores/limitInfoStoreProvider';
import { AppStoreType, useAppStore } from '@stores/appStoreProvider';
import { useModalStore } from '@stores/modalStoreProvider';
import { GetLocalStorage, StorageKeys } from '@utils/localStorage';
import { HOME_PAGE_TABLE_VIEWS } from 'app/pages/classic';
import { TODOFIXANY } from 'app/shared/types';

const CreateButton = () => {
  const { setModalConfigData, setModalOpen } = useModalStore();

  const {
    classes: { createButton },
  } = useCreateButtonStyles();

  const {
    accountHasValidName,
    adCreditActivated,
    adCreditBalance,
    campaignLimit,
    campaignMinimumDailyBudgetUsd,
    isCampaignLimitMax,
    paymentFailure,
    paymentProfiles,
  } = useAppStore((state: AppStoreType) => state.appData);

  const router = useRouter();
  const selectedRoute = router.query.tableView;
  const showingCampaignsTable = selectedRoute === HOME_PAGE_TABLE_VIEWS.campaigns;
  const showingAdSetsTable = selectedRoute === HOME_PAGE_TABLE_VIEWS.adSets;

  const numCampaigns = useLimitInfoStore((state) => state.numCampaigns);

  const isClassicFlowEnabled = useAppStore(
    (state: AppStoreType) => state.appMetadataState?.data?.isClassicFlowEnabled,
  );

  const hasVerifiedPaymentProfiles = paymentProfiles.some(
    (paymentProfile) => paymentProfile?.is_verified,
  );

  // minimum daily budget for ad credit default has 2 days
  const minBudgetUsd = campaignMinimumDailyBudgetUsd;
  // we only want to show the tool tip if user only has ad credit as payment
  // method, and the fund is less than the min budget required to create campaign
  const advertisingEnabled = useAppStore((state: AppStoreType) =>
    state.advertisingShouldBeEnabled(),
  );
  let showTooltip =
    !advertisingEnabled.advertisingShouldBeEnabled &&
    !hasVerifiedPaymentProfiles &&
    adCreditActivated &&
    adCreditBalance < usdToMicroUsd(minBudgetUsd);

  let tooltipText: string | ReactNode = GetTooltipText('Disabled.NotEnoughAdCredit', {
    '_{credits}': minBudgetUsd.toString(),
  });

  // show tooltip if the user has no verified payment method or a failed payment, and
  // not already showing a tooltip for under budget ad credit
  if (
    !advertisingEnabled.advertisingShouldBeEnabled &&
    !showTooltip &&
    (!hasVerifiedPaymentProfiles || paymentFailure)
  ) {
    if (showingCampaignsTable) {
      tooltipText = GetTooltipText('Disabled.NoValidPaymentMethodCampaign');
    } else if (showingAdSetsTable) {
      tooltipText = GetTooltipText('Disabled.NoValidPaymentMethodAdSet');
    } else {
      tooltipText = GetTooltipText('Disabled.NoValidPaymentMethodAd');
    }
    showTooltip = true;
  }

  // only update text when user has valid ad credit and failed business name check
  if (!showTooltip && !accountHasValidName) {
    tooltipText = GetTooltipText('Disabled.InvalidBusinessName');
  }
  showTooltip = showTooltip || !accountHasValidName;

  const shouldDisableCampaignCreation = !!campaignLimit && numCampaigns >= campaignLimit;

  // show tooltip if no tooltip yet and user at campaign limit
  if (!showTooltip && shouldDisableCampaignCreation && showingCampaignsTable) {
    tooltipText = isCampaignLimitMax ? (
      <>
        {'You have reached the maximum number of campaigns allowed for your account. Please '}
        <Link
          color='inherit'
          href='https://www.roblox.com/support'
          rel='noopener'
          target='_blank'
          underline='always'>
          contact support
        </Link>
        {' for assistance.'}
      </>
    ) : (
      GetTooltipText('Disabled.CampaignLimitReached')
    );

    showTooltip = true;
  }

  if (!isClassicFlowEnabled) {
    tooltipText = GetTooltipText('Disabled.SelfServeAccountCreationDisabled');
    showTooltip = true;
  }

  const openNewCampaignPage = useCallback(
    (e: TODOFIXANY | undefined) => {
      if (e) {
        e.preventDefault();
      }
      setModalOpen(false);
      router.push(Routes.CREATE_CAMPAIGN);
    },
    [router, setModalOpen],
  );

  const openNewAdSetPage = useCallback(
    (e: TODOFIXANY, parentCampaignId: string) => {
      e.preventDefault();
      setModalOpen(false);
      router.push({
        pathname: Routes.CREATE_ADSET,
        query: {
          campaignId: parentCampaignId,
          currStep: 1,
        },
      });
    },
    [router, setModalOpen],
  );

  const openNewAdPage = useCallback(
    (e: TODOFIXANY, parentCampaignId: string, parentAdSetId: string) => {
      e.preventDefault();
      setModalOpen(false);
      router.push({
        pathname: Routes.CREATE_AD,
        query: {
          adSetId: parentAdSetId,
          campaignId: parentCampaignId,
          currStep: 2,
        },
      });
    },
    [router, setModalOpen],
  );

  const handleCloseCreateModal = useCallback(
    (_: TODOFIXANY, reason: string) => {
      if (reason === 'backdropClick') {
        return;
      }
      setModalOpen(false);
    },
    [setModalOpen],
  );

  const openCreateAdSetModal = useCallback(() => {
    setModalConfigData({
      completelyCustomModalContents: (
        <CreateNewAdOrAdSetPrompt
          format={EntityTypeEnum.ADSET}
          onClose={handleCloseCreateModal}
          onNewAdButtonClicked={noop}
          onNewAdSetButtonClicked={openNewAdSetPage}
          onNewCampaignButtonClicked={openNewCampaignPage}
          shouldDisableCampaignCreation={shouldDisableCampaignCreation}
        />
      ),
      handleClose: handleCloseCreateModal,
    });

    setModalOpen(true);
  }, [
    setModalConfigData,
    setModalOpen,
    openNewCampaignPage,
    openNewAdSetPage,
    handleCloseCreateModal,
    shouldDisableCampaignCreation,
  ]);

  const openCreateAdModal = useCallback(() => {
    setModalConfigData({
      completelyCustomModalContents: (
        <CreateNewAdOrAdSetPrompt
          format={EntityTypeEnum.AD}
          onClose={handleCloseCreateModal}
          onNewAdButtonClicked={openNewAdPage}
          onNewAdSetButtonClicked={openNewAdSetPage}
          onNewCampaignButtonClicked={openNewCampaignPage}
          shouldDisableCampaignCreation={shouldDisableCampaignCreation}
        />
      ),
      handleClose: handleCloseCreateModal,
    });

    setModalOpen(true);
  }, [
    setModalConfigData,
    setModalOpen,
    openNewCampaignPage,
    openNewAdSetPage,
    openNewAdPage,
    handleCloseCreateModal,
    shouldDisableCampaignCreation,
  ]);

  const createDisabled =
    !advertisingEnabled.advertisingShouldBeEnabled ||
    (shouldDisableCampaignCreation && showingCampaignsTable) ||
    !isClassicFlowEnabled;

  useEffect(() => {
    if (createDisabled && showingCampaignsTable) {
      unifiedLogger.logImpressionEvent({
        eventName: EventName.CreateButtonDisabled,
        parameters: {
          adAccountId: GetLocalStorage(StorageKeys.AD_ACCOUNT_ID, ''),
          tooltipText:
            typeof tooltipText === 'string'
              ? tooltipText
              : 'You have reached the maximum number of campaigns allowed for your account.',
        },
      });
    }
  }, [tooltipText]);

  return (
    <Tooltip arrow placement='left' title={showTooltip ? tooltipText : ''}>
      <div>
        <Button
          className={createButton}
          color='primaryBrand'
          data-testid='create-button'
          disabled={createDisabled}
          onClick={() => {
            if (showingCampaignsTable) {
              unifiedLogger.logClickEvent({ eventName: EventName.CreateCampaignButtonClicked });
              openNewCampaignPage(undefined);
            } else if (showingAdSetsTable) {
              unifiedLogger.logClickEvent({ eventName: EventName.CreateAdSetButtonClicked });
              openCreateAdSetModal();
            } else {
              unifiedLogger.logClickEvent({ eventName: EventName.CreateAdButtonClicked });
              openCreateAdModal();
            }
          }}
          size='medium'
          variant='contained'>
          Create
        </Button>
      </div>
    </Tooltip>
  );
};

export default CreateButton;
