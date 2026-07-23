import type {
  GetLinkedAvatarsByUniverseResponse,
  GetLookDetailResponseV2,
  GetLooksByCuratorResponse,
  LinkAvatarsToUniverseResponse,
  LookDeleteAvatarRequest,
  LookGetLooksByCuratorAndTypeRequest,
  LookGetLooksByGroupCuratorAndTypeRequest,
  LookType,
  UnlinkAvatarsFromUniverseResponse,
} from '@rbx/client-look-api/v1';
import { AvatarUniverseLinkApi, LookApi } from '@rbx/client-look-api/v1';
import { BaseAPI } from '@rbx/clients-core';
import { createClientConfiguration } from './utils/createClientConfiguration';

export type {
  ModerationStatus as LookModerationStatus,
  DisplayProperties as LookDisplayProperties,
  LookType,
  PagedLookItem,
} from '@rbx/client-look-api/v1';

export class LookClient extends BaseAPI {
  private looksV1Api: LookApi;
  private avatarUniverseLinkApi: AvatarUniverseLinkApi;

  constructor() {
    const configuration = createClientConfiguration('look-api', 'bedev2');

    super(configuration);
    this.looksV1Api = new LookApi(configuration);
    this.avatarUniverseLinkApi = new AvatarUniverseLinkApi(configuration);
  }

  getLookDetail(lookId: string): Promise<GetLookDetailResponseV2> {
    // Workaround for OpenAPI generator bug where path template {LookId} doesn't match parameter name lookId.
    // The generator fails to substitute the path parameter, so we manually construct the path using BaseAPI.
    return this.request({
      path: `/v2/looks/${lookId}`,
      method: 'GET',
      headers: {},
      // oxlint-disable-next-line no-unsafe-type-assertion -- response.json() returns Promise<any>
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

  linkAvatarsToUniverse(
    universeId: string,
    lookIds: string[],
  ): Promise<LinkAvatarsToUniverseResponse> {
    return this.avatarUniverseLinkApi.avatarUniverseLinkLinkAvatarsToUniverse({
      universeId,
      avatarUniverseLinkLinkAvatarsToUniverseRequest: { lookIds },
    });
  }

  unlinkAvatarsFromUniverse(
    universeId: string,
    lookIds: string[],
  ): Promise<UnlinkAvatarsFromUniverseResponse> {
    return this.avatarUniverseLinkApi.avatarUniverseLinkUnlinkAvatarsFromUniverse({
      universeId,
      avatarUniverseLinkUnlinkAvatarsFromUniverseRequest: { lookIds },
    });
  }

  getLinkedAvatarsByUniverse(universeId: string): Promise<GetLinkedAvatarsByUniverseResponse> {
    return this.avatarUniverseLinkApi.avatarUniverseLinkGetLinkedAvatarsByUniverse({ universeId });
  }
}

const lookClient = new LookClient();

export default lookClient;
