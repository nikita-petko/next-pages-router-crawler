import { Icon, Media } from '@rbx/foundation-ui';
import { ThumbnailResponseState } from '@rbx/thumbnails';
import { useEffect, useMemo } from 'react';

import { useThumbnailStore } from '@stores/thumbnailStoreProvider';

interface AssetTileImageProps {
  alt: string;
  assetId: number;
  /** Extra classes applied to the rounded media container (e.g. dim it). */
  containerClassName?: string;
}

// Shared 16:9 tile image for the campaign-builder drawer's Active +
// Select-from-library tabs. Resolution priority mirrors `Creative.tsx`:
//   1. Local blob (`blobByAssetId`) — fresh uploads / AI-gen assets have no
//      S3 thumbnail until the service catches up, so this avoids an empty
//      placeholder on the tiles the user just added.
//   2. Completed S3 thumbnail from the Roblox thumbnails service.
//   3. Placeholder icon while we wait (or on failure).
const AssetTileImage = ({ alt, assetId, containerClassName = '' }: AssetTileImageProps) => {
  const data = useThumbnailStore((state) => state.thumbnailsByAssetId[assetId]?.data);
  const blob = useThumbnailStore((state) => state.blobByAssetId[assetId]);
  const getThumbnailByAssetId = useThumbnailStore((state) => state.getThumbnailByAssetId);

  // Only fetch the S3 thumbnail when we have nothing to show. If a blob is
  // already cached (fresh upload / AI generation) the asset is rendered
  // immediately; the thumbnail service can stay cold until the next mount
  // when the blob is gone but the asset is still in the form.
  useEffect(() => {
    if (!blob && !data) {
      getThumbnailByAssetId(assetId);
    }
  }, [assetId, blob, data, getThumbnailByAssetId]);

  // Stable object URL per blob reference; revoked on unmount / blob swap so
  // we don't leak BlobURLs as the user scrolls through a long grid.
  const blobUrl = useMemo(() => (blob ? URL.createObjectURL(blob) : undefined), [blob]);
  useEffect(
    () => () => {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    },
    [blobUrl],
  );

  if (blobUrl) {
    return (
      <Media
        alt={alt}
        aspectRatio='16:9'
        containerClassName={`radius-medium ${containerClassName}`.trim()}
        src={blobUrl}
      />
    );
  }

  if (data?.imageUrl && data.state === ThumbnailResponseState.Completed) {
    return (
      <Media
        alt={alt}
        aspectRatio='16:9'
        containerClassName={`radius-medium ${containerClassName}`.trim()}
        src={data.imageUrl}
      />
    );
  }

  return (
    <div
      className={`aspect-16-9 radius-medium clip flex items-center justify-center bg-surface-200 ${containerClassName}`.trim()}>
      <Icon name='icon-regular-image' size='Large' />
    </div>
  );
};

export default AssetTileImage;
