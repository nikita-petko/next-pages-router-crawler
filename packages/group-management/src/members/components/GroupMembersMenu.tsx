import type { FunctionComponent, SyntheticEvent } from 'react';
import React, { useCallback } from 'react';
import { useTranslation } from '@rbx/intl';
import { Grid, Tab, Tabs, useMediaQuery } from '@rbx/ui';
import useCurrentGroup from '../../hooks/useCurrentGroup';
import { GroupMembersMenuState } from '../../utils/constants';

export type GroupMembersMenuProps = {
  menuState: GroupMembersMenuState;
  onMenuStateChange: (newState: GroupMembersMenuState) => void;
};

const GroupMembersMenu: FunctionComponent<GroupMembersMenuProps> = ({
  menuState,
  onMenuStateChange,
}) => {
  const { translate } = useTranslation();
  const { permissions } = useCurrentGroup();
  const isMobile = useMediaQuery((theme) => theme.breakpoints.down('Medium'));

  const onMenuChange = useCallback(
    (_: SyntheticEvent, value: GroupMembersMenuState) => {
      onMenuStateChange(value);
    },
    [onMenuStateChange],
  );

  if (!permissions?.canInviteMembers) {
    return null;
  }

  return (
    <Grid container>
      <Tabs
        variant={isMobile ? 'fullWidth' : 'standard'}
        className='width-full'
        value={menuState}
        onChange={onMenuChange}>
        <Tab
          key={GroupMembersMenuState.Members}
          value={GroupMembersMenuState.Members}
          label={translate(`Label.Member`)}
        />
        <Tab
          key={GroupMembersMenuState.Invited}
          value={GroupMembersMenuState.Invited}
          label={translate(`Label.Invited`)}
        />
      </Tabs>
    </Grid>
  );
};

export default GroupMembersMenu;
