import type { FunctionComponent } from 'react';
import React, { useCallback, useEffect, useState } from 'react';
import { SearchAudioTypeModel } from '@rbx/client-toolbox-service/v1';
import { CircularProgress } from '@rbx/ui';
import {
  getAudioDiscoverability,
  type AudioDiscoverabilityItem,
} from '@modules/clients/musicDiscovery';
import { useFetchItemDetails } from '@modules/clients/ToolboxServiceQueries';
import usersClient from '@modules/clients/users';
import {
  assetToProduct,
  useMarketplaceFiatServiceProvider,
} from '@modules/marketplaceFiatService/MarketplaceFiatServiceProvider';
import {
  assetToMprsAsset,
  useMarketplacePublishingRequirementsProvider,
} from '@modules/marketplacePublishingRequirements/MarketplacePublishingRequirementsProvider';
import type { AssetConfigurationRestrictions } from '@modules/marketplacePublishingRequirements/MarketplacePublishingRequirementsProvider';
import { Asset } from '@modules/miscellaneous/common';
import { EmptyGrid } from '@modules/miscellaneous/components';
import { useSettings } from '@modules/settings/SettingsProvider/SettingsProvider';
import type { SongArtist } from '../../../common/components/SongArtistsSection/useGetFriendsAsSongArtists';
import { useCurrentDeveloperItem } from '../../common/DeveloperItemProvider';
import type { TConfigureDeveloperItemProps } from '../../common/types';
import ConfigureMediaFiatForm from '../ConfigureMediaFiatForm/ConfigureMediaFiatForm';

// AudioType is declared as numeric in the TS types but the API returns strings at runtime.
function isSoundEffectAudioType(audioType: unknown): boolean {
  return audioType === SearchAudioTypeModel.SoundEffect;
}

type ArtistAttribution = {
  userId: number;
  displayName?: string;
};

function getArtistAttributions(
  discoverability: AudioDiscoverabilityItem | null,
): ArtistAttribution[] {
  return [discoverability?.primaryArtist, ...(discoverability?.supplementaryArtists ?? [])].flatMap(
    (artist) =>
      artist?.userId === undefined
        ? []
        : [{ userId: artist.userId, displayName: artist.displayName }],
  );
}

async function hydrateSongArtists(artists: ArtistAttribution[]): Promise<SongArtist[]> {
  if (artists.length === 0) {
    return [];
  }
  const { data: users } = await usersClient.getUsersByIds(artists.map((artist) => artist.userId));
  const hydratedArtists = artists.flatMap((artist) => {
    const user = users?.find((candidate) => candidate.id === artist.userId);
    return user?.name
      ? [{ ...artist, username: user.name, displayName: user.displayName ?? artist.displayName }]
      : [];
  });
  if (hydratedArtists.length !== artists.length) {
    throw new Error('Failed to resolve artist usernames');
  }
  return hydratedArtists;
}

const ConfigureMediaFiatContainer: FunctionComponent<
  React.PropsWithChildren<TConfigureDeveloperItemProps>
> = ({
  developerItemDetails,
  enableAssetAccessForm,
  isCreatorEligibleForAssetAccessBeta,
  onDataFetchFailed,
}) => {
  const { type: assetType } = developerItemDetails;
  const { refreshDeveloperItemDetails } = useCurrentDeveloperItem();
  const { settings } = useSettings();
  const isAudioRevampEnabled = assetType === Asset.Audio && settings.enableAudioUploadRevamp;
  const [isPageInitializing, setIsPageInitializing] = useState<boolean>(true);
  const [isOnMarketplace, setIsOnMarketplace] = useState<boolean>(false);
  const [isAttested, setIsAttested] = useState<boolean>(false);
  const [isChartsEligible, setIsChartsEligible] = useState<boolean>(false);
  const [isPublicSurfacingEnabled, setIsPublicSurfacingEnabled] = useState<boolean>(true);
  const [isDiscoverabilityAvailable, setIsDiscoverabilityAvailable] = useState<boolean>(false);
  const [initialSongArtists, setInitialSongArtists] = useState<SongArtist[]>([]);
  const [assetConfigurationRestrictions, setAssetConfigurationRestrictions] =
    useState<AssetConfigurationRestrictions>();
  const { data: itemDetails, isLoading: isItemDetailsLoading } = useFetchItemDetails(
    parseInt(developerItemDetails.id, 10),
    isAudioRevampEnabled,
  );
  const isSfx =
    isAudioRevampEnabled && isSoundEffectAudioType(itemDetails?.asset?.audioDetails?.audioType);
  const { fetchAssetConfigurationRestrictions } = useMarketplacePublishingRequirementsProvider();
  const { fetchProduct } = useMarketplaceFiatServiceProvider();

  const loadVerificationAndFiatStatus = useCallback(
    async (assetId: string) => {
      try {
        return await fetchAssetConfigurationRestrictions(
          assetToMprsAsset(assetType),
          parseInt(assetId, 10),
        );
      } catch {
        const errorMsg = `Failed to fetch asset configuration restrictions for asset ${assetId}`;
        console.error(errorMsg);
        throw new Error(errorMsg);
      }
    },
    [assetType, fetchAssetConfigurationRestrictions],
  );

  const loadFiatProduct = useCallback(
    async (assetId: string) => {
      try {
        return await fetchProduct(assetId, assetToProduct(assetType));
      } catch {
        const errorMsg = `Failed to fetch fiat product for asset ${assetId}`;
        console.error(errorMsg);
        throw new Error(errorMsg);
      }
    },
    [assetType, fetchProduct],
  );

  const fetchData = useCallback(async () => {
    try {
      if (developerItemDetails) {
        const [assetConfigurationRestrictionsResponse, fiatProduct] = await Promise.all([
          loadVerificationAndFiatStatus(developerItemDetails.id),
          loadFiatProduct(developerItemDetails.id),
        ]);
        if (!assetConfigurationRestrictionsResponse) {
          throw new Error(
            `Something went wrong fetching asset configuration restrictions for ${developerItemDetails.id}`,
          );
        }
        if (
          !fiatProduct ||
          fiatProduct.purchasable === undefined ||
          fiatProduct.purchasable === null
        ) {
          throw new Error(
            `Something went wrong fetching fiat product for ${developerItemDetails.id}`,
          );
        }
        setAssetConfigurationRestrictions(assetConfigurationRestrictionsResponse);
        setIsOnMarketplace(fiatProduct.purchasable);

        if (isAudioRevampEnabled) {
          try {
            const discoverability = await getAudioDiscoverability(
              parseInt(developerItemDetails.id, 10),
            );
            setIsAttested(discoverability?.isAttested ?? false);
            setIsChartsEligible(discoverability?.isChartsEligible ?? false);
            setIsPublicSurfacingEnabled(!(discoverability?.disablePublicSurfacing ?? false));
            const artistAttributions = getArtistAttributions(discoverability);
            setInitialSongArtists(await hydrateSongArtists(artistAttributions));
            setIsDiscoverabilityAvailable(true);
          } catch {
            // Non-blocking — discoverability section hidden on fetch failure
          }
        }
      }
    } catch {
      if (onDataFetchFailed) {
        onDataFetchFailed();
      }
    } finally {
      setIsPageInitializing(false);
    }
  }, [
    developerItemDetails,
    isAudioRevampEnabled,
    loadFiatProduct,
    loadVerificationAndFiatStatus,
    onDataFetchFailed,
  ]);

  const refreshData = async () => {
    void refreshDeveloperItemDetails();
    await fetchData();
  };

  useEffect(() => {
    // oxlint-disable-next-line react/react-compiler -- fetchData sets state only after awaited async operations
    void fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- TODO: Add relevant description
  }, []);

  if (isPageInitializing || (isAudioRevampEnabled && isItemDetailsLoading)) {
    return (
      <EmptyGrid>
        <CircularProgress />
      </EmptyGrid>
    );
  }

  if (developerItemDetails && assetConfigurationRestrictions) {
    return (
      <ConfigureMediaFiatForm
        assetConfigurationRestrictions={assetConfigurationRestrictions}
        assetType={assetType}
        creatorName={itemDetails?.creator?.name ?? undefined}
        developerItemDetails={developerItemDetails}
        enableAssetAccessForm={enableAssetAccessForm}
        isAttested={isAttested}
        isChartsEligible={isChartsEligible}
        isCreatorEligibleForAssetAccessBeta={isCreatorEligibleForAssetAccessBeta}
        initialSongArtists={initialSongArtists}
        isOnMarketplace={isOnMarketplace}
        refreshData={refreshData}
        isSfx={isSfx}
        isPublicSurfacingEnabled={isPublicSurfacingEnabled}
        isDiscoverabilityAvailable={isDiscoverabilityAvailable}
      />
    );
  }

  return (
    <EmptyGrid>
      <CircularProgress />
    </EmptyGrid>
  );
};

export default ConfigureMediaFiatContainer;
