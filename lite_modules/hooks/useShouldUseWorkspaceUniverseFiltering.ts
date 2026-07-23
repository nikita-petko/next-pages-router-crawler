import { AppStoreType, useAppStore } from '@stores/appStoreProvider';

/**
 * Returns whether the current session should scope surfaces to a Creator Hub
 * workspace-owned experience instead of the ad account. Internalizes the
 * ad-account auto-create flag + account-type gating so call sites don't each
 * re-derive it (and can't drift on the internal/external checks).
 *
 * Note: this only reports the gating decision. Callers that also need the
 * workspace itself (e.g. to show the group name) still read `useWorkspaces`.
 */
const useShouldUseWorkspaceUniverseFiltering = (): boolean =>
  useAppStore((state: AppStoreType) => state.shouldUseWorkspaceUniverseFiltering());

export default useShouldUseWorkspaceUniverseFiltering;
