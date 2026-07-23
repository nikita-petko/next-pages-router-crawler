import React, { FunctionComponent } from 'react';
import { User } from '@modules/clients';
import { Button, Grid, Typography } from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
import { CreatorType } from '@modules/miscellaneous/common';
import { ThumbnailWithNames } from '@modules/miscellaneous/common/components';

export interface SelectedUserListProps {
  selectedUsers: User[];
  removeUser: (userId: number) => void;
}

export const SelectedUserList: FunctionComponent<SelectedUserListProps> = ({
  selectedUsers,
  removeUser,
}) => {
  const { translate } = useTranslation();

  return (
    <Grid container>
      {selectedUsers.map((userInvites) => (
        <Grid item key={userInvites.id} XSmall={12} mt={2} mb={2}>
          <Grid container alignItems='center' flexWrap='wrap' spacing={1}>
            <Grid item flex='1 1 0' sx={{ overflow: 'hidden' }}>
              <ThumbnailWithNames
                target={{
                  id: userInvites.id,
                  name: userInvites.name,
                  displayName: userInvites.displayName,
                }}
                targetType={CreatorType.User}
                disableLink
                textVariant='secondary'
              />
            </Grid>
            <Grid item flex='0 0 auto'>
              <Button
                onClick={() => removeUser(userInvites.id!)}
                aria-label={translate('Action.Remove')}
                color='secondary'
                size='small'>
                <Typography variant='body1'>{translate('Action.Remove')}</Typography>
              </Button>
            </Grid>
          </Grid>
        </Grid>
      ))}
    </Grid>
  );
};
