import type {
  PriceAcceptanceState,
  ProductIdentifier,
  ProductType,
} from '@rbx/client-price-experimentation-api/v1';

type ValidProductType = Exclude<ProductType, 'Invalid'>;

export interface Product {
  name: string;
  // productId is stored as a string in experimentation EaaS backend
  // in case we have non-numeric IDs in the future.
  // It is the product specific ID, such as game pass or dev product ID.
  // productId is the ID in ProductsV3.
  productId: string;
  // It should only be set if productId is to be displayed to the user instead of productTargetId.
  // productId is stored as a string in experimentation EaaS backend
  // in case we have non-numeric IDs in the future
  productV3Id?: number;
  productType: ValidProductType;
  iconId: number;
  defaultPriceInRobux: number;
  recommendedPriceInRobux?: number;
  recommendedPriceChangeInMicroUnits?: number | null;
  isRegionalPricingEnabled?: boolean;
  priceAcceptanceStatus?: PriceAcceptanceState;
  optimizationPercentage?: number | null; // Percentage change for optimization (e.g., 5 for +5%, -3 for -3%, null for no data)
}

export const productIdentifierToKey = (product: ProductIdentifier): string =>
  `${product.productType}#${product.productId}`;
