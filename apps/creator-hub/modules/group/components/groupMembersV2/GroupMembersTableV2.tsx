import React, { Fragment, FunctionComponent, useEffect, useMemo, useState } from 'react';
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
import { RoleMetadata } from '@rbx/clients/organizationsServiceApi';
import {
  useGetInvitationsWithRole,
  useGetOrganizationRoles,
  useGetUsersWithRole,
} from '@modules/react-query/groupMembers';
import { useTranslation } from '@rbx/intl';
import GroupMembersRow from './GroupMembersRowV2';
import useCurrentOrganization from '../../hooks/useCurrentOrganization';
import {
  DefaultMemberRoleId,
  GroupMembersMenuState,
  MembersPageSize,
  noResultsIconPath,
} from '../../constants/groupConstants';
import RoleMembersRow from '../roleMembersV2/RoleMembersRowV2';

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
            (role.id && invitation?.roleIds?.includes(role.id)) || role.id === DefaultMemberRoleId,
        ) ?? [],
      invitationId: invitation?.invitationId,
    }));
  }, [invitationRoles, roles]);

  useEffect(() => {
    if (menuState === GroupMembersMenuState.Members) {
      setMembersPageTokens((prevPageTokens) => {
        const updatedPageTokens = [...prevPageTokens];
        updatedPageTokens[page + 1] = usersWithRole?.pageToken;
        return updatedPageTokens;
      });
      if (page > 0 && usersWithRole?.users.length === 0) {
        setPage((prevPage) => prevPage - 1);
        setNextPageDisabled(true);
      }
    }
  }, [page, usersWithRole, menuState]);

  useEffect(() => {
    if (menuState === GroupMembersMenuState.Invited) {
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
  }, [page, invitationRoles, invitationsPageToken, menuState]);

  useEffect(() => {
    setPage(0);
    setNextPageDisabled(false);
  }, [menuState, roleFilter]);

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
        <Fragment>
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
                <Fragment>
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
                </Fragment>
              )}
              {menuState === GroupMembersMenuState.Invited && mappedInvitations && (
                <Fragment>
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
                </Fragment>
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
        </Fragment>
      )}
    </Grid>
  );
};

export default GroupMembersTable;
