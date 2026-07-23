import {
  type AdAssetType,
  type AdCreativeAssetSource,
  AdCreativesApi,
  type CreateAdCreativeAssetRequest,
  type EnrichedAdCreativeAsset,
  type UpdateAdCreativeAssetRequest,
} from '@rbx/client-ads-management-api/v1';

import { createAdsManagementApiConfiguration } from '@utils/adsManagementApiDevOverride';
import { CaptureException } from '@utils/error';

export type { AdCreativeAssetSource };

type NullableUniverseUpdateRequest = Omit<UpdateAdCreativeAssetRequest, 'universeId'> & {
  universeId?: number | null;
};

interface AdCreativeRequestOptions {
  groupId?: number;
}

export interface RegisterAdCreativeAssetParams {
  assetId: number;
  assetType: AdAssetType;
  /** For video assets, in milliseconds. */
  durationMs?: number;
  /**
   * For image assets: pass the original File to auto-extract pixel dimensions.
   * If omitted, falls back to explicit `width` / `height`.
   */
  file?: File;
  /**
   * AI-generation provenance refs. Required by AMA when
   * `source === AdCreativeAssetSourceAIGen` so it can resolve the stamped
   * S3 object (model / prompt metadata) for the GEN_AI sidecar write.
   * Originate from the generate response (see `GeneratedImageReportContext`).
   */
  generationId?: string;
  height?: number;
  imageIndex?: number;
  source: AdCreativeAssetSource;
  universeId?: number;
  width?: number;
}

const configuration = createAdsManagementApiConfiguration();

const adCreativesClient = new AdCreativesApi(configuration);

/**
 * Reads the pixel dimensions of an image File in the browser without uploading it.
 * Returns null if the file cannot be decoded (e.g. in a non-browser environment).
 */
const getImageDimensionsFromFile = (
  file: File,
): Promise<{ height: number; width: number } | null> =>
  new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(null);
      return;
    }

    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({ height: img.naturalHeight, width: img.naturalWidth });
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(null);
    };

    img.src = objectUrl;
  });

/**
 * Reads the pixel dimensions of an already-hosted image by loading it from its
 * URL and reading the decoded `naturalWidth`/`naturalHeight`. Used to register
 * assets we don't have a local `File` for (e.g. experience-preview thumbnails
 * imported from the creative drawer) without fabricating dimensions — the
 * required width/height come straight from the bitmap the browser decodes.
 * Only the intrinsic size is read, so no crossOrigin/canvas access is needed.
 * Returns null if the image can't be decoded (non-browser env or load error).
 */
export const getImageDimensionsFromUrl = (
  url: string,
): Promise<{ height: number; width: number } | null> =>
  new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(null);
      return;
    }

    const img = new Image();

    img.onload = () => {
      resolve({ height: img.naturalHeight, width: img.naturalWidth });
    };

    img.onerror = () => {
      resolve(null);
    };

    img.src = url;
  });

const batchCreateAdCreativeAssets = async (
  assets: CreateAdCreativeAssetRequest[],
  options: AdCreativeRequestOptions = {},
): Promise<void> => {
  await adCreativesClient.batchCreateAdCreatives({
    ...(options.groupId !== undefined && { groupId: options.groupId }),
    request: {
      adCreatives: assets.map(
        (a): CreateAdCreativeAssetRequest => ({
          assetId: a.assetId,
          assetType: a.assetType,
          source: a.source,
          // Defensive: drop universeId when it's `0` (the "no experience"
          // sentinel that some campaign forms carry before the user picks
          // one). AMS treats 0 as a real id and rejects with
          // `UNIVERSE_NOT_FOUND: universe 0 not found`, so omitting the
          // field entirely is the correct "untagged" wire shape.
          ...(a.universeId != null && a.universeId > 0 && { universeId: a.universeId }),
          ...(a.width !== undefined && { width: a.width }),
          ...(a.height !== undefined && { height: a.height }),
          ...(a.durationMs !== undefined && { durationMs: a.durationMs }),
          // GEN_AI provenance refs. `imageIndex` is 0-based, so guard on
          // `!= null` rather than truthiness to preserve index 0.
          ...(a.generationId != null && { generationId: a.generationId }),
          ...(a.imageIndex != null && { imageIndex: a.imageIndex }),
        }),
      ),
    },
  });
};

/**
 * Batch-registers multiple uploaded assets with the creative library
 * (POST /v1/adCreatives). Pixel dimensions are extracted in parallel for
 * all image assets before the single batch call is made.
 *
 * Failures are captured to Sentry and re-thrown so callers can revert UI state.
 *
 * Reusable across the campaign creative drawer and the creative library upload flow.
 */
export const batchRegisterAdCreativeAssets = async (
  assets: RegisterAdCreativeAssetParams[],
  options: AdCreativeRequestOptions = {},
): Promise<void> => {
  try {
    const resolvedAssets = await Promise.all(
      assets.map(async (asset) => {
        let resolvedWidth = asset.width;
        let resolvedHeight = asset.height;

        if (asset.assetType === 'AD_ASSET_TYPE_IMAGE' && asset.file != null) {
          const dims = await getImageDimensionsFromFile(asset.file);
          if (dims != null) {
            resolvedWidth = dims.width;
            resolvedHeight = dims.height;
          }
        }

        return {
          assetId: asset.assetId,
          assetType: asset.assetType,
          durationMs: asset.durationMs,
          generationId: asset.generationId,
          height: resolvedHeight,
          imageIndex: asset.imageIndex,
          source: asset.source,
          universeId: asset.universeId,
          width: resolvedWidth,
        };
      }),
    );

    await batchCreateAdCreativeAssets(resolvedAssets, options);
  } catch (err) {
    CaptureException(err, {
      context: `batchRegisterAdCreativeAssets: failed to register ${assets.length} asset(s)`,
    });
    throw err;
  }
};

interface GetAdCreativesResult {
  assets: EnrichedAdCreativeAsset[];
  nextCursor: string;
}

// Creative Library design doc (referenced throughout for sizing /
// strategy justification — data scale, fetch-all rationale, etc.):
// https://docs.google.com/document/d/1pjGsZwLbZThFa-oxWdNtOWhMonvawW63PMhXg_Dx59A/edit?tab=t.klmtkly9uw6q

/**
 * Page size used when draining the creative library. Matches the AMA /
 * AMS v2 ceiling (`maxPageSize = 500` in the AMA handler). Per the
 * design doc, p99 = 98 entries and the production max is 2,544 — so
 * this size lets 99% of accounts complete in a single round trip and
 * bounds the worst case to ~6 trips.
 */
const FULL_FETCH_PAGE_SIZE = 500;

/**
 * Hard ceiling on the number of entries the client will accumulate from
 * cursor-chasing AMA. Chosen well above the production max (2,544) so
 * normal accounts are never affected, but bounded so a runaway loop or
 * a pathological account can't OOM the browser tab. If we ever cross
 * this, the dataset has outgrown the in-memory client-side model and
 * filtering should move to the wire.
 */
const FULL_FETCH_HARD_CAP = 10000;

/**
 * Lists every ad creative for the authenticated ad account
 * (GET /v1/adCreatives). The endpoint is cursor-paginated server-side;
 * this helper chases the cursor until exhausted and returns the full
 * enriched set so the caller can filter / sort / search / paginate
 * client-side.
 *
 * This pattern matches the established convention in this repo
 * (`GenericManagementTable` for campaigns / ads) and is what the design
 * doc's "Fetch all + in-memory filter/sort/search" strategy depends on.
 * See the doc for the data-scale justification (p99 = 98 entries, max
 * 2,544).
 *
 * `nextCursor` is always `''` in the returned result — kept in the shape
 * for backwards compatibility with the previous single-page signature
 * and for future use if we ever want to stream results progressively.
 */
export const getAdCreatives = async (
  isArchived?: boolean,
  options: AdCreativeRequestOptions = {},
): Promise<GetAdCreativesResult> => {
  const all: EnrichedAdCreativeAsset[] = [];
  let cursor = '';

  // Sequential awaits are intentional: each page request depends on the
  // previous response's `nextCursor`, so the calls cannot be parallelised.
  /* eslint-disable no-await-in-loop */
  do {
    const response = await adCreativesClient.getAdCreatives({
      ...(options.groupId !== undefined && { groupId: options.groupId }),
      ...(isArchived !== undefined && { isArchived }),
      pageSize: FULL_FETCH_PAGE_SIZE,
      ...(cursor !== '' && { cursor }),
    });
    if (response.adCreatives != null) {
      all.push(...response.adCreatives);
    }
    if (all.length > FULL_FETCH_HARD_CAP) {
      CaptureException(
        new Error(
          `getAdCreatives: accumulated ${all.length} entries, exceeding hard cap ${FULL_FETCH_HARD_CAP}`,
        ),
      );
      break;
    }
    cursor = response.nextCursor ?? '';
  } while (cursor !== '');
  /* eslint-enable no-await-in-loop */

  return { assets: all, nextCursor: '' };
};

/**
 * Updates a single ad creative entry (PATCH /v1/adCreatives/{id}).
 *
 * `universeId: null` clears the game association when paired with the
 * `universe_id` update mask.
 *
 * Failures are captured to Sentry and re-thrown so callers can
 * surface user-facing errors.
 */
export const updateAdCreative = async (
  adCreativeId: string,
  updates: { universeId: number | null },
  options: AdCreativeRequestOptions = {},
): Promise<void> => {
  const request: NullableUniverseUpdateRequest = {
    universeId: updates.universeId,
    updateMask: ['universe_id'],
  };

  try {
    await adCreativesClient.updateAdCreativeAsset({
      ...(options.groupId !== undefined && { groupId: options.groupId }),
      id: adCreativeId,
      request: request as UpdateAdCreativeAssetRequest,
    });
  } catch (err) {
    CaptureException(err, {
      context: `updateAdCreative: failed to update ad creative ${adCreativeId}`,
    });
    throw err;
  }
};

/**
 * Soft-deletes (archives) a single ad creative entry
 * (DELETE /v1/adCreatives/{id}). The AMA handler flips `isArchived` to
 * true rather than hard-deleting, so the row stays available for any
 * downstream historical lookups but is filtered out of the library list.
 *
 * Failures are captured to Sentry and re-thrown so callers can
 * surface user-facing errors.
 */
export const deleteAdCreative = async (
  adCreativeId: string,
  options: AdCreativeRequestOptions = {},
): Promise<void> => {
  try {
    await adCreativesClient.deleteAdCreativeAsset({
      ...(options.groupId !== undefined && { groupId: options.groupId }),
      id: adCreativeId,
    });
  } catch (err) {
    CaptureException(err, {
      context: `deleteAdCreative: failed to delete ad creative ${adCreativeId}`,
    });
    throw err;
  }
};
