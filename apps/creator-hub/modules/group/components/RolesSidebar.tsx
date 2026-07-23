import React, { Dispatch, FunctionComponent, SetStateAction, useCallback } from 'react';
import { useTranslation } from '@rbx/intl';
import {
  Typography,
  Grid,
  makeStyles,
  Button,
  SupervisedUserCircleOutlinedIcon,
  AddIcon,
  LaunchIcon,
  IconButton,
  CircularProgress,
  Tooltip,
  InfoOutlinedIcon,
} from '@rbx/ui';
import { useUpdateRolePosition } from '@modules/react-query/organizations';
import { RoleColorType, RoleMetadata } from '@rbx/clients/organizationsServiceApi';
import { RobloxGroupsApiGroupRoleResponse } from '@rbx/clients/groups';
import { useUnifiedLoggerProvider } from '@modules/miscellaneous/hooks/UnifiedLoggerProvider';
import { Draggable, OnDragEndResponder } from '@hello-pangea/dnd';
import useCurrentOrganization from '../hooks/useCurrentOrganization';
import { getRoleStyle } from '../utils/groupUtils';
import { DefaultMemberRoleId, MaximumRoles } from '../constants/groupConstants';
import { OrganizationsEventName, logOrganizationsEvent } from '../utils/eventUtils';
import { RoleCreationMetadata } from '../interface/RoleCreationMetadata';
import RolesListRole from './RolesListRole';
import RolesListDraggableContainer from './RolesListDraggableContainer';

const useRolesSidebarStyles = makeStyles()((theme) => ({
  container: {
    margin: '32px 24px',
    [theme.breakpoints.down('Medium')]: {
      margin: '32px 0px',
    },
  },
  draggableContainer: {
    display: 'flex',
  },
  buttonContainer: {
    width: '100%',
    maxWidth: '100%',
  },
  roleButtonContainer: {
    width: '100%',
    justifyContent: 'flex-start',
    textTransform: 'none',
    '& > *:not(:first-child)': {
      display: 'block',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    },
  },

  addButtonContainer: {
    color: theme.palette.content.muted,
  },

  selectedButton: {
    borderRadius: 4,
    background: theme.palette.states.selected,
  },

  legacyRolesTitleContainer: {
    display: 'flex',
  },

  legacyRolesTitle: {
    lineHeight: '32px',
    color: theme.palette.content.muted,
  },

  legacyRolesContainer: {
    marginTop: 40,
    '& > *:not(:last-child)': {
      marginBottom: 8,
    },
  },

  icon: {
    marginLeft: 4,
  },

  mobileButton: {
    'span:not(.MuiButton-startIcon)': {
      width: '100%',
      display: 'flex',
      justifyContent: 'flex-start',
    },
  },
}));

export type RolesSidebarProps = {
  roles?: RoleCreationMetadata[];
  setRoles: Dispatch<SetStateAction<RoleCreationMetadata[] | undefined>>;
  legacyRoles?: RobloxGroupsApiGroupRoleResponse[];
  selectedRole?: RoleCreationMetadata;
  onSelectedRole: (role: RoleMetadata | null, autoSelectTab: boolean) => void;
  loading?: boolean;
  disabled?: boolean;
  isMobile?: boolean;
};
const RolesSidebar: FunctionComponent<React.PropsWithChildren<RolesSidebarProps>> = ({
  roles,
  setRoles,
  legacyRoles,
  selectedRole,
  onSelectedRole,
  loading = false,
  disabled = false,
  isMobile = false,
}) => {
  const { translate } = useTranslation();
  const { unifiedLogger } = useUnifiedLoggerProvider();
  const { organization, permissions } = useCurrentOrganization();
  const canUpdateRolePositions =
    !!permissions && (permissions.isOwner || permissions.canCreateRoles);

  const {
    classes: {
      container,
      buttonContainer,
      roleButtonContainer,
      addButtonContainer,
      legacyRolesTitleContainer,
      legacyRolesTitle,
      legacyRolesContainer,
      draggableContainer,
      icon,
    },

    cx,
  } = useRolesSidebarStyles();

  const { mutate: updateRolePosition } = useUpdateRolePosition();

  const handleSelectRole = useCallback(
    (role: RoleMetadata | null) => {
      onSelectedRole(role, !isMobile);
    },
    [onSelectedRole, isMobile],
  );

  const onDragEnd: OnDragEndResponder = useCallback(
    (result) => {
      if (
        !result.destination ||
        roles === undefined ||
        result.destination.index === result.source.index
      ) {
        return;
      }
      const newRoles = [...roles];
      const [movedItem] = newRoles.splice(result.source.index, 1);

      if (!movedItem.metadata?.id || !organization!.id) {
        return;
      }

      newRoles.splice(result.destination.index, 0, movedItem);

      setRoles(newRoles);

      const prevRoleId = newRoles[result.destination.index - 1]?.metadata?.id;
      const nextRoleId = newRoles[result.destination.index + 1]?.metadata?.id;

      updateRolePosition({
        organizationId: organization!.id,
        roleId: movedItem.metadata?.id,
        nextRoleId,
        previousRoleId: prevRoleId,
      });
    },
    [roles, setRoles, organization, updateRolePosition],
  );

  const isOrderableRole = (role: RoleCreationMetadata) => {
    return role.metadata?.id !== DefaultMemberRoleId;
  };

  return (
    <Grid
      item
      direction='column'
      alignContent='flex-start'
      className={container}
      data-testid='roles-sidebar'>
      {loading || roles === undefined ? (
        <Grid container justifyContent='center'>
          <CircularProgress />
        </Grid>
      ) : (
        <Grid container className={buttonContainer}>
          {/* Roles which can't be reordered */}
          {roles
            .filter((role) => !isOrderableRole(role))
            .map(({ metadata: role, isNewRole }) => {
              if (!role?.name || !role.id || !role.color || isNewRole === undefined) {
                return undefined;
              }

              return (
                <RolesListRole
                  key={role.id}
                  roleId={role.id!}
                  roleName={role.name!}
                  roleColor={role.color!}
                  isNewRole={isNewRole}
                  disabled={disabled}
                  isSelected={selectedRole?.metadata?.id === role.id}
                  isMobile={isMobile}
                  onClickRole={() => handleSelectRole(role)}
                />
              );
            })}

          {/* Roles which can be reordered */}
          <RolesListDraggableContainer droppableId='rolesList' onDragEnd={onDragEnd}>
            {roles.map((role, index) => {
              if (!isOrderableRole(role)) {
                return undefined;
              }

              const { metadata: roleMetadata, isNewRole } = role;
              if (
                !roleMetadata?.name ||
                !roleMetadata.id ||
                !roleMetadata.color ||
                isNewRole === undefined
              ) {
                return undefined;
              }

              return (
                <Draggable
                  key={roleMetadata.id}
                  draggableId={`${roleMetadata.id}`}
                  index={index}
                  isDragDisabled={!canUpdateRolePositions}>
                  {(provided) => (
                    <div
                      className={draggableContainer}
                      ref={provided.innerRef}
                      {...provided.draggableProps}>
                      <RolesListRole
                        key={roleMetadata.id}
                        roleId={roleMetadata.id!}
                        roleName={roleMetadata.name!}
                        roleColor={roleMetadata.color!}
                        isNewRole={isNewRole}
                        disabled={disabled}
                        isSelected={selectedRole?.metadata?.id === roleMetadata.id}
                        isMobile={isMobile}
                        onClickRole={() => handleSelectRole(roleMetadata)}
                        dragHandleProps={provided.dragHandleProps}
                      />
                    </div>
                  )}
                </Draggable>
              );
            })}
          </RolesListDraggableContainer>

          {/* Only show create role button if the user can create roles */}
          {(permissions?.isOwner || permissions?.canCreateRoles === true) && (
            <Button
              size='large'
              color='primary'
              variant='text'
              disabled={disabled || (roles ?? []).length >= MaximumRoles}
              onClick={() => {
                handleSelectRole(null);
                logOrganizationsEvent(unifiedLogger, OrganizationsEventName.ClickOrgsCreateRole, {
                  group_id: organization?.groupId ?? '',
                });
              }}
              startIcon={<AddIcon />}
              className={cx(roleButtonContainer, addButtonContainer)}>
              {translate('Action.AddARole')}
            </Button>
          )}

          <Grid
            container
            direction='column'
            alignContent='flex-start'
            className={legacyRolesContainer}>
            <Grid container justifyContent='space-between' alignContent='center'>
              <Grid item alignItems='center' className={legacyRolesTitleContainer}>
                <Typography variant='h5' className={legacyRolesTitle}>
                  {translate('Label.LegacyRoles')}
                </Typography>

                <Tooltip
                  arrow
                  title={translate('Description.LegacyRoles')}
                  placement='right'
                  enterTouchDelay={0}
                  leaveTouchDelay={3000}>
                  <InfoOutlinedIcon className={cx(icon, legacyRolesTitle)} fontSize='small' />
                </Tooltip>
              </Grid>
              {organization?.groupId && (
                <IconButton
                  color='secondary'
                  size='small'
                  className={icon}
                  aria-label='group-roles'
                  onClick={() =>
                    window.open(
                      `https://www.${process.env.robloxSiteDomain}/groups/configure?id=${organization.groupId}#!/roles`,
                      '_blank',
                    )
                  }
                  disabled={disabled}>
                  <LaunchIcon fontSize='small' color='disabled' />
                </IconButton>
              )}
            </Grid>

            {legacyRoles?.map(
              (legacyRole) =>
                legacyRole.name &&
                legacyRole.id && (
                  <Button
                    key={legacyRole.id}
                    size='large'
                    color='primary'
                    variant='text'
                    disabled
                    startIcon={
                      <SupervisedUserCircleOutlinedIcon
                        style={getRoleStyle(RoleColorType.Invalid)}
                      />
                    }
                    className={roleButtonContainer}>
                    {legacyRole.name}
                  </Button>
                ),
            )}
          </Grid>
        </Grid>
      )}
    </Grid>
  );
};

export default RolesSidebar;
