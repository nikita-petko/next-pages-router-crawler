import type { FunctionComponent } from 'react';
import { Fragment, useCallback, useEffect, useState } from 'react';
import type { Member, RoleMetadata } from '@rbx/client-organizations-service-api/v1';
import { RoleColorType } from '@rbx/client-organizations-service-api/v1';
import { useTranslation } from '@rbx/intl';
import {
  Grid,
  makeStyles,
  Chip,
  SupervisedUserCircleOutlinedIcon,
  Tooltip,
  Skeleton,
  CloseIcon,
} from '@rbx/ui';
import { useAuthentication } from '@modules/authentication/providers';
import { useUnifiedLoggerProvider } from '@modules/miscellaneous/hooks/UnifiedLoggerProvider';
import { useRemoveUserFromRole, useGetUsersGroupRole } from '@modules/react-query/groupMembers';
import type { GroupMembersMenuState } from '../../constants/groupConstants';
import { DefaultMemberRoleId } from '../../constants/groupConstants';
import useBottomToast from '../../hooks/useBottomToast';
import useCanAssignRoles from '../../hooks/useCanAssignRoles';
import useCurrentOrganization from '../../hooks/useCurrentOrganization';
import { OrganizationsEventName, logOrganizationsEvent } from '../../utils/eventUtils';
import { getRoleStyle, sortRolesById } from '../../utils/groupUtils';

const useGroupMemberRoleChipsStyles = makeStyles()((theme) => ({
  chipContainer: {
    fontSize: 12,
    margin: '4px 0px',
    maxWidth: 160,
  },

  legacyChip: {
    cursor: 'pointer',
    color: theme.palette.content.disabled,
  },

  icon: {
    paddingLeft: 4,
  },
}));

export type GroupMemberRoleChipsProps = {
  member: Member;
  menuState: GroupMembersMenuState;
};

const GroupMemberRoleChips: FunctionComponent<GroupMemberRoleChipsProps> = ({
  member,
  menuState,
}) => {
  const { translate } = useTranslation();
  const {
    classes: { chipContainer, legacyChip, icon },
    cx,
  } = useGroupMemberRoleChipsStyles();
  const { showBottomToast } = useBottomToast();
  const { user: currentUser } = useAuthentication();

  const { unifiedLogger } = useUnifiedLoggerProvider();
  const { organization, permissions, refreshPermission } = useCurrentOrganization();
  const { isUnrestricted } = useCanAssignRoles();
  const { data: legacyRole } = useGetUsersGroupRole(
    Number.parseInt(member.userId ?? '0', 10),
    organization?.groupId,
  );
  const { mutate: removeUserFromRole } = useRemoveUserFromRole();

  const [hoveredChip, setHoveredChip] = useState<string>();

  const [memberRoles, setMemberRoles] = useState<RoleMetadata[] | null | undefined>(member.roles);

  const onRemoveRole = useCallback(
    async (role: RoleMetadata) => {
      if (!organization?.id || !member.userId || !role.id) {
        return;
      }
      setMemberRoles((prevRoles) =>
        (prevRoles ?? []).filter((prevRole) => prevRole.id !== role.id),
      );
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
            showBottomToast(translate('Message.RoleRemoved'));
          },
          onError: () => {
            setMemberRoles((prevRoles) => (prevRoles ?? []).concat(role));
            showBottomToast(translate('Error.RemovingRole'), { severity: 'error' });
          },
        },
      );
      logOrganizationsEvent(unifiedLogger, OrganizationsEventName.ClickOrgsRemoveRoleFromMember, {
        group_id: organization?.groupId ?? '',
        role_id: role.id?.toString() ?? '',
        user_id: member.userId?.toString() ?? '',
        member_status: menuState,
      });
    },
    [
      organization,
      member,
      removeUserFromRole,
      unifiedLogger,
      showBottomToast,
      translate,
      currentUser,
      refreshPermission,
      menuState,
    ],
  );

  useEffect(() => {
    setMemberRoles(member.roles);
  }, [member.roles]);

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
            className={cx(chipContainer, legacyChip)}
            icon={
              <SupervisedUserCircleOutlinedIcon
                className={icon}
                style={getRoleStyle(RoleColorType.Invalid)}
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
            .filter((role) => role.id !== DefaultMemberRoleId)
            .map((role) => (
              <Chip
                key={role.id}
                label={role.name}
                color='secondary'
                size='small'
                variant='outlined'
                className={chipContainer}
                icon={
                  hoveredChip === role.id ? (
                    <CloseIcon
                      className={icon}
                      onClick={() => {
                        onRemoveRole(role);
                      }}
                    />
                  ) : (
                    <SupervisedUserCircleOutlinedIcon
                      className={icon}
                      style={getRoleStyle(role.color)}
                    />
                  )
                }
                onMouseEnter={() => {
                  if (
                    role.id &&
                    (permissions?.assignableRoleIds.includes(role.id) || isUnrestricted)
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
