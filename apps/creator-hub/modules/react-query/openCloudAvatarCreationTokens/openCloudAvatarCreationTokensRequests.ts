import { getBEDEV2ServiceBasePath } from '@modules/clients/utils';
import { V2CloudClient, V2CloudProtos } from '@rbx/open-cloud';

const basePath = getBEDEV2ServiceBasePath('user');

const openCloudApi = new V2CloudClient({
  servicePath: basePath,
});

function getUniverseAndTokenIdFromPath(path: string | null | undefined): {
  universe: string | number;
  avatarCreationToken: string | number;
} {
  return path
    ? openCloudApi.parseAvatarCreationTokenPath(path)
    : { universe: '', avatarCreationToken: '' };
}

export function getTokenIdFromPath(path: string | null | undefined): string | number {
  return getUniverseAndTokenIdFromPath(path).avatarCreationToken;
}

export function getUniverseIdFromPath(path: string | null | undefined): number {
  return Number(getUniverseAndTokenIdFromPath(path).universe);
}

export function createAvatarCreationToken(
  request: V2CloudProtos.ICreateAvatarCreationTokenRequest,
): Promise<
  [
    V2CloudProtos.IAvatarCreationToken,
    V2CloudProtos.ICreateAvatarCreationTokenRequest | undefined,
    {} | undefined,
  ]
> {
  return openCloudApi.createAvatarCreationToken(request);
}

export const listAvatarCreationTokens = (
  request: V2CloudProtos.IListAvatarCreationTokensRequest,
) => {
  return openCloudApi.listAvatarCreationTokens(request);
};

export default createAvatarCreationToken;
export function getAvatarCreationToken(
  request: V2CloudProtos.IGetAvatarCreationTokenRequest,
): Promise<
  [
    V2CloudProtos.IAvatarCreationToken,
    V2CloudProtos.IGetAvatarCreationTokenRequest | undefined,
    {} | undefined,
  ]
> {
  return openCloudApi.getAvatarCreationToken(request);
}

export function updateAvatarCreationToken(
  request: V2CloudProtos.IUpdateAvatarCreationTokenRequest,
): Promise<
  [
    V2CloudProtos.IAvatarCreationToken,
    V2CloudProtos.IUpdateAvatarCreationTokenRequest | undefined,
    {} | undefined,
  ]
> {
  return openCloudApi.updateAvatarCreationToken(request);
}

export function getPricingPolicy(
  request: V2CloudProtos.IGetAvatarCreationTokensPricingPolicyRequest,
): Promise<
  [
    V2CloudProtos.IGetAvatarCreationTokensPricingPolicyResponse,
    V2CloudProtos.IGetAvatarCreationTokensPricingPolicyRequest | undefined,
    {} | undefined,
  ]
> {
  return openCloudApi.getAvatarCreationTokensPricingPolicy(request);
}
