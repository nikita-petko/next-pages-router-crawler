import type { components } from '@rbx/client-analytics-custom-dashboards-api/openapi-typescript/v1Paths';
import customDashboardsFetchClient from '@modules/clients/analytics/customDashboardsApi';

export type ApiDashboardMetadata =
  components['schemas']['Roblox.DeveloperAnalytics.CustomDashboards.V1Beta1.DashboardMetadata'];

export type ApiDashboard =
  components['schemas']['Roblox.DeveloperAnalytics.CustomDashboards.V1Beta1.CustomDashboard'];

export type ApiDashboardDocument =
  components['schemas']['Roblox.DeveloperAnalytics.CustomDashboards.V1Beta1.CustomDashboardDocument'];

export type ApiErrorBody = {
  readonly code?: string | number;
  readonly message?: string;
  readonly error?: {
    readonly code?: string | number;
    readonly message?: string;
    readonly status?: string;
  };
  readonly details?: ReadonlyArray<unknown>;
};

export class CustomDashboardsApiRequestError extends Error {
  readonly status: number;

  readonly body?: ApiErrorBody;

  constructor(status: number, message: string, body?: ApiErrorBody) {
    super(message);
    this.name = 'CustomDashboardsApiRequestError';
    this.status = status;
    this.body = body;
  }
}

export type CustomDashboardsApiClient = {
  listDashboards(
    universeId: number,
    options?: { readonly pageSize?: number; readonly pageToken?: string },
  ): Promise<{
    readonly dashboards?: ReadonlyArray<ApiDashboardMetadata> | null;
    readonly nextPageToken?: string | null;
  }>;
  getDashboard(input: {
    readonly universeId: number;
    readonly dashboardId: string;
  }): Promise<ApiDashboard>;
  createDashboard(input: {
    readonly universeId: number;
    readonly name: string;
    readonly description?: string;
    readonly document: ApiDashboardDocument;
  }): Promise<ApiDashboard>;
  updateDashboardMetadata(input: {
    readonly universeId: number;
    readonly dashboardId: string;
    readonly expectedHeadEtag: string;
    readonly patch: {
      readonly name?: string;
      readonly description?: string;
      readonly isPinned?: boolean;
    };
  }): Promise<ApiDashboardMetadata>;
  publishDashboard(input: {
    readonly universeId: number;
    readonly dashboardId: string;
    readonly expectedHeadEtag: string;
    readonly document: ApiDashboardDocument;
  }): Promise<ApiDashboard>;
  duplicateDashboard(input: {
    readonly universeId: number;
    readonly dashboardId: string;
    readonly destinationUniverseId: number;
    readonly name: string;
  }): Promise<ApiDashboard>;
  deleteDashboard(input: {
    readonly universeId: number;
    readonly dashboardId: string;
    readonly expectedHeadEtag: string;
  }): Promise<void>;
};

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asNestedError(error: unknown): ApiErrorBody['error'] {
  if (!isObjectRecord(error)) {
    return undefined;
  }
  const { code, message, status } = error;
  return {
    ...(typeof code === 'string' || typeof code === 'number' ? { code } : {}),
    ...(typeof message === 'string' ? { message } : {}),
    ...(typeof status === 'string' ? { status } : {}),
  };
}

function asErrorBody(error: unknown): ApiErrorBody | undefined {
  if (!isObjectRecord(error)) {
    return undefined;
  }
  const { code, message, error: nestedError, details } = error;
  const parsedNestedError = asNestedError(nestedError);
  return {
    ...(typeof code === 'string' || typeof code === 'number' ? { code } : {}),
    ...(typeof message === 'string' ? { message } : {}),
    ...(parsedNestedError ? { error: parsedNestedError } : {}),
    ...(Array.isArray(details) ? { details } : {}),
  };
}

function throwRequestError(response: Response | undefined, error: unknown): never {
  const status = response?.status ?? 0;
  const body = asErrorBody(error);
  const message = body?.message ?? body?.error?.message ?? `HTTP ${status}`;
  throw new CustomDashboardsApiRequestError(status, message, body);
}

export function createDefaultCustomDashboardsApiClient(
  fetchClient: typeof customDashboardsFetchClient = customDashboardsFetchClient,
): CustomDashboardsApiClient {
  return {
    async listDashboards(universeId, options) {
      const { data, error, response } = await fetchClient.GET(
        '/v1/universes/{universeId}/custom-dashboards',
        {
          params: {
            path: { universeId },
            query: {
              pageSize: options?.pageSize,
              pageToken: options?.pageToken,
            },
          },
        },
      );
      if (error || !data) {
        throwRequestError(response, error);
      }
      return data;
    },

    async getDashboard({ universeId, dashboardId }) {
      const { data, error, response } = await fetchClient.GET(
        '/v1/universes/{universeId}/custom-dashboards/{dashboardId}',
        {
          params: {
            path: { universeId, dashboardId },
          },
        },
      );
      if (error || !data) {
        throwRequestError(response, error);
      }
      return data.dashboard ?? {};
    },

    async createDashboard({ universeId, name, description, document }) {
      const { data, error, response } = await fetchClient.POST(
        '/v1/universes/{universeId}/custom-dashboards',
        {
          params: {
            path: { universeId },
          },
          body: {
            universeId,
            name,
            description,
            document,
          },
        },
      );
      if (error || !data) {
        throwRequestError(response, error);
      }
      return data.dashboard ?? {};
    },

    async updateDashboardMetadata({ universeId, dashboardId, expectedHeadEtag, patch }) {
      // Omit OpenAPI readOnly `has*` presence flags — protobuf JsonParser
      // rejects them as unknown fields on the request wire.
      const metadataPatch: {
        name?: string;
        description?: string;
        isPinned?: boolean;
      } = {};
      if (patch.name !== undefined) {
        metadataPatch.name = patch.name;
      }
      if (patch.description !== undefined) {
        metadataPatch.description = patch.description;
      }
      if (patch.isPinned !== undefined) {
        metadataPatch.isPinned = patch.isPinned;
      }

      const { data, error, response } = await fetchClient.PATCH(
        '/v1/universes/{universeId}/custom-dashboards/{dashboardId}/metadata',
        {
          params: {
            path: { universeId, dashboardId },
          },
          body: {
            universeId,
            dashboardId,
            expectedHeadEtag,
            patch: metadataPatch,
          },
        },
      );
      if (error || !data) {
        throwRequestError(response, error);
      }
      return data.metadata ?? {};
    },

    async publishDashboard({ universeId, dashboardId, expectedHeadEtag, document }) {
      const { data, error, response } = await fetchClient.POST(
        // Slash form: colon AIP paths (`:publish`) are not exposed via the gateway.
        '/v1/universes/{universeId}/custom-dashboards/{dashboardId}/publish',
        {
          params: {
            path: { universeId, dashboardId },
          },
          body: {
            universeId,
            dashboardId,
            expectedHeadEtag,
            document,
          },
        },
      );
      if (error || !data) {
        throwRequestError(response, error);
      }
      return data.dashboard ?? {};
    },

    async duplicateDashboard({ universeId, dashboardId, destinationUniverseId, name }) {
      const { data, error, response } = await fetchClient.POST(
        '/v1/universes/{universeId}/custom-dashboards/{dashboardId}/duplicate',
        {
          params: {
            path: { universeId, dashboardId },
          },
          body: {
            destinationUniverseId,
            name,
          },
        },
      );
      if (error || !data) {
        throwRequestError(response, error);
      }
      return data.dashboard ?? {};
    },

    async deleteDashboard({ universeId, dashboardId, expectedHeadEtag }) {
      const { error, response } = await fetchClient.POST(
        '/v1/universes/{universeId}/custom-dashboards/{dashboardId}/delete',
        {
          params: {
            path: { universeId, dashboardId },
          },
          body: {
            universeId,
            dashboardId,
            expectedHeadEtag,
          },
        },
      );
      if (error) {
        throwRequestError(response, error);
      }
    },
  };
}
