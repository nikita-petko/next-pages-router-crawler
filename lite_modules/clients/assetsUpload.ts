import { Asset, AssetApi, UploadStatusApi } from '@rbx/client-assets-upload-api/v1';
import { Configuration } from '@rbx/clients-core';

import { csrfTokenInjectionMiddleware } from '@clients/csrfTokenInjectionMiddleware';
import {
  EventName,
  logNativeErrorEvent,
  logNativeImpressionEvent,
  unifiedLogger,
} from '@clients/unifiedLogger';
import { CaptureException } from '@utils/error';
import { GetApiSiteBaseUrl } from '@utils/url';

const OPEN_USE_ADDITIONAL_PARAMETERS = JSON.stringify({ AssetPrivacy: 'OpenUse' });

/** Assets API update mask for renaming; matches Creator Hub `FieldMask.DISPLAY_NAME`. */
const DISPLAY_NAME_UPDATE_MASK = 'displayName';

export const MAX_ASSET_DISPLAY_NAME_LENGTH = 50;

const OPERATION_POLL_INTERVAL_MS = 1000;
const OPERATION_MAX_RETRIES = 30;

/** Trim and cap length for Assets Registry display names (text-moderated on write). */
export const sanitizeAssetDisplayName = (raw: string): string | undefined => {
  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    return undefined;
  }
  return trimmed.slice(0, MAX_ASSET_DISPLAY_NAME_LENGTH);
};

export type { Asset as AssetCreationRequest } from '@rbx/client-assets-upload-api/v1';
export { AssetType } from '@rbx/client-assets-upload-api/v1';

const BASE_PATH = `${GetApiSiteBaseUrl()}/assets/user-auth`;

class AssetsUploadApiClient {
  public assetsUploadApi: AssetApi;

  public uploadStatusApi: UploadStatusApi;

  constructor(baseAssetsUploadApiPath = BASE_PATH) {
    const defaultConfiguration = new Configuration({
      basePath: baseAssetsUploadApiPath,
      credentials: 'include',
      middleware: [csrfTokenInjectionMiddleware],
      unifiedLogger,
    });

    this.assetsUploadApi = new AssetApi(defaultConfiguration);
    this.uploadStatusApi = new UploadStatusApi(defaultConfiguration);
  }

  /**
   * Returns the operation ID corresdponding to the status of the created asset.
   */
  async createAsset(
    requestInfo: Asset,
    file: Blob,
    retryCount: number = 0,
    maxRetries: number = 2,
  ): Promise<string> {
    const request = {
      fileContent: file,
      request: requestInfo,
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
    const requestInit = AssetsUploadApiClient.generateRequestInitForCreatingOpenUseAsset(
      requestInfo,
      file,
    );

    try {
      const res = await this.assetsUploadApi.assetsCreateAsset(request, requestInit);
      if (res.error) {
        const errorMessage = res.error.message ?? 'Unknown error';
        CaptureException(new Error(errorMessage));
        logNativeErrorEvent({
          error: res.error,
          eventName: EventName.AssetUploadAPIError,
          parameters: {
            error: errorMessage,
          },
        });
      } else {
        try {
          logNativeImpressionEvent(EventName.AssetUploadAPISuccess, {
            response: JSON.stringify(res),
          });
        } catch (e) {
          CaptureException(e as Error);
        }
      }
      if (res.path != null) {
        const splitPath = res.path.split('/');
        const operationId = splitPath[splitPath.length - 1];
        return operationId;
      }
      if (retryCount < maxRetries) {
        return this.createAsset(requestInfo, file, retryCount + 1, maxRetries);
      }
      return '';
    } catch (error) {
      if (retryCount < maxRetries) {
        return this.createAsset(requestInfo, file, retryCount + 1, maxRetries);
      }
      logNativeErrorEvent({
        error,
        eventName: EventName.AssetUploadAPIFailure,
        parameters: {
          error: String(error),
        },
      });
      CaptureException(error as Error);
      return '';
    }
  }

  async getAssetIdFromOperationStatus(operationId: string): Promise<number | undefined> {
    const request = {
      operationId,
    };
    try {
      const res = await this.uploadStatusApi.assetsGetOperationRaw(request);
      const op = await res.raw.json();

      const assetId = op.response?.assetId;

      return assetId == null ? undefined : parseInt(assetId, 10);
    } catch (error) {
      // A transient failure on the operation-status endpoint (e.g. a 504 from
      // the gateway while the upload is still processing) must not reject: the
      // callers poll this and treat `undefined` as "not ready yet", so returning
      // undefined lets them retry instead of leaving an unhandled rejection.
      logNativeErrorEvent({
        error,
        eventName: EventName.AssetUploadAPIFailure,
        parameters: {
          error: String(error),
        },
      });
      return undefined;
    }
  }

  /**
   * Renames an uploaded asset via PATCH /v1/assets/{assetId} (displayName only).
   * Creative Library names come from Assets Registry enrichment on GET
   * /v1/adCreatives — invalidate that list after success.
   */
  async updateAssetDisplayName(assetId: number, displayName: string): Promise<void> {
    const sanitized = sanitizeAssetDisplayName(displayName);
    if (sanitized == null) {
      throw new Error('Display name cannot be empty');
    }

    try {
      const operation = await this.assetsUploadApi.assetsUpdateAsset({
        assetId,
        request: { assetId, displayName: sanitized },
        updateMask: [DISPLAY_NAME_UPDATE_MASK],
      });
      const operationId = AssetsUploadApiClient.parseOperationId(operation);
      if (operationId === '') {
        throw new Error('Asset update did not return an operation id');
      }
      await this.pollOperationUntilDone(operationId);
    } catch (err) {
      CaptureException(err, {
        context: `updateAssetDisplayName: failed to rename asset ${assetId}`,
      });
      throw err;
    }
  }

  private async pollOperationUntilDone(operationId: string): Promise<void> {
    for (let attempt = 0; attempt < OPERATION_MAX_RETRIES; attempt += 1) {
      // eslint-disable-next-line no-await-in-loop
      const operation = await this.uploadStatusApi.assetsGetOperation({
        operationId,
      });
      if (operation.error?.message) {
        throw new Error(operation.error.message);
      }
      if (operation.done) {
        return;
      }
      // eslint-disable-next-line no-await-in-loop
      await new Promise((resolve) => {
        setTimeout(resolve, OPERATION_POLL_INTERVAL_MS);
      });
    }
    throw new Error('Timed out waiting for asset update');
  }

  private static parseOperationId(operation: {
    operationId?: string;
    path?: string | null;
  }): string {
    if (operation.path != null) {
      const splitPath = operation.path.split('/');
      return splitPath[splitPath.length - 1] ?? '';
    }
    return operation.operationId ?? '';
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
}

const assetsUploadApiClient = new AssetsUploadApiClient();
export default assetsUploadApiClient;

export const updateAssetDisplayName = (assetId: number, displayName: string): Promise<void> =>
  assetsUploadApiClient.updateAssetDisplayName(assetId, displayName);
