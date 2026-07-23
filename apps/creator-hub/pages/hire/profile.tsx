import React from 'react';
import type { NextLayoutPage } from 'next';
import Authenticated from '@modules/authentication/Authenticated';

import { PageNotFound } from '@modules/miscellaneous/error';
import TalentHubV2Guard from '@modules/talent-hub-v2/guards/TalentHubV2Guard';
import StudioProfileV2Container from '@modules/talent-hub-v2/containers/StudioProfileV2Container';
import { TalentHubLayout } from '@modules/talent-hub-v2/components/shared/TalentHubLayout';
import { useMyStudios } from '@modules/talent-hub-v2/hooks/useMyStudios';

const ProfilePageContent: React.FC = () => {
  const { data, isLoading } = useMyStudios();
  if (isLoading) return null;

  const studioId = data?.studios?.[0]?.id;
  if (studioId) {
    return (
      <TalentHubLayout crumbs={[{ label: 'Manage' }, { label: 'Profile' }]}>
        <StudioProfileV2Container studioId={studioId} context='profile' />
      </TalentHubLayout>
    );
  }

  return <PageNotFound />;
};

const TalentProfilePage: NextLayoutPage = () => (
  <Authenticated>
    <TalentHubV2Guard v2={<ProfilePageContent />} />
  </Authenticated>
);

export default TalentProfilePage;
