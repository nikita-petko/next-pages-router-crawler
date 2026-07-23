import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import {
  AssetType,
  MarketplaceType,
  RequirementCheck,
  Restriction,
} from '@rbx/client-marketplace-publishing-requirements-api/v1';
import marketplacePublishingRequirements from '@modules/clients/marketplacePublishingRequirements';
import { useAsyncAction } from '@modules/clients/utils';
import { Asset } from '@modules/miscellaneous/common';

export type MarketplacePublishingRequirementsProvider = {
  children?: React.ReactNode;
};
export type AssetConfigurationRestrictions = {
  isVerified: boolean;
  canPublish: boolean;
  canPrice: boolean;
  publishingRestrictions: Restriction[];
  pricingRestrictions: Restriction[];
};

export type OnboardingRestrictions = {
  canOnboard: boolean;
  onboardingRestrictions: Restriction[];
};

export type SellerRestrictions = {
  canPublish: boolean;
  publishingRestrictions: Restriction[];
  canPrice: boolean;
  pricingRestrictions: Restriction[];
};

export type MarketplacePublishingRequirementsProviderContext = {
  fetchAssetConfigurationRestrictions: (
    assetType: AssetType,
    assetId: number,
  ) => Promise<AssetConfigurationRestrictions>;
  fetchOnboardingRestrictions: () => Promise<OnboardingRestrictions>;
  fetchSellerRestrictions: () => Promise<SellerRestrictions>;
};

type CachedAsset = {
  assetType: AssetType;
  assetId: number;
};

export const MarketplacePublishingRequirementsProviderContext =
  createContext<MarketplacePublishingRequirementsProviderContext | null>(null);

const MarketplacePublishingRequirementsProvider = ({
  children,
}: MarketplacePublishingRequirementsProvider): React.JSX.Element => {
  const [cachedAsset, setCachedAsset] = useState<CachedAsset | null>(null);
  const [assetConfigurationRestrictions, setAssetConfigurationRestrictions] =
    useState<AssetConfigurationRestrictions | null>(null);
  const [onboardingRestrictions, setOnboardingRestrictions] =
    useState<OnboardingRestrictions | null>(null);
  const [sellerRestrictions, setSellerRestrictions] = useState<SellerRestrictions | null>(null);

  const fetchAssetConfigurationRestrictions = useCallback(
    async (assetType: AssetType, assetId: number): Promise<AssetConfigurationRestrictions> => {
      // If a call has already been made for this user + assetType, use cached result
      if (cachedAsset && assetType === cachedAsset.assetType && assetId === cachedAsset.assetId) {
        if (assetConfigurationRestrictions === null) {
          throw new Error('assetConfigurationRestrictions object cannot be null.');
        }
        return assetConfigurationRestrictions;
      }

      const result = await marketplacePublishingRequirements.getRequirements(
        MarketplaceType.Creator,
        assetType,
        undefined,
        [RequirementCheck.Publishing, RequirementCheck.Pricing],
        assetId,
      );

      if (!result.publishing || !result.pricing) {
        throw new Error('publishing or pricing objects not found');
      }
      const newAssetConfigurationRestrictions: AssetConfigurationRestrictions = {
        isVerified: result.verification?.isVerified ?? false,
        canPublish: result.publishing.isAllowed ?? false,
        canPrice: result.pricing.isAllowed ?? false,
        publishingRestrictions: result.publishing.restrictions ?? [Restriction.Invalid],
        pricingRestrictions: result.pricing.restrictions ?? [Restriction.Invalid],
      };

      setAssetConfigurationRestrictions(newAssetConfigurationRestrictions);
      setCachedAsset({ assetType, assetId });
      return newAssetConfigurationRestrictions;
    },
    [cachedAsset, assetConfigurationRestrictions],
  );

  const fetchOnboardingRestrictions = useCallback(async (): Promise<OnboardingRestrictions> => {
    if (onboardingRestrictions !== null) {
      return onboardingRestrictions;
    }

    const result = await marketplacePublishingRequirements.getRequirements(
      MarketplaceType.Creator,
      AssetType.Model, // AssetType is not used when determining onboarding eligibility. To be deprecated as a required param in future client update
      undefined,
      [RequirementCheck.SellerOnboarding],
      undefined,
    );

    if (!result.sellerOnboarding) {
      throw new Error('seller onboarding object not found');
    }
    const newOnboardingRestrictions: OnboardingRestrictions = {
      canOnboard: result.sellerOnboarding.isAllowed ?? false,
      onboardingRestrictions: result.sellerOnboarding.restrictions ?? [Restriction.Invalid],
    };

    setOnboardingRestrictions(newOnboardingRestrictions);
    return newOnboardingRestrictions;
  }, [onboardingRestrictions]);

  const fetchSellerRestrictions = useCallback(async (): Promise<SellerRestrictions> => {
    // If a call has already been made for this user, use cached result
    if (sellerRestrictions !== null) {
      return sellerRestrictions;
    }

    const result = await marketplacePublishingRequirements.getRequirements(
      MarketplaceType.Creator,
      AssetType.Plugin, // Ensure this is a valid fiat pricing assetType so the restriction isn't applied, as this is a seller level check.
      undefined,
      [RequirementCheck.Publishing, RequirementCheck.Pricing],
      undefined,
    );

    if (!result.publishing || !result.pricing) {
      throw new Error('publishing or pricing objects not found');
    }

    // Publishing and Pricing Restrictions on a seller level are only used to notify the user that their account has a form of restrictions applied.
    // Hence, we want to default to no publishing or pricing restrictions in the rare case the result is incomplete (should not happen); this is to avoid a false alarm of some side effect, such as their payouts being frozen.
    const newSellerRestrictions: SellerRestrictions = {
      canPublish: result.publishing.isAllowed ?? true,
      publishingRestrictions: result.publishing.restrictions ?? [],
      canPrice: result.pricing.isAllowed ?? true,
      pricingRestrictions: result.pricing.restrictions ?? [],
    };

    setSellerRestrictions(newSellerRestrictions);
    return newSellerRestrictions;
  }, [sellerRestrictions]);

  const value = useMemo(() => {
    return {
      fetchAssetConfigurationRestrictions,
      fetchOnboardingRestrictions,
      fetchSellerRestrictions,
    };
  }, [fetchAssetConfigurationRestrictions, fetchOnboardingRestrictions, fetchSellerRestrictions]);

  return (
    <MarketplacePublishingRequirementsProviderContext.Provider value={value}>
      {children}
    </MarketplacePublishingRequirementsProviderContext.Provider>
  );
};

export default MarketplacePublishingRequirementsProvider;

export function useMarketplacePublishingRequirementsProvider(): MarketplacePublishingRequirementsProviderContext {
  const context = useContext(MarketplacePublishingRequirementsProviderContext);
  if (context === null) {
    throw new Error(
      'useMarketplacePublishingRequirementsProvider must be used within a MarketplacePublishingRequirementsProvider',
    );
  }
  return context;
}

export function useFetchAssetConfigurationRestrictions(assetType: AssetType, assetId: number) {
  const context = useContext(MarketplacePublishingRequirementsProviderContext);
  if (context === null) {
    throw new Error(
      'useFetchAssetConfigurationRestrictions must be used within an MarketplacePublishingRequirementsProviderContext',
    );
  }
  const { fetchAssetConfigurationRestrictions } = context;

  const action = useCallback(async () => {
    return fetchAssetConfigurationRestrictions(assetType, assetId);
  }, [assetId, assetType, fetchAssetConfigurationRestrictions]);

  return useAsyncAction(action);
}

export function useFetchOnboardingRestrictions() {
  const context = useContext(MarketplacePublishingRequirementsProviderContext);
  if (context === null) {
    throw new Error(
      'useFetchOnboardingRestrictions must be used within an MarketplacePublishingRequirementsProviderContext',
    );
  }
  const { fetchOnboardingRestrictions } = context;

  const action = useCallback(async () => {
    return fetchOnboardingRestrictions();
  }, [fetchOnboardingRestrictions]);

  return useAsyncAction(action);
}

export function useFetchSellerRestrictions() {
  const context = useContext(MarketplacePublishingRequirementsProviderContext);
  if (context === null) {
    throw new Error(
      'useFetchSellerRestrictions must be used within an MarketplacePublishingRequirementsProviderContext',
    );
  }
  const { fetchSellerRestrictions } = context;

  const action = useCallback(async () => {
    return fetchSellerRestrictions();
  }, [fetchSellerRestrictions]);

  return useAsyncAction(action);
}

export const assetToMprsAsset = (asset: Asset | undefined): AssetType => {
  if (!asset) {
    return AssetType.Invalid;
  }

  switch (asset) {
    case Asset.Plugin:
      return AssetType.Plugin;
    case Asset.Model:
      return AssetType.Model;
    case Asset.Animation:
      return AssetType.Animation;
    case Asset.MeshPart:
      return AssetType.MeshPart;
    case Asset.Decal:
      return AssetType.Decal;
    case Asset.Audio:
      return AssetType.Audio;
    case Asset.Video:
      return AssetType.Video;
    default:
      return AssetType.Invalid;
  }
};
