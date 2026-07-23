import type { FunctionComponent } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Member } from '@rbx/client-organizations-service-api/v1';
import type { RobloxUsersApiGetUserResponse } from '@rbx/client-users/v1';
import { useTranslation } from '@rbx/intl';
import { Grid, IconButton, makeStyles, NavigateNextIcon, useMediaQuery } from '@rbx/ui';
import { CreatorType } from '@modules/miscellaneous/common';
import ThumbnailWithNames from '@modules/miscellaneous/components/ThumbnailWithNames';
import { useGetGroupInfo } from '@modules/react-query/groupMembers';
import type { InvitedMember } from '../../constants/groupConstants';
import { GroupMembersMenuState } from '../../constants/groupConstants';
import useCurrentOrganization from '../../hooks/useCurrentOrganization';
import GroupMemberActions from './GroupMemberActions';
import GroupMemberRoleChipsV2 from './GroupMemberRoleChipsV2';
import GroupMemberRoleModal from './GroupMemberRoleModalV2';

const useGroupMembersRowStyles = makeStyles()((theme) => ({
  container: {
    borderRadius: 4,
    '&:hover': {
      background: theme.palette.states.selected,
    },
    [theme.breakpoints.down('Medium')]: {
      padding: '16px 0px',
    },
  },

  nameContainer: {
    padding: 16,
    flex: '1 0 0',
    overflow: 'hidden',
    [theme.breakpoints.down('Medium')]: {
      overflow: 'visible',
      padding: 0,
    },
  },

  rolesContainer: {
    padding: 16,
    [theme.breakpoints.down('Medium')]: {
      padding: 0,
    },
  },
}));

export type GroupMembersRowProps = {
  member: Member | InvitedMember;
  user?: RobloxUsersApiGetUserResponse;
  menuState: GroupMembersMenuState;
};

const GroupMembersRow: FunctionComponent<GroupMembersRowProps> = ({ member, user, menuState }) => {
  const { translate } = useTranslation();
  const {
    classes: { container, nameContainer, rolesContainer },
  } = useGroupMembersRowStyles();
  const isMobile = useMediaQuery((theme) => theme.breakpoints.down('Medium'));

  const { organization } = useCurrentOrganization();
  const { data: groupInfo } = useGetGroupInfo(organization?.groupId);

  const [hovering, setHovering] = useState<boolean>(false);
  const rowRef = useRef<HTMLDivElement>(null);
  const roleModalRef = useRef<HTMLButtonElement>(null);
  const [openRoleModalClicked, setOpenRoleModalClicked] = useState<boolean>(false);

  const label = useMemo(() => {
    if (menuState === GroupMembersMenuState.Invited) {
      return translate('Label.Pending');
    }
    if (member.userId === groupInfo?.ownerId?.toString()) {
      return translate('Label.Owner');
    }
    return '';
  }, [groupInfo, member, menuState, translate]);

  useEffect(() => {
    const node = rowRef.current;
    if (!node) {
      return () => {
        // Do nothing
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
      className={container}
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
        <Grid container item className={nameContainer}>
          <ThumbnailWithNames
            target={{
              id: member?.userId ? Number.parseInt(member.userId, 10) : undefined,
              name: user?.name,
              displayName: user?.displayName,
            }}
            targetType={CreatorType.User}
            label={label}
            variant='compact'
          />
        </Grid>
        <Grid item display='flex' flex='2 0 0' className={rolesContainer}>
          <Grid item display='flex' flex='2 0 0'>
            <GroupMemberRoleChipsV2 member={member} menuState={menuState} />
          </Grid>
          {!isMobile && (
            <Grid item display='flex' flex='1 0 0' justifyContent='right'>
              <GroupMemberActions
                member={member}
                showEdit={hovering}
                user={user}
                menuState={menuState}
              />
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
          user={user}
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
