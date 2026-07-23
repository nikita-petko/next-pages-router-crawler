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

export type MomentCreation = {
  id: string;
  assetId?: number;
  thumbnailUrl?: string;
  videoUrl?: string;
  experienceName: string;
  description: string;
  modifiedAt: string;
  status: MomentCreationStatus;
  universeId?: number;
};

export type ListMomentsResponse = {
  moments: MomentCreation[];
  totalCount: number;
};

export type ListMomentsPageParams = {
  paginationContext?: string;
  pageNumber?: number;
};

export type ListMomentsPageResponse = {
  moments: MomentCreation[];
  paginationContext?: string;
  moderatedMomentIds: string[];
  failedMomentIds: string[];
};
