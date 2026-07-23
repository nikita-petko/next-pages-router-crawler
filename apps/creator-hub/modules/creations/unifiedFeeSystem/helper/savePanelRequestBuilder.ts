import type { RobloxItemConfigurationApiModelsRequestCollectiblesSaleLocationConfigurationModel } from '@rbx/client-itemconfiguration/v1';
import type { ItemConfigurationCollectiblesMetadataResponse } from '@modules/clients/itemconfiguration';
import { SaleLocationEnum, mapSaleLocationToType } from './UnifiedFeeSystemConstants';

export function buildSaleLocationModel(
  saleLocation: SaleLocationEnum,
  selectedPlaces: string[],
): RobloxItemConfigurationApiModelsRequestCollectiblesSaleLocationConfigurationModel {
  return {
    saleLocationType: mapSaleLocationToType(saleLocation),
    places:
      saleLocation === SaleLocationEnum.ExperiencesAndDevAPIOnly ||
      saleLocation === SaleLocationEnum.MarketplaceAndExperiencesById
        ? selectedPlaces.map(Number)
        : [],
  };
}

interface ComputePriceParams {
  isFree: boolean;
  isBundle: boolean;
  collectiblesMetadata?: ItemConfigurationCollectiblesMetadataResponse;
  optionalPriceFloor: number | undefined;
  price: number | undefined;
}

export function computePriceInRobux({
  isFree,
  isBundle,
  collectiblesMetadata,
  optionalPriceFloor,
  price,
}: ComputePriceParams): number {
  if (isFree) {
    return 0;
  }
  if (isBundle && collectiblesMetadata?.isNewBundleUIEnabled === false) {
    return price ?? 0;
  }
  if (optionalPriceFloor && optionalPriceFloor > 0) {
    return optionalPriceFloor;
  }
  return 1;
}
