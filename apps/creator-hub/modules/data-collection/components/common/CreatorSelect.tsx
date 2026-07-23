import type { FunctionComponent } from 'react';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation, withTranslation } from '@rbx/intl';
import {
  MenuItem,
  Select,
  Grid,
  Typography,
  makeStyles,
  selectClasses,
  avatarClasses,
} from '@rbx/ui';
import type { TUser } from '@modules/authentication/types';
import type { Creator } from '@modules/miscellaneous/common';
import { CreatorThumbnailContainer, CreatorType } from '@modules/miscellaneous/common';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

const useStyles = makeStyles<{ width?: number }>()((theme, { width }) => ({
  creatorLabel: {
    marginLeft: theme.spacing(1),
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },

  dropdownMenuWidth: { width },

  selectDropdown: {
    width: '100%',
    [`& .${avatarClasses.root}`]: {
      width: 32,
      height: 32,
    },
  },

  menuItemWrapper: {
    alignItems: 'center',
    [`.${selectClasses.select} &`]: {
      margin: '-4px 0',
    },
  },
}));

export interface Group {
  id: number;
  name: string;
}

function groupToCreator(group: Group): Creator {
  return {
    creatorId: group.id,
    creatorName: group.name,
    creatorType: CreatorType.Group,
  };
}

interface CreatorSelectProps {
  groups: Group[];
  user: TUser;
  onGroupChange: (groupId: string) => void;
}

const CreatorSelect: FunctionComponent<CreatorSelectProps> = ({ groups, user, onGroupChange }) => {
  const [selectedGroup, setSelectedGroup] = useState<string>(`user-${user.id}`);
  const [selectWidth, setSelectWidth] = useState<number>(0);

  const selectElementRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (selectElementRef.current) {
      setSelectWidth(selectElementRef.current.offsetWidth);
    }
  }, [selectElementRef.current?.offsetWidth]);

  const {
    classes: { creatorLabel, dropdownMenuWidth, selectDropdown, menuItemWrapper },
  } = useStyles({
    width: selectWidth,
  });

  const { translate } = useTranslation();

  useEffect(() => {
    onGroupChange(selectedGroup);
  }, [selectedGroup, onGroupChange]);

  const handleChange = (event: React.ChangeEvent<{ value: string }>) => {
    setSelectedGroup(event.target.value);
  };

  const userAsCreator: Creator = useMemo(() => {
    return {
      creatorId: user.id,
      creatorName: process.env.buildTarget === 'luobu' ? user.displayName : user.name,
      creatorType: CreatorType.User,
    };
  }, [user]);

  return (
    <Grid container marginY={2}>
      <Grid item XSmall={12} Medium={6} Large={4} XLarge={3}>
        <Select
          classes={{
            root: selectDropdown,
          }}
          SelectProps={{
            MenuProps: {
              PaperProps: {
                className: dropdownMenuWidth,
              },
            },
          }}
          value={selectedGroup}
          onChange={handleChange}
          label={translate('Action.SelectCreator')}
          size='medium'
          margin='none'
          ref={selectElementRef}
          data-testid='creator-select'>
          <MenuItem key={`user-${user.id}`} value={`user-${user.id}`} data-testid='user-menu-item'>
            <Grid container wrap='nowrap' className={menuItemWrapper}>
              <CreatorThumbnailContainer creator={userAsCreator} />
              <Typography
                className={creatorLabel}
                title={userAsCreator.creatorName}
                variant='largeLabel2'
                noWrap>
                {userAsCreator.creatorName}
              </Typography>
            </Grid>
          </MenuItem>
          {groups.map((group: Group) => (
            <MenuItem
              key={`group-${group.id}`}
              value={`group-${group.id}`}
              data-testid={`group-menu-item-${group.id}`}>
              <Grid container wrap='nowrap' className={menuItemWrapper}>
                <CreatorThumbnailContainer creator={groupToCreator(group)} />
                <Typography
                  className={creatorLabel}
                  title={group.name}
                  variant='largeLabel2'
                  noWrap>
                  {group.name}
                </Typography>
              </Grid>
            </MenuItem>
          ))}
        </Select>
      </Grid>
    </Grid>
  );
};

export default withTranslation(CreatorSelect, [TranslationNamespace.DataSharingSettingsV2]);
