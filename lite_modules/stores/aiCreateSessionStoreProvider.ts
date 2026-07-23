import { create } from 'zustand';

import { type GeneratedImageReportContext } from '@services/ads/generateAdCreativeService';

/** A batch of generated image URLs (one generate/regenerate round). */
export interface GeneratedImageBatch {
  id: string;
  imageUrls: string[];
}

/**
 * A snapshot of the AI-create generation session. The **campaign** builder
 * drawer persists this in the Zustand store (in-memory, lost on refresh). The
 * **library** flow persists the same shape to localStorage with a 24h TTL
 * (see `@utils/aiCreateSessionStorage`).
 */
export interface AiCreateSessionSnapshot {
  /**
   * Advertiser account scope. A snapshot is only restored when account + universe
   * both match, preventing cross-account hydration when universes overlap.
   */
  adAccountId: string | undefined;
  /** Newest-first generated batches (the in-flight batch is folded in at close). */
  batches: GeneratedImageBatch[];
  /** Image URLs hidden via report/dismiss; re-applied as a filter on restore. */
  hiddenImageUrls: string[];
  /**
   * Reference asset IDs the user had selected when the drawer closed, persisted
   * so they are pre-populated on reopen. Omitted (rather than `[]`) when empty
   * to keep the snapshot shape minimal and backwards-compatible.
   */
  referenceAssetIds?: number[];
  /** Per-image generation metadata so a restored tile can still be reported. */
  reportContextByImageUrl: Record<string, GeneratedImageReportContext>;
  /** Image URLs the user had selected for save. */
  selectedImageUrls: string[];
  /**
   * The universe the session belongs to. A snapshot is only restored when it
   * matches the universe the reopened drawer is generating for, so switching
   * the campaign experience starts a clean session.
   */
  universeId: number | undefined;
  /** The prompt text at close time, restored for continuity. */
  userPrompt: string;
}

interface AiCreateSessionStoreStateType {
  isReviewBannerDismissed: boolean;
  isUploadDrawerBannerDismissed: boolean;
  session: AiCreateSessionSnapshot | null;
}

interface AiCreateSessionStoreActionType {
  clearAiCreateSession: () => void;
  resetAiCreateCampaignScope: () => void;
  setAiCreateReviewBannerDismissed: (isDismissed: boolean) => void;
  setAiCreateSession: (session: AiCreateSessionSnapshot) => void;
  setUploadDrawerBannerDismissed: (isDismissed: boolean) => void;
}

interface AiCreateSessionStoreType
  extends AiCreateSessionStoreStateType, AiCreateSessionStoreActionType {}

export const useAiCreateSessionStore = create<AiCreateSessionStoreType>()((set) => ({
  clearAiCreateSession: () => set({ session: null }),
  isReviewBannerDismissed: false,
  isUploadDrawerBannerDismissed: false,
  resetAiCreateCampaignScope: () =>
    set({ isReviewBannerDismissed: false, isUploadDrawerBannerDismissed: false, session: null }),
  session: null,
  setAiCreateReviewBannerDismissed: (isDismissed) => set({ isReviewBannerDismissed: isDismissed }),
  setAiCreateSession: (session) => set({ session }),
  setUploadDrawerBannerDismissed: (isDismissed) =>
    set({ isUploadDrawerBannerDismissed: isDismissed }),
}));
