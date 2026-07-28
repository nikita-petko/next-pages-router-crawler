import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { AdminViewEntry } from '@modules/clients/teamCreateCollaboration';
import usersClient from '@modules/clients/users';
import type { OwnerCollaborator, TrustRelationship } from '../types/ownerCollaborators';
import { OwnerCollaboratorStatus } from '../types/ownerCollaborators';

export interface UseOwnerCollaboratorsResult {
  needsAction: OwnerCollaborator[];
  notImpacting: OwnerCollaborator[];
  notAgeVerified: OwnerCollaborator[];
  isLoading: boolean;
  error: string | undefined;
}

function transformAdminView(
  adminView: AdminViewEntry[],
  userDetailsMap: Map<number, { displayName: string; username: string }>,
): {
  needsAction: OwnerCollaborator[];
  notImpacting: OwnerCollaborator[];
  notAgeVerified: OwnerCollaborator[];
} {
  const resolve = (userId: number) =>
    userDetailsMap.get(userId) ?? { displayName: `User ${userId}`, username: `user${userId}` };

  const collaborators = adminView.map((entry) => {
    const details = resolve(entry.UserId);
    const trustRelationships: TrustRelationship[] = entry.RequiresTrustedConnection.map((req) => {
      const reqDetails = resolve(req.UserId);
      return {
        userId: req.UserId,
        displayName: reqDetails.displayName,
        username: reqDetails.username,
      };
    });

    return {
      userId: entry.UserId,
      displayName: details.displayName,
      username: details.username,
      blockingCount: trustRelationships.length,
      trustRelationships,
      status: entry.CanCollaborate
        ? OwnerCollaboratorStatus.NotImpacting
        : OwnerCollaboratorStatus.NeedsAction,
      canCollaborate: entry.CanCollaborate,
      isNotAgeVerified: entry.Error === 'NotAgeVerified',
    };
  });

  return {
    needsAction: collaborators
      .filter((c) => !c.canCollaborate && c.trustRelationships.length > 0)
      .map(({ canCollaborate: _, isNotAgeVerified: _n, ...rest }) => rest),
    notImpacting: collaborators
      .filter((c) => !c.isNotAgeVerified && (c.canCollaborate || c.trustRelationships.length === 0))
      .map(({ canCollaborate: _, isNotAgeVerified: _n, ...rest }) => rest),
    notAgeVerified: collaborators
      .filter((c) => c.isNotAgeVerified)
      .map(({ canCollaborate: _, isNotAgeVerified: _n, ...rest }) => rest),
  };
}

function collectAllUserIds(adminView: AdminViewEntry[]): number[] {
  const ids = new Set<number>();
  adminView.forEach((entry) => {
    ids.add(entry.UserId);
    entry.RequiresTrustedConnection.forEach((req) => ids.add(req.UserId));
  });
  return Array.from(ids);
}

const useOwnerCollaborators = (
  adminView: AdminViewEntry[] | undefined,
  apiError?: string,
): UseOwnerCollaboratorsResult => {
  const [needsAction, setNeedsAction] = useState<OwnerCollaborator[]>([]);
  const [notImpacting, setNotImpacting] = useState<OwnerCollaborator[]>([]);
  const [notAgeVerified, setNotAgeVerified] = useState<OwnerCollaborator[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>();
  const requestIdRef = useRef(0);

  const loadData = useCallback(async (entries: AdminViewEntry[]) => {
    requestIdRef.current += 1;
    const requestId = requestIdRef.current;

    setIsLoading(true);
    setError(undefined);

    try {
      const allUserIds = collectAllUserIds(entries);

      if (allUserIds.length === 0) {
        setNeedsAction([]);
        setNotImpacting([]);
        setNotAgeVerified([]);
        return;
      }

      const usersResponse = await usersClient.getUsersByIds(allUserIds);
      if (requestId !== requestIdRef.current) {
        return;
      }

      const userDetailsMap = new Map<number, { displayName: string; username: string }>();
      usersResponse?.data?.forEach((u) => {
        if (u.id != null) {
          userDetailsMap.set(u.id, {
            displayName: u.displayName ?? u.name ?? String(u.id),
            username: u.name ?? String(u.id),
          });
        }
      });

      const result = transformAdminView(entries, userDetailsMap);
      setNeedsAction(result.needsAction);
      setNotImpacting(result.notImpacting);
      setNotAgeVerified(result.notAgeVerified);
    } catch {
      if (requestId === requestIdRef.current) {
        setError('Failed to load collaborators.');
      }
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (adminView === undefined) {
      return;
    }
    void loadData(adminView);
  }, [adminView, loadData]);

  useEffect(() => {
    if (apiError) {
      setError(apiError);
      setIsLoading(false);
    }
  }, [apiError]);

  return useMemo(
    () => ({ needsAction, notImpacting, notAgeVerified, isLoading, error }),
    [needsAction, notImpacting, notAgeVerified, isLoading, error],
  );
};

export default useOwnerCollaborators;
