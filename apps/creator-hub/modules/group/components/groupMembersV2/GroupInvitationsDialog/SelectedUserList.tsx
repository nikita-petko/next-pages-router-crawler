import React, { FunctionComponent } from 'react';
import { User } from '@modules/clients';
import { RoleMetadata } from '@modules/clients/organizationApi';
import { ThumbnailWithNames } from '@modules/miscellaneous/common/components';
import { Grid, IconButton, RemoveCircleOutlineIcon, useMediaQuery } from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
import { CreatorType } from '@modules/miscellaneous/common';
import { RoleSelect } from './RoleSelect';

export interface UserInvitation {
  user: User;
  roles: RoleMetadata[];
}
export interface SelectedUserListProps {
  selectedUsers: UserInvitation[];
  removeUserFromInvite: (userId: number) => void;
  updateRolesForUser: (userId: number, roles: RoleMetadata[]) => void;
}

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
            <Grid item flex='1 1 0' sx={{ overflow: 'hidden' }}>
              <ThumbnailWithNames
                target={{
                  id: userInvites.user.id,
                  name: userInvites.user.name,
                  displayName: userInvites.user.displayName,
                }}
                targetType={CreatorType.User}
                disableLink
                textVariant='secondary'
              />
            </Grid>
            <Grid
              item
              flex={isMobile ? '0 0 100%' : '0 0 auto'}
              order={isMobile ? 1 : 0}
              mt={isMobile ? 2 : 0}>
              <RoleSelect
                selectedRoles={userInvites.roles}
                onChange={(roles) => updateRolesForUser(userInvites.user.id!, roles)}
              />
            </Grid>
            <Grid item flex='0 0 auto'>
              <IconButton
                onClick={() => removeUserFromInvite(userInvites.user.id!)}
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
