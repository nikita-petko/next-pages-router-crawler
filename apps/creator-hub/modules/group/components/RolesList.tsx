import React, { FunctionComponent, useCallback } from 'react';
import { Grid, makeStyles, Typography, IconButton, AddIcon, RemoveIcon } from '@rbx/ui';
import { RoleMetadata } from '@rbx/clients/organizationsServiceApi';
import { useThemeMode } from '@rbx/settings';
import { DefaultMemberRoleId } from '../constants/groupConstants';
import useCurrentOrganization from '../hooks/useCurrentOrganization';
import useCanAssignRoles from '../hooks/useCanAssignRoles';
import { getRoleStyle } from '../utils/groupUtils';

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
    padding: 8,
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
    padding: 0,
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
  roles?: RoleMetadata[];
  variant: 'add' | 'remove';
  onClick: (role?: RoleMetadata) => void;
  disabled?: boolean;
}

const RolesList: FunctionComponent<React.PropsWithChildren<RolesListProps>> = ({
  roles,
  variant,
  onClick,
  disabled,
}) => {
  const { themeMode } = useThemeMode();
  const { permissions } = useCurrentOrganization();
  const { isUnrestricted } = useCanAssignRoles();

  const {
    classes: { rolesListContainer, menuItem, roleIcon, pointerIcon, icon, itemText, roleName },
  } = useRolesListStyles();

  const canInteractWithRole = useCallback(
    (role: RoleMetadata): boolean => {
      return !!(
        !disabled &&
        role?.id &&
        role.id !== DefaultMemberRoleId &&
        (permissions?.assignableRoleIds?.includes(role.id) || isUnrestricted)
      );
    },
    [disabled, permissions, isUnrestricted],
  );

  return (
    <Grid container direction='row' wrap='wrap' className={rolesListContainer}>
      {[...(roles ?? [])]
        .sort((a, b) => (Number(a.id) ?? 0) - (Number(b.id) ?? 0))
        .map((role) => (
          <Grid
            container
            key={role.id}
            wrap='nowrap'
            justifyContent='space-between'
            className={`${menuItem} ${canInteractWithRole(role) ? pointerIcon : ''}`}
            onClick={canInteractWithRole(role) ? () => onClick(role) : undefined}>
            <Grid container wrap='nowrap' alignItems='center' className={roleName}>
              <Grid
                item
                className={roleIcon}
                style={getRoleStyle(role.color, themeMode, 'background')}
              />
              <Typography variant='body1' color='secondary' className={itemText}>
                {role.name}
              </Typography>
            </Grid>
            {canInteractWithRole(role) && (
              <IconButton
                data-testid={`${variant}-role-button`}
                className={icon}
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
