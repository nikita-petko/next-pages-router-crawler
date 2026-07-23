import createFetchClient from '@rbx/client-music-discovery';
import type { AudioDiscoverability } from '@rbx/client-music-discovery/v1';
import { getBEDEV2ServiceBasePath } from './utils';

const musicDiscoveryClient = createFetchClient({
  baseUrl: getBEDEV2ServiceBasePath('music-discovery'),
  credentials: 'include',
  enableMrRouter: true,
});

export type AudioDiscoverabilityItem = AudioDiscoverability & { assetId: number };

export async function setAudioAttestation(assetId: number, isAttested: boolean): Promise<void> {
  const { error } = await musicDiscoveryClient.POST('/v1/set-audio-attestation', {
    body: { assetId, isAttested },
  });
  if (error) {
    throw new Error(`setAudioAttestation failed for asset ${assetId}`);
  }
}

export async function getAudioDiscoverability(
  assetId: number,
): Promise<AudioDiscoverabilityItem | null> {
  const { data, error } = await musicDiscoveryClient.GET('/v1/batch-audio-discoverability', {
    params: { query: { assetIds: [assetId] } },
  });
  if (error) {
    throw new Error(`getAudioDiscoverability failed for asset ${assetId}`);
  }
  const item = data?.audioDiscoverability?.[0];
  if (item?.assetId === undefined) {
    return null;
  }
  return { ...item, assetId: item.assetId };
}

export async function setPublicSurfacing(assetId: number, enabled: boolean): Promise<void> {
  const { error } = await musicDiscoveryClient.POST('/v1/set-public-surfacing', {
    body: { assetId, enabled },
  });
  if (error) {
    throw new Error(`setPublicSurfacing failed for asset ${assetId}`);
  }
}

export async function setMusicArtists(assetId: number, artistUserIds: number[]): Promise<void> {
  const { error } = await musicDiscoveryClient.POST('/v1/set-music-artists', {
    body: { assetId, artistUserIds },
  });
  if (error) {
    throw new Error(`setMusicArtists failed for asset ${assetId}`);
  }
}
