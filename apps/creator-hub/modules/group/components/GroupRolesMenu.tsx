import type { FunctionComponent } from 'react';
import React from 'react';
import type { RoleMetadata } from '@rbx/client-organizations-service-api/v1';
import { RoleColorType } from '@rbx/client-organizations-service-api/v1';
import { useTranslation } from '@rbx/intl';
import { useThemeMode } from '@rbx/settings';
import {
  makeStyles,
  Select,
  MenuItem,
  Grid,
  CircularProgress,
  SupervisedUserCircleOutlinedIcon,
  Typography,
  PortraitOutlinedIcon,
} from '@rbx/ui';
import { useGetOrganizationRoles } from '@modules/react-query/groupMembers';
import { DefaultMemberRoleId } from '../constants/groupConstants';
import useCurrentOrganization from '../hooks/useCurrentOrganization';
import GroupMemberDisplayType from '../interface/GroupMemberDisplayType';
import { getRoleStyle } from '../utils/groupUtils';

const useGroupRolesMenuStyles = makeStyles()({
  menuContainer: {
    width: 220,
  },

  iconContainer: {
    marginRight: 12,
  },

  loaderContainer: {
    marginTop: 8,
  },

  roleNameText: {
    textOverflow: 'ellipsis',
    overflow: 'hidden',
    maxWidth: 'calc(100% - 32px)',
  },
});

export type GroupRolesMenuProps = {
  value: RoleMetadata | null;
  onSelect: (value: RoleMetadata | null) => void;
  onOpen?: () => void;
  disabled?: boolean;
};

const GroupRolesMenu: FunctionComponent<React.PropsWithChildren<GroupRolesMenuProps>> = ({
  value,
  onSelect,
  onOpen,
  disabled = false,
}) => {
  const { translate } = useTranslation();
  const { themeMode } = useThemeMode();

  const {
    classes: { menuContainer, iconContainer, loaderContainer, roleNameText },
  } = useGroupRolesMenuStyles();

  const { organization } = useCurrentOrganization();
  const { data: roles } = useGetOrganizationRoles(organization?.id);

  return (
    <Select
      SelectProps={{
        onOpen,
      }}
      value={value?.id ?? GroupMemberDisplayType.Everyone}
      size='small'
      label={translate('Label.Role')}
      disabled={disabled}
      data-testid={disabled ? 'disabled-members-display' : 'members-display'}
      className={menuContainer}>
      {!value && (
        <MenuItem
          value={GroupMemberDisplayType.Everyone}
          selected={!value}
          onClick={() => onSelect(null)}>
          <Grid container alignItems='center'>
            <SupervisedUserCircleOutlinedIcon
              className={iconContainer}
              style={getRoleStyle(RoleColorType.Invalid)}
            />
            {translate(`Label.${GroupMemberDisplayType.Everyone}`)}
          </Grid>
        </MenuItem>
      )}
      {roles === undefined ? (
        <Grid container justifyContent='center'>
          <CircularProgress size={20} className={loaderContainer} />
        </Grid>
      ) : (
        roles?.map(
          (role) =>
            role.name &&
            role.id && (
              <MenuItem
                key={role.id}
                value={role.id}
                selected={value === role}
                onClick={() => onSelect(role)}>
                <Grid container alignItems='center'>
                  {role.id === DefaultMemberRoleId ? (
                    <PortraitOutlinedIcon
                      style={getRoleStyle(role.color, themeMode)}
                      className={iconContainer}
                    />
                  ) : (
                    <SupervisedUserCircleOutlinedIcon
                      style={getRoleStyle(role.color, themeMode)}
                      className={iconContainer}
                    />
                  )}
                  <Typography variant='body1' color='primary' className={roleNameText}>
                    {role.name}
                  </Typography>
                </Grid>
              </MenuItem>
            ),
        )
      )}
    </Select>
  );
};

export default GroupRolesMenu;
