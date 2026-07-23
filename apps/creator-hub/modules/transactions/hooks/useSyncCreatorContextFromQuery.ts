import { useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/router';
import { useAuthentication } from '@modules/authentication/providers';
import { useGroups } from '@modules/providers/groups/GroupsProvider';

const parsePositiveInt = (raw: string | string[] | undefined): number | null => {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value) {
    return null;
  }
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
};

// The URL can deep-link to a group (`?groupId=<id>`) or back to the personal/user context
// (`?userId=<id>`). `user` context is represented by a null current group.
type ContextTarget = { kind: 'group'; id: number } | { kind: 'user' } | null;

/**
 * When Transactions is opened via a deep link carrying `?groupId=<id>` or `?userId=<id>` (e.g. a
 * redirect from roblox.com), switch the active creator context to match so the correct
 * transactions load: `?groupId` to a group the user belongs to, `?userId` back to their own
 * personal context.
 *
 * Once the deep link has been consumed (or settled as a no-op) the `?groupId`/`?userId` param is
 * stripped from the URL, so a refresh doesn't re-apply it and a later manual workspace switch
 * isn't fought by the stale param. This is scoped to Transactions (the only page this hook mounts
 * on), so unlike a global strip it can't clobber params other flows rely on (e.g. `/unsubscribe`).
 *
 * Returns `isResolving`: true while the router has not yet hydrated the query, or while a valid,
 * in-scope target from the URL has not yet been applied to the context. Callers gate rendering on
 * it so the page never briefly queries the previously selected creator's financial data. Once the
 * router is ready it is never true for links with no directive, malformed ids, groups the user
 * does not belong to, or a `?userId` that isn't the authenticated user — those are no-ops and the
 * page renders with the existing context.
 */
export default function useSyncCreatorContextFromQuery(): { isResolving: boolean } {
  const router = useRouter();
  const { user } = useAuthentication();
  const { groups, isFetched, currentGroup, setCurrentGroup } = useGroups();
  const appliedRef = useRef(false);
  const strippedRef = useRef(false);

  const target = useMemo<ContextTarget>(() => {
    if (!router.isReady) {
      return null;
    }
    const groupId = parsePositiveInt(router.query.groupId);
    const userId = parsePositiveInt(router.query.userId);
    // The two params are mutually exclusive; treat a link carrying both as malformed.
    if (groupId !== null && userId !== null) {
      return null;
    }
    if (userId !== null) {
      // A `?userId` only ever means "my own personal context", so it must match the signed-in
      // user; a foreign id is a no-op rather than silently showing this user's own finances.
      return userId === Number(user?.id) ? { kind: 'user' } : null;
    }
    return groupId !== null ? { kind: 'group', id: groupId } : null;
  }, [router.isReady, router.query.groupId, router.query.userId, user?.id]);

  const isMember = target?.kind === 'group' && (groups ?? []).some(({ id }) => id === target.id);

  useEffect(() => {
    // Apply at most once per mount: after the first switch the user is free to change context
    // via the workspace selector without this snapping them back to the URL.
    if (appliedRef.current || target === null || !isFetched) {
      return;
    }
    appliedRef.current = true;
    if (target.kind === 'user') {
      if (currentGroup !== null) {
        setCurrentGroup(null);
      }
    } else if (isMember && currentGroup?.id !== target.id) {
      setCurrentGroup(target.id);
    }
  }, [target, isFetched, isMember, currentGroup, setCurrentGroup]);

  // Gate on router readiness first: before hydration `target` is forced to null, so without this
  // the page would render the previous context for one frame before the deep-linked target is
  // known, flickering isResolving false -> true -> false.
  let isResolving = !router.isReady;
  if (!isResolving && target !== null) {
    if (target.kind === 'group') {
      // Keep resolving until groups load (membership unknown), then only while an in-scope
      // switch is still pending. Non-members settle to the existing context.
      isResolving = !isFetched || (isMember && currentGroup?.id !== target.id);
    } else {
      // `?userId`: settled once the context is personal (no current group).
      isResolving = currentGroup !== null;
    }
  }

  useEffect(() => {
    // Strip only after resolution settles (never mid-switch) and only when a param is actually
    // present. Runs once per mount; `replace` keeps the consumed link out of history so Back
    // doesn't re-trigger it.
    if (strippedRef.current || !router.isReady || isResolving) {
      return;
    }
    if (router.query.groupId === undefined && router.query.userId === undefined) {
      return;
    }
    strippedRef.current = true;
    const query = { ...router.query };
    delete query.groupId;
    delete query.userId;
    void router.replace({ query }, undefined, { shallow: true });
  }, [router, isResolving]);

  return { isResolving };
}
