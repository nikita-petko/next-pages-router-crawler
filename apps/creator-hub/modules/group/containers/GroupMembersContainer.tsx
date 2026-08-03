import type { FunctionComponent } from 'react';
import React from 'react';
import { useFlag } from '@rbx/flags';
import { UnificationOptInModal } from '@rbx/group-management';
import { withTranslation } from '@rbx/intl';
import { CircularProgress, Grid } from '@rbx/ui';
import { isUnifiedUiEnabled } from '@generated/flags/groups';
import { useAuthentication } from '@modules/authentication/providers';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { creatorHub, www } from '@modules/miscellaneous/urls';
import GroupMembersV2 from '../components/groupMembersV2/GroupMembersV2';
import useCurrentOrganization from '../hooks/useCurrentOrganization';

const GroupMembersContainer: FunctionComponent<React.PropsWithChildren> = () => {
  const { organization, permissions } = useCurrentOrganization();
  const { user } = useAuthentication();
  const { value: isUnifiedUIEnabled } = useFlag(isUnifiedUiEnabled);

  if (!organization) {
    return (
      <Grid container justifyContent='center'>
        <CircularProgress />
      </Grid>
    );
  }

  return (
    <>
      {organization.groupId && user?.id && isUnifiedUIEnabled && permissions?.isOwner && (
        <UnificationOptInModal
          groupId={Number(organization.groupId)}
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
