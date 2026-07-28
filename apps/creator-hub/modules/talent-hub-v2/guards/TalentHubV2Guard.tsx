import React from 'react';
import { PageNotFound } from '@modules/miscellaneous/error';
import { useIsV2Enabled } from '../hooks/useIsV2Enabled';

type TalentHubV2GuardProps = {
  v2: React.ReactNode;
};

/**
 * Gate for TH2 V2 pages. Renders children when V2 is enabled (per
 * `useIsV2Enabled`), otherwise renders `<PageNotFound />`.
 *
 * NOTE: this guard runs INSIDE the Talent Hub layout, so the page-level
 * sidenav would still render even when denied. `TalentHubLayout` itself
 * calls `useIsV2Enabled` and swaps to a neutral 404 layout (no Talent
 * chrome) when denied — so unenrolled prod users see a generic 404 with
 * no hint that the feature exists.
 */
const TalentHubV2Guard: React.FC<TalentHubV2GuardProps> = ({ v2 }) => {
  const { v2Enabled, isFetched } = useIsV2Enabled();

  if (!isFetched) {
    return null;
  }
  if (!v2Enabled) {
    return <PageNotFound />;
  }

  return <>{v2}</>;
};

export default TalentHubV2Guard;
