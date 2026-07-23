import type {
  RobloxUniversePermissionsStudioSafetyPolicyServiceV1Beta1CanCollaborateResponse as CanCollaborateResponse,
  RobloxUniversePermissionsStudioSafetyPolicyServiceV1Beta1CollaborationUser as CollaborationUser,
  RobloxUniversePermissionsStudioSafetyPolicyServiceV1Beta1GetUniverseCollaborationStatusResponse as GetUniverseCollaborationStatusResponse,
  RobloxUniversePermissionsStudioSafetyPolicyServiceV1Beta1UniverseImpactedResult as GeneratedUniverseImpactedResult,
} from '@rbx/client-team-create-service/v1';
import { TeamCreateApi } from '@rbx/client-team-create-service/v1';
import { createClientConfiguration } from './utils/createClientConfiguration';

const configuration = createClientConfiguration('team-create-service', 'bedev2');

const teamCreateApi = new TeamCreateApi(configuration);

export interface TrustedConnectionEntry {
  UserId: number;
  ErrorReason: string;
}

const required = <T>(value: T | undefined, fieldName: string): T => {
  if (value === undefined) {
    throw new Error(`TeamCreate response missing ${fieldName}`);
  }
  return value;
};

const mapTrustedConnectionEntry = (entry: CollaborationUser): TrustedConnectionEntry => ({
  UserId: required(entry.userId, 'UserId'),
  ErrorReason: required(entry.errorReason, 'ErrorReason'),
});

const mapTrustedConnectionEntries = (
  entries: CollaborationUser[] | null | undefined,
): TrustedConnectionEntry[] => entries?.map(mapTrustedConnectionEntry) ?? [];

const mapCanCollaborateResponse = (response: CanCollaborateResponse): EditViewData => ({
  CanCollaborate: required(response.canCollaborate, 'CanCollaborate'),
  Error: required(response.error, 'Error'),
  UserId: required(response.userId, 'UserId'),
  UniverseId: required(response.universeId, 'UniverseId'),
  RequiresTrustedConnection: mapTrustedConnectionEntries(response.requiresTrustedConnection),
});

export async function getCanCollaborate(universeId: number): Promise<TrustedConnectionEntry[]> {
  const response = await teamCreateApi.teamCreateGetCanCollaborate({
    teamCreateGetCanCollaborateRequest: { universeId },
  });
  return mapTrustedConnectionEntries(response.requiresTrustedConnection);
}

export default async function multiUniverseGetCanCollaborate(
  universeIds: number[],
): Promise<Record<number, boolean>> {
  const response = await teamCreateApi.teamCreateMultiUniverseGetCanCollaborate({
    teamCreateMultiUniverseGetCanCollaborateRequest: { universeIds },
  });

  const result: Record<number, boolean> = {};
  response.canCollaborateResponses?.forEach((entry) => {
    result[required(entry.universeId, 'UniverseId')] =
      !required(entry.canCollaborate, 'CanCollaborate') || entry.error === 'NotAuthorized';
  });
  return result;
}

export interface UniverseImpactedResult {
  UniverseId: number;
  IsImpacted: boolean;
  IsAdmin: boolean;
  HasError: boolean;
}

const ARE_UNIVERSES_IMPACTED_MAX_BATCH_SIZE = 50;
const ARE_UNIVERSES_IMPACTED_MAX_BATCHES = 3;

const mapUniverseImpactedResult = (
  entry: GeneratedUniverseImpactedResult,
): UniverseImpactedResult => ({
  UniverseId: required(entry.universeId, 'UniverseId'),
  IsImpacted: required(entry.isImpacted, 'IsImpacted'),
  IsAdmin: required(entry.isAdmin, 'IsAdmin'),
  HasError: required(entry.hasError, 'HasError'),
});

export async function areUniversesImpacted(
  universeIds: number[],
): Promise<Record<number, UniverseImpactedResult>> {
  const result: Record<number, UniverseImpactedResult> = {};

  const maxUniverseIds = ARE_UNIVERSES_IMPACTED_MAX_BATCH_SIZE * ARE_UNIVERSES_IMPACTED_MAX_BATCHES;
  const limitedUniverseIds = universeIds.slice(0, maxUniverseIds);

  const batches: number[][] = [];
  for (let i = 0; i < limitedUniverseIds.length; i += ARE_UNIVERSES_IMPACTED_MAX_BATCH_SIZE) {
    batches.push(limitedUniverseIds.slice(i, i + ARE_UNIVERSES_IMPACTED_MAX_BATCH_SIZE));
  }

  const responses = await Promise.all(
    batches.map(async (batch) => {
      const response = await teamCreateApi.teamCreateAreUniversesImpacted({
        teamCreateAreUniversesImpactedRequest: { universeIds: batch },
      });
      return response.results?.map(mapUniverseImpactedResult) ?? [];
    }),
  );

  responses.forEach((entries) => {
    entries.forEach((entry) => {
      result[entry.UniverseId] = entry;
    });
  });

  return result;
}

export interface AdminViewEntry {
  UserId: number;
  CanCollaborate: boolean;
  Error: string;
  RequiresTrustedConnection: TrustedConnectionEntry[];
}

export interface EditViewData {
  CanCollaborate: boolean;
  Error: string;
  UserId: number;
  UniverseId: number;
  RequiresTrustedConnection: TrustedConnectionEntry[];
}

export interface BlockedUser {
  UserId: number;
  Timestamp: number;
}

export interface UniverseCollaborationStatusResponse {
  IsAdmin: boolean;
  EditView?: EditViewData | null;
  AdminView: AdminViewEntry[];
  Error: string;
  EditViewUsers: EditViewData[];
  TenuredUsers: number[];
  BlockedUsers: BlockedUser[];
}

const mapEditView = (response: CanCollaborateResponse | null | undefined) =>
  response == null ? response : mapCanCollaborateResponse(response);

const mapUniverseCollaborationStatusResponse = (
  response: GetUniverseCollaborationStatusResponse,
): UniverseCollaborationStatusResponse => ({
  IsAdmin: required(response.isAdmin, 'IsAdmin'),
  EditView: mapEditView(response.editView),
  AdminView: response.adminView?.map(mapCanCollaborateResponse) ?? [],
  Error: required(response.error, 'Error'),
  EditViewUsers: response.editViewUsers
    ? response.editViewUsers.map((entry) => mapCanCollaborateResponse(entry))
    : [],
  TenuredUsers: response.tenuredUsers ?? [],
  BlockedUsers:
    response.blockedUsers?.map((userResponse) => ({
      UserId: required(userResponse.userId, 'UserId'),
      Timestamp: required(userResponse.blockedTimestamp, 'BlockedTimestamp'),
    })) ?? [],
});

export async function getUniverseCollaborationStatus(
  universeId: number,
): Promise<UniverseCollaborationStatusResponse> {
  const response = await teamCreateApi.teamCreateGetUniverseCollaborationStatus({
    teamCreateGetUniverseCollaborationStatusRequest: { universeId },
  });
  return mapUniverseCollaborationStatusResponse(response);
}

export async function evictTeamCreatePlayer(universeId: number, userId: number): Promise<void> {
  await teamCreateApi.teamCreateEvictTeamCreatePlayer({
    universeId,
    teamCreateEvictTeamCreatePlayerRequest: { targetUserId: userId },
  });
}
