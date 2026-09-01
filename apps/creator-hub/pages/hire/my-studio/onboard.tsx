import React, { type ReactNode } from 'react';
import type { NextLayoutPage } from 'next';
import Head from 'next/head';
import { LoadingState } from '@modules/talent-hub-v2/components/feedback/LoadingState';
import { MocksAuthBypass } from '@modules/talent-hub-v2/components/shared/MocksAuthBypass';
import { TalentHubLayout } from '@modules/talent-hub-v2/components/shared/TalentHubLayout';
import { StudioOnboardingCriteria } from '@modules/talent-hub-v2/containers/StudioOnboardingCriteria';
import { StudioOnboardingSurveyCTA } from '@modules/talent-hub-v2/containers/StudioOnboardingV2Container';
import RequireAccountContext from '@modules/talent-hub-v2/guards/RequireAccountContext';
import TalentHubV2Guard from '@modules/talent-hub-v2/guards/TalentHubV2Guard';
import { useIsM2Enabled } from '@modules/talent-hub-v2/hooks/useIsM2Enabled';

/**
 * Studio onboarding entry. With M2 enabled: in-product criteria screen; otherwise
 * the Qualtrics survey CTA (manual-review gated `POST /api/Studios`). Studio-context only.
 */
const StudioOnboardPageContent: React.FC = () => {
  const { m2Enabled, isFetched } = useIsM2Enabled();

  if (!isFetched) {
    return <LoadingState itemCount={3} />;
  }

  return (
    <>
      <Head>
        {/* oxlint-disable-next-line rbx/no-hardcoded-translation-string - outof scope for this PR. @cmurphy to fix  */}
        <title>Onboard your studio - Talent Hub</title>
        <meta
          name='description'
          content='Get your studio listed on Talent Hub to post jobs and find creators.'
          key='description'
        />
      </Head>
      {m2Enabled ? <StudioOnboardingCriteria /> : <StudioOnboardingSurveyCTA />}
    </>
  );
};

const StudioOnboardPage: NextLayoutPage = () => (
  <MocksAuthBypass>
    <TalentHubV2Guard
      v2={
        <RequireAccountContext context='studio'>
          <StudioOnboardPageContent />
        </RequireAccountContext>
      }
    />
  </MocksAuthBypass>
);

StudioOnboardPage.getPageLayout = (page: ReactNode) => (
  <TalentHubLayout crumbs={[{ label: 'Manage' }, { label: 'My studio' }, { label: 'Onboard' }]}>
    {page}
  </TalentHubLayout>
);

StudioOnboardPage.loggerConfig = { rosId: RosTeams.Knowledge };
export default StudioOnboardPage;
