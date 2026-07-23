import {
  AdCreativeAssetSource,
  type ContentModerationStatus,
} from '@rbx/client-ads-management-api/v1';
import { Icon, Media } from '@rbx/foundation-ui';
import { ThumbnailResponseState } from '@rbx/thumbnails';
import { type SyntheticEvent, useEffect, useMemo, useState } from 'react';

import tileGridStyles from '@components/creativeLibrary/CreativeLibrary.module.css';
import { useThumbnailStore } from '@stores/thumbnailStoreProvider';

/** AI-generated creatives stay on their upstream image while moderation is pending. */
const isAiGenPendingReview = (
  source: string | undefined,
  contentModerationStatus: ContentModerationStatus | undefined,
): boolean =>
  source === AdCreativeAssetSource.AdCreativeAssetSourceAIGen &&
  contentModerationStatus === 'pending_review';

/**
 * Renders an asset's thumbnail by `assetId` via the shared thumbnail store
 * (Roblox thumbnails service), with an icon placeholder while the request
 * is pending or if it fails. Each instance triggers an idempotent fetch
 * for its `assetId`; the store dedupes repeats.
 */
interface AssetThumbnailProps {
  alt: string;
  aspectRatio: '4:3' | '16:9';
  assetId: number;
  containerClassName?: string;
  contentModerationStatus?: ContentModerationStatus;
  fallbackClassName: string;
  fallbackIconSize: 'Large' | 'XLarge';
  /**
   * 'cover' (default) — image fills the container and crops off-ratio
   * sources. Used by the grid + table tiles where every cell needs a
   * uniform 16:9 footprint.
   *
   * 'contain' — image is letterboxed inside the container against a
   * neutral background. Used by the detail-sheet hero preview so tall
   * (vertical) sources show in full instead of getting cropped to the
   * 16:9 viewport. Mirrors the Creator Hub asset-page preview.
   */
  fit?: 'cover' | 'contain';
  /**
   * Rejected: hide the upstream thumbnail (don't re-show policy-violating
   * content) and render an alert-triangle in the neutral content color.
   * The Rejected status badge elsewhere on the tile carries the alert tone.
   */
  isRejected?: boolean;
  /**
   * Optional upstream preview URL (e.g. presigned S3 from AI generation). Used
   * while a GEN_AI asset is pending moderation; ignored once approved/rejected
   * handling takes over.
   */
  previewImageUrl?: string | null;
  source?: string;
}

const AssetThumbnail = ({
  alt,
  aspectRatio,
  assetId,
  containerClassName,
  contentModerationStatus,
  fallbackClassName,
  fallbackIconSize,
  fit = 'cover',
  isRejected = false,
  previewImageUrl,
  source,
}: AssetThumbnailProps) => {
  const data = useThumbnailStore((state) => state.thumbnailsByAssetId[assetId]?.data);
  const blob = useThumbnailStore((state) => state.blobByAssetId[assetId]);
  const previewUrlFromStore = useThumbnailStore((state) => state.previewUrlByAssetId[assetId]);
  const isError = useThumbnailStore(
    (state) => state.thumbnailsByAssetId[assetId]?.isError ?? false,
  );
  const getThumbnailByAssetId = useThumbnailStore((state) => state.getThumbnailByAssetId);

  const blobUrl = useMemo(() => (blob ? URL.createObjectURL(blob) : undefined), [blob]);
  useEffect(
    () => () => {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    },
    [blobUrl],
  );

  // The thumbnails service can hand back a `Completed` row whose CDN URL is
  // stale / 404s. Without this the tile renders a broken-image glyph and emits
  // a stray `<img>` error event; tracking the failed URL lets us fall back to
  // the same neutral placeholder used while loading.
  const [failedSrc, setFailedSrc] = useState<string | undefined>(undefined);

  const isAiInReview = isAiGenPendingReview(source, contentModerationStatus);
  const upstreamPreviewUrl = previewImageUrl ?? previewUrlFromStore;

  // Still fetch for non-rejected assets so reopening the same tile after
  // moderation flips approved is instant; skip the fetch entirely for
  // rejected ones since we never show the upstream image. Prefer a locally
  // cached blob (fresh AI save / upload) over the thumbnails service. Re-trigger
  // on a terminal `isError` (even when stale `data` lingers) so a remount after
  // retry exhaustion gets a fresh attempt; the store dedupes resolved/in-flight
  // assets.
  useEffect(() => {
    if (!isRejected && !blob && (!data || isError)) {
      getThumbnailByAssetId(assetId);
    }
  }, [assetId, blob, data, getThumbnailByAssetId, isError, isRejected]);

  // Clear the failed marker whenever the source we'd render changes, so a fresh
  // URL (new asset, or a retry that resolved to a different CDN path) gets a
  // clean attempt instead of staying stuck on the placeholder.
  useEffect(() => {
    setFailedSrc(undefined);
  }, [assetId, blobUrl, data?.imageUrl, upstreamPreviewUrl]);

  const handleImageError = (event: SyntheticEvent<HTMLImageElement>): void => {
    // Stop the React error event from bubbling to ancestor onError handlers; the
    // placeholder fallback below is the user-visible signal. (This does not
    // suppress the browser's own failed-request entry in the DevTools console.)
    event.stopPropagation();
    setFailedSrc(event.currentTarget.src);
  };

  const renderImage = (src: string) => {
    if (fit === 'contain') {
      const aspectClass = aspectRatio === '16:9' ? 'aspect-16-9' : 'aspect-4-3';
      return (
        <div
          className={`${aspectClass} clip flex items-center justify-center bg-surface-200 ${
            containerClassName ?? ''
          }`.trim()}>
          <img
            alt={alt}
            className={tileGridStyles.previewContainImage}
            decoding='async'
            loading='lazy'
            onError={handleImageError}
            src={src}
          />
        </div>
      );
    }
    return (
      <Media
        alt={alt}
        aspectRatio={aspectRatio}
        containerClassName={containerClassName}
        decoding='async'
        loading='lazy'
        onError={handleImageError}
        src={src}
      />
    );
  };

  if (isRejected) {
    return (
      <div className={fallbackClassName}>
        <Icon
          className='content-default'
          name='icon-regular-triangle-exclamation'
          size={fallbackIconSize}
        />
      </div>
    );
  }

  if (blobUrl && blobUrl !== failedSrc) {
    return renderImage(blobUrl);
  }

  // Only render a Completed CDN URL — the thumbnails service can return a generic
  // PlaceHolder image while the row is still Pending/InReview, which is not the
  // actual generated creative the designer wants visible during moderation.
  const canRenderServiceThumbnail =
    data?.imageUrl &&
    data.state === ThumbnailResponseState.Completed &&
    data.imageUrl !== failedSrc;

  if (canRenderServiceThumbnail) {
    return renderImage(data.imageUrl);
  }

  // AI-generated assets in moderation: show the upstream presigned S3 preview
  // when available (session cache or future wire-level preview URL). Rejected
  // assets never reach here; approved ones prefer the Completed CDN URL above.
  if (isAiInReview && upstreamPreviewUrl && upstreamPreviewUrl !== failedSrc) {
    return renderImage(upstreamPreviewUrl);
  }

  // AI-generated assets in moderation without a preview URL: neutral placeholder.
  // Never show the Roblox PlaceHolder image or the broken-image glyph.
  if (isAiInReview) {
    return (
      <div className={fallbackClassName}>
        <Icon name='icon-regular-image' size={fallbackIconSize} />
      </div>
    );
  }

  const hasTerminalFailure =
    isError || (data?.imageUrl !== undefined && data.imageUrl === failedSrc);

  return (
    <div className={fallbackClassName}>
      <Icon
        name={hasTerminalFailure ? 'icon-regular-image-circle-slash' : 'icon-regular-image'}
        size={fallbackIconSize}
      />
    </div>
  );
};

export default AssetThumbnail;
