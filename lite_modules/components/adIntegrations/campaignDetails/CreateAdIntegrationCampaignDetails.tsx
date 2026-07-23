import { useRouter } from 'next/router';
import { useMemo, useRef } from 'react';

import AdIntegrationCampaignDetailsForm from '@components/adIntegrations/campaignDetails/AdIntegrationCampaignDetailsForm';
import CenteredCircularProgress from '@components/common/CenteredCircularProgress';
import NoDataPage from '@components/common/NoDataPage';
import Routes from '@constants/routes';
import useAdIntegrationCampaignApi from '@hooks/adIntegrations/useAdIntegrationCampaignApi';
import { useAuthenticatedUser } from '@hooks/useAuthenticatedUser';
import { addPlacementToAdIntegration } from '@services/ads/adIntegrationCampaignService';
import { AdIntegrationCampaignDetailsFormValues } from '@type/adIntegrations';

const CreateAdIntegrationCampaignDetails = () => {
  const router = useRouter();
  const authenticatedUser = useAuthenticatedUser();
  const createdCampaignIdRef = useRef<string | null>(null);
  const addedPlacementIdsRef = useRef<Set<number>>(new Set());
  const {
    createCampaignDetails,
    isSubmitting,
    isUniversesError,
    isUniversesLoading,
    universesCanAdvertise,
  } = useAdIntegrationCampaignApi();

  const defaultValues = useMemo<AdIntegrationCampaignDetailsFormValues>(
    () => ({
      adsCategory: '',
      advertiserName: '',
      campaignName: '',
      endDate: '',
      endTime: '',
      experience: universesCanAdvertise[0]?.universe_id ?? 0,
      hasRewardedPlacements: false,
      startDate: '',
      startTime: '',
      termsAndAdsStandardsAcknowledgement: false,
    }),
    [universesCanAdvertise],
  );

  if (isUniversesLoading) {
    return <CenteredCircularProgress />;
  }

  if (isUniversesError) {
    return <NoDataPage />;
  }

  return (
    <AdIntegrationCampaignDetailsForm
      defaultValues={defaultValues}
      isSubmitting={isSubmitting}
      mode='create'
      onCancel={() => {
        router.push(Routes.AD_INTEGRATIONS);
      }}
      onSubmit={async (values, _changedFields, pendingAssetIds) => {
        if (!createdCampaignIdRef.current) {
          const result = await createCampaignDetails(values);
          createdCampaignIdRef.current = result.campaignId ?? null;
        }
        const campaignId = createdCampaignIdRef.current;
        if (!campaignId) {
          throw new Error('Campaign creation did not return an ID');
        }
        if (pendingAssetIds && pendingAssetIds.length > 0) {
          const remainingAssetIds = pendingAssetIds.filter(
            (assetId) => !addedPlacementIdsRef.current.has(assetId),
          );
          const results = await Promise.allSettled(
            remainingAssetIds.map((assetId) => addPlacementToAdIntegration(campaignId, assetId)),
          );
          const failures: number[] = [];
          results.forEach((result, index) => {
            if (result.status === 'fulfilled') {
              addedPlacementIdsRef.current.add(remainingAssetIds[index]);
            } else {
              failures.push(remainingAssetIds[index]);
            }
          });
          if (failures.length > 0) {
            throw new Error(`Failed to add placements: ${failures.join(', ')}`);
          }
        }
        await router.push(Routes.AD_INTEGRATIONS);
      }}
      placements={[]}
      universes={universesCanAdvertise}
      userId={authenticatedUser?.id}
    />
  );
};

export default CreateAdIntegrationCampaignDetails;
