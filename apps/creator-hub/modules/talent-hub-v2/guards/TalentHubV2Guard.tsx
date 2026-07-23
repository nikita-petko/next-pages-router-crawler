import React from 'react';
import { useRouter } from 'next/router';
import { FeatureFlagName, useSettings } from '@modules/settings';
import { PageNotFound } from '@modules/miscellaneous/error';
import useIXPParameters from '@modules/miscellaneous/hooks/useIXPParameters';
import { IXPLayers, TalentHubParameters } from '@modules/clients/ixpExperiments';
import { isQaOverrideHostAllowed } from '../utils';

type TalentHubV2GuardProps = {
  v2: React.ReactNode;
};

function useQueryParamOverride(): boolean {
  const { query } = useRouter();
  if (!isQaOverrideHostAllowed()) return false;
  return query.th2 === '1';
}

const TalentHubV2Guard: React.FC<TalentHubV2GuardProps> = ({ v2 }) => {
  const { settings, isFetched } = useSettings();
  const queryOverride = useQueryParamOverride();
  const { params: ixpParams, isFetched: isIxpFetched } = useIXPParameters(IXPLayers.TalentHub, {
    restoreInitialValueFromCache: true,
  });

  if (!isFetched || !isIxpFetched) return null;

  const ixpValue = ixpParams[TalentHubParameters.EnableTalentHubV2];
  const ixpEnabled = ixpValue === 1 || ixpValue === true;

  if (settings?.[FeatureFlagName.enableTalentHubV2] || ixpEnabled || queryOverride) {
    return <React.Fragment>{v2}</React.Fragment>;
  }

  return <PageNotFound />;
};

export default TalentHubV2Guard;
