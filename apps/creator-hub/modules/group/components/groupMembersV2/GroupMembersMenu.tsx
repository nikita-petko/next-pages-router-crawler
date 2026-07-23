import React, { FunctionComponent, SyntheticEvent, useCallback } from 'react';
import { useTranslation } from '@rbx/intl';
import { Grid, makeStyles, Tab, Tabs, useMediaQuery } from '@rbx/ui';
import { GroupMembersMenuState } from '../../constants/groupConstants';

const useStyles = makeStyles()(() => ({
  tabs: {
    width: '100%',
  },
}));

export interface GroupMembersMenuProps {
  menuState: GroupMembersMenuState;
  onMenuStateChange: (newState: GroupMembersMenuState) => void;
}

const GroupMembers: FunctionComponent<GroupMembersMenuProps> = ({
  menuState,
  onMenuStateChange,
}) => {
  const { translate } = useTranslation();
  const {
    classes: { tabs },
  } = useStyles();
  const isMobile = useMediaQuery((theme) => theme.breakpoints.down('Medium'));

  const onMenuChange = useCallback(
    (_: SyntheticEvent, value: GroupMembersMenuState) => {
      onMenuStateChange(value);
    },
    [onMenuStateChange],
  );

  return (
    <Grid container>
      <Tabs
        variant={isMobile ? 'fullWidth' : 'standard'}
        className={tabs}
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

export default GroupMembers;
