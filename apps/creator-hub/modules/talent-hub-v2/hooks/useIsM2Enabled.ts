import { useRouter } from 'next/router';
import { IXPLayers, TalentHubParameters } from '@modules/clients/ixpExperiments';
import useIXPParameters from '@modules/miscellaneous/hooks/useIXPParameters';
import { FeatureFlagName } from '@modules/settings/SettingsProvider/featureFlags';
import { useSettings } from '@modules/settings/SettingsProvider/SettingsProvider';
import { isLocalTh2DevModeEnabled, isQaOverrideHostAllowed } from '../utils';

/**
 * Unified check for whether TH2 M2 features are enabled.
 * Checks (in order):
 *   - `?th2m2=0` force-off (QA-allowed hosts only) — returns false immediately.
 *   - feature flag, IXP experiment, `?th2m2=1` force-on (QA-allowed hosts only).
 *
 * The query params are only honoured on QA-allowed hosts (sitetest / non-prod),
 * so prod users cannot toggle the feature via URL.
 *
 * `isFetched` is false until settings, IXP, AND the Next.js router are all
 * ready.  This prevents a race where the guard renders PageNotFound before
 * query-param overrides are available.
 */
export function useIsM2Enabled(): { m2Enabled: boolean; isFetched: boolean } {
  const { settings, isFetched: isSettingsFetched } = useSettings();
  const { params: ixpParams, isFetched: isIxpFetched } = useIXPParameters(IXPLayers.TalentHub, {
    restoreInitialValueFromCache: true,
  });
  const router = useRouter();
  const localMode = router.isReady && isLocalTh2DevModeEnabled();

  if (localMode) {
    return { m2Enabled: true, isFetched: true };
  }

  const qaAllowed = router.isReady && isQaOverrideHostAllowed();
  const queryForceOff = qaAllowed && router.query.th2m2 === '0';
  const queryForceOn = qaAllowed && router.query.th2m2 === '1';

  const flagEnabled = !!settings?.[FeatureFlagName.enableTalentHubV2M2];
  const m2IxpValue = ixpParams[TalentHubParameters.EnableTalentHubV2M2];
  const ixpEnabled = m2IxpValue === 1 || m2IxpValue === true;

  const m2Enabled = queryForceOff ? false : flagEnabled || ixpEnabled || queryForceOn;

  return {
    m2Enabled,
    isFetched: isSettingsFetched && isIxpFetched && router.isReady,
  };
}

export default useIsM2Enabled;
