import type { CustomDashboardDocument } from '../../types';
import {
  createEditorWorkingCopyFromDocument,
  getEditorWorkingCopy,
  type EditorWorkingCopy,
} from '../../workingCopy/editorWorkingCopy';

export function resolveActiveSession({
  current,
  draftId,
  isNewDashboard,
  persistedDocument,
}: {
  readonly current: EditorWorkingCopy | null;
  readonly draftId: string | undefined;
  readonly isNewDashboard: boolean;
  readonly persistedDocument: CustomDashboardDocument | null;
}): EditorWorkingCopy | null {
  if (isNewDashboard) {
    // Keep the live session if we already have one; only resolve from the
    // route on first mount. A background refetch must not reset it.
    return current ?? getEditorWorkingCopy(draftId);
  }
  if (!persistedDocument) {
    return current;
  }
  // Already editing this document: keep the working copy. The document query
  // refetches on cross-tab events, pin toggles, and window refocus; rebuilding
  // the session here would silently discard in-progress edits.
  if (current && current.dashboardId === persistedDocument.id) {
    return current;
  }
  const existingSession = getEditorWorkingCopy(draftId);
  if (existingSession && existingSession.dashboardId === persistedDocument.id) {
    return existingSession;
  }
  return createEditorWorkingCopyFromDocument(persistedDocument);
}
