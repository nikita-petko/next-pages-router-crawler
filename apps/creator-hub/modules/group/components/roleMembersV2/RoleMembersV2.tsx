import React, { FunctionComponent, useEffect, useState } from 'react';
import { RoleMetadata } from '@rbx/clients/organizationsServiceApi';
import { Chip, Grid } from '@rbx/ui';
import { useGetInvitationsWithRole } from '@modules/react-query/groupMembers';
import { useTranslation } from '@rbx/intl';
import useCurrentOrganization from '../../hooks/useCurrentOrganization';
import {
  DefaultMemberRoleId,
  GroupMembersMenuState,
  MembersPageSize,
} from '../../constants/groupConstants';
import GroupMembersTableV2 from '../groupMembersV2/GroupMembersTableV2';
import AddUserToRoleButtonV2 from './AddUserToRoleButtonV2';

export type RoleMembersV2Props = {
  role: RoleMetadata;
};

const RoleMembersV2: FunctionComponent<RoleMembersV2Props> = ({ role }) => {
  const { translate } = useTranslation();

  const { organization, permissions } = useCurrentOrganization();
  const { data: { invitationRoles } = {} } = useGetInvitationsWithRole(
    organization?.id,
    role.id,
    undefined,
    MembersPageSize,
    role.id === DefaultMemberRoleId,
  );

  const [menuState, setMenuState] = useState(GroupMembersMenuState.Members);

  useEffect(() => {
    if (invitationRoles?.length === 0) {
      setMenuState(GroupMembersMenuState.Members);
    }
  }, [invitationRoles]);

  return (
    <Grid container gap={3} paddingTop={3}>
      {invitationRoles && invitationRoles.length > 0 && (
        <Grid container item gap={1}>
          <Chip
            label={translate(`Label.Members`)}
            color={menuState === GroupMembersMenuState.Members ? 'primary' : 'secondary'}
            onClick={() => setMenuState(GroupMembersMenuState.Members)}
          />
          <Chip
            label={translate(`Label.Invited`)}
            color={menuState === GroupMembersMenuState.Invited ? 'primary' : 'secondary'}
            onClick={() => setMenuState(GroupMembersMenuState.Invited)}
          />
        </Grid>
      )}
      {permissions?.assignableRoleIds.includes(role.id) && <AddUserToRoleButtonV2 role={role} />}
      <GroupMembersTableV2 menuState={menuState} roleFilter={role} isRoleMembersPage />
    </Grid>
  );
};

export default RoleMembersV2;
