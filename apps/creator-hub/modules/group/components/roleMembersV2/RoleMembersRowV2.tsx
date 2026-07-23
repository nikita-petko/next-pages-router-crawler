import type { FunctionComponent } from 'react';
import { useCallback, useState } from 'react';
import type { Member, RoleMetadata } from '@rbx/client-organizations-service-api/v1';
import type { RobloxUsersApiGetUserResponse } from '@rbx/client-users/v1';
import { useTranslation } from '@rbx/intl';
import { Button, Grid, makeStyles } from '@rbx/ui';
import { useAuthentication } from '@modules/authentication/providers';
import { CreatorType } from '@modules/miscellaneous/common';
import ThumbnailWithNames from '@modules/miscellaneous/components/ThumbnailWithNames';
import { useUnifiedLoggerProvider } from '@modules/miscellaneous/hooks/UnifiedLoggerProvider';
import { useRemoveUserFromRole } from '@modules/react-query/groupMembers';
import type { InvitedMember } from '../../constants/groupConstants';
import { GroupMembersMenuState } from '../../constants/groupConstants';
import useBottomToast from '../../hooks/useBottomToast';
import useCurrentOrganization from '../../hooks/useCurrentOrganization';
import { OrganizationsEventName, logOrganizationsEvent } from '../../utils/eventUtils';

const useRoleMembersRowStyles = makeStyles()(() => ({
  container: {
    borderRadius: 4,
    padding: '8px 0px',
  },
}));

export type RoleMembersRowProps = {
  member: Member | InvitedMember;
  user?: RobloxUsersApiGetUserResponse;
  menuState: GroupMembersMenuState;
  role: RoleMetadata | null;
};

const RoleMembersRow: FunctionComponent<RoleMembersRowProps> = ({
  member,
  user,
  menuState,
  role,
}) => {
  const { translate } = useTranslation();
  const { user: currentUser } = useAuthentication();
  const { showBottomToast } = useBottomToast();
  const { unifiedLogger } = useUnifiedLoggerProvider();
  const {
    classes: { container },
  } = useRoleMembersRowStyles();

  const { organization, permissions, refreshPermission } = useCurrentOrganization();
  const { mutate: removeUserFromRole } = useRemoveUserFromRole();

  const [isRemoving, setIsRemoving] = useState(false);

  const onRemoveRole = useCallback(async () => {
    if (!organization?.id || !member || !role?.id) {
      return;
    }
    setIsRemoving(true);
    removeUserFromRole(
      {
        organizationId: organization.id,
        member,
        roleId: role.id,
      },
      {
        onSuccess: () => {
          if (member.userId === currentUser?.id.toString()) {
            refreshPermission();
          }
          showBottomToast(translate('Message.UserRemoved'));
        },
        onError: () => {
          setIsRemoving(false);
          showBottomToast(translate('Error.RemovingUser'), { severity: 'error' });
        },
      },
    );
    logOrganizationsEvent(unifiedLogger, OrganizationsEventName.ClickOrgsRemoveMemberFromRole, {
      group_id: organization?.groupId ?? '',
      role_id: role.id?.toString() ?? '',
      user_id: member.userId?.toString() ?? '',
      member_status: menuState,
    });
  }, [
    organization,
    member,
    role,
    removeUserFromRole,
    unifiedLogger,
    menuState,
    currentUser,
    showBottomToast,
    translate,
    refreshPermission,
  ]);

  return (
    <Grid container className={container} wrap='nowrap' flexDirection='row'>
      <Grid container item flexShrink={1} minWidth={0}>
        <ThumbnailWithNames
          target={{
            id: member?.userId ? Number.parseInt(member.userId, 10) : undefined,
            name: user?.name,
            displayName: user?.displayName,
          }}
          targetType={CreatorType.User}
          label={
            menuState === GroupMembersMenuState.Invited ? translate('Label.Pending') : undefined
          }
          variant='compact'
          labelTooltip={
            menuState === GroupMembersMenuState.Invited
              ? translate('Label.PendingPermissions')
              : undefined
          }
        />
      </Grid>

      {!isRemoving && role?.id && permissions?.assignableRoleIds.includes(role.id) && (
        <Grid item height='100%' alignContent='center'>
          <Button size='small' color='secondary' onClick={onRemoveRole}>
            {translate('Action.Remove')}
          </Button>
        </Grid>
      )}
    </Grid>
  );
};

export default RoleMembersRow;
