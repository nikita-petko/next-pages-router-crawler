import {
  AdAssetType,
  AdCreativeAssetSource,
  AdCreativesApi,
  type GithubRbxComRobloxAdsManagementApiInternalModelsPolicyViolation as AdPolicyReviewLabel,
  type GenAiCreativeQuota,
  type GenerateAdCreativeRequest,
  GithubRbxComRobloxAdsManagementApiInternalModelsReportCreativeType as ReportCreativeType,
} from '@rbx/client-ads-management-api/v1';
import { AssetType } from '@rbx/client-assets-upload-api/v1';

import assetsUploadApiClient from '@clients/assetsUpload';
import { batchRegisterAdCreativeAssets } from '@services/ads/adCreativeAssetService';
import { getHttpStatusFromError, parseResponseErrorToAMAError } from '@type/errorResponse';
import { type GenAiCreativesQuotaType } from '@type/metadata';
import { createAdsManagementApiConfiguration } from '@utils/adsManagementApiDevOverride';
import { CaptureException } from '@utils/error';

/** Discriminator for generate errors so the UI can route them appropriately. */
type GenerateAdCreativeErrorCode =
  | 'InvalidPrompt'
  | 'RateLimited'
  | 'ReferenceAssetPermissionDenied'
  | 'ReferenceAssetRejected'
  | 'Unknown';

/**
 * Structured error thrown by `generateAdCreative` so callers can distinguish
 * reference-asset validation failures (show near the picker) from prompt
 * validation failures (show near the prompt) and generic transient failures.
 */
export class GenerateAdCreativeError extends Error {
  readonly code: GenerateAdCreativeErrorCode;

  readonly httpStatus: number | undefined;

  constructor(
    message: string,
    code: GenerateAdCreativeErrorCode,
    httpStatus: number | undefined,
    cause?: unknown,
  ) {
    super(message);
    this.name = 'GenerateAdCreativeError';
    this.code = code;
    this.httpStatus = httpStatus;
    if (cause !== undefined) {
      this.cause = cause;
    }
  }
}

const IMAGE_UPLOAD_POLL_INTERVAL_MS = 1000;
const IMAGE_UPLOAD_MAX_RETRIES = 30;

const configuration = createAdsManagementApiConfiguration();
const adCreativesClient = new AdCreativesApi(configuration);

interface SavedGeneratedCreative {
  assetId: number;
  file: File;
}

/** Per-image identifiers AMA needs to resolve a report back to the source generation. */
export interface GeneratedImageReportContext {
  generationId: string;
  imageIndex: number;
}

interface GenerateAdCreativeResult {
  generatedImages: string[];
  /** Post-generation quota from AMA when rate limiting is enabled. */
  quota?: GenAiCreativesQuotaType;
  /** Keyed by presigned image URL so the UI can look up report context on report. */
  reportContextByImageUrl: Record<string, GeneratedImageReportContext>;
}

const toGenAiCreativesQuota = (
  quota: GenAiCreativeQuota | undefined,
): GenAiCreativesQuotaType | undefined => {
  const { limit, remaining, resetSeconds, used } = quota ?? {};
  if (limit == null || remaining == null || used == null) {
    return undefined;
  }

  return {
    limit,
    remaining,
    used,
    ...(resetSeconds != null && { resetSeconds }),
  };
};

const HTTP_STATUS_BAD_REQUEST = 400;
const HTTP_STATUS_FORBIDDEN = 403;
const HTTP_STATUS_TOO_MANY_REQUESTS = 429;

// Backend distinguishes a reference-asset validation failure from an
// invalid-prompt failure via a specific error message fragment on the body.
// AMA's user-reference resolution (resolveUserReferenceImages) returns a 400
// BadRequestGeneric for missing/unsupported-type reference assets and a 403
// PermissionDeniedGeneric when the caller lacks USE permission on an asset —
// both message bodies include "reference asset". If AMA later introduces a
// dedicated error code/field, update this check.
const REFERENCE_ASSET_ERROR_MESSAGE_FRAGMENTS = ['reference_asset', 'reference asset'];

const getErrorBodyMessage = async (err: unknown): Promise<string | undefined> => {
  const amaError = await parseResponseErrorToAMAError(err);
  if (amaError?.error.message != null && amaError.error.message !== '') {
    return amaError.error.message;
  }
  if (err == null || typeof err !== 'object') {
    return undefined;
  }
  const { response } = err as { response?: { data?: { message?: string } } };
  const message = response?.data?.message;
  return typeof message === 'string' && message !== '' ? message : undefined;
};

const isReferenceAssetError = async (err: unknown): Promise<boolean> => {
  const message = (await getErrorBodyMessage(err)) ?? '';
  return REFERENCE_ASSET_ERROR_MESSAGE_FRAGMENTS.some((fragment) =>
    message.toLowerCase().includes(fragment),
  );
};

const getHttpStatus = (err: unknown): number | undefined => getHttpStatusFromError(err);

export const generateAdCreative = async (
  request: GenerateAdCreativeRequest,
): Promise<GenerateAdCreativeResult> => {
  try {
    // Build the wire request: spread the base fields and conditionally include
    // referenceAssetIds only when present and non-empty so we never send an
    // empty array to the backend (it would fail schema validation).
    const { referenceAssetIds, ...baseRequest } = request;
    const wireRequest: GenerateAdCreativeRequest = {
      ...baseRequest,
      ...(referenceAssetIds != null && referenceAssetIds.length > 0 && { referenceAssetIds }),
    };

    const response = await adCreativesClient.generateAdCreative({
      request: wireRequest,
    });
    // AMA returns GeneratedImage objects ({ url, generationId, imageIndex }). Pull
    // the presigned URL out of each item so previews render and the save flow
    // fetches a real URL, and keep generationId/imageIndex keyed by URL so a later
    // report can identify exactly which generated image is being flagged.
    const generatedImages: string[] = [];
    const reportContextByImageUrl: Record<string, GeneratedImageReportContext> = {};
    (response.generatedImages ?? []).forEach((image) => {
      const url = image.url ?? '';
      if (url === '') {
        return;
      }
      generatedImages.push(url);
      if (image.generationId != null && image.imageIndex != null) {
        reportContextByImageUrl[url] = {
          generationId: image.generationId,
          imageIndex: image.imageIndex,
        };
      }
    });
    return {
      generatedImages,
      quota: toGenAiCreativesQuota(response.quota),
      reportContextByImageUrl,
    };
  } catch (err) {
    const httpStatus = getHttpStatus(err);
    const message = (await getErrorBodyMessage(err)) ?? 'Failed to generate ad creatives';
    const hasReferenceAssetError = await isReferenceAssetError(err);

    // Map the raw HTTP error to a structured error so the UI can route the
    // failure message to the right section (reference picker vs prompt field).
    // A 403 with a reference-asset body is an ownership/USE-permission failure
    // (authoritatively enforced by AMA via the assets registry); a 400 with a
    // reference-asset body is a missing/unsupported-type failure.
    let code: GenerateAdCreativeErrorCode;
    if (httpStatus === HTTP_STATUS_TOO_MANY_REQUESTS) {
      code = 'RateLimited';
    } else if (httpStatus === HTTP_STATUS_FORBIDDEN && hasReferenceAssetError) {
      code = 'ReferenceAssetPermissionDenied';
    } else if (httpStatus === HTTP_STATUS_BAD_REQUEST && hasReferenceAssetError) {
      code = 'ReferenceAssetRejected';
    } else if (httpStatus === HTTP_STATUS_BAD_REQUEST) {
      code = 'InvalidPrompt';
    } else {
      code = 'Unknown';
    }

    const structured = new GenerateAdCreativeError(message, code, httpStatus, err);
    CaptureException(structured, {
      context: 'generateAdCreative: failed to generate ad creatives',
    });
    throw structured;
  }
};

interface ReportAiGeneratedCreativeParams {
  generationId: string;
  imageIndex: number;
  policyViolations: AdPolicyReviewLabel[];
  reasonText?: string;
  universeId: number;
}

/**
 * Reports a previously-generated AI ad creative as violating one or more policies.
 * The endpoint is informational only (emits a moderation feedback event); it does
 * not mutate the creative. generationId/imageIndex come from the generate response
 * via {@link GenerateAdCreativeResult.reportContextByImageUrl}.
 */
export const reportAiGeneratedCreative = async ({
  generationId,
  imageIndex,
  policyViolations,
  reasonText,
  universeId,
}: ReportAiGeneratedCreativeParams): Promise<void> => {
  try {
    await adCreativesClient.reportAiCreative({
      request: {
        creativeType: ReportCreativeType.ReportCreativeTypeAiGenerated,
        generationId,
        imageIndex,
        policyViolations,
        reasonText,
        universeId,
      },
    });
  } catch (err) {
    CaptureException(err, { context: 'reportAiGeneratedCreative: failed to report ai creative' });
    throw err;
  }
};

const pollForAssetId = async (operationId: string): Promise<number> => {
  for (let attempt = 0; attempt < IMAGE_UPLOAD_MAX_RETRIES; attempt += 1) {
    // eslint-disable-next-line no-await-in-loop
    const assetId = await assetsUploadApiClient.getAssetIdFromOperationStatus(operationId);
    if (assetId != null) {
      return assetId;
    }
    // eslint-disable-next-line no-await-in-loop
    await new Promise((resolve) => {
      setTimeout(resolve, IMAGE_UPLOAD_POLL_INTERVAL_MS);
    });
  }
  throw new Error('Timed out waiting for generated image upload');
};

const fetchImageBlob = async (imageUrl: string): Promise<Blob> => {
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch generated image: ${response.status}`);
  }
  return response.blob();
};

const uploadGeneratedImage = async (
  imageUrl: string,
  userId: number,
  index: number,
): Promise<{ assetId: number; file: File }> => {
  const blob = await fetchImageBlob(imageUrl);
  const mimeType = blob.type || 'image/png';
  const extension = mimeType.includes('jpeg') ? 'jpg' : 'png';
  const file = new File([blob], `ai-creative-${Date.now()}-${index}.${extension}`, {
    type: mimeType,
  });

  const operationId = await assetsUploadApiClient.createAsset(
    {
      assetType: AssetType.Image,
      creationContext: {
        creator: { userId },
      },
      description: '',
      displayName: `AI Creative ${index + 1}`.slice(0, 50),
    },
    file,
  );

  if (operationId === '') {
    throw new Error('Asset upload did not return an operation id');
  }

  const assetId = await pollForAssetId(operationId);
  return { assetId, file };
};

/**
 * Downloads presigned generated images, uploads them to the Assets Registry,
 * and registers each as an in-house Gen AI creative in the library.
 */
export const saveGeneratedCreativesToLibrary = async (params: {
  groupId?: number;
  imageUrls: ReadonlyArray<string>;
  /**
   * Per-image generation refs keyed by presigned image URL (from
   * {@link GenerateAdCreativeResult.reportContextByImageUrl}). AMA requires
   * `generationId` / `imageIndex` to resolve the stamped S3 object for the
   * GEN_AI sidecar write, so they are forwarded into registration.
   */
  reportContextByImageUrl?: Record<string, GeneratedImageReportContext>;
  universeId: number;
  userId: number;
}): Promise<SavedGeneratedCreative[]> => {
  const { groupId, imageUrls, reportContextByImageUrl, universeId, userId } = params;
  if (imageUrls.length === 0) {
    return [];
  }

  try {
    // `Promise.all` preserves input order, so `uploaded[i]` corresponds to
    // `imageUrls[i]` — used below to look up each image's generation refs.
    const uploaded = await Promise.all(
      imageUrls.map((imageUrl, index) => uploadGeneratedImage(imageUrl, userId, index)),
    );

    const assetsToRegister = uploaded.map(({ assetId, file }, index) => {
      const reportContext = reportContextByImageUrl?.[imageUrls[index]];
      return {
        assetId,
        assetType: AdAssetType.AdAssetTypeImage,
        file,
        generationId: reportContext?.generationId,
        imageIndex: reportContext?.imageIndex,
        source: AdCreativeAssetSource.AdCreativeAssetSourceAIGen,
        universeId,
      };
    });

    if (groupId === undefined) {
      await batchRegisterAdCreativeAssets(assetsToRegister);
    } else {
      await batchRegisterAdCreativeAssets(assetsToRegister, { groupId });
    }
    return uploaded;
  } catch (err) {
    CaptureException(err, {
      context: `saveGeneratedCreativesToLibrary: failed to save ${imageUrls.length} image(s)`,
    });
    throw err;
  }
};
