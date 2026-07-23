import type { CommerceApiClient } from '@modules/clients/commerce';
import type { ItemConfigurationClient } from '@modules/clients/itemconfiguration';
import { fetchIXPParametersForCurrentUser, IXPLayers } from '@modules/clients/ixpExperiments';
import type { PriceConfigurationApiClient } from '@modules/clients/priceConfigurationApi';
import type { PriceExperimentationApiClient } from '@modules/clients/priceExperimentation';
import type { ServiceEfficiencyClient } from '@modules/clients/serviceEfficiency';
import SkippedUpdateError from '@modules/settings/implementations/SkippedUpdateError';
import type CustomSettingsManagerWithArgs from '@modules/settings/interfaces/CustomSettingsManagerWithArgs';
import type CreationsCustomSettings from '../interfaces/CreationsCustomSettings';

export type CreationsCustomSettingsArgs = [universeId?: number];

export default class CreationsCustomSettingsManager implements CustomSettingsManagerWithArgs<
  CreationsCustomSettings,
  CreationsCustomSettingsArgs
> {
  name?: string | undefined;

  defaultSettings: Readonly<CreationsCustomSettings>;

  getSettingsPromise: Record<number, Promise<CreationsCustomSettings> | undefined> = {};

  constructor(
    private serviceEfficiencyClient: ServiceEfficiencyClient,
    private priceExperimentationClient: PriceExperimentationApiClient,
    private priceConfigurationApiClient: PriceConfigurationApiClient,
    private itemConfigurationClient: ItemConfigurationClient,
    private commerceApiClient: CommerceApiClient,
  ) {
    this.name = 'CreationsCustomSettings';

    this.defaultSettings = Object.freeze({
      isCloudServicesEnabled: false,
      showVrDeviceOption: false,
      isPriceOptimizationEnabled: false,
      isManagedPricingEnabled: false,
      isExperienceCreatedByCurrentUserOrGroup: false,
      isCommercePilotEnabled: false,
      isScheduledPublishingEnabled: false,
      isFreeAvatarSystemEnabled: false,
      isCustomMatchmakingEnabled: true,
      isCustomMatchmakingTextChatSignalEnabled: true,
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
      userIXPParams,
      serviceEfficiencyPermission,
      priceOptimizationPermission,
      managedPricingStatus,
      getCollectiblesMetadata,
      getCommerceExperienceConfiguration,
      webhooksIXPParams,
    ] = await Promise.allSettled([
      fetchIXPParametersForCurrentUser(IXPLayers.CreatorDashboard),
      this.serviceEfficiencyClient.serviceEfficiencyApiIsAllowed({ universeId }),
      this.priceExperimentationClient.getExperimentEligibility({
        universeId,
      }),
      this.priceConfigurationApiClient.getManagedPricingStatus(universeId),
      this.itemConfigurationClient.getCollectiblesMetadata(),
      this.commerceApiClient.getCommerceExperienceConfiguration(universeId),
      fetchIXPParametersForCurrentUser(IXPLayers.CreatorHubExperienceWebhooks),
    ]);

    return {
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
      isCommercePilotEnabled:
        getCommerceExperienceConfiguration.status === 'fulfilled' &&
        (getCommerceExperienceConfiguration.value?.isShopifyEnabled ?? false),
      isScheduledPublishingEnabled:
        getCollectiblesMetadata.status === 'fulfilled' &&
        (getCollectiblesMetadata.value?.isScheduledPublishingEnabled ?? false),
      isFreeAvatarSystemEnabled:
        getCollectiblesMetadata.status === 'fulfilled' &&
        (getCollectiblesMetadata.value?.isFreeAvatarSystemEnabled ?? false),
      isCustomMatchmakingEnabled: true,
      isCustomMatchmakingTextChatSignalEnabled: true,
      isExperienceWebhooksEnabled:
        webhooksIXPParams.status === 'fulfilled' &&
        (webhooksIXPParams.value.enableExperienceWebhooks ?? false),
    };
  }
}
