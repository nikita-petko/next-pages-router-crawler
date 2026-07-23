import React, { useEffect, type ReactNode } from 'react';
import type { NextLayoutPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { LoadingState } from '@modules/talent-hub-v2/components/feedback/LoadingState';
import { MocksAuthBypass } from '@modules/talent-hub-v2/components/shared/MocksAuthBypass';
import { TalentHubLayout } from '@modules/talent-hub-v2/components/shared/TalentHubLayout';
import { CreateStudioContainer } from '@modules/talent-hub-v2/containers/CreateStudioContainer';
import RequireAccountContext from '@modules/talent-hub-v2/guards/RequireAccountContext';
import TalentHubV2Guard from '@modules/talent-hub-v2/guards/TalentHubV2Guard';
import { useIsM2Enabled } from '@modules/talent-hub-v2/hooks/useIsM2Enabled';

/**
 * TH2 studio creation form (M2). Off-flag users are redirected to the legacy
 * empty state on `/hire/my-studio`.
 */
const StudioOnboardFormPageContent: React.FC = () => {
  const router = useRouter();
  const { m2Enabled, isFetched } = useIsM2Enabled();

  useEffect(() => {
    if (isFetched && !m2Enabled) {
      router.replace('/hire/my-studio').catch(() => {});
    }
  }, [isFetched, m2Enabled, router]);

  if (!isFetched || !m2Enabled) {
    return <LoadingState itemCount={3} />;
  }

  return (
    <>
      <Head>
        {/* oxlint-disable-next-line rbx/no-hardcoded-translation-string - outof scope for this PR. @cmurphy to fix  */}
        <title>Create your studio - Talent Hub</title>
        <meta
          name='description'
          content='Apply to Talent Hub and create a studio profile for your group.'
          key='description'
        />
      </Head>
      <CreateStudioContainer />
    </>
  );
};

const StudioOnboardFormPage: NextLayoutPage = () => (
  <MocksAuthBypass>
    <TalentHubV2Guard
      v2={
        <RequireAccountContext context='studio'>
          <StudioOnboardFormPageContent />
        </RequireAccountContext>
      }
    />
  </MocksAuthBypass>
);

StudioOnboardFormPage.getPageLayout = (page: ReactNode) => (
  <TalentHubLayout
    crumbs={[
      { label: 'Manage' },
      { label: 'My studio' },
      { label: 'Onboard' },
      { label: 'Apply' },
    ]}>
    {page}
  </TalentHubLayout>
);
StudioOnboardFormPage.loggerConfig = { rosId: RosTeams.Knowledge };

export default StudioOnboardFormPage;
