import {
  LicenseType,
  RevenueTargetType,
  type RevenueTargetReference,
} from '@rbx/client-content-licensing-api/v1';
import { ThumbnailTypes } from '@rbx/thumbnails';
import developerProductsClient from '@modules/clients/developerProducts';
import passesClient from '@modules/clients/passes';

/** Product type for a collaboration sales avenue entry. */
export const SalesAvenueProductType = {
  GamePass: 'GamePass',
  DeveloperProduct: 'DeveloperProduct',
} as const;

export type SalesAvenueProductType =
  (typeof SalesAvenueProductType)[keyof typeof SalesAvenueProductType];

/** Resolved game pass or developer product designated as a collaboration sales avenue. */
export type SalesAvenueSelection = {
  id: number;
  name: string;
  type: SalesAvenueProductType;
  priceInRobux: number;
  iconAssetId?: number;
};

/** Game pass and developer product selections for collaboration license applications. */
export type CollaborationSalesAvenues = {
  developerProducts: SalesAvenueSelection[];
  gamePasses: SalesAvenueSelection[];
};

export const MAX_COLLABORATION_SALES_AVENUES = 5;

export const EMPTY_COLLABORATION_SALES_AVENUES: CollaborationSalesAvenues = {
  developerProducts: [],
  gamePasses: [],
};

export function getTotalResolvedSalesAvenues(salesAvenues: CollaborationSalesAvenues): number {
  return salesAvenues.developerProducts.length + salesAvenues.gamePasses.length;
}

export function hasResolvedSalesAvenue(salesAvenues: CollaborationSalesAvenues): boolean {
  return getTotalResolvedSalesAvenues(salesAvenues) > 0;
}

export function isDuplicateSalesAvenueWithinType(
  productType: SalesAvenueProductType,
  productId: number,
  salesAvenues: CollaborationSalesAvenues,
): boolean {
  const entries =
    productType === SalesAvenueProductType.GamePass
      ? salesAvenues.gamePasses
      : salesAvenues.developerProducts;
  return entries.some((entry) => entry.id === productId);
}

function toGamePassSelection(gamePass: {
  gamePassId: number;
  name: string;
  iconAssetId?: number;
  priceInformation?: { defaultPriceInRobux?: number | null } | null;
}): SalesAvenueSelection {
  return {
    id: gamePass.gamePassId,
    name: gamePass.name,
    type: SalesAvenueProductType.GamePass,
    priceInRobux: gamePass.priceInformation?.defaultPriceInRobux ?? 0,
    iconAssetId: gamePass.iconAssetId,
  };
}

function toDeveloperProductSelection(product: {
  productId: number;
  name: string;
  iconImageAssetId?: number | null;
  priceInformation?: { defaultPriceInRobux?: number | null } | null;
}): SalesAvenueSelection {
  return {
    id: product.productId,
    name: product.name,
    type: SalesAvenueProductType.DeveloperProduct,
    priceInRobux: product.priceInformation?.defaultPriceInRobux ?? 0,
    iconAssetId: product.iconImageAssetId ?? undefined,
  };
}

/**
 * Resolves a game pass or developer product in the selected experience universe.
 * Returns null when the ID is not found for the given product type and universe.
 */
export async function resolveSalesAvenueProduct(
  universeId: number,
  productId: number,
  productType: SalesAvenueProductType,
): Promise<SalesAvenueSelection | null> {
  if (!Number.isFinite(universeId) || universeId <= 0) {
    return null;
  }

  if (productType === SalesAvenueProductType.GamePass) {
    const response = await passesClient.batchGetGamePassConfigs({
      universeId,
      gamePassIds: [productId],
    });
    const gamePass = response.gamePasses.find((entry) => entry.gamePassId === productId);
    return gamePass ? toGamePassSelection(gamePass) : null;
  }

  const response = await developerProductsClient.batchGetDeveloperProductConfigs({
    universeId,
    productIds: [productId],
  });
  const developerProduct = response.developerProducts.find(
    (entry) => entry.productId === productId,
  );
  return developerProduct ? toDeveloperProductSelection(developerProduct) : null;
}

export function getSalesAvenueThumbnailTarget(entry: SalesAvenueSelection): {
  targetId: number;
  type: ThumbnailTypes;
} {
  if (entry.iconAssetId) {
    return {
      targetId: entry.iconAssetId,
      type: ThumbnailTypes.assetThumbnail,
    };
  }

  if (entry.type === SalesAvenueProductType.GamePass) {
    return {
      targetId: entry.id,
      type: ThumbnailTypes.gamePassIcon,
    };
  }

  return {
    targetId: entry.id,
    type: ThumbnailTypes.developerProductIcon,
  };
}

interface BuildApplyToLicenseRevenueTargetsParams {
  enableCollaborationLicensing: boolean;
  licenseType?: LicenseType;
  universeId: number;
  collaborationSalesAvenues?: CollaborationSalesAvenues;
}

/** Builds apply-to-license revenue targets from license type and creator selections. */
export function buildApplyToLicenseRevenueTargets({
  enableCollaborationLicensing,
  licenseType,
  universeId,
  collaborationSalesAvenues,
}: BuildApplyToLicenseRevenueTargetsParams): RevenueTargetReference[] {
  const isCollaborationLicense =
    enableCollaborationLicensing && licenseType === LicenseType.CollaborationInExperienceSale;

  if (!isCollaborationLicense) {
    return [
      {
        revenueTargetType: RevenueTargetType.Universe,
        revenueTargetId: String(universeId),
      },
    ];
  }

  if (!collaborationSalesAvenues) {
    return [];
  }

  const revenueTargets: RevenueTargetReference[] = [];

  for (const developerProduct of collaborationSalesAvenues.developerProducts) {
    revenueTargets.push({
      revenueTargetType: RevenueTargetType.DeveloperProduct,
      revenueTargetId: String(developerProduct.id),
    });
  }

  for (const gamePass of collaborationSalesAvenues.gamePasses) {
    revenueTargets.push({
      revenueTargetType: RevenueTargetType.GamePass,
      revenueTargetId: String(gamePass.id),
    });
  }

  return revenueTargets;
}
