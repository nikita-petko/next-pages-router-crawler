import type { FunctionComponent } from 'react';
import React from 'react';
import type { TIconSize } from '@rbx/foundation-ui';
import { Icon } from '@rbx/foundation-ui';
import { useTheme } from '@rbx/ui';
import type { GroupRoleColorType } from '../../../clients/groups';
import { DefaultMemberRoleIdNumber } from '../../../utils/constants';
import { getRoleStyle } from '../../../utils/groupUtils';

export type RoleIconProps = {
  roleId?: number | null;
  color?: GroupRoleColorType;
  size?: TIconSize;
  className?: string;
};

/** Role icon with the role's configured color. */
const RoleIcon: FunctionComponent<RoleIconProps> = ({
  roleId,
  color,
  size = 'Small',
  className,
}) => {
  const { palette } = useTheme();

  return (
    <Icon
      name={
        roleId === DefaultMemberRoleIdNumber
          ? 'icon-filled-square-person'
          : 'icon-filled-person-rectangle-horizontal-line'
      }
      size={size}
      className={className}
      style={getRoleStyle(color, palette.mode, 'color')}
    />
  );
};

export default RoleIcon;
