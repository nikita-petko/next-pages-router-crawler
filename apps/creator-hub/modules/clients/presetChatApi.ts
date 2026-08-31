import type {
  GetUniversePresetStateResponse,
  PresetCategoryInput,
  PublishPresetVersionResponse,
  RevertToDefaultsResponse,
  UpsertPresetDraftResponse,
} from '@rbx/client-preset-chat/v1';
import { V2CreatorApi } from '@rbx/client-preset-chat/v1';
import { ResponseError } from '@rbx/clients-core';
import { createClientConfiguration } from './utils/createClientConfiguration';

export type {
  GetUniversePresetStateResponse,
  PublishPresetVersionResponse,
  RevertToDefaultsResponse,
  UpsertPresetDraftResponse,
};

export class PresetChatApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'PresetChatApiError';
    this.status = status;
  }
}

export class PresetChatApiClient {
  private api: V2CreatorApi;

  constructor() {
    const configuration = createClientConfiguration('preset-chat', 'bedev2');
    this.api = new V2CreatorApi(configuration);
  }

  async getUniversePresetState(
    universeId: number,
    options?: { signal?: AbortSignal },
  ): Promise<GetUniversePresetStateResponse> {
    try {
      return await this.api.v2CreatorGetUniversePresetState(
        { universeId },
        options?.signal ? { signal: options.signal } : undefined,
      );
    } catch (error) {
      if (error instanceof ResponseError) {
        throw new PresetChatApiError(
          `Failed to fetch preset chat state: ${error.response.status}`,
          error.response.status,
        );
      }
      throw error;
    }
  }

  async publishPresetVersion(
    universeId: number,
    options?: { signal?: AbortSignal },
  ): Promise<PublishPresetVersionResponse> {
    try {
      return await this.api.v2CreatorPublishPresetVersion(
        { universeId },
        options?.signal ? { signal: options.signal } : undefined,
      );
    } catch (error) {
      if (error instanceof ResponseError) {
        const status = error.response.status;
        throw new PresetChatApiError(
          status === 429
            ? 'Publish limit reached — 3 publishes per 24 hours.'
            : `Publish failed: ${status}`,
          status,
        );
      }
      throw error;
    }
  }

  // TODO: Once BE adds `required` to UpsertPresetDraftResponse fields (status, presetValidationErrors, errorCode), consuming validation errors won't need null checks.
  async upsertPresetDraft(
    universeId: number,
    categories: PresetCategoryInput[],
    options?: { signal?: AbortSignal },
  ): Promise<UpsertPresetDraftResponse> {
    try {
      return await this.api.v2CreatorUpsertPresetDraft(
        {
          universeId,
          v2CreatorUpsertPresetDraftRequest: { universeId, categories },
        },
        options?.signal ? { signal: options.signal } : undefined,
      );
    } catch (error) {
      if (error instanceof ResponseError) {
        throw new PresetChatApiError(
          `Failed to save draft: ${error.response.status}`,
          error.response.status,
        );
      }
      throw error;
    }
  }

  async revertToDefaults(
    universeId: number,
    options?: { signal?: AbortSignal },
  ): Promise<RevertToDefaultsResponse> {
    try {
      return await this.api.v2CreatorRevertToDefaults(
        { universeId },
        options?.signal ? { signal: options.signal } : undefined,
      );
    } catch (error) {
      if (error instanceof ResponseError) {
        throw new PresetChatApiError(
          `Failed to revert to defaults: ${error.response.status}`,
          error.response.status,
        );
      }
      throw error;
    }
  }
}

const presetChatApiClient = new PresetChatApiClient();
export default presetChatApiClient;
