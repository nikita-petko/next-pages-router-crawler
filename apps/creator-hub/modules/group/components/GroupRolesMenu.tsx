import React, { FunctionComponent } from 'react';
import { useTranslation } from '@rbx/intl';
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
import { RoleColorType, RoleMetadata } from '@rbx/clients/organizationsServiceApi';
import { useGetOrganizationRoles } from '@modules/react-query/groupMembers';
import { useThemeMode } from '@rbx/settings';
import { DefaultMemberRoleId } from '../constants/groupConstants';
import GroupMemberDisplayType from '../interface/GroupMemberDisplayType';
import { getRoleStyle } from '../utils/groupUtils';
import useCurrentOrganization from '../hooks/useCurrentOrganization';

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
