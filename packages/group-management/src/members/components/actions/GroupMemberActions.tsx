import type { FunctionComponent } from 'react';
import React, { useMemo, useRef, useState } from 'react';
import { useTranslation } from '@rbx/intl';
import { Button, Grid, IconButton, MoreVertIcon } from '@rbx/ui';
import type { GroupUserWithRoles } from '../../../clients/groups';
import useCanAssignRoles from '../../../hooks/useCanAssignRoles';
import useCurrentGroup from '../../../hooks/useCurrentGroup';
import { useGetGroupInfo } from '../../../queries';
import { GroupMembersMenuState } from '../../../utils/constants';
import GroupMemberActionsMenu from './GroupMemberActionsMenu';
import GroupMemberRoleModal from './GroupMemberRoleModal';

export type GroupMemberActionsProps = {
  member: GroupUserWithRoles;
  showEdit: boolean;
  menuState: GroupMembersMenuState;
};

const GroupMemberActions: FunctionComponent<GroupMemberActionsProps> = ({
  member,
  showEdit,
  menuState,
}) => {
  const { translate } = useTranslation();

  const { organization, permissions, user: currentUser } = useCurrentGroup();
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
        (permissions?.canManageMembers === true &&
          member.user?.userId !== groupInfo?.ownerId &&
          member.user?.userId !== currentUser?.id))
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
          className='width-max height-min'
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
          className='height-min'
          ref={moreRef}
          onClick={() => {
            setMoreClicked(true);
          }}>
          <MoreVertIcon />
        </IconButton>
      )}
      <GroupMemberRoleModal
        member={member}
        menuState={menuState}
        anchor={addRoleRef.current}
        onClose={() => {
          setAddRoleClicked(false);
        }}
        open={addRoleClicked}
      />
      <GroupMemberActionsMenu
        member={member}
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
