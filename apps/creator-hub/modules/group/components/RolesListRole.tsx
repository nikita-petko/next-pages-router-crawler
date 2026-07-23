import React from 'react';
import {
  Button,
  buttonClasses,
  ChevronRightIcon,
  DragHandleIcon,
  makeStyles,
  PortraitOutlinedIcon,
  SupervisedUserCircleOutlinedIcon,
} from '@rbx/ui';
import { RoleColorType } from '@modules/clients/organizationApi';
import { DraggableProvidedDragHandleProps } from '@hello-pangea/dnd';
import { Flex } from '@modules/miscellaneous/common/components';
import { useThemeMode } from '@rbx/settings';
import useCurrentOrganization from '../hooks/useCurrentOrganization';
import useCanAssignRoles from '../hooks/useCanAssignRoles';
import { DefaultMemberRoleId } from '../constants/groupConstants';
import { getRoleStyle } from '../utils/groupUtils';

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
    // TODO: this is brittle. Can we find a better way to target the text container
    [`& > span:nth-child(2)`]: {
      flexGrow: 1,
      maxWidth: '100%',
      minWidth: 0,
    },
  },
  buttonContentContainer: {
    width: '100%',
    maxWidth: '100%',
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
  roleColor: RoleColorType;
  isNewRole: boolean;
  disabled: boolean;
  isSelected: boolean;
  isMobile: boolean;
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
      dragHandleIcon,
    },
    cx,
  } = useRolesSidebarStyles();
  const { themeMode } = useThemeMode();
  const { permissions } = useCurrentOrganization();
  const { isUnrestricted } = useCanAssignRoles();

  const isOwner = permissions?.isOwner === true;
  const canAssignRole = isOwner || permissions?.assignableRoleIds.includes(roleId);
  const canEditPermissions = isOwner || permissions?.permissionEditableRoleIds?.includes(roleId);
  const canEditMetadata = isOwner || permissions?.metadataEditableRoleIds?.includes(roleId);

  const isExistingRoleDisabled =
    isNewRole === false &&
    !(isUnrestricted || canAssignRole || canEditPermissions || canEditMetadata);

  // If the role is new, check if the user can create roles
  const canCreateRoles = permissions?.canCreateRoles === true || isOwner;
  const isNewRoleDisabled = isNewRole && !canCreateRoles;

  const isDefaultMemberRole = roleId === DefaultMemberRoleId;

  return (
    <Button
      data-testid={`role-button-${roleId}`}
      key={roleId}
      size='large'
      color='primary'
      variant='text'
      disabled={disabled || isNewRoleDisabled || isExistingRoleDisabled}
      onClick={onClickRole}
      startIcon={
        isDefaultMemberRole ? (
          <PortraitOutlinedIcon style={getRoleStyle(roleColor, themeMode)} />
        ) : (
          <SupervisedUserCircleOutlinedIcon style={getRoleStyle(roleColor, themeMode)} />
        )
      }
      endIcon={isMobile && <ChevronRightIcon />}
      className={cx(roleButtonContainer, {
        [selectedButton]: isSelected,
      })}
      fullWidth={isMobile}>
      <Flex
        classes={{ root: buttonContentContainer }}
        justifyContent='space-between'
        alignItems='center'>
        <span className={textContainer}>{roleName}</span>
        {!!dragHandleProps && (
          <span className={dragHandleContainer} {...dragHandleProps}>
            {/* Increasing the icon's size makes it easier to drag the rows on mobile */}
            <DragHandleIcon className={dragHandleIcon} />
          </span>
        )}
      </Flex>
    </Button>
  );
};

export default RolesListRole;
