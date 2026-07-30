import React from 'react';
import { useTranslation } from '@rbx/intl';
import { Select, MenuItem, Checkbox, Typography } from '@rbx/ui';
import type { GroupRoleMetadata } from '../../../clients/groups';
import useCurrentGroup from '../../../hooks/useCurrentGroup';
import useMemberPermissions from '../../../hooks/useMemberPermissions';
import { useGetGroupsRoles } from '../../../queries';
import { DefaultMemberRoleIdNumber } from '../../../utils/constants';
import { isManageableRole } from '../../../utils/groupUtils';

export type RoleSelectProps = {
  selectedRoles: GroupRoleMetadata[];
  onChange: (selectedRoles: GroupRoleMetadata[]) => void;
};

export const RoleSelect: React.FC<RoleSelectProps> = ({ selectedRoles, onChange }) => {
  const { organization } = useCurrentGroup();
  const { data: groupRoles } = useGetGroupsRoles(organization?.groupId);
  const { assignableRoles } = useMemberPermissions();
  const { translate } = useTranslation();

  if (!groupRoles) {
    return null;
  }

  const rolesMap = new Map(groupRoles.map((role) => [role.id, role]));
  const memberRole = groupRoles.find((role) => role.id === DefaultMemberRoleIdNumber);
  const inviteAssignableRoles = assignableRoles.filter(isManageableRole).toReversed();

  const selectedRoleIds = selectedRoles
    .map((role) => role.id)
    .filter((roleId): roleId is number => roleId !== undefined && roleId !== null);

  const displayedRoleIds = [
    ...(memberRole?.id !== undefined ? [memberRole.id] : []),
    ...selectedRoleIds.filter((roleId) => roleId !== memberRole?.id),
  ];

  return (
    <Select
      multiple
      value={displayedRoleIds}
      SelectProps={{
        MenuProps: {
          PaperProps: {
            className: 'max-height-[300px]',
          },
        },
      }}
      className='width-[176px] max-[600.95px]:width-[calc(100vw-40px)]'
      label={translate('Label.AddRoles')}
      onChange={(event) => {
        const rawValue = event.target.value;
        const selectedIds = (Array.isArray(rawValue) ? rawValue : []) as number[];
        const selectedValueExcludingMember = selectedIds.filter((id) => id !== memberRole?.id);
        onChange(
          selectedValueExcludingMember.flatMap((id) => {
            const role = rolesMap.get(id);
            return role ? [role] : [];
          }),
        );
      }}
      renderValue={() =>
        displayedRoleIds
          .map((id) => rolesMap.get(id)?.name)
          .filter(Boolean)
          .join(', ')
      }>
      {inviteAssignableRoles.map(
        (role) =>
          role.id !== undefined && (
            <MenuItem key={role.id} value={role.id}>
              <Checkbox
                checked={selectedRoles.some((selectedRole) => selectedRole.id === role.id)}
              />
              <Typography variant='body1'>{role.name}</Typography>
            </MenuItem>
          ),
      )}
      {memberRole?.id !== undefined && (
        <MenuItem key={memberRole.id} value={memberRole.id} disabled>
          <Checkbox checked />
          <Typography variant='body1'>{memberRole.name}</Typography>
        </MenuItem>
      )}
    </Select>
  );
};

export default RoleSelect;
