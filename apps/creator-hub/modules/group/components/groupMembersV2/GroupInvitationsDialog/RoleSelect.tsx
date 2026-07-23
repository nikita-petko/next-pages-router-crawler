import React from 'react';
import { Select, MenuItem, Checkbox, Typography, makeStyles } from '@rbx/ui';
import { RoleMetadata } from '@modules/clients/organizationApi';
import { useTranslation } from '@rbx/intl';
import { useGetOrganizationRoles } from '@modules/react-query/groupMembers/rolesQueries';
import { DefaultMemberRoleId } from '../../../constants/groupConstants';
import useCurrentOrganization from '../../../hooks/useCurrentOrganization';

const useStyles = makeStyles()((theme) => ({
  roleSelectorClass: {
    width: 176,
    [theme.breakpoints.down('Medium')]: {
      width: `calc(100vw - 40px)`,
    },
  },
  userRoleMenuListClass: {
    maxHeight: 300,
  },
}));

export interface RoleSelectProps {
  selectedRoles: RoleMetadata[];
  onChange: (selectedRoles: RoleMetadata[]) => void;
}

export const RoleSelect: React.FC<RoleSelectProps> = ({ selectedRoles, onChange }) => {
  const {
    classes: { roleSelectorClass, userRoleMenuListClass },
  } = useStyles();
  const { organization, permissions } = useCurrentOrganization();
  const { data: orgRoles } = useGetOrganizationRoles(organization?.id);
  const { translate } = useTranslation();

  if (!orgRoles) {
    return null;
  }

  const rolesMap = new Map(orgRoles.map((role) => [role.id, role]) || []);
  const memberRole = orgRoles.find((role) => role.id === DefaultMemberRoleId);

  // Filter out roles that the user does not have permission to assign
  const assignableRoles =
    permissions?.assignableRoleIds.map((roleId) => rolesMap.get(roleId)) || [];

  return (
    <Select
      multiple
      value={[...selectedRoles.map((role) => role.id), memberRole?.id]}
      SelectProps={{
        MenuProps: {
          PaperProps: {
            className: userRoleMenuListClass,
          },
        },
      }}
      className={roleSelectorClass}
      label={translate('Label.AddRoles')}
      onChange={(event) => {
        const selectedValueExcludingMember = (event.target.value as unknown as string[]).filter(
          (id) => id !== memberRole?.id,
        ); // Exclude member role from selection
        onChange(selectedValueExcludingMember.map((id) => rolesMap.get(id) as RoleMetadata));
      }}
      renderValue={(selectedValue) =>
        (selectedValue as string[]).map((id) => rolesMap.get(id)?.name).join(', ')
      }>
      {/* Render all non member roles first */}
      {assignableRoles?.map(
        (role) =>
          role && (
            <MenuItem key={role.id} value={role.id}>
              <Checkbox checked={selectedRoles.includes(role)} />
              <Typography variant='body1'>{role.name}</Typography>
            </MenuItem>
          ),
      )}
      {/* Display the default member role as a disabled option */}
      {memberRole && (
        <MenuItem key={memberRole.id} value={memberRole.id} disabled>
          <Checkbox checked />
          <Typography variant='body1'>{memberRole.name}</Typography>
        </MenuItem>
      )}
    </Select>
  );
};
