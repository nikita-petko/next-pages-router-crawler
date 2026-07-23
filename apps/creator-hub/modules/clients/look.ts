import { BaseAPI, Configuration } from '@rbx/clients';
import unifiedLoggerClient from '@modules/eventStream/unifiedLoggerClient';
import {
  GetLookDetailResponseV2,
  GetLooksByCuratorResponse,
  LookApi,
  LookDeleteAvatarRequest,
  LookGetLooksByCuratorAndTypeRequest,
  LookGetLooksByGroupCuratorAndTypeRequest,
  LookType,
} from '@rbx/clients/lookApi';
import { getBEDEV2ServiceBasePath } from './utils';

export type {
  ModerationStatus as LookModerationStatus,
  DisplayProperties as LookDisplayProperties,
  LookType,
  PagedLookItem,
} from '@rbx/clients/lookApi';

export class LookClient extends BaseAPI {
  private looksV1Api: LookApi;

  constructor(basePath: string = getBEDEV2ServiceBasePath('look-api')) {
    const configuration = new Configuration({
      robloxSiteDomain: process.env.robloxSiteDomain,
      basePath,
      credentials: 'include',
      unifiedLogger: unifiedLoggerClient,
    });

    super(configuration);
    this.looksV1Api = new LookApi(configuration);
  }

  getLookDetail(lookId: string): Promise<GetLookDetailResponseV2> {
    // Workaround for OpenAPI generator bug where path template {LookId} doesn't match parameter name lookId.
    // The generator fails to substitute the path parameter, so we manually construct the path using BaseAPI.
    return this.request({
      path: `/v2/looks/${lookId}`,
      method: 'GET',
      headers: {},
    }).then((response) => response.json() as Promise<GetLookDetailResponseV2>);
  }

  getLooksByCuratorAndType(
    curatorUserId: string,
    lookType: LookType,
    limit?: number,
    cursor?: string,
    isPrevious?: boolean,
  ): Promise<GetLooksByCuratorResponse> {
    const request: LookGetLooksByCuratorAndTypeRequest = {
      curatorUserIdString: curatorUserId,
      lookType,
      limit,
      cursor,
      isPrevious,
    };
    return this.looksV1Api.lookGetLooksByCuratorAndType(request);
  }

  getLooksByGroupAndType(
    curatorGroupId: string,
    lookType: LookType,
    limit?: number,
    cursor?: string,
    isPrevious?: boolean,
  ): Promise<GetLooksByCuratorResponse> {
    const request: LookGetLooksByGroupCuratorAndTypeRequest = {
      curatorGroupIdString: curatorGroupId,
      lookType,
      limit,
      cursor,
      isPrevious,
    };
    return this.looksV1Api.lookGetLooksByGroupCuratorAndType(request);
  }

  deleteLook(lookId: string): Promise<void> {
    const request: LookDeleteAvatarRequest = {
      lookId,
    };
    return this.looksV1Api.lookDeleteAvatar(request);
  }

  updateLook(lookId: string, name?: string, description?: string): Promise<void> {
    return this.looksV1Api.lookUpdateLook({
      lookId,
      lookUpdateLookRequest: { name, description },
    });
  }
}

const lookClient = new LookClient();

export default lookClient;
