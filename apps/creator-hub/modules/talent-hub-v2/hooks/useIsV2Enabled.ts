import { useRouter } from 'next/router';
import { IXPLayers, TalentHubParameters } from '@modules/clients/ixpExperiments';
import useIXPParameters from '@modules/miscellaneous/hooks/useIXPParameters';
import { FeatureFlagName } from '@modules/settings/SettingsProvider/featureFlags';
import { useSettings } from '@modules/settings/SettingsProvider/SettingsProvider';
import { isLocalTh2DevModeEnabled, isQaOverrideHostAllowed } from '../utils';

/**
 * Unified check for whether TH2 V2 features are enabled for the current user.
 *
 * Order of precedence (first match wins):
 *   1. `?th2=0` on QA-allowed hosts → force-OFF (lets QA verify the denied UX
 *      without flipping backend flags).
 *   2. Feature flag `enableTalentHubV2` (server-driven).
 *   3. IXP experiment `enableTalentHubV2` === 1 / true.
 *   4. M2 implies V2 — if any M2 signal (flag or IXP) is on, V2 is on.
 *   5. `?th2=1` on QA-allowed hosts → force-ON.
 *
 * Query params are only honoured on QA-allowed hosts (sitetest / non-prod).
 * On production hosts, `isQaOverrideHostAllowed()` returns false and the
 * query params are ignored, so prod users cannot toggle the feature via URL.
 *
 * `isFetched` stays false until settings, IXP, AND the Next.js router are
 * all ready, so callers can avoid a flash-of-404 while enrollment loads.
 */
export function useIsV2Enabled(): { v2Enabled: boolean; isFetched: boolean } {
  const { settings, isFetched: isSettingsFetched } = useSettings();
  const { params: ixpParams, isFetched: isIxpFetched } = useIXPParameters(IXPLayers.TalentHub, {
    restoreInitialValueFromCache: true,
  });
  const router = useRouter();
  const localMode = router.isReady && isLocalTh2DevModeEnabled();

  if (localMode) {
    return { v2Enabled: true, isFetched: true };
  }

  const qaAllowed = router.isReady && isQaOverrideHostAllowed();
  const queryForceOff = qaAllowed && router.query.th2 === '0';
  const queryForceOn = qaAllowed && router.query.th2 === '1';

  const v2Flag = !!settings?.[FeatureFlagName.enableTalentHubV2];
  const m2Flag = !!settings?.[FeatureFlagName.enableTalentHubV2M2];

  const v2IxpValue = ixpParams[TalentHubParameters.EnableTalentHubV2];
  const v2IxpEnabled = v2IxpValue === 1 || v2IxpValue === true;

  const m2IxpValue = ixpParams[TalentHubParameters.EnableTalentHubV2M2];
  const m2IxpEnabled = m2IxpValue === 1 || m2IxpValue === true;

  const v2Enabled = queryForceOff
    ? false
    : v2Flag || v2IxpEnabled || m2Flag || m2IxpEnabled || queryForceOn;

  return {
    v2Enabled,
    isFetched: isSettingsFetched && isIxpFetched && router.isReady,
  };
}

export default useIsV2Enabled;
