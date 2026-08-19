import { MAX_SHOWCASE_ITEMS } from '../constants';
import type {
  EligibleItemsPage,
  ResolvedShowcaseItem,
  Showcase,
  ShowcaseDraft,
  ShowcasePublishQuota,
} from '../types';

/**
 * Showcases are planned to persist as a new Shop service shop type (one showcase =
 * one shop), but that shop type does not exist yet. Everything above this seam is
 * built against the interface; when the shops-api contract lands, only
 * `showcaseDataSource` needs to change.
 *
 * There is no update method by design — published showcases are immutable (FR-C3).
 */
export interface ShowcaseDataSource {
  listShowcases(communityId: number, signal?: AbortSignal): Promise<Showcase[]>;
  getShowcase(showcaseId: string, signal?: AbortSignal): Promise<Showcase | undefined>;
  createShowcase(communityId: number, draft: ShowcaseDraft): Promise<Showcase>;
  deleteShowcase(showcaseId: string): Promise<void>;
  getPublishQuota(communityId: number, signal?: AbortSignal): Promise<ShowcasePublishQuota>;
  listEligibleItems(
    communityId: number,
    params: { page: number; pageSize: number },
    signal?: AbortSignal,
  ): Promise<EligibleItemsPage>;
  /** Resolves pasted asset ids, rejecting ones already in `existingAssetIds`. */
  resolveItemsByAssetId(
    communityId: number,
    assetIds: number[],
    existingAssetIds: number[],
  ): Promise<ResolvedShowcaseItem[]>;
}

const STUB_LATENCY_MS = 250;

/** Size of the stub's eligible-item pool; surfaces as `total` from listEligibleItems. */
export const STUB_ELIGIBLE_ITEMS_COUNT = 50;

const stubItem = (assetId: number) => ({
  assetId,
  name: `Item ${assetId}`,
  price: 70,
});

/**
 * In-memory stand-in so the flagged UI is fully clickable before the backend exists.
 * State is per-session and intentionally not persisted.
 */
export class InMemoryShowcaseDataSource implements ShowcaseDataSource {
  private showcases = new Map<string, Showcase>();

  private nextId = 1;

  private readonly quotaLimit = 5;

  private eligible = Array.from({ length: STUB_ELIGIBLE_ITEMS_COUNT }, (_, index) =>
    stubItem(1000000 + index),
  );

  /**
   * The default latency only exists to make the stubbed UI feel like a real
   * network call. Pass 0 in tests so they never schedule a timer.
   */
  constructor(private readonly latencyMs: number = STUB_LATENCY_MS) {}

  private delay<T>(value: T): Promise<T> {
    if (this.latencyMs <= 0) {
      return Promise.resolve(value);
    }
    return new Promise((resolve) => {
      setTimeout(() => resolve(value), this.latencyMs);
    });
  }

  async listShowcases(communityId: number): Promise<Showcase[]> {
    const all = [...this.showcases.values()].filter((s) => s.communityId === communityId);
    return this.delay(all.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt)));
  }

  async getShowcase(showcaseId: string): Promise<Showcase | undefined> {
    return this.delay(this.showcases.get(showcaseId));
  }

  async createShowcase(communityId: number, draft: ShowcaseDraft): Promise<Showcase> {
    const showcase: Showcase = {
      id: String(this.nextId),
      communityId,
      title: draft.title,
      background: draft.background,
      items: draft.items.slice(0, MAX_SHOWCASE_ITEMS),
      dynamicOrdering: draft.dynamicOrdering,
      moderationStatus: 'Pending',
      publishedAt: new Date().toISOString(),
    };
    this.nextId += 1;
    this.showcases.set(showcase.id, showcase);
    return this.delay(showcase);
  }

  async deleteShowcase(showcaseId: string): Promise<void> {
    this.showcases.delete(showcaseId);
    await this.delay(undefined);
  }

  async getPublishQuota(communityId: number): Promise<ShowcasePublishQuota> {
    const used = [...this.showcases.values()].filter((s) => s.communityId === communityId).length;
    return this.delay({ used, limit: this.quotaLimit });
  }

  async listEligibleItems(
    _communityId: number,
    params: { page: number; pageSize: number },
  ): Promise<EligibleItemsPage> {
    const start = params.page * params.pageSize;
    return this.delay({
      items: this.eligible.slice(start, start + params.pageSize),
      total: this.eligible.length,
    });
  }

  async resolveItemsByAssetId(
    _communityId: number,
    assetIds: number[],
    existingAssetIds: number[],
  ): Promise<ResolvedShowcaseItem[]> {
    const seen = new Set(existingAssetIds);
    const resolved = assetIds.map<ResolvedShowcaseItem>((assetId) => {
      if (seen.has(assetId)) {
        return { assetId, ok: false, reason: 'Duplicate' };
      }
      seen.add(assetId);
      const match = this.eligible.find((item) => item.assetId === assetId);
      return match
        ? { assetId, ok: true, item: match }
        : { assetId, ok: false, reason: 'NotFound' };
    });
    return this.delay(resolved);
  }
}

const showcaseDataSource: ShowcaseDataSource = new InMemoryShowcaseDataSource();

export default showcaseDataSource;
