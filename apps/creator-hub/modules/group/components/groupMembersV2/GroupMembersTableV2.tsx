import type { FunctionComponent } from 'react';
import { useCallback, useMemo, useState } from 'react';
import type { RoleMetadata } from '@rbx/client-organizations-service-api/v1';
import { useTranslation } from '@rbx/intl';
import {
  Grid,
  makeStyles,
  Typography,
  Pagination,
  Table,
  TableHead,
  TableCell,
  TableRow,
  CircularProgress,
  TableBody,
  useMediaQuery,
} from '@rbx/ui';
import {
  useGetInvitationsWithRole,
  useGetOrganizationRoles,
  useGetUsersWithRole,
} from '@modules/react-query/groupMembers';
import {
  DefaultMemberRoleId,
  GroupMembersMenuState,
  MembersPageSize,
  noResultsIconPath,
} from '../../constants/groupConstants';
import useCurrentOrganization from '../../hooks/useCurrentOrganization';
import RoleMembersRow from '../roleMembersV2/RoleMembersRowV2';
import GroupMembersRow from './GroupMembersRowV2';

const useGroupMembersTableStyles = makeStyles()((theme) => ({
  rowContainer: {
    display: 'flex',
  },

  nameContainer: {
    flex: '1 0 0',
  },

  rolesContainer: {
    flex: '2 0 0',
  },

  iconImg: {
    width: 145,
  },

  table: {
    [theme.breakpoints.down('Medium')]: {
      display: 'flex',
    },
  },

  tableBody: {
    width: '100%',
  },

  tableRow: {
    display: 'flex',
  },
}));

export type GroupMembersTableProps = {
  menuState: GroupMembersMenuState;
  roleFilter: RoleMetadata | null;
  isRoleMembersPage?: boolean;
};

const GroupMembersTable: FunctionComponent<GroupMembersTableProps> = ({
  menuState,
  roleFilter,
  isRoleMembersPage = false,
}) => {
  const {
    classes: { rowContainer, nameContainer, rolesContainer, iconImg, table, tableBody, tableRow },
  } = useGroupMembersTableStyles();
  const { translate } = useTranslation();
  const isMobile = useMediaQuery((theme) => theme.breakpoints.down('Medium'));

  const { organization } = useCurrentOrganization();
  const { data: roles } = useGetOrganizationRoles(organization?.id);

  const [membersPageTokens, setMembersPageTokens] = useState<(string | null | undefined)[]>([]);
  const [invitationsPageTokens, setInvitationsPageTokens] = useState<(string | null | undefined)[]>(
    [],
  );
  const [page, setPage] = useState<number>(0);
  const [nextPageDisabled, setNextPageDisabled] = useState<boolean>(false);

  const pagingKey = `${menuState}:${roleFilter?.id ?? ''}`;
  const [renderedPagingKey, setRenderedPagingKey] = useState<string>(pagingKey);
  if (renderedPagingKey !== pagingKey) {
    setRenderedPagingKey(pagingKey);
    setPage(0);
    setMembersPageTokens([]);
    setInvitationsPageTokens([]);
    setNextPageDisabled(false);
  }

  const { data: { usersWithRole, userMap } = {}, isFetching: isUsersFetching } =
    useGetUsersWithRole(
      organization?.id,
      roleFilter?.id,
      membersPageTokens[page],
      MembersPageSize,
      roleFilter?.id === DefaultMemberRoleId,
    );
  const {
    data: { invitationRoles, invitationsUserMap, invitationsPageToken } = {},
    isFetching: isInvitationsFetching,
  } = useGetInvitationsWithRole(
    organization?.id,
    roleFilter?.id,
    invitationsPageTokens[page],
    MembersPageSize,
    roleFilter?.id === DefaultMemberRoleId,
  );
  const mappedInvitations = useMemo(() => {
    return invitationRoles?.map((invitation) => ({
      userId: invitation?.userId,
      roles:
        roles?.filter(
          (role) =>
            // oxlint-disable-next-line typescript/prefer-nullish-coalescing -- intentional boolean OR, not nullish coalescing
            (role.id && invitation?.roleIds?.includes(role.id)) || role.id === DefaultMemberRoleId,
        ) ?? [],
      invitationId: invitation?.invitationId,
    }));
  }, [invitationRoles, roles]);

  const isInvited = menuState === GroupMembersMenuState.Invited;

  const isPageSettled = isInvited ? !isInvitationsFetching : !isUsersFetching;
  const currentPageCount = isInvited ? invitationRoles?.length : usersWithRole?.users.length;
  if (page > 0 && currentPageCount === 0 && isPageSettled && !nextPageDisabled) {
    setPage(page - 1);
    setNextPageDisabled(true);
  }

  const goToNextPage = useCallback(() => {
    const nextPage = page + 1;

    if (isInvited) {
      setInvitationsPageTokens((prevPageTokens) => {
        const updatedPageTokens = [...prevPageTokens];
        updatedPageTokens[nextPage] = invitationsPageToken;
        return updatedPageTokens;
      });
    } else {
      setMembersPageTokens((prevPageTokens) => {
        const updatedPageTokens = [...prevPageTokens];
        updatedPageTokens[nextPage] = usersWithRole?.pageToken;
        return updatedPageTokens;
      });
    }

    setPage(nextPage);
  }, [invitationsPageToken, isInvited, page, usersWithRole?.pageToken]);

  const goToPreviousPage = useCallback(() => {
    setPage((prevPage) => prevPage - 1);
    setNextPageDisabled(false);
  }, []);

  return (
    <Grid container direction='row' wrap='wrap'>
      {(menuState === GroupMembersMenuState.Members && usersWithRole?.users.length === 0) ||
      (menuState === GroupMembersMenuState.Invited && mappedInvitations?.length === 0) ? (
        <Grid container direction='column' alignItems='center' padding={3} gap={3}>
          <Grid container justifyContent='center'>
            <img className={iconImg} src={noResultsIconPath} alt={translate('Label.NoMembers')} />
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
                <TableRow className={rowContainer}>
                  <TableCell className={nameContainer}>
                    <Typography variant='body2'>{translate('Label.User')}</Typography>
                  </TableCell>
                  <TableCell className={rolesContainer}>
                    <Typography variant='body2'>{translate('Label.Roles')}</Typography>
                  </TableCell>
                </TableRow>
              </TableHead>
            )}
            <TableBody className={tableBody}>
              {menuState === GroupMembersMenuState.Members && usersWithRole?.users && (
                <>
                  {usersWithRole.users.map((member) => (
                    <TableRow key={member.userId} className={tableRow}>
                      {isRoleMembersPage ? (
                        <RoleMembersRow
                          member={member}
                          user={userMap?.get(`${member?.userId}`) ?? undefined}
                          menuState={menuState}
                          role={roleFilter}
                        />
                      ) : (
                        <GroupMembersRow
                          member={member}
                          user={userMap?.get(`${member?.userId}`) ?? undefined}
                          menuState={menuState}
                        />
                      )}
                    </TableRow>
                  ))}
                </>
              )}
              {menuState === GroupMembersMenuState.Invited && mappedInvitations && (
                <>
                  {mappedInvitations.map((member) => (
                    <TableRow key={member.userId} className={tableRow}>
                      {isRoleMembersPage ? (
                        <RoleMembersRow
                          member={member}
                          user={invitationsUserMap?.get(`${member?.userId}`) ?? undefined}
                          menuState={menuState}
                          role={roleFilter}
                        />
                      ) : (
                        <GroupMembersRow
                          member={member}
                          user={invitationsUserMap?.get(`${member?.userId}`) ?? undefined}
                          menuState={menuState}
                        />
                      )}
                    </TableRow>
                  ))}
                </>
              )}
            </TableBody>
          </Table>
          {((menuState === GroupMembersMenuState.Members &&
            isUsersFetching &&
            !usersWithRole?.users) ||
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
                    (!usersWithRole?.pageToken ||
                      (usersWithRole?.users?.length ?? 0) < MembersPageSize)) ||
                  (menuState === GroupMembersMenuState.Invited &&
                    (!invitationsPageToken || (invitationRoles?.length ?? 0) < MembersPageSize)),
                onClick: goToNextPage,
              }}
              page={page + 1}
              previousProps={{
                disabled: page === 0,
                onClick: goToPreviousPage,
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
