import type { FunctionComponent } from 'react';
import React, { useMemo, useState } from 'react';
import { useTranslation } from '@rbx/intl';
import {
  CircularProgress,
  Grid,
  makeStyles,
  Pagination,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  useMediaQuery,
} from '@rbx/ui';
import type { GroupRoleMetadata, GroupUserWithRoles } from '../../clients/groups';
import useCurrentGroup from '../../hooks/useCurrentGroup';
import {
  useGetInvitationsWithRole,
  useGetGroupUsersWithRoles,
  useGetGroupsRoles,
} from '../../queries';
import {
  DefaultMemberRoleIdNumber,
  GroupMembersMenuState,
  MembersPageSize,
  noResultsIconPath,
} from '../../utils/constants';
import GroupMembersRow from './GroupMembersRow';
import RoleMembersRow from './RoleMembersRow';

const useGroupMembersTableStyles = makeStyles()((theme) => ({
  table: {
    [theme.breakpoints.down('Medium')]: {
      display: 'flex',
    },
  },
}));

export type GroupMembersTableProps = {
  menuState: GroupMembersMenuState;
  roleFilter: GroupRoleMetadata | null;
  isRoleMembersPage?: boolean;
};

const GroupMembersTable: FunctionComponent<GroupMembersTableProps> = ({
  menuState,
  roleFilter,
  isRoleMembersPage = false,
}) => {
  const {
    classes: { table },
  } = useGroupMembersTableStyles();
  const { translate } = useTranslation();
  const isMobile = useMediaQuery((theme) => theme.breakpoints.down('Medium'));

  const { organization } = useCurrentGroup();
  const { data: roles } = useGetGroupsRoles(organization?.groupId);

  const [membersPageTokens, setMembersPageTokens] = useState<(string | null | undefined)[]>([]);
  const [invitationsPageTokens, setInvitationsPageTokens] = useState<(string | null | undefined)[]>(
    [],
  );
  const [page, setPage] = useState<number>(0);
  const [nextPageDisabled, setNextPageDisabled] = useState<boolean>(false);
  const [prevMenuState, setPrevMenuState] = useState(menuState);
  const [prevRoleFilter, setPrevRoleFilter] = useState(roleFilter);
  if (prevMenuState !== menuState || prevRoleFilter !== roleFilter) {
    setPrevMenuState(menuState);
    setPrevRoleFilter(roleFilter);
    setPage(0);
    setNextPageDisabled(false);
  }

  const { data: usersWithRole, isFetching: isUsersFetching } = useGetGroupUsersWithRoles(
    organization?.groupId ?? '',
    roleFilter?.id,
    MembersPageSize,
    membersPageTokens[page],
  );
  const {
    data: { invitationRoles, invitationsUserMap, invitationsPageToken } = {},
    isFetching: isInvitationsFetching,
  } = useGetInvitationsWithRole(
    organization?.id,
    roleFilter?.id?.toString(),
    invitationsPageTokens[page],
    MembersPageSize,
    roleFilter?.id === DefaultMemberRoleIdNumber,
  );
  const mappedInvitations: GroupUserWithRoles[] | undefined = useMemo(() => {
    return invitationRoles?.map((invitation) => ({
      user: {
        userId: Number.parseInt(invitation?.userId ?? '0', 10),
        displayName: invitationsUserMap?.get(`${invitation?.userId}`)?.displayName,
        username: invitationsUserMap?.get(`${invitation?.userId}`)?.name,
      },
      roles:
        roles?.filter(
          (role) =>
            (role.id !== undefined && invitation?.roleIds?.includes(role.id.toString()) === true) ||
            role.id === DefaultMemberRoleIdNumber,
        ) ?? [],
      invitationId: invitation?.invitationId,
    }));
  }, [invitationRoles, invitationsUserMap, roles]);

  const [prevUsersWithRole, setPrevUsersWithRole] = useState<typeof usersWithRole | null>(null);
  if (menuState === GroupMembersMenuState.Members && prevUsersWithRole !== usersWithRole) {
    setPrevUsersWithRole(usersWithRole);
    setMembersPageTokens((prevPageTokens) => {
      const updatedPageTokens = [...prevPageTokens];
      updatedPageTokens[page + 1] = usersWithRole?.nextPageCursor;
      return updatedPageTokens;
    });
    if (page > 0 && usersWithRole?.data?.length === 0) {
      setPage((prevPage) => prevPage - 1);
      setNextPageDisabled(true);
    }
  }

  const [prevInvitationsPageToken, setPrevInvitationsPageToken] = useState<
    typeof invitationsPageToken | null
  >(null);
  const [prevInvitationRoles, setPrevInvitationRoles] = useState<typeof invitationRoles | null>(
    null,
  );
  if (
    menuState === GroupMembersMenuState.Invited &&
    (prevInvitationsPageToken !== invitationsPageToken || prevInvitationRoles !== invitationRoles)
  ) {
    setPrevInvitationsPageToken(invitationsPageToken);
    setPrevInvitationRoles(invitationRoles);
    setInvitationsPageTokens((prevPageTokens) => {
      const updatedPageTokens = [...prevPageTokens];
      updatedPageTokens[page + 1] = invitationsPageToken;
      return updatedPageTokens;
    });
    if (page > 0 && invitationRoles?.length === 0) {
      setPage((prevPage) => prevPage - 1);
      setNextPageDisabled(true);
    }
  }

  return (
    <Grid container direction='row' wrap='wrap'>
      {(menuState === GroupMembersMenuState.Members && usersWithRole?.data?.length === 0) ||
      (menuState === GroupMembersMenuState.Invited && mappedInvitations?.length === 0) ? (
        <Grid container direction='column' alignItems='center' padding={3} gap={3}>
          <Grid container justifyContent='center'>
            <img
              style={{ width: 145 }}
              src={noResultsIconPath}
              alt={translate('Label.NoMembers')}
            />
          </Grid>
          <Grid container direction='column' justifyContent='center' alignItems='center' gap={1}>
            <Typography variant='h6'>
              {menuState === GroupMembersMenuState.Members
                ? translate('Label.NoMembers')
                : translate('Label.NoInvitedMembers')}
            </Typography>
            {isRoleMembersPage && (
              <Typography variant='body1' align='center'>
                {translate('Description.AddMembersToRole')}
              </Typography>
            )}
          </Grid>
        </Grid>
      ) : (
        <>
          <Table className={table}>
            {!isMobile && !isRoleMembersPage && (
              <TableHead>
                <TableRow className='flex'>
                  <TableCell style={{ flex: '1 0 0' }}>
                    <Typography variant='body2'>{translate('Label.User')}</Typography>
                  </TableCell>
                  <TableCell style={{ flex: '2 0 0' }}>
                    <Typography variant='body2'>{translate('Label.Roles')}</Typography>
                  </TableCell>
                </TableRow>
              </TableHead>
            )}
            <TableBody className='width-full'>
              {menuState === GroupMembersMenuState.Members && usersWithRole?.data && (
                <>
                  {usersWithRole.data.map((member) => (
                    <TableRow key={member.user?.userId} className='flex'>
                      {isRoleMembersPage ? (
                        <RoleMembersRow member={member} menuState={menuState} role={roleFilter} />
                      ) : (
                        <GroupMembersRow member={member} menuState={menuState} />
                      )}
                    </TableRow>
                  ))}
                </>
              )}
              {menuState === GroupMembersMenuState.Invited && mappedInvitations && (
                <>
                  {mappedInvitations.map((member) => (
                    <TableRow key={member.user?.userId} className='flex'>
                      {isRoleMembersPage ? (
                        <RoleMembersRow member={member} menuState={menuState} role={roleFilter} />
                      ) : (
                        <GroupMembersRow member={member} menuState={menuState} />
                      )}
                    </TableRow>
                  ))}
                </>
              )}
            </TableBody>
          </Table>
          {((menuState === GroupMembersMenuState.Members &&
            isUsersFetching &&
            !usersWithRole?.data) ||
            (menuState === GroupMembersMenuState.Invited &&
              isInvitationsFetching &&
              !invitationRoles)) && (
            <Grid container justifyContent='center'>
              <CircularProgress />
            </Grid>
          )}
          <Grid container width='100%' marginTop='16px' justifyContent='center'>
            <Pagination
              nextProps={{
                disabled:
                  nextPageDisabled ||
                  (menuState === GroupMembersMenuState.Members &&
                    (!usersWithRole?.nextPageCursor ||
                      (usersWithRole?.data?.length ?? 0) < MembersPageSize)) ||
                  (menuState === GroupMembersMenuState.Invited &&
                    (!invitationsPageToken || (invitationRoles?.length ?? 0) < MembersPageSize)),
                onClick: () => {
                  setPage((prevPage) => prevPage + 1);
                },
              }}
              page={page + 1}
              previousProps={{
                disabled: page === 0,
                onClick: () => {
                  setPage((prevPage) => prevPage - 1);
                  setNextPageDisabled(false);
                },
              }}
              shape='rounded'
              size='medium'
              variant='reduced'
            />
          </Grid>
        </>
      )}
    </Grid>
  );
};

export default GroupMembersTable;
