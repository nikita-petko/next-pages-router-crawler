import type { ReactNode } from 'react';
import React from 'react';
import type { NextLayoutPage } from 'next';
import Authenticated from '@modules/authentication/Authenticated';
import { LoadingState } from '@modules/talent-hub-v2/components/feedback/LoadingState';
import { TalentHubLayout } from '@modules/talent-hub-v2/components/shared/TalentHubLayout';
import { StudioOnboardingV2Container } from '@modules/talent-hub-v2/containers/StudioOnboardingV2Container';
import RequireAccountContext from '@modules/talent-hub-v2/guards/RequireAccountContext';
import TalentHubM2Guard from '@modules/talent-hub-v2/guards/TalentHubM2Guard';
import { useMyStudios } from '@modules/talent-hub-v2/hooks/useMyStudios';

/**
 * Post a new job under the current studio. Studio-context only; the
 * container handles the survey-fallback case (no studio on record) and the
 * form case (studio exists and user has write permission).
 */
const PostJobPageContent: React.FC = () => {
  const { data: myStudiosData, isFetching } = useMyStudios();

  if (isFetching) {
    return <LoadingState itemCount={3} />;
  }

  const studioId = myStudiosData?.studios?.[0]?.id ?? undefined;
  return <StudioOnboardingV2Container studioId={studioId} />;
};

const PostJobPage: NextLayoutPage = () => (
  <Authenticated>
    <TalentHubM2Guard>
      <RequireAccountContext context='studio'>
        <PostJobPageContent />
      </RequireAccountContext>
    </TalentHubM2Guard>
  </Authenticated>
);

PostJobPage.getPageLayout = (page: ReactNode) => (
  <TalentHubLayout crumbs={[{ label: 'Manage' }, { label: 'My studio' }, { label: 'Post a job' }]}>
    {page}
  </TalentHubLayout>
);
PostJobPage.loggerConfig = { rosId: RosTeams.Knowledge };

export default PostJobPage;
