import { resolveUrl } from '@rbx/env-utils';
import { shopifyWordmarkLogoPath } from './assets';

export interface MerchantDetail {
  // Required configurations
  merchant: Merchant;
  displayName: string;
  imageConfigs: {
    wordmarkLogo: {
      path: string;
      scale: number; // TODO(SUBS-3126): remove this (replace with images that are visually centered)
    };
  };
  translationKeys: {
    selectMerchantDescription: string;
    catalogHeading: string;
  };
  // Optional configurations (merchant-specific) - TODO(SUBS-3125): refactor / avoid doing this
  importCatalogHref?: string;
}

export enum Merchant {
  Shopify = 'shopify',
}

export const merchantConfigs: Record<Merchant, MerchantDetail> = {
  [Merchant.Shopify]: {
    merchant: Merchant.Shopify,
    displayName: 'Shopify',
    imageConfigs: { wordmarkLogo: { path: shopifyWordmarkLogoPath, scale: 1 } },
    translationKeys: {
      selectMerchantDescription: 'Description.SelectMerchant.Shopify',
      catalogHeading: 'Heading.Catalog.Shopify',
    },
    importCatalogHref: resolveUrl(
      'shopifyMerchantUrl',
      process.env.targetEnvironment,
      process.env.buildTarget,
    ),
  },
};
