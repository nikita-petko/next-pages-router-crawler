import type { FunctionComponent } from 'react';
import React from 'react';
import { useTranslation } from '@rbx/intl';
import { Grid, IconButton, RemoveCircleOutlineIcon, useMediaQuery } from '@rbx/ui';
import type { GroupRoleMetadata } from '../../../clients/groups';
import type { User } from '../../../clients/users';
import UserThumbnailWithNames from '../common/UserThumbnailWithNames';
import { RoleSelect } from './RoleSelect';

export type UserInvitation = {
  user: User;
  roles: GroupRoleMetadata[];
};

export type SelectedUserListProps = {
  selectedUsers: UserInvitation[];
  removeUserFromInvite: (userId: number) => void;
  updateRolesForUser: (userId: number, roles: GroupRoleMetadata[]) => void;
};

export const SelectedUserList: FunctionComponent<SelectedUserListProps> = ({
  selectedUsers,
  removeUserFromInvite,
  updateRolesForUser,
}) => {
  const { translate } = useTranslation();
  const isMobile = useMediaQuery((theme) => theme.breakpoints.down('Medium'));

  return (
    <Grid container>
      {selectedUsers.map((userInvites) => (
        <Grid item key={userInvites.user.id} XSmall={12} mt={2} mb={2}>
          <Grid container alignItems='center' flexWrap='wrap' spacing={1}>
            <Grid item flex='1 1 0' className='clip'>
              <UserThumbnailWithNames
                target={{
                  id: userInvites.user.id,
                  name: userInvites.user.name,
                  displayName: userInvites.user.displayName,
                }}
                disableLink
              />
            </Grid>
            <Grid
              item
              flex={isMobile ? '0 0 100%' : '0 0 auto'}
              order={isMobile ? 1 : 0}
              mt={isMobile ? 2 : 0}>
              <RoleSelect
                selectedRoles={userInvites.roles}
                onChange={(roles) => {
                  if (userInvites.user.id !== undefined) {
                    updateRolesForUser(userInvites.user.id, roles);
                  }
                }}
              />
            </Grid>
            <Grid item flex='0 0 auto'>
              <IconButton
                onClick={() => {
                  if (userInvites.user.id !== undefined) {
                    removeUserFromInvite(userInvites.user.id);
                  }
                }}
                aria-label={translate('Action.Remove')}
                color='secondary'
                size='small'>
                <RemoveCircleOutlineIcon fontSize='large' />
              </IconButton>
            </Grid>
          </Grid>
        </Grid>
      ))}
    </Grid>
  );
};

export default SelectedUserList;
