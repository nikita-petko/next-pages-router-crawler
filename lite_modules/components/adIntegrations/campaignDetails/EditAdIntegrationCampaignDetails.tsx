import { useRouter } from 'next/router';
import { useCallback, useEffect } from 'react';

import AdIntegrationCampaignDetailsForm from '@components/adIntegrations/campaignDetails/AdIntegrationCampaignDetailsForm';
import CenteredCircularProgress from '@components/common/CenteredCircularProgress';
import NoDataPage from '@components/common/NoDataPage';
import Routes from '@constants/routes';
import useAdIntegrationCampaignApi from '@hooks/adIntegrations/useAdIntegrationCampaignApi';
import { useAuthenticatedUser } from '@hooks/useAuthenticatedUser';
import {
  addPlacementToAdIntegration,
  removePlacementFromAdIntegration,
} from '@services/ads/adIntegrationCampaignService';

const EditAdIntegrationCampaignDetails = () => {
  const router = useRouter();
  const authenticatedUser = useAuthenticatedUser();
  const {
    campaignDetails,
    campaignPlacements,
    campaignSavedRevenueShareSignals,
    campaignStartTimestampMs,
    getCampaignDetailsById,
    isCampaignDetailsError,
    isCampaignDetailsLoading,
    isSubmitting,
    isUniversesError,
    isUniversesLoading,
    universesCanAdvertise,
    updateCampaignDetails,
  } = useAdIntegrationCampaignApi();
  const campaignIdFromQuery = router.query.campaignId;
  const campaignId = typeof campaignIdFromQuery === 'string' ? campaignIdFromQuery : null;

  useEffect(() => {
    if (!router.isReady) {
      return;
    }

    if (!campaignId) {
      return;
    }

    getCampaignDetailsById(campaignId);
  }, [campaignId, getCampaignDetailsById, router.isReady]);

  const handleSavePlacements = useCallback(
    async (additions: number[], removals: string[]) => {
      if (!campaignId) {
        return;
      }

      await Promise.all([
        ...additions.map((assetId) => addPlacementToAdIntegration(campaignId, assetId)),
        ...removals.map((placementId) => removePlacementFromAdIntegration(campaignId, placementId)),
      ]);

      await getCampaignDetailsById(campaignId, true);
    },
    [campaignId, getCampaignDetailsById],
  );

  if (!campaignId || isUniversesLoading || isCampaignDetailsLoading) {
    return <CenteredCircularProgress />;
  }

  if (isUniversesError || isCampaignDetailsError || !campaignDetails) {
    return <NoDataPage />;
  }

  return (
    <AdIntegrationCampaignDetailsForm
      campaignId={campaignId}
      campaignStartTimestampMs={campaignStartTimestampMs}
      defaultValues={campaignDetails}
      isSubmitting={isSubmitting}
      mode='edit'
      onCancel={() => {
        router.push(Routes.AD_INTEGRATIONS);
      }}
      onSavePlacements={handleSavePlacements}
      onSubmit={async (values, changedFields) => {
        await updateCampaignDetails(campaignId, values, changedFields);
        await router.push(Routes.AD_INTEGRATIONS);
      }}
      placements={campaignPlacements}
      savedRevenueShareSignals={campaignSavedRevenueShareSignals}
      universes={universesCanAdvertise}
      userId={authenticatedUser?.id}
    />
  );
};

export default EditAdIntegrationCampaignDetails;
