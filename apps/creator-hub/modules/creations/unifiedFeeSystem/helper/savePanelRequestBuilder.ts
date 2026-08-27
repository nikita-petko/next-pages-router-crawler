import type { RobloxItemConfigurationApiModelsRequestCollectiblesSaleLocationConfigurationModel } from '@rbx/client-itemconfiguration/v1';
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
  optionalPriceFloor: number | undefined;
}

export function computePriceInRobux({ isFree, optionalPriceFloor }: ComputePriceParams): number {
  if (isFree) {
    return 0;
  }
  if (optionalPriceFloor && optionalPriceFloor > 0) {
    return optionalPriceFloor;
  }
  return 1;
}
