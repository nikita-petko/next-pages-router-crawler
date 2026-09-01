import {
  getConfigRepositoryValues,
  publishDraft,
  updateDraft,
  type CreatorConfigsPublicApiRepository,
  type CreatorConfigsPublicApiRequestOptions,
} from '@modules/clients/creatorConfigsPublicApi';
import { buildEnhancedAntiCheatConfig } from './antiCheatConfig.mapping';
import {
  deserializeEnhancedAntiCheatConfig,
  serializeEnhancedAntiCheatConfig,
} from './antiCheatConfig.serialization';
import type { AntiCheatConfigClient, AntiCheatEnhancedConfig } from './antiCheatConfig.types';

// The creator-configs-public-api repository whose single internal namespace is `EnhancedAntiCheat`.
// The gateway flattens that namespace's entries into `entries`, keyed `default` (universe-level)
// or `place_{placeId}` (place override).
const ANTI_CHEAT_REPOSITORY: CreatorConfigsPublicApiRepository = 'AntiCheatConfig';
const DEFAULT_ENTRY_KEY = 'default';
const PUBLISH_MESSAGE = 'Updated enhanced anti-cheat via Creator Hub';

const placeEntryKey = (placeId: string): string => `place_${placeId}`;

/**
 * CONFaaS-backed {@link AntiCheatConfigClient} for a single universe. Reads/writes the
 * `EnhancedAntiCheat` namespace through the creator-configs-public-api draft/publish flow, mapping
 * the UI's per-place `placeId` onto the `place_{placeId}` entry key.
 */
export class ConfaasAntiCheatConfigClient implements AntiCheatConfigClient {
  private readonly requestOptions: CreatorConfigsPublicApiRequestOptions;

  constructor(universeId: string) {
    this.requestOptions = { universeId, repository: ANTI_CHEAT_REPOSITORY };
  }

  async getConfig(placeId: string): Promise<AntiCheatEnhancedConfig> {
    const repository = await getConfigRepositoryValues(this.requestOptions);
    const entries = repository.entries ?? {};
    // A place with no override of its own inherits the universe-level `default`.
    const raw = entries[placeEntryKey(placeId)] ?? entries[DEFAULT_ENTRY_KEY];
    if (raw == null) {
      return buildEnhancedAntiCheatConfig(false);
    }
    return deserializeEnhancedAntiCheatConfig(raw);
  }

  async setConfig(placeId: string, config: AntiCheatEnhancedConfig): Promise<void> {
    const repository = await getConfigRepositoryValues(this.requestOptions);
    const existingEntries = repository.entries ?? {};

    // PATCH merges at the entry level, so writing one place override leaves the others intact.
    const entries: Record<string, unknown> = {
      [placeEntryKey(placeId)]: serializeEnhancedAntiCheatConfig(config),
    };
    // The namespace requires a non-deleted `default` entry; provision a disabled universe-level
    // default the first time a universe gets any override, or the server rejects the write.
    if (existingEntries[DEFAULT_ENTRY_KEY] == null) {
      entries[DEFAULT_ENTRY_KEY] = serializeEnhancedAntiCheatConfig(
        buildEnhancedAntiCheatConfig(false),
      );
    }

    const { draftHash } = await updateDraft(this.requestOptions, { entries });
    if (!draftHash) {
      throw new Error('creator-configs-public-api updateDraft returned no draftHash');
    }
    await publishDraft(this.requestOptions, {
      draftHash,
      message: PUBLISH_MESSAGE,
      deploymentStrategy: 'Immediate',
    });
  }
}
