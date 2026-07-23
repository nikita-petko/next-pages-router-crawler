import { useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { useGroups } from '@modules/providers/groups/GroupsProvider';

const parseGroupId = (raw: string | string[] | undefined): number | null => {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value) {
    return null;
  }
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
};

/**
 * When Transactions is opened via a deep link carrying `?groupId=<id>` (e.g. a redirect from
 * roblox.com), switch the active creator context to that group so the correct transactions load.
 *
 * Returns `isResolving`: true while the router has not yet hydrated the query, or while a valid,
 * in-scope group id from the URL has not yet been applied to the context. Callers gate rendering
 * on it so the page never briefly queries the previously selected creator's financial data. Once
 * the router is ready it is never true for personal links, malformed ids, or groups the user does
 * not belong to — those are no-ops and the page renders with the existing context.
 */
export default function useSyncCreatorContextFromQuery(): { isResolving: boolean } {
  const router = useRouter();
  const { groups, isFetched, currentGroup, setCurrentGroup } = useGroups();
  const appliedRef = useRef(false);

  const targetGroupId = router.isReady ? parseGroupId(router.query.groupId) : null;
  const isMember = targetGroupId !== null && (groups ?? []).some(({ id }) => id === targetGroupId);

  useEffect(() => {
    // Apply at most once per mount: after the first switch the user is free to change context
    // via the workspace selector without this snapping them back to the URL's group.
    if (appliedRef.current || targetGroupId === null || !isFetched) {
      return;
    }
    appliedRef.current = true;
    if (isMember && currentGroup?.id !== targetGroupId) {
      setCurrentGroup(targetGroupId);
    }
  }, [targetGroupId, isFetched, isMember, currentGroup, setCurrentGroup]);

  // Gate on router readiness first: before hydration `targetGroupId` is forced to null, so without
  // this the page would render the previous context for one frame before the deep-linked group is
  // known, flickering isResolving false -> true -> false.
  const isResolving =
    !router.isReady ||
    (targetGroupId !== null && (!isFetched || (isMember && currentGroup?.id !== targetGroupId)));

  return { isResolving };
}
