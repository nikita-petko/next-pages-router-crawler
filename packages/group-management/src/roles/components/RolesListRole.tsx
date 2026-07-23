import React, { useState } from 'react';
import type { DraggableProvidedDragHandleProps } from '@hello-pangea/dnd';
import { Icon } from '@rbx/foundation-ui';
import { Button, buttonClasses, ChevronRightIcon, Grid, makeStyles, useTheme } from '@rbx/ui';
import type { GroupRoleColorType } from '../../clients/groups';
import useCanAssignRoles from '../../hooks/useCanAssignRoles';
import useCurrentGroup from '../../hooks/useCurrentGroup';
import { DefaultMemberRoleId } from '../../utils/constants';
import { getRoleStyle } from '../../utils/groupUtils';

const useRolesSidebarStyles = makeStyles()((theme) => ({
  roleButtonContainer: {
    width: '100%',
    flexGrow: 1,
    display: 'flex',
    justifyContent: 'flex-start',
    textTransform: 'none',
    [`&.${buttonClasses.endIcon}`]: {
      flexShrink: 0,
      flexGrow: 0,
      justifySelf: 'flex-end',
    },
    [`& > span:nth-child(2)`]: {
      flexGrow: 1,
      maxWidth: '100%',
      minWidth: 0,
    },
  },
  buttonContentContainer: {
    width: '100%',
    maxWidth: '100%',
    display: 'flex',
    flexWrap: 'nowrap',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dragHandleContainer: {
    flexGrow: 0,
    flexShrink: 0,
  },
  dragHandleIcon: {
    minWidth: 28,
  },
  textContainer: {
    display: 'block',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    flexGrow: 1,
    flexShrink: 1,
    textAlign: 'left',
  },
  selectedButton: {
    borderRadius: 4,
    background: theme.palette.states.selected,
  },
}));

type TRolesListRoleProps = {
  roleId: string;
  roleName: string;
  roleColor: GroupRoleColorType;
  isNewRole: boolean;
  disabled: boolean;
  isSelected: boolean;
  isMobile: boolean;
  isAnyRoleDragging?: boolean;
  isDragging?: boolean;
  onClickRole: () => void;
  dragHandleProps?: DraggableProvidedDragHandleProps | null | undefined;
};

const RolesListRole: React.FC<TRolesListRoleProps> = ({
  roleId,
  roleName,
  roleColor,
  isNewRole,
  disabled,
  isSelected,
  isMobile,
  isAnyRoleDragging = false,
  isDragging = false,
  onClickRole,
  dragHandleProps,
}) => {
  const {
    classes: {
      roleButtonContainer,
      selectedButton,
      textContainer,
      dragHandleContainer,
      buttonContentContainer,
    },
    cx,
  } = useRolesSidebarStyles();
  const { palette } = useTheme();
  const { permissions } = useCurrentGroup();
  const { isUnrestricted } = useCanAssignRoles();
  const [isHovered, setIsHovered] = useState(false);

  const isOwner = permissions?.isOwner === true;
  const canAssignRole = isOwner || permissions?.assignableRoleIds?.includes(roleId) === true;
  const canEditPermissions =
    isOwner || permissions?.permissionEditableRoleIds?.includes(roleId) === true;
  const canEditMetadata =
    isOwner || permissions?.metadataEditableRoleIds?.includes(roleId) === true;

  const isExistingRoleDisabled =
    !isNewRole && !(isUnrestricted || canAssignRole || canEditPermissions || canEditMetadata);

  const canCreateRoles = permissions?.canCreateRoles === true || isOwner;
  const isNewRoleDisabled = isNewRole && !canCreateRoles;

  const isDefaultMemberRole = roleId === DefaultMemberRoleId;
  const shouldShowDragHandleIcon = isMobile || isDragging || (!isAnyRoleDragging && isHovered);

  return (
    <Button
      data-testid={`role-button-${roleId}`}
      key={roleId}
      size='small'
      color='primary'
      variant='text'
      disabled={disabled || isNewRoleDisabled || isExistingRoleDisabled}
      onClick={onClickRole}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      startIcon={
        isDefaultMemberRole ? (
          <Icon
            name='icon-filled-square-person'
            size='Medium'
            style={getRoleStyle(roleColor, palette.mode, 'color')}
          />
        ) : (
          <Icon
            name='icon-filled-person-rectangle-horizontal-line'
            size='Medium'
            style={getRoleStyle(roleColor, palette.mode, 'color')}
          />
        )
      }
      endIcon={isMobile && <ChevronRightIcon />}
      className={cx(roleButtonContainer, {
        [selectedButton]: isSelected,
      })}
      fullWidth={isMobile}>
      <Grid container className={buttonContentContainer}>
        <span className={textContainer}>{roleName}</span>
        {!!dragHandleProps && (
          <span className={dragHandleContainer} {...dragHandleProps}>
            <Icon
              name='icon-regular-three-bars-horizontal-triangles-vertical'
              size='Large'
              style={{ visibility: shouldShowDragHandleIcon ? 'visible' : 'hidden' }}
            />
          </span>
        )}
      </Grid>
    </Button>
  );
};

export default RolesListRole;
