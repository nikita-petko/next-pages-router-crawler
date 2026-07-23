import { md5 } from 'js-md5';
import type {
  Asset,
  Operation,
  AssetApiAssetsUpdateAssetRequest,
  MultipartUploadStartRequest,
  PreSignedUploadUrl,
} from '@rbx/client-assets-upload-api/v1';
import { AssetApi, UploadStatusApi, MultipartUploadApi } from '@rbx/client-assets-upload-api/v1';
import type { AssetsUploadOperationWithMetadata } from './assetsUploadOperationError';
import { MultipartUploadError, MultipartUploadStage } from './multipartUploadError';
import { getBEDEV2ServiceBasePath } from './utils';
import { createClientConfiguration } from './utils/createClientConfiguration';

export type { CreationContext, Creator, Operation, Asset } from '@rbx/client-assets-upload-api/v1';
export { AssetType } from '@rbx/client-assets-upload-api/v1';
export { getAssetsUploadOperationErrorMessage } from './assetsUploadOperationError';
// TODO STM-8914: remove this export once Operation.metadata is available from the client package.
export type { AssetsUploadOperationWithMetadata } from './assetsUploadOperationError';

// Available field masks can be found in the Assets API OpenCloud docs.
// https://create.roblox.com/docs/en-us/reference/cloud/assets/v1
export enum FieldMask {
  ASSET_TYPE = 'assetType',
  DESCRIPTION = 'description',
  DISPLAY_NAME = 'displayName',
  ICON = 'icon',
  MODERATION_RESULT = 'moderationResult',
  PREVIEWS = 'previews',
  FACEBOOK_SOCIAL_LINK = 'facebookSocialLink',
  TWITTER_SOCIAL_LINK = 'twitterSocialLink',
  YOUTUBE_SOCIAL_LINK = 'youtubeSocialLink',
  TWITCH_SOCIAL_LINK = 'twitchSocialLink',
  DISCORD_SOCIAL_LINK = 'discordSocialLink',
  GITHUB_SOCIAL_LINK = 'githubSocialLink',
  ROBLOX_SOCIAL_LINK = 'robloxSocialLink',
  DEVFORUM_SOCIAL_LINK = 'devForumSocialLink',
  TRY_ASSET_SOCIAL_LINK = 'tryAssetSocialLink',
}

const BASE_PATH = getBEDEV2ServiceBasePath('assets/user-auth');
const CSRF_TOKEN_HEADER = 'x-csrf-token';
const OPEN_USE_ADDITIONAL_PARAMETERS = JSON.stringify({ AssetPrivacy: 'OpenUse' });
const CHUNK_SIZE = 5 * 1024 * 1024; // required by content platform

/**
 * Retry a function with exponential backoff using recursion.
 * Similar to retryAsync from developer-products/utils but inline to avoid deep imports.
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number,
  getDelay: (attempt: number) => number,
  currentAttempt = 0,
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    const lastError = error instanceof Error ? error : new Error(String(error));

    if (currentAttempt < maxRetries) {
      const delay = getDelay(currentAttempt);
      await new Promise<void>((resolve) => {
        setTimeout(resolve, delay);
      });
      return retryWithBackoff(fn, maxRetries, getDelay, currentAttempt + 1);
    }

    throw lastError;
  }
}

const getCSRFToken = async () => {
  try {
    const tokenRefresh = await fetch(`${BASE_PATH}/v1/assets`, {
      method: 'PATCH',
      credentials: 'include',
    });

    return tokenRefresh.headers.get(CSRF_TOKEN_HEADER);
  } catch {
    return null;
  }
};
export class AssetsUploadApiClient {
  public assetsUploadApi: AssetApi;

  public uploadStatusApi: UploadStatusApi;

  public multipartUploadApi: MultipartUploadApi;

  constructor() {
    const defaultConfiguration = createClientConfiguration('assets/user-auth', 'bedev2');

    this.assetsUploadApi = new AssetApi(defaultConfiguration);
    this.uploadStatusApi = new UploadStatusApi(defaultConfiguration);
    this.multipartUploadApi = new MultipartUploadApi(defaultConfiguration);
  }

  async createAssetAndGetOperationId(
    requestInfo: Asset,
    file: Blob,
    setAssetPrivacyToOpenUse = false,
  ): Promise<string> {
    const request = {
      request: requestInfo,
      fileContent: file,
    };

    /*
     * To set an asset to OpenUse on creation, the additionalParameters form
     * value must be set to { "AssetPrivacy": "OpenUse" }. As the
     * additionalParameters form value is not exposed via Grasshopper (and will
     * be removed if passed in the normal request), this must
     * be done by overriding the requestInit body.
     *
     * { "AssetPrivacy": "OpenUse" } is the only supported value currently.
     * Setting the value to anything else, including null, will simply result in
     * the default per-assetType privacy being used.
     */
    const requestInit = setAssetPrivacyToOpenUse
      ? AssetsUploadApiClient.generateRequestInitForCreatingOpenUseAsset(requestInfo, file)
      : {};

    const token = await getCSRFToken();
    if (token) {
      requestInit.headers = { [CSRF_TOKEN_HEADER]: token };
    }

    const res = await this.assetsUploadApi.assetsCreateAsset(request, requestInit);
    return AssetsUploadApiClient.parseOperationId(res.path);
  }

  async createAssetAndGetOperationIdWithMultipart(
    requestInfo: Asset,
    file: File,
    setAssetPrivacyToOpenUse?: boolean,
    onUploadProgress?: (progress: number) => void,
  ): Promise<string> {
    const actualSetAssetPrivacyToOpenUse = setAssetPrivacyToOpenUse ?? false;
    const requestInit = actualSetAssetPrivacyToOpenUse
      ? AssetsUploadApiClient.generateRequestInitForCreatingOpenUseAsset(requestInfo, file)
      : {};
    const token = await getCSRFToken();
    if (token) {
      requestInit.headers = {
        [CSRF_TOKEN_HEADER]: token,
        'Content-Type': 'application/json; charset=utf-8',
      };
    }

    // Phase 1: Calculate MD5 and read file (0-5%)
    if (onUploadProgress) {
      onUploadProgress(1);
    }
    let md5Sum: string;
    let fileData: Uint8Array;
    try {
      const result = await AssetsUploadApiClient.calculateMD5(file);
      md5Sum = result.hash;
      fileData = result.data;
    } catch (error) {
      throw new MultipartUploadError(
        `Failed to calculate MD5 for file: ${error instanceof Error ? error.message : String(error)}`,
        MultipartUploadStage.MD5_CALCULATION,
        undefined,
        undefined,
        undefined,
        'MD5_CALCULATION_FAILED',
      );
    }
    if (onUploadProgress) {
      onUploadProgress(5);
    }

    // Phase 2: Create upload plan (5-10%)
    const chunkPlan = AssetsUploadApiClient.makeUploadPlan(file.size);
    if (onUploadProgress) {
      onUploadProgress(10);
    }

    const startRequest: MultipartUploadStartRequest = {
      asset: requestInfo,
      file: {
        filesize: file.size,
        md5CheckSum: md5Sum,
        chunkPlan,
        contentType: file.type,
      },
    };

    let uploadUrls: PreSignedUploadUrl[] = [];

    // Phase 3: Start multipart upload (10-15%)
    let startResponse;
    try {
      startResponse = await this.multipartUploadApi.assetsCreateAssetWithMultipartUpload(
        { multipartUploadStartRequest: startRequest },
        requestInit,
      );
    } catch (error) {
      throw new MultipartUploadError(
        `Failed to start multipart upload: ${error instanceof Error ? error.message : String(error)}`,
        MultipartUploadStage.MULTIPART_START,
        undefined,
        undefined,
        error instanceof Error && 'status' in error
          ? // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- pre-existing multipart error status extraction
            (error as { status: number }).status
          : undefined,
        'MULTIPART_START_FAILED',
      );
    }
    if (onUploadProgress) {
      onUploadProgress(15);
    }

    uploadUrls = startResponse.uploadUrls ?? [];
    if (uploadUrls.length === 0) {
      throw new MultipartUploadError(
        'Upload URLs are empty from multipart start response',
        MultipartUploadStage.MULTIPART_START,
        undefined,
        undefined,
        undefined,
        'EMPTY_UPLOAD_URLS',
      );
    }

    const operationId = AssetsUploadApiClient.parseOperationId(startResponse.operationPath);

    if (operationId === '') {
      throw new MultipartUploadError(
        'Operation ID is empty from multipart start response',
        MultipartUploadStage.MULTIPART_START,
        undefined,
        undefined,
        undefined,
        'EMPTY_OPERATION_ID',
      );
    }

    // Phase 4: Upload chunks (15-80%)
    let etags: string[];
    try {
      etags = await AssetsUploadApiClient.uploadChunks(
        uploadUrls,
        fileData,
        operationId,
        onUploadProgress
          ? (chunkProgress: number) => {
              // Map chunk progress (0-100%) to overall progress (15-80%)
              const overallProgress = 15 + chunkProgress * 0.65; // 65% of total progress
              onUploadProgress(Math.min(overallProgress, 80));
            }
          : undefined,
      );
    } catch (error) {
      try {
        await this.multipartUploadApi.assetsMultipartUploadAbort({ operationId }, requestInit);
      } catch (abortError) {
        throw new MultipartUploadError(
          `Chunk upload failed and abort also failed. Original error: ${error instanceof Error ? error.message : String(error)}. Abort error: ${abortError instanceof Error ? abortError.message : String(abortError)}`,
          MultipartUploadStage.CHUNK_UPLOAD_ABORT,
          operationId,
          undefined,
          undefined,
          'ABORT_FAILED',
        );
      }
      // Re-throw the original error if it's already a MultipartUploadError, otherwise wrap it
      if (error instanceof MultipartUploadError) {
        throw error;
      }
      throw new MultipartUploadError(
        `Chunk upload failed: ${error instanceof Error ? error.message : String(error)}`,
        MultipartUploadStage.CHUNK_UPLOAD,
        operationId,
        undefined,
        undefined,
        'CHUNK_UPLOAD_FAILED',
      );
    }

    // Phase 5: Complete chunks (80-90%)
    if (onUploadProgress) {
      onUploadProgress(80);
    }

    try {
      await Promise.all(
        etags.map((eTag, index) => {
          const chunkNum = index + 1;
          return retryWithBackoff(
            async () => {
              try {
                await this.multipartUploadApi.assetsMultipartUploadChunkComplete(
                  {
                    operationId,
                    multipartUploadChunkCompleteRequest: {
                      chunkNum,
                      eTag,
                    },
                  },
                  requestInit,
                );
              } catch (error) {
                throw new MultipartUploadError(
                  `Failed to complete chunk ${chunkNum}: ${error instanceof Error ? error.message : String(error)}`,
                  MultipartUploadStage.CHUNK_COMPLETE,
                  operationId,
                  chunkNum,
                  error instanceof Error && 'status' in error
                    ? // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- pre-existing multipart error status extraction
                      (error as { status: number }).status
                    : undefined,
                  'CHUNK_COMPLETE_FAILED',
                );
              }
            },
            3, // maxRetries
            (attempt) => 1000 * 2 ** attempt, // Exponential backoff: 1s, 2s, 4s
          );
        }),
      );
    } catch (error) {
      try {
        await this.multipartUploadApi.assetsMultipartUploadAbort({ operationId }, requestInit);
      } catch (abortError) {
        throw new MultipartUploadError(
          `Chunk complete failed and abort also failed. Original error: ${error instanceof Error ? error.message : String(error)}. Abort error: ${abortError instanceof Error ? abortError.message : String(abortError)}`,
          MultipartUploadStage.CHUNK_COMPLETE_ABORT,
          operationId,
          undefined,
          undefined,
          'ABORT_FAILED',
        );
      }
      // Re-throw the original error if it's already a MultipartUploadError, otherwise wrap it
      if (error instanceof MultipartUploadError) {
        throw error;
      }
      throw new MultipartUploadError(
        `Chunk complete failed: ${error instanceof Error ? error.message : String(error)}`,
        MultipartUploadStage.CHUNK_COMPLETE,
        operationId,
        undefined,
        undefined,
        'CHUNK_COMPLETE_FAILED',
      );
    }

    if (onUploadProgress) {
      onUploadProgress(90);
    }

    // Phase 6: Complete multipart upload (90-100%)
    try {
      await this.multipartUploadApi.assetsMultipartUploadComplete(
        {
          operationId,
        },
        requestInit,
      );
    } catch (error) {
      throw new MultipartUploadError(
        `Failed to complete multipart upload: ${error instanceof Error ? error.message : String(error)}`,
        MultipartUploadStage.MULTIPART_COMPLETE,
        operationId,
        undefined,
        error instanceof Error && 'status' in error
          ? // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- pre-existing multipart error status extraction
            (error as { status: number }).status
          : undefined,
        'MULTIPART_COMPLETE_FAILED',
      );
    }
    if (onUploadProgress) {
      onUploadProgress(100);
    }

    return operationId;
  }

  async updateAssetAndGetOperationId(
    assetId: number,
    updateMask: Array<FieldMask>,
    requestInfo?: Asset,
    file?: Blob,
  ): Promise<string> {
    const request: AssetApiAssetsUpdateAssetRequest = {
      assetId,
      updateMask,
      request: requestInfo,
      fileContent: file,
    };
    const res = await this.assetsUploadApi.assetsUpdateAsset(request);
    return AssetsUploadApiClient.parseOperationId(res.path);
  }

  async getAsset(assetId: number, readMask: Array<FieldMask>): Promise<Asset> {
    const request = {
      assetId,
      readMask,
    };
    const res = await this.assetsUploadApi.assetsGetAsset(request);
    return res;
  }

  async getOperationStatus(operationId: string): Promise<Operation | undefined> {
    const request = {
      operationId,
    };
    const res = await this.uploadStatusApi.assetsGetOperation(request);
    return res;
  }

  /**
   * TODO STM-8914: Bypasses the typed client to read Operation.metadata, which the assets-api
   * swagger omits today. Switch callers to getOperationStatus once @rbx/client-assets-upload-api
   * includes metadata on Operation.
   */
  async getOperationStatusRaw(operationId: string): Promise<AssetsUploadOperationWithMetadata> {
    const request = {
      operationId,
    };
    const rawResponse = await this.uploadStatusApi.assetsGetOperationRaw(request);
    const json: unknown = await rawResponse.raw.json();
    if (json !== null && typeof json === 'object') {
      return json as AssetsUploadOperationWithMetadata;
    }
    return {};
  }

  /**
   * Get operation status with metadata for progress tracking.
   * TODO STM-8914: metadata is read from raw JSON because it is not on the generated Operation type.
   * Consolidate with getOperationStatus once the client includes metadata.
   */
  async getOperationStatusWithMetadata(
    operationId: string,
  ): Promise<{ operation: Operation; metadata?: { progress?: number } }> {
    const rawOperation = await this.getOperationStatusRaw(operationId);

    return {
      operation: rawOperation,
      metadata: rawOperation.metadata,
    };
  }

  private static parseOperationId(operationPath: string | undefined | null): string {
    if (!operationPath) {
      throw new Error('Operation path is missing or empty');
    }
    const splitPath = operationPath.split('/');
    const operationId = splitPath[splitPath.length - 1];
    return operationId;
  }

  private static generateRequestInitForCreatingOpenUseAsset(
    request: Asset,
    file: Blob,
  ): RequestInit {
    const body = new FormData();
    body.append('request', JSON.stringify(request));
    body.append('fileContent', file);
    body.append('additionalParameters', OPEN_USE_ADDITIONAL_PARAMETERS);
    return { body };
  }

  private static async calculateMD5(file: File): Promise<{ hash: string; data: Uint8Array }> {
    const data = await new Promise<Uint8Array>((resolve, reject) => {
      const reader = new FileReader();
      // oxlint-disable-next-line unicorn/prefer-add-event-listener -- one-shot FileReader in Promise wrapper
      reader.onload = (event) => {
        const result = event?.target?.result;
        if (result instanceof ArrayBuffer) {
          resolve(new Uint8Array(result));
        } else {
          reject(new Error('Failed to read file'));
        }
      };
      // oxlint-disable-next-line unicorn/prefer-add-event-listener -- one-shot FileReader in Promise wrapper
      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(file);
    });

    return { hash: md5(data), data };
  }

  private static makeUploadPlan(fileSize: number): number[] {
    const chunks: number[] = [];
    let start = 0;
    while (start < fileSize) {
      const size = Math.min(CHUNK_SIZE, fileSize - start);
      chunks.push(size);
      start += CHUNK_SIZE;
    }
    return chunks;
  }

  private static async uploadChunks(
    uploadUrls: PreSignedUploadUrl[],
    fileData: Uint8Array,
    operationId: string,
    onUploadProgress?: (progress: number) => void,
  ): Promise<string[]> {
    const totalChunks = uploadUrls.length;
    let completedChunks = 0;

    // Create a progress callback that tracks completed chunks
    const trackProgress = onUploadProgress
      ? () => {
          completedChunks += 1;
          const progress = (completedChunks / totalChunks) * 100;
          onUploadProgress(Math.min(progress, 99)); // Cap at 99% until all chunks complete
        }
      : undefined;

    // Upload chunks in parallel using the same file data
    const uploadPromises = uploadUrls.map((url, index) => {
      // API may return contentStart/contentLength as strings at runtime despite typed as number;
      // Number() + || avoids slice failures during multipart upload (e.g. video).
      /* oxlint-disable typescript/no-unnecessary-type-conversion, typescript/prefer-nullish-coalescing */
      const start = Number(url.contentStart || 0);
      const length = Number(url.contentLength || 0);
      /* oxlint-enable typescript/no-unnecessary-type-conversion, typescript/prefer-nullish-coalescing */

      return retryWithBackoff(
        async () => {
          if (!url?.url) {
            throw new MultipartUploadError(
              `No URL found for chunk ${index + 1}`,
              MultipartUploadStage.CHUNK_UPLOAD,
              operationId,
              index + 1,
              undefined,
              'MISSING_UPLOAD_URL',
            );
          }

          // Slice the already-read data instead of reading file again
          const chunk = fileData.slice(start, start + length);

          // Verify chunk size matches expected length
          if (chunk.length !== length) {
            throw new MultipartUploadError(
              `Chunk size mismatch for chunk ${index + 1}: expected ${length}, got ${chunk.length}`,
              MultipartUploadStage.CHUNK_UPLOAD,
              operationId,
              index + 1,
              undefined,
              'CHUNK_SIZE_MISMATCH',
            );
          }

          const response = await fetch(url.url, {
            method: 'PUT',
            body: chunk,
          });

          if (!response.ok) {
            throw new MultipartUploadError(
              `Failed to upload chunk ${index + 1}: ${response.status} ${response.statusText}`,
              MultipartUploadStage.CHUNK_UPLOAD,
              operationId,
              index + 1,
              response.status,
              'CHUNK_UPLOAD_HTTP_ERROR',
            );
          }

          const eTag = response.headers.get('ETag');
          if (!eTag) {
            throw new MultipartUploadError(
              `No ETag received for chunk ${index + 1}`,
              MultipartUploadStage.CHUNK_UPLOAD,
              operationId,
              index + 1,
              response.status,
              'MISSING_ETAG',
            );
          }

          // Update progress when chunk completes
          if (trackProgress) {
            trackProgress();
          }

          return eTag.replaceAll(/['"]/g, ''); // Strip quotes from ETag
        },
        3, // maxRetries
        (attempt) => 1000 * 2 ** attempt, // Exponential backoff: 1s, 2s, 4s
      );
    });

    const etags = await Promise.all(uploadPromises);

    // Report 100% progress for chunk upload phase only
    if (onUploadProgress) {
      onUploadProgress(100);
    }

    return etags;
  }
}

const assetsUploadApiClient = new AssetsUploadApiClient();
export default assetsUploadApiClient;
