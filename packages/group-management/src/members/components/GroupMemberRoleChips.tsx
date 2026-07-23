import type { FunctionComponent } from 'react';
import React, { useCallback, useState } from 'react';
import { useTranslation } from '@rbx/intl';
import {
  Chip,
  CloseIcon,
  Grid,
  makeStyles,
  Skeleton,
  SupervisedUserCircleOutlinedIcon,
  Tooltip,
} from '@rbx/ui';
import type { GroupRoleMetadata, GroupUserWithRoles } from '../../clients/groups';
import useCanAssignRoles from '../../hooks/useCanAssignRoles';
import useCurrentGroup from '../../hooks/useCurrentGroup';
import {
  useGetUsersGroupRole,
  useRemoveInvitedFromRole,
  useRemoveUserFromRole,
} from '../../queries';
import {
  DefaultMemberRoleIdNumber,
  DefaultRoleColor,
  GroupMembersMenuState,
} from '../../utils/constants';
import { OrganizationsEventName, logOrganizationsEvent } from '../../utils/eventUtils';
import { getRoleStyle, sortRolesById } from '../../utils/groupUtils';

const useGroupMemberRoleChipsStyles = makeStyles()((theme) => ({
  legacyChip: {
    color: theme.palette.content.disabled,
  },
}));

export type GroupMemberRoleChipsProps = {
  member: GroupUserWithRoles;
  menuState: GroupMembersMenuState;
};

const GroupMemberRoleChips: FunctionComponent<GroupMemberRoleChipsProps> = ({
  member,
  menuState,
}) => {
  const { translate } = useTranslation();
  const {
    classes: { legacyChip },
  } = useGroupMemberRoleChipsStyles();

  const {
    organization,
    permissions,
    refreshPermission,
    user: currentUser,
    unifiedLogger,
    showToast,
  } = useCurrentGroup();
  const { isUnrestricted } = useCanAssignRoles();
  const { data: legacyRole } = useGetUsersGroupRole(
    member.user?.userId ?? 0,
    organization?.groupId,
  );
  const { mutate: removeUserFromRole } = useRemoveUserFromRole();
  const { mutate: removeInvitedFromRole } = useRemoveInvitedFromRole();

  const [hoveredChip, setHoveredChip] = useState<number>();

  const [memberRoles, setMemberRoles] = useState<GroupRoleMetadata[] | null | undefined>(
    member.roles,
  );
  const [prevMemberRoles, setPrevMemberRoles] = useState(member.roles);
  if (prevMemberRoles !== member.roles) {
    setPrevMemberRoles(member.roles);
    setMemberRoles(member.roles);
  }

  const onRemoveRole = useCallback(
    async (role: GroupRoleMetadata) => {
      if (!organization?.id || !member.user?.userId || !role.id) {
        return;
      }
      setMemberRoles((prevRoles) =>
        (prevRoles ?? []).filter((prevRole) => prevRole.id !== role.id),
      );
      if (menuState === GroupMembersMenuState.Invited) {
        removeInvitedFromRole(
          {
            organizationId: organization.id,
            member,
            roleId: role.id,
          },
          {
            onSuccess: () => {
              showToast(translate('Message.RoleRemoved'));
            },
            onError: () => {
              setMemberRoles((prevRoles) => (prevRoles ?? []).concat(role));
              showToast(translate('Error.RemovingRole'), true);
            },
          },
        );
      } else {
        removeUserFromRole(
          {
            groupId: organization.groupId,
            member,
            roleId: role.id,
          },
          {
            onSuccess: () => {
              if (member.user?.userId === currentUser?.id) {
                void refreshPermission();
              }
              showToast(translate('Message.RoleRemoved'));
            },
            onError: () => {
              setMemberRoles((prevRoles) => (prevRoles ?? []).concat(role));
              showToast(translate('Error.RemovingRole'), true);
            },
          },
        );
      }
      logOrganizationsEvent(unifiedLogger, OrganizationsEventName.ClickOrgsRemoveRoleFromMember, {
        group_id: organization?.groupId ?? '',
        role_id: role.id?.toString() ?? '',
        user_id: member.user?.userId?.toString() ?? '',
        member_status: menuState,
      });
    },
    [
      organization,
      member,
      removeUserFromRole,
      removeInvitedFromRole,
      unifiedLogger,
      showToast,
      translate,
      currentUser,
      refreshPermission,
      menuState,
    ],
  );

  return (
    <Grid container alignItems='center' columnGap={1}>
      {legacyRole?.role && (
        <Tooltip
          data-testid='legacy-role-tooltip'
          arrow
          title={translate('Description.LegacyRoleTooltip')}
          placement='right'
          enterTouchDelay={0}
          leaveTouchDelay={3000}>
          <Chip
            key={legacyRole.role.id}
            label={legacyRole.role.name}
            color='secondary'
            size='small'
            variant='outlined'
            className={legacyChip}
            style={{ fontSize: 12, margin: '4px 0px', maxWidth: 160, cursor: 'pointer' }}
            icon={
              <SupervisedUserCircleOutlinedIcon
                className='padding-left-xsmall'
                style={getRoleStyle(DefaultRoleColor)}
              />
            }
          />
        </Tooltip>
      )}
      {member.roles === undefined ? (
        <Skeleton animate variant='rectangular' width={160} height={24} />
      ) : (
        <>
          {memberRoles
            ?.sort(sortRolesById)
            .filter((role) => role.id !== DefaultMemberRoleIdNumber)
            .map((role) => (
              <Chip
                key={role.id}
                label={role.name}
                color='secondary'
                size='small'
                variant='outlined'
                style={{ fontSize: 12, margin: '4px 0px', maxWidth: 160 }}
                icon={
                  hoveredChip === role.id ? (
                    <CloseIcon
                      className='padding-left-xsmall'
                      onClick={() => {
                        void onRemoveRole(role);
                      }}
                    />
                  ) : (
                    <SupervisedUserCircleOutlinedIcon
                      className='padding-left-xsmall'
                      style={getRoleStyle(role.color)}
                    />
                  )
                }
                onMouseEnter={() => {
                  if (
                    role.id &&
                    (permissions?.assignableRoleIds.includes(role.id.toString()) || isUnrestricted)
                  ) {
                    setHoveredChip(role.id);
                  }
                }}
                onMouseLeave={() => {
                  setHoveredChip(undefined);
                }}
              />
            ))}
        </>
      )}
    </Grid>
  );
};

export default GroupMemberRoleChips;
