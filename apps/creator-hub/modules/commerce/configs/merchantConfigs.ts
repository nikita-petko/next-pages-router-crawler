import { resolveUrl } from '@rbx/env-utils';
import { amazonWordmarkLogoPath, shopifyWordmarkLogoPath } from './assets';

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
  validateMerchantItemId?: (merchantItemId: string) => boolean;
  importCatalogHref?: string;
}

export enum Merchant {
  Amazon = 'amazon',
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
  [Merchant.Amazon]: {
    merchant: Merchant.Amazon,
    displayName: 'Amazon',
    imageConfigs: {
      wordmarkLogo: { path: amazonWordmarkLogoPath, scale: 0.8 },
    },
    translationKeys: {
      selectMerchantDescription: 'Description.SelectMerchant.Amazon',
      catalogHeading: 'Heading.Catalog.Amazon',
    },
    validateMerchantItemId: (merchantItemId: string) => /(^[A-Z0-9]{10}$)/.test(merchantItemId),
  },
};
