import type { FunctionComponent } from 'react';
import React from 'react';
import { UnificationOptInModal } from '@rbx/group-management';
import { withTranslation } from '@rbx/intl';
import { CircularProgress, Grid } from '@rbx/ui';
import { useAuthentication } from '@modules/authentication/providers';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { creatorHub, www } from '@modules/miscellaneous/urls';
import { useGetGroupProductFeatures } from '@modules/react-query/groups/groupQueries';
import GroupMembersV2 from '../components/groupMembersV2/GroupMembersV2';
import useCurrentOrganization from '../hooks/useCurrentOrganization';

const GroupMembersContainer: FunctionComponent<React.PropsWithChildren> = () => {
  const { organization, permissions } = useCurrentOrganization();
  const { user } = useAuthentication();
  const groupId = organization?.groupId ? Number(organization.groupId) : undefined;
  const { data: productFeatures, isLoading: isProductFeaturesLoading } =
    useGetGroupProductFeatures(groupId);

  const isUnifiedUIEnabled = productFeatures?.isUnifiedUIEnabled === true;

  if (!organization || isProductFeaturesLoading) {
    return (
      <Grid container justifyContent='center'>
        <CircularProgress />
      </Grid>
    );
  }

  return (
    <>
      {groupId && user?.id && isUnifiedUIEnabled && permissions?.isOwner && (
        <UnificationOptInModal
          groupId={groupId}
          userId={user.id}
          getCreatorHubRoleUrl={creatorHub.getGroupRoleUrl}
          getLegacyRolesUrl={www.getConfigureGroupRolesUrl}
        />
      )}
      <GroupMembersV2 />
    </>
  );
};

export default withTranslation(GroupMembersContainer, [TranslationNamespace.Organization]);
