// API response types — re-exported from the client module (single source of truth)
export type { TrustedConnectionEntry as RequiresTrustedConnectionEntry } from '@modules/clients/teamCreateCollaboration';
export type {
  AdminViewEntry,
  UniverseCollaborationStatusResponse as CollaboratorsApiResponse,
} from '@modules/clients/teamCreateCollaboration';

// --- View-model types (consumed by table components) ---

export interface TrustRelationship {
  userId: number;
  displayName: string;
  username: string;
}

export interface OwnerCollaborator {
  userId: number;
  displayName: string;
  username: string;
  blockingCount: number;
  trustRelationships: TrustRelationship[];
  status: OwnerCollaboratorStatus;
}

export enum OwnerCollaboratorStatus {
  NeedsAction = 'needs_action',
  NotImpacting = 'not_impacting',
}

export enum CollaboratorsColumnKey {
  User = 'user',
  Blocking = 'blocking',
  RemainingTrust = 'remainingTrust',
}
