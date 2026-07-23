import { useRouter } from 'next/router';
import React from 'react';
import { IXPLayers, TalentHubParameters } from '@modules/clients/ixpExperiments';
import { PageNotFound } from '@modules/miscellaneous/error';
import useIXPParameters from '@modules/miscellaneous/hooks/useIXPParameters';
import { FeatureFlagName } from '@modules/settings/SettingsProvider/featureFlags';
import { useSettings } from '@modules/settings/SettingsProvider/SettingsProvider';
import { isQaOverrideHostAllowed } from '../utils';

type TalentHubM2GuardProps = {
  children: React.ReactNode;
};

type QaOverride = 'on' | 'off' | 'none';

function useM2QueryParamOverride(): QaOverride {
  const { query } = useRouter();
  if (!isQaOverrideHostAllowed()) {
    return 'none';
  }
  if (query.th2m2 === '1') {
    return 'on';
  }
  if (query.th2m2 === '0') {
    return 'off';
  }
  return 'none';
}

/**
 * M2 guard. Requires M2 enrollment (IXP, feature flag, or QA override).
 * M2 implies V2 — if M2 is on, V2 pages are also accessible.
 * If M2 is off, falls back to requiring V2 enrollment to show 404 vs content.
 *
 * `?th2m2=0` on allowed hosts (non-prod / sitetest) force-denies so QA can
 * verify the gated-off experience. Prod hosts ignore the query entirely.
 */
const TalentHubM2Guard: React.FC<TalentHubM2GuardProps> = ({ children }) => {
  const { settings, isFetched } = useSettings();
  const queryOverride = useM2QueryParamOverride();
  const { params: ixpParams, isFetched: isIxpFetched } = useIXPParameters(IXPLayers.TalentHub, {
    restoreInitialValueFromCache: true,
  });

  if (!isFetched || !isIxpFetched) {
    return null;
  }

  if (queryOverride === 'off') {
    return <PageNotFound />;
  }

  const m2IxpValue = ixpParams[TalentHubParameters.EnableTalentHubV2M2];
  const m2Enabled =
    !!settings?.[FeatureFlagName.enableTalentHubV2M2] ||
    m2IxpValue === 1 ||
    m2IxpValue === true ||
    queryOverride === 'on';

  if (!m2Enabled) {
    return <PageNotFound />;
  }

  return <>{children}</>;
};

export default TalentHubM2Guard;
