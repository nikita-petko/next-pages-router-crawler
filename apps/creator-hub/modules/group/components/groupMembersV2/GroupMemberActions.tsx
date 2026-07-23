import { FunctionComponent, useMemo, useRef, useState } from 'react';
import { Member } from '@rbx/clients/organizationsServiceApi';
import { Button, Grid, IconButton, makeStyles, MoreVertIcon } from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
import { RobloxUsersApiGetUserResponse } from '@rbx/clients/users';
import { useGetGroupInfo } from '@modules/react-query/groupMembers';
import { useAuthentication } from '@modules/authentication/providers';
import { GroupMembersMenuState } from '../../constants/groupConstants';
import GroupMemberRoleModal from './GroupMemberRoleModalV2';
import useCurrentOrganization from '../../hooks/useCurrentOrganization';
import useCanAssignRoles from '../../hooks/useCanAssignRoles';
import GroupMemberActionsMenu from './GroupMemberActionsMenu';

const useGroupMemberActionsStyles = makeStyles()(() => ({
  addRoleButton: {
    width: 'max-content',
    height: 'min-content',
  },
  moreIcon: {
    height: 'min-content',
  },
}));

export type GroupMemberActionsProps = {
  member: Member;
  showEdit: boolean;
  user?: RobloxUsersApiGetUserResponse;
  menuState: GroupMembersMenuState;
};

const GroupMemberActions: FunctionComponent<GroupMemberActionsProps> = ({
  member,
  showEdit,
  user,
  menuState,
}) => {
  const { translate } = useTranslation();
  const {
    classes: { addRoleButton, moreIcon },
  } = useGroupMemberActionsStyles();
  const { user: currentUser } = useAuthentication();

  const { organization, permissions } = useCurrentOrganization();
  const { data: groupInfo } = useGetGroupInfo(organization?.groupId);
  const { canAssignRoles } = useCanAssignRoles();

  const addRoleRef = useRef<HTMLButtonElement>(null);
  const [addRoleClicked, setAddRoleClicked] = useState<boolean>(false);
  const moreRef = useRef<HTMLButtonElement>(null);
  const [moreClicked, setMoreClicked] = useState<boolean>(false);

  const showAddRole = useMemo(() => {
    return (showEdit || addRoleClicked || moreClicked) && canAssignRoles;
  }, [showEdit, addRoleClicked, moreClicked, canAssignRoles]);

  const showMore = useMemo(() => {
    return (
      (showEdit || addRoleClicked || moreClicked) &&
      (menuState === GroupMembersMenuState.Invited ||
        (permissions?.canManageMembers &&
          member.userId !== groupInfo?.ownerId?.toString() &&
          member.userId !== currentUser?.id?.toString()))
    );
  }, [
    showEdit,
    addRoleClicked,
    moreClicked,
    menuState,
    groupInfo,
    member,
    permissions,
    currentUser,
  ]);

  return (
    <Grid display='flex' flexDirection='row' alignItems='center'>
      {showAddRole && (
        <Button
          variant='contained'
          color='secondary'
          size='small'
          className={addRoleButton}
          ref={addRoleRef}
          onClick={() => {
            setAddRoleClicked(true);
          }}>
          {translate('Label.AddRole')}
        </Button>
      )}
      {showMore && (
        <IconButton
          aria-label='more-actions'
          size='medium'
          color='secondary'
          className={moreIcon}
          ref={moreRef}
          onClick={() => {
            setMoreClicked(true);
          }}>
          <MoreVertIcon />
        </IconButton>
      )}
      <GroupMemberRoleModal
        member={member}
        user={user}
        menuState={menuState}
        anchor={addRoleRef.current}
        onClose={() => {
          setAddRoleClicked(false);
        }}
        open={addRoleClicked}
      />
      <GroupMemberActionsMenu
        member={member}
        user={user}
        menuState={menuState}
        anchor={moreRef.current}
        onClose={() => {
          setMoreClicked(false);
        }}
        open={moreClicked}
      />
    </Grid>
  );
};

export default GroupMemberActions;
