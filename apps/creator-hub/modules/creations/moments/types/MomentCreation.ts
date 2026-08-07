import type { Locale } from '@rbx/intl';

export const MomentCreationStatus = {
  ACTIVE: 'active',
  PENDING: 'pending',
  DRAFT: 'draft',
  MODERATED: 'moderated',
} as const;

export type MomentCreationStatus = (typeof MomentCreationStatus)[keyof typeof MomentCreationStatus];

export type MomentCreationStatusTab = MomentCreationStatus;

export type MomentCreationStatusFilterTab =
  | typeof MomentCreationStatus.ACTIVE
  | typeof MomentCreationStatus.DRAFT;

export const MomentCreationStatusFilterTabs: MomentCreationStatusFilterTab[] = [
  MomentCreationStatus.ACTIVE,
  MomentCreationStatus.DRAFT,
];

/** Fields shared by local drafts and server-backed moments. Carries no identifier. */
export type MomentCreationBase = {
  assetId?: number;
  thumbnailUrl?: string;
  videoUrl?: string;
  experienceName: string;
  description: string;
  modifiedAt: string;
  universeId?: number;
  /** Spoken/on-screen language of the Moments video, when provided at upload. */
  locale?: Locale;
};

/**
 * Draft moment metadata persisted in the browser until publish.
 *
 * Never reaches the server as a moment: publish uploads the video and the server mints its own
 * identifiers, after which the draft is deleted locally.
 */
export type DraftMomentCreation = MomentCreationBase & {
  status: typeof MomentCreationStatus.DRAFT;
  /**
   * Client-generated UUID, structurally unrelated to any server identifier. Also the IndexedDB key
   * for this draft's video blob.
   */
  draftId: string;
  experienceId: number;
  rootPlaceId?: number;
  /** True when the uploaded video blob is stored locally in IndexedDB. */
  hasLocalVideo?: boolean;
};

/**
 * A moment returned by `GET /v2/moments/get-users-moments`.
 *
 * Both identifiers are the raw API values and both are optional, because which one is populated
 * depends on where the backend is in its `feedItemId` rollout. The parser guarantees that whichever
 * one `isMomentsFeedIdEnabled` selects is present — rows missing it are dropped — so exactly one is
 * safe to rely on at a time. Use `getMomentRowKey` for client-side identity instead of picking one.
 */
export type ServerMomentCreation = MomentCreationBase & {
  status: Exclude<MomentCreationStatus, typeof MomentCreationStatus.DRAFT>;
  /** `items[].feedItemId`. The delete key when `isMomentsFeedIdEnabled` is on. */
  feedItemId?: string;
  /** `items[].id`. The delete key when the flag is off; disappears with the API change. */
  momentId?: string;
};

/**
 * Discriminated on `status`: drafts are forced to `DRAFT` when written to local storage, and the
 * response parser never emits `DRAFT` for a server moment. Narrowing on `status` is therefore
 * enough to know which identifier a moment has, and mixing the two id spaces is a type error.
 */
export type MomentCreation = DraftMomentCreation | ServerMomentCreation;

export type ListMomentsPageParams = {
  paginationContext?: string;
  pageNumber?: number;
};

export type ListMomentsPageResponse = {
  moments: ServerMomentCreation[];
  paginationContext?: string;
};
