import { Icon } from '@rbx/foundation-ui';
import { ThumbnailResponseState } from '@rbx/thumbnails';
import { Grid } from '@rbx/ui';
import {
  memo,
  type SyntheticEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { TranslationNamespace } from '@constants/localization';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';
import { useThumbnailStore } from '@stores/thumbnailStoreProvider';

interface CreativeAssetImageProps {
  alt?: string;
  assetId: number;
  className?: string;
}

enum IMAGE_STATUS {
  ERROR = 'error',
  LOADING = 'loading',
  SUCCESS = 'success',
}

interface ImageState {
  src?: string;
  status: IMAGE_STATUS;
}

// A thumbnail that came back in one of these states is terminally broken — the
// image will never materialize, so render the broken-image affordance rather
// than spin forever. Transient/non-final states and request failures are
// retried by the thumbnail store, so they're treated as "still loading" here.
const TerminalBrokenImageState: ThumbnailResponseState[] = [
  ThumbnailResponseState.Error,
  ThumbnailResponseState.Blocked,
];

/** Thumbnail display for a creative asset — no preview affordance. */
const CreativeAssetImage = memo(({ alt, assetId, className }: CreativeAssetImageProps) => {
  const { translate } = useNamespacedTranslation(TranslationNamespace.Report);
  const resolvedAlt = alt ?? translate('Description.CreativeAlt');
  const imageBlob = useThumbnailStore((state) => state.blobByAssetId[assetId]);
  const { data, isError } = useThumbnailStore((state) => state.thumbnailsByAssetId[assetId] || {});
  const { getThumbnailByAssetId } = useThumbnailStore();
  const [failedImageSrc, setFailedImageSrc] = useState<string | undefined>(undefined);
  // Tracks the assetId we've already kicked a fetch for in this mount, so a
  // terminal `isError` can't re-trigger the effect on the same mount (which
  // loops: effect → store re-fetches errored asset → fails → isError → effect …).
  const requestedAssetIdRef = useRef<number | undefined>(undefined);
  const blobUrl = useMemo(
    () => (imageBlob ? URL.createObjectURL(imageBlob) : undefined),
    [imageBlob],
  );

  // Kick off the fetch when we have nothing usable to show. The store coalesces
  // these into a single bulk request and owns ALL retries (transient 5xx/429,
  // non-final states, and freshly-created assets the thumbnails system hasn't
  // registered yet), so the component just reflects whatever state it lands in.
  //
  // We deliberately fetch at most once per mount per assetId. The store sets a
  // terminal `isError` once its bounded retry budget is exhausted; re-triggering
  // the fetch from here on `isError` would loop forever (the store re-fetches
  // errored assets, fails again, flips `isError`, and re-fires this effect). A
  // genuine remount (or the assetId prop changing) resets the ref, so those
  // still get a fresh attempt — but a terminal failure on the current mount
  // settles into the broken-image affordance instead of hammering the network.
  useEffect(() => {
    if (imageBlob || requestedAssetIdRef.current === assetId) {
      return;
    }
    if (data && !isError) {
      return;
    }
    requestedAssetIdRef.current = assetId;
    getThumbnailByAssetId(assetId);
  }, [assetId, getThumbnailByAssetId, imageBlob, data, isError]);

  // A `Completed` thumbnail whose CDN URL fails to load in the browser is
  // otherwise indistinguishable from a successful load. Track the failed URL so
  // we render the broken affordance, and clear it whenever the source changes
  // so a new asset (or a different resolved URL) gets a clean attempt.
  useEffect(() => {
    setFailedImageSrc(undefined);
  }, [assetId, data?.imageUrl]);

  useEffect(
    () => () => {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    },
    [blobUrl],
  );

  const handleImageError = useCallback((errorEvent: SyntheticEvent<HTMLImageElement>) => {
    setFailedImageSrc(errorEvent.currentTarget.src);
  }, []);

  const determineImageState = useCallback((): ImageState => {
    if (blobUrl) {
      return blobUrl === failedImageSrc
        ? { status: IMAGE_STATUS.ERROR }
        : { src: blobUrl, status: IMAGE_STATUS.SUCCESS };
    }

    if (data?.state === ThumbnailResponseState.Completed && data.imageUrl) {
      return data.imageUrl === failedImageSrc
        ? { status: IMAGE_STATUS.ERROR }
        : { src: data.imageUrl, status: IMAGE_STATUS.SUCCESS };
    }

    // Terminal: a broken/blocked thumbnail, or a request the store has stopped
    // retrying (`isError`). Everything else — in-flight, between store retries,
    // a non-final row, or a not-yet-fetched asset — is still loading.
    if (isError || (data != null && TerminalBrokenImageState.includes(data.state))) {
      return { status: IMAGE_STATUS.ERROR };
    }

    return { status: IMAGE_STATUS.LOADING };
  }, [blobUrl, data, failedImageSrc, isError]);

  const { src, status } = determineImageState();

  if (status !== IMAGE_STATUS.SUCCESS) {
    return (
      <Grid
        alignItems='center'
        aria-label={status}
        className={className}
        component='div'
        container
        justifyContent='center'
        role='img'>
        {status === IMAGE_STATUS.LOADING ? (
          <Icon name='icon-regular-image' size='Medium' />
        ) : (
          <Icon name='icon-regular-image-circle-slash' size='Medium' />
        )}
      </Grid>
    );
  }

  return <img alt={resolvedAlt} className={className} onError={handleImageError} src={src} />;
});

export default CreativeAssetImage;
