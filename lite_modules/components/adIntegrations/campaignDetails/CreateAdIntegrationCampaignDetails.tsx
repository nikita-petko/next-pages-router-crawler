import { useWorkspaces } from '@rbx/creator-hub-navigation';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useRef } from 'react';

import AdIntegrationCampaignDetailsForm from '@components/adIntegrations/campaignDetails/AdIntegrationCampaignDetailsForm';
import CenteredCircularProgress from '@components/common/CenteredCircularProgress';
import GenericNoDataPage from '@components/common/GenericNoDataPage';
import NoDataPage from '@components/common/NoDataPage';
import { AdsCategoryOtherValue } from '@constants/adIntegrations';
import { TranslationNamespace } from '@constants/localization';
import Routes from '@constants/routes';
import useAdIntegrationCampaignApi from '@hooks/adIntegrations/useAdIntegrationCampaignApi';
import { useAuthenticatedUser } from '@hooks/useAuthenticatedUser';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';
import useShouldUseWorkspaceUniverseFiltering from '@hooks/useShouldUseWorkspaceUniverseFiltering';
import { addPlacementToAdIntegration } from '@services/ads/adIntegrationCampaignService';
import { AdIntegrationCampaignDetailsFormValues } from '@type/adIntegrations';

const CreateAdIntegrationCampaignDetails = () => {
  const router = useRouter();
  const authenticatedUser = useAuthenticatedUser();
  const { translate: translateCampaign } = useNamespacedTranslation(TranslationNamespace.Campaign);
  const createdCampaignIdRef = useRef<string | null>(null);
  const addedPlacementIdsRef = useRef<Set<number>>(new Set());
  const {
    createCampaignDetails,
    getUniversesCanAdvertise,
    isSubmitting,
    isUniversesError,
    isUniversesLoading,
    publisherEligibleUniverseIds,
    universesCanAdvertise,
  } = useAdIntegrationCampaignApi({ loadUniversesOnMount: false });
  const shouldUseWorkspaceUniverseFiltering = useShouldUseWorkspaceUniverseFiltering();
  const { currentWorkspace, isLoading: isWorkspaceLoading } = useWorkspaces();
  const workspace = useMemo(
    () =>
      currentWorkspace.creatorId
        ? {
            creatorTargetId: currentWorkspace.creatorId,
            creatorType: currentWorkspace.creatorType,
          }
        : undefined,
    [currentWorkspace.creatorId, currentWorkspace.creatorType],
  );

  const eligibleUniverses = useMemo(() => {
    const eligibleIdSet = new Set(publisherEligibleUniverseIds);
    return universesCanAdvertise.filter((universe) => eligibleIdSet.has(universe.universe_id));
  }, [publisherEligibleUniverseIds, universesCanAdvertise]);

  const defaultValues = useMemo<AdIntegrationCampaignDetailsFormValues>(
    () => ({
      adsCategory: AdsCategoryOtherValue,
      advertiserName: '',
      campaignName: '',
      endDate: '',
      endTime: '',
      experience: eligibleUniverses[0]?.universe_id ?? 0,
      hasRewardedPlacements: false,
      startDate: '',
      startTime: '',
      termsAndAdsStandardsAcknowledgement: false,
    }),
    [eligibleUniverses],
  );

  useEffect(() => {
    if (shouldUseWorkspaceUniverseFiltering && isWorkspaceLoading) {
      return;
    }
    if (shouldUseWorkspaceUniverseFiltering && !workspace) {
      return;
    }

    getUniversesCanAdvertise(true, {
      workspace: shouldUseWorkspaceUniverseFiltering ? workspace : undefined,
    });
  }, [
    getUniversesCanAdvertise,
    isWorkspaceLoading,
    shouldUseWorkspaceUniverseFiltering,
    workspace,
  ]);

  if (isUniversesLoading || (shouldUseWorkspaceUniverseFiltering && isWorkspaceLoading)) {
    return <CenteredCircularProgress />;
  }

  if (isUniversesError) {
    return <NoDataPage />;
  }

  if (eligibleUniverses.length === 0) {
    return (
      <GenericNoDataPage
        subtitle={translateCampaign('Description.NoEligibleExperiencesForSelectedCreator')}
        title={translateCampaign('Heading.NoEligibleExperiencesFound')}
      />
    );
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
      universes={eligibleUniverses}
      userId={authenticatedUser?.id}
    />
  );
};

export default CreateAdIntegrationCampaignDetails;
