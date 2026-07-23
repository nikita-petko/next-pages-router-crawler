import type { FunctionComponent } from 'react';
import React, { useCallback } from 'react';
import { AddIcon, Grid, IconButton, makeStyles, RemoveIcon, Typography, useTheme } from '@rbx/ui';
import type { GroupRoleMetadata } from '../../../clients/groups';
import useCanAssignRoles from '../../../hooks/useCanAssignRoles';
import useCurrentGroup from '../../../hooks/useCurrentGroup';
import { DefaultMemberRoleIdNumber } from '../../../utils/constants';
import { getRoleStyle } from '../../../utils/groupUtils';

const useRolesListStyles = makeStyles()((theme) => ({
  rolesListContainer: {
    maxHeight: 114,
    overflowY: 'scroll',
    scrollbarColor: 'grey transparent',
    scrollbarWidth: 'thin',
    '&::-webkit-scrollbar': {
      width: 6,
    },
    '&::-webkit-scrollbar-thumb': {
      background: 'grey',
      borderRadius: '10rem',
    },
    '&::-webkit-scrollbar-track': {
      background: 'transparent',
    },
    [theme.breakpoints.down('Medium')]: {
      maxHeight: 'none',
    },
  },

  menuItem: {
    '&:hover': {
      borderRadius: 4,
      background: theme.palette.content.disabled,
    },
  },

  roleIcon: {
    width: 12,
    height: 12,
    borderRadius: 12,
    marginRight: 8,
  },

  pointerIcon: {
    cursor: 'pointer',
    color: theme.palette.content.muted,
  },

  icon: {
    marginRight: 6,
  },

  itemText: {
    textOverflow: 'ellipsis',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
  },

  roleName: {
    maxWidth: 'calc(100% - 26px)',
  },
}));

export interface RolesListProps {
  roles?: GroupRoleMetadata[];
  variant: 'add' | 'remove';
  onClick: (role?: GroupRoleMetadata) => void;
  disabled?: boolean;
}

const RolesList: FunctionComponent<React.PropsWithChildren<RolesListProps>> = ({
  roles,
  variant,
  onClick,
  disabled,
}) => {
  const { palette } = useTheme();
  const { permissions } = useCurrentGroup();
  const { isUnrestricted } = useCanAssignRoles();

  const {
    classes: { rolesListContainer, menuItem, roleIcon, pointerIcon, icon, itemText, roleName },
  } = useRolesListStyles();

  const canInteractWithRole = useCallback(
    (role: GroupRoleMetadata): boolean => {
      return !!(
        disabled !== true &&
        role?.id &&
        role.id !== DefaultMemberRoleIdNumber &&
        (permissions?.assignableRoleIds?.includes(role.id.toString()) === true || isUnrestricted)
      );
    },
    [disabled, permissions, isUnrestricted],
  );

  return (
    <Grid container direction='row' wrap='wrap' className={rolesListContainer}>
      {[...(roles ?? [])]
        .sort((a, b) => (a.id ?? 0) - (b.id ?? 0))
        .map((role) => (
          <Grid
            container
            key={role.id}
            wrap='nowrap'
            justifyContent='space-between'
            className={`padding-small ${menuItem} ${canInteractWithRole(role) ? pointerIcon : ''}`}
            onClick={canInteractWithRole(role) ? () => onClick(role) : undefined}>
            <Grid container wrap='nowrap' alignItems='center' className={roleName}>
              <Grid
                item
                className={roleIcon}
                style={getRoleStyle(role.color, palette.mode, 'background')}
              />
              <Typography variant='body1' color='secondary' className={itemText}>
                {role.name}
              </Typography>
            </Grid>
            {canInteractWithRole(role) && (
              <IconButton
                data-testid={`${variant}-role-button`}
                className={`padding-none ${icon}`}
                aria-label={`${variant} role`}>
                {variant === 'add' ? (
                  <AddIcon data-testid='add-role' color='secondary' className={pointerIcon} />
                ) : (
                  <RemoveIcon data-testid='remove-role' className={pointerIcon} />
                )}
              </IconButton>
            )}
          </Grid>
        ))}
    </Grid>
  );
};

export default RolesList;
