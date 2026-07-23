import type { FunctionComponent } from 'react';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from '@rbx/intl';
import { Grid, IconButton, makeStyles, NavigateNextIcon, useMediaQuery } from '@rbx/ui';
import type { GroupUserWithRoles } from '../../clients/groups';
import useCurrentGroup from '../../hooks/useCurrentGroup';
import { useGetGroupInfo } from '../../queries';
import type { InvitedMember } from '../../utils/constants';
import { GroupMembersMenuState } from '../../utils/constants';
import GroupMemberActions from './actions/GroupMemberActions';
import GroupMemberRoleModal from './actions/GroupMemberRoleModal';
import UserThumbnailWithNames from './common/UserThumbnailWithNames';
import GroupMemberRoleChips from './GroupMemberRoleChips';

const useGroupMembersRowStyles = makeStyles()((theme) => ({
  container: {
    '&:hover': {
      background: theme.palette.states.selected,
    },
    [theme.breakpoints.down('Medium')]: {
      padding: '16px 0px',
    },
  },

  nameContainer: {
    overflow: 'hidden',
    [theme.breakpoints.down('Medium')]: {
      overflow: 'visible',
      padding: 0,
    },
  },

  rolesContainer: {
    [theme.breakpoints.down('Medium')]: {
      padding: 0,
    },
  },
}));

export type GroupMembersRowProps = {
  member: GroupUserWithRoles | InvitedMember;
  menuState: GroupMembersMenuState;
};

const GroupMembersRow: FunctionComponent<GroupMembersRowProps> = ({ member, menuState }) => {
  const { translate } = useTranslation();
  const {
    classes: { container, nameContainer, rolesContainer },
    cx,
  } = useGroupMembersRowStyles();
  const isMobile = useMediaQuery((theme) => theme.breakpoints.down('Medium'));

  const { organization } = useCurrentGroup();
  const { data: groupInfo } = useGetGroupInfo(organization?.groupId);

  const [hovering, setHovering] = useState<boolean>(false);
  const rowRef = useRef<HTMLDivElement>(null);
  const roleModalRef = useRef<HTMLButtonElement>(null);
  const [openRoleModalClicked, setOpenRoleModalClicked] = useState<boolean>(false);

  const label = useMemo(() => {
    if (menuState === GroupMembersMenuState.Invited) {
      return translate('Label.Pending');
    }
    if (member.user?.userId === groupInfo?.ownerId) {
      return translate('Label.Owner');
    }
    return '';
  }, [groupInfo, member, menuState, translate]);

  useEffect(() => {
    const node = rowRef.current;
    if (!node) {
      return () => {
        // intentionally empty
      };
    }

    const handleMouseEnter = () => {
      setHovering(true);
    };
    const handleMouseLeave = () => {
      setHovering(false);
    };

    node.addEventListener('mouseenter', handleMouseEnter);
    node.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      node.removeEventListener('mouseenter', handleMouseEnter);
      node.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [member, organization]);

  return (
    <Grid
      container
      className={cx(container, 'radius-small')}
      wrap='nowrap'
      data-testid='group-member-row'
      ref={rowRef}
      flexDirection='row'>
      <Grid
        container
        item
        gap={isMobile ? 1 : 0}
        flexDirection={isMobile ? 'column' : 'row'}
        flexShrink={1}
        minWidth={0}>
        <Grid
          container
          item
          className={cx(nameContainer, 'padding-large')}
          style={{ flex: '1 0 0' }}>
          <UserThumbnailWithNames
            target={{
              id: member?.user?.userId,
              name: member?.user?.username,
              displayName: member?.user?.displayName,
            }}
            label={label}
          />
        </Grid>
        <Grid item display='flex' flex='2 0 0' className={cx(rolesContainer, 'padding-large')}>
          <Grid item display='flex' flex='2 0 0'>
            <GroupMemberRoleChips member={member} menuState={menuState} />
          </Grid>
          {!isMobile && (
            <Grid item display='flex' flex='1 0 0' justifyContent='right'>
              <GroupMemberActions member={member} showEdit={hovering} menuState={menuState} />
            </Grid>
          )}
        </Grid>
      </Grid>

      {isMobile && (
        <Grid item height='100%' alignContent='center'>
          <IconButton
            aria-label='more-actions'
            size='medium'
            color='secondary'
            ref={roleModalRef}
            onClick={() => {
              setOpenRoleModalClicked(true);
            }}
            data-testid='next-icon'>
            <NavigateNextIcon />
          </IconButton>
        </Grid>
      )}
      {openRoleModalClicked && (
        <GroupMemberRoleModal
          member={member}
          menuState={menuState}
          anchor={roleModalRef.current}
          onClose={() => {
            setOpenRoleModalClicked(false);
          }}
          open={openRoleModalClicked}
        />
      )}
    </Grid>
  );
};

export default GroupMembersRow;
