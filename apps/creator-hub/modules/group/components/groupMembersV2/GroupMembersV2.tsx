import { FunctionComponent, useEffect, useState } from 'react';
import { useTranslation } from '@rbx/intl';
import { Grid, makeStyles } from '@rbx/ui';
import { RoleMetadata } from '@rbx/clients/organizationsServiceApi';
import { useGetOrganizationRoles } from '@modules/react-query/groupMembers';
import { buildBreadcrumb, buildTitle, HubMeta } from '@rbx/creator-hub-history';
import MaintenanceBanner from '../MaintenanceBanner';
import { DefaultMemberRoleId, GroupMembersMenuState } from '../../constants/groupConstants';
import GroupMembersMenu from './GroupMembersMenu';
import GroupInviteButtonV2 from './GroupInviteButtonV2';
import GroupRolesMenu from '../GroupRolesMenu';
import useCurrentOrganization from '../../hooks/useCurrentOrganization';
import GroupMembersTable from './GroupMembersTableV2';

const useStyles = makeStyles()((theme) => ({
  container: {
    gap: 8,
    [theme.breakpoints.down('Large')]: {
      paddingLeft: 12,
      paddingRight: 12,
    },
  },

  inviteRowContainer: {
    gap: 16,
    paddingTop: 16,
  },
}));

const GroupMembers: FunctionComponent = () => {
  const { translate } = useTranslation();
  const {
    classes: { container, inviteRowContainer },
  } = useStyles();

  const { organization, permissions } = useCurrentOrganization();
  const { data: roles } = useGetOrganizationRoles(organization?.id);

  const [menuState, setMenuState] = useState(GroupMembersMenuState.Members);
  const [roleFilter, setRoleFilter] = useState<RoleMetadata | null>(null);

  useEffect(() => {
    if (!roleFilter) {
      setRoleFilter(roles?.find((role) => role.id === DefaultMemberRoleId) ?? null);
    }
  }, [roles, roleFilter]);

  return (
    <Grid container className={container}>
      <HubMeta
        title={buildTitle(translate('Heading.Members'))}
        breadcrumb={buildBreadcrumb(translate('Label.Group'), translate('Heading.Members'))}
      />
      <MaintenanceBanner />
      {permissions?.canManageMembers && (
        <GroupMembersMenu menuState={menuState} onMenuStateChange={setMenuState} />
      )}
      <Grid container direction='row' className={inviteRowContainer}>
        {permissions?.canManageMembers && <GroupInviteButtonV2 />}
        <GroupRolesMenu value={roleFilter} onSelect={setRoleFilter} />
      </Grid>
      <GroupMembersTable menuState={menuState} roleFilter={roleFilter} />
    </Grid>
  );
};

export default GroupMembers;
