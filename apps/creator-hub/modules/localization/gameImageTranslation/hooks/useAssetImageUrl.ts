import { skipToken, useQuery } from '@tanstack/react-query';
import assetdeliveryClient from '@modules/clients/assetdelivery';
import { useCurrentGame } from '@modules/providers/game/GameProvider';

/**
 * Localization image entries are stored as asset ids. `rbxassetid://<id>` is an engine-only
 * reference and does not render in an <img> tag, so the web UI must resolve the id to a real CDN
 * URL via assetdelivery (the same approach as place-thumbnails MediaPreview). Results are cached
 * and deduped per asset id by react-query so shared ids (e.g. a source image shown in the list and
 * the detail card) only fetch once.
 */
const ASSET_IMAGE_STALE_TIME = 5 * 60 * 1000;

async function fetchAssetImageUrl(assetId: number, placeId: number | undefined): Promise<string> {
  const assets = await assetdeliveryClient.getAssets([{ assetId, requestId: String(assetId) }], {
    placeId,
  });
  const asset = assets[0];
  const location = asset?.location;
  if (!location) {
    const reason = asset?.errors?.[0]?.message;
    throw new Error(
      reason != null
        ? `Failed to resolve asset ${assetId}: ${reason}`
        : `No asset location returned for asset ${assetId}`,
    );
  }
  return location;
}

export interface AssetImageUrlResult {
  url: string | null;
  isLoading: boolean;
  isError: boolean;
}

export default function useAssetImageUrl(assetId: number | null): AssetImageUrlResult {
  const { gameDetails } = useCurrentGame();
  const placeId = gameDetails?.rootPlaceId ?? undefined;
  const isValidAssetId = assetId != null && Number.isFinite(assetId);
  const { data, isLoading, isError } = useQuery({
    queryKey: ['gameImageTranslation', 'assetImageUrl', assetId, placeId],
    queryFn: isValidAssetId ? () => fetchAssetImageUrl(assetId, placeId) : skipToken,
    refetchOnWindowFocus: false,
    staleTime: ASSET_IMAGE_STALE_TIME,
  });

  return {
    url: data ?? null,
    isLoading,
    isError,
  };
}
