import { CustomSettingsManagerWithArgs, SkippedUpdateError } from '@modules/settings';
import type { ItemConfigurationClient, ServiceEfficiencyClient } from '@modules/clients';
import type { DefaultApi as DeveloperAdsStatsApi } from '@rbx/clients/developerAdsStatsApi/v1';

import { fetchIXPParametersForCurrentUser, IXPLayers } from '@modules/clients/ixpExperiments';
import { BadgesClient } from '@modules/clients';
import { CommerceApiClient } from '@modules/clients/commerce';
import { PriceExperimentationApiApi } from '@rbx/clients/priceExperimentationApi/v1';
import { PriceConfigurationApiClient } from '@modules/clients/priceConfigurationApi';
import { MatchmakingClient } from '@modules/react-query/matchmaking/matchmakingRequests';
import type CreationsCustomSettings from '../interfaces/CreationsCustomSettings';

export type CreationsCustomSettingsArgs = [universeId?: number];

export default class CreationsCustomSettingsManager
  implements CustomSettingsManagerWithArgs<CreationsCustomSettings, CreationsCustomSettingsArgs>
{
  name?: string | undefined;

  defaultSettings: Readonly<CreationsCustomSettings>;

  getSettingsPromise: Record<number, Promise<CreationsCustomSettings> | undefined> = {};

  constructor(
    private developerAdsStatsApi: DeveloperAdsStatsApi,
    private serviceEfficiencyClient: ServiceEfficiencyClient,
    private priceExperimentationClient: PriceExperimentationApiApi,
    private priceConfigurationApiClient: PriceConfigurationApiClient,
    private badgesClient: BadgesClient,
    private itemConfigurationClient: ItemConfigurationClient,
    private commerceApiClient: CommerceApiClient,
    private matchmakingClient: MatchmakingClient,
  ) {
    this.name = 'CreationsCustomSettings';

    this.defaultSettings = Object.freeze({
      isImmersiveAdsDashboardEnabled: false,
      isCloudServicesEnabled: false,
      showVrDeviceOption: false,
      isPriceOptimizationEnabled: false,
      isManagedPricingEnabled: false,
      isExperienceCreatedByCurrentUserOrGroup: false,
      isUniverseEnrolledInBadgesReordering: false,
      isAvatarCreationTokensEnabled: false,
      isCommercePilotEnabled: false,
      isScheduledPublishingEnabled: false,
      isCustomMatchmakingEnabled: false,
      isCustomMatchmakingTextChatSignalEnabled: false,
      isEdauBreakdownEnabled: false,
      isExperienceWebhooksEnabled: false,
    });
  }

  async getSettings(universeId?: number): Promise<CreationsCustomSettings> {
    // this would be undefined in the initial render since it needs to be
    // retrieved from the router, skip the update in that case
    if (typeof universeId === 'undefined') {
      throw new SkippedUpdateError();
    }

    if (this.getSettingsPromise[universeId]) {
      return this.getSettingsPromise[universeId];
    }

    const getSettingsPromise = this.getSettingsUncached(universeId);
    this.getSettingsPromise[universeId] = getSettingsPromise;
    return getSettingsPromise;
  }

  async getSettingsUncached(universeId: number): Promise<CreationsCustomSettings> {
    const [
      immersiveAdsDashboardPermission,
      userIXPParams,
      serviceEfficiencyPermission,
      priceOptimizationPermission,
      managedPricingStatus,
      isUniverseEnrolledInBadgesReordering,
      getCollectiblePublishingMetadata,
      getCommerceExperienceConfiguration,
      getIsFeatureEnabledForUniverse,
      webhooksIXPParams,
    ] = await Promise.allSettled([
      this.developerAdsStatsApi.getImmersiveAdsPermissions({ universeId }),
      fetchIXPParametersForCurrentUser(IXPLayers.CreatorDashboard),
      this.serviceEfficiencyClient.serviceEfficiencyApiIsAllowed({ universeId }),
      this.priceExperimentationClient.priceExperimentationApiGetExperimentEligibility({
        universeId,
      }),
      this.priceConfigurationApiClient.getManagedPricingStatus(universeId),
      this.badgesClient.getIsUniverseEnrolledInBadgesReordering(universeId),
      this.itemConfigurationClient.getCollectiblePublishingMetadata(),
      this.commerceApiClient.getCommerceExperienceConfiguration(universeId),
      this.matchmakingClient.getIsFeatureEnabledForUniverse({ universeId }),
      fetchIXPParametersForCurrentUser(IXPLayers.CreatorHubExperienceWebhooks),
    ]);

    return {
      isImmersiveAdsDashboardEnabled:
        immersiveAdsDashboardPermission.status === 'fulfilled' &&
        (immersiveAdsDashboardPermission.value.isImmersiveAdsDashboardEnabled ?? false),
      isCloudServicesEnabled:
        serviceEfficiencyPermission.status === 'fulfilled' &&
        (serviceEfficiencyPermission.value ?? false),
      showVrDeviceOption:
        userIXPParams.status === 'fulfilled' && (userIXPParams.value.showVrDeviceOption ?? false),
      isPriceOptimizationEnabled:
        priceOptimizationPermission.status === 'fulfilled' &&
        (priceOptimizationPermission.value?.isEligible ?? false),
      isManagedPricingEnabled:
        managedPricingStatus.status === 'fulfilled' &&
        (managedPricingStatus.value?.status === 'Pending' ||
          managedPricingStatus.value?.status === 'Accepted'),
      isExperienceCreatedByCurrentUserOrGroup: true,
      isUniverseEnrolledInBadgesReordering:
        isUniverseEnrolledInBadgesReordering.status === 'fulfilled' &&
        (isUniverseEnrolledInBadgesReordering.value ?? false),
      isAvatarCreationTokensEnabled:
        getCollectiblePublishingMetadata.status === 'fulfilled' &&
        (getCollectiblePublishingMetadata.value?.isAvatarCreationTokensUIEnabled ?? false),
      isCommercePilotEnabled:
        getCommerceExperienceConfiguration.status === 'fulfilled' &&
        ((getCommerceExperienceConfiguration.value?.isShopifyEnabled ?? false) ||
          (getCommerceExperienceConfiguration.value?.isAmazonEnabled ?? false)),
      isScheduledPublishingEnabled:
        getCollectiblePublishingMetadata.status === 'fulfilled' &&
        (getCollectiblePublishingMetadata.value?.isScheduledPublishingEnabled ?? false),
      isCustomMatchmakingEnabled:
        getIsFeatureEnabledForUniverse.status === 'fulfilled' &&
        (getIsFeatureEnabledForUniverse.value.featureFlags?.isMatchmakingCustomizationAllowed ??
          false),
      isCustomMatchmakingTextChatSignalEnabled:
        getIsFeatureEnabledForUniverse.status === 'fulfilled' &&
        (getIsFeatureEnabledForUniverse.value.featureFlags?.isMatchmakingTextChatSignalEnabled ??
          false),
      isEdauBreakdownEnabled:
        immersiveAdsDashboardPermission.status === 'fulfilled' &&
        (immersiveAdsDashboardPermission.value.isEdauBreakdownEnabled ?? false),
      isExperienceWebhooksEnabled:
        webhooksIXPParams.status === 'fulfilled' &&
        (webhooksIXPParams.value.enableExperienceWebhooks ?? false),
    };
  }
}
