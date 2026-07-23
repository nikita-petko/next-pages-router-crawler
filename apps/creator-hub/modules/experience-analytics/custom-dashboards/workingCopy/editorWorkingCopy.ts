/**
 * Process-lifetime in-memory store for unsaved custom-dashboard working copies.
 *
 * Not persisted storage — distinct from document `status: 'draft' | 'published'`
 * in localStorage. The URL `draftId` query param keys into this map so editor,
 * chart-editor, and preview routes can remount without losing in-flight edits.
 *
 * Manage allocates a working copy via `createNewEditorWorkingCopy` on create.
 * Editor/chart-editor use `getEditorWorkingCopy`, `updateEditorWorkingCopy`, and
 * related helpers. `deleteEditorWorkingCopy` tears down a copy on exit.
 */
import type { CustomDashboardConfig, CustomDashboardDocument } from '../types';
import { EMPTY_DASHBOARD_CONFIG } from '../types';

export const NEW_DASHBOARD_ROUTE_ID = 'new';

export type EditorWorkingCopy = {
  readonly draftId: string;
  readonly universeId: number;
  readonly dashboardId: string | null;
  readonly name: string;
  readonly config: CustomDashboardConfig;
  readonly createdByUserId: number;
  readonly createdByUsername: string;
};

export type EditorWorkingCopyPatch = Pick<EditorWorkingCopy, 'name' | 'config'>;

/**
 * In-memory editor working copies, keyed by `draftId`. This is module-level
 * (not React state) so the value survives the editor → chart-editor → editor
 * route transitions that remount `EditPageContent`.
 *
 * Sessions are normally removed explicitly (cancel, or after a successful
 * publish). The cap below is a leak guard for the abandoned-tab case — e.g. a
 * user repeatedly opening "new dashboard" and navigating away without
 * cancelling. `Map` preserves insertion order, so evicting the first key drops
 * the oldest session. The cap is generous; in practice at most a couple of
 * sessions are live at once.
 */
const MAX_LIVE_SESSIONS = 32;
const sessions = new Map<string, EditorWorkingCopy>();

function evictOldestIfOverCap(): void {
  while (sessions.size > MAX_LIVE_SESSIONS) {
    const oldest = sessions.keys().next().value;
    if (oldest === undefined) {
      return;
    }
    sessions.delete(oldest);
  }
}

function createDraftId(): string {
  return `draft_${crypto.randomUUID()}`;
}

export function createNewEditorWorkingCopy({
  universeId,
  name,
  createdByUserId,
  createdByUsername,
}: {
  readonly universeId: number;
  readonly name: string;
  readonly createdByUserId: number;
  readonly createdByUsername: string;
}): EditorWorkingCopy {
  const session: EditorWorkingCopy = {
    draftId: createDraftId(),
    universeId,
    dashboardId: null,
    name,
    config: EMPTY_DASHBOARD_CONFIG,
    createdByUserId,
    createdByUsername,
  };
  sessions.set(session.draftId, session);
  evictOldestIfOverCap();
  return session;
}

export function createEditorWorkingCopyFromDocument(
  document: CustomDashboardDocument,
): EditorWorkingCopy {
  const session: EditorWorkingCopy = {
    draftId: createDraftId(),
    universeId: document.universeId,
    dashboardId: document.id,
    name: document.name,
    config: document.config,
    createdByUserId: document.createdByUserId,
    createdByUsername: document.createdByUsername,
  };
  sessions.set(session.draftId, session);
  evictOldestIfOverCap();
  return session;
}

export function getEditorWorkingCopy(draftId: string | null | undefined): EditorWorkingCopy | null {
  if (!draftId) {
    return null;
  }
  return sessions.get(draftId) ?? null;
}

export function updateEditorWorkingCopy(
  draftId: string,
  patch: EditorWorkingCopyPatch,
): EditorWorkingCopy | null {
  const existing = sessions.get(draftId);
  if (!existing) {
    return null;
  }
  const next = {
    ...existing,
    ...patch,
  };
  sessions.set(draftId, next);
  return next;
}

/**
 * Stamp the persisted dashboard id onto a working copy after a first-time save.
 * Keeps the live copy in the "existing dashboard" state so a retry (or a
 * subsequent edit before navigation) updates the just-created document instead
 * of creating a duplicate.
 */
export function attachDashboardIdToWorkingCopy(
  draftId: string,
  dashboardId: string,
): EditorWorkingCopy | null {
  const existing = sessions.get(draftId);
  if (!existing) {
    return null;
  }
  const next = { ...existing, dashboardId };
  sessions.set(draftId, next);
  return next;
}

export function deleteEditorWorkingCopy(draftId: string | null | undefined): void {
  if (draftId) {
    sessions.delete(draftId);
  }
}

/** Test-only reset for the module-level working-copy store. */
export function clearAllEditorWorkingCopiesForTests(): void {
  sessions.clear();
}
