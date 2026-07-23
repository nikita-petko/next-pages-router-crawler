import React, { FunctionComponent, useCallback, useMemo, useRef, useState } from 'react';
import Router, { useRouter } from 'next/router';
import { Grid, MenuItem, Typography, Select, FormControl, AddIcon } from '@rbx/ui';
import type { TGroup, TUser } from '@modules/authentication/types';
import {
  Creator,
  CreatorType,
  CreatorThumbnailContainer,
  urls,
} from '@modules/miscellaneous/common';
import { useTranslation } from '@rbx/intl';
import useLeftNavigationState from '../../layout/hooks/useLeftNavigationState';
import useCreatorStatusStyles from './CreatorStatus.styles';
import {
  groupsMembershipLimit,
  isAcceptedGroupPath,
} from '../constants/creationsNavigationConstants';

export interface CreatorStatusProps {
  authenticatedUser: TUser | null;
  groups: TGroup[];
  currentGroup: TGroup | null;
  setCurrentGroup: (groupId: number | null) => void;
}

const CreatorStatus: FunctionComponent<React.PropsWithChildren<CreatorStatusProps>> = ({
  authenticatedUser,
  groups,
  currentGroup,
  setCurrentGroup,
}) => {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const anchorElementRef = useRef<HTMLButtonElement | null>(null);
  const selectElementRef = useRef<HTMLDivElement | null>(null);

  const setCurrentGroupWrapper = useCallback(
    (groupId: number | null) => {
      setCurrentGroup(groupId);
      if (!isAcceptedGroupPath(router.pathname)) {
        const redirectPath = urls.creatorHub.dashboard.getUrl();
        Router.push({
          pathname: redirectPath,
        });
      }
    },
    [router.pathname, setCurrentGroup],
  );

  const userCreator: Creator = useMemo(() => {
    return {
      creatorId: authenticatedUser?.id,
      creatorName:
        process.env.buildTarget === 'luobu'
          ? authenticatedUser?.displayName
          : authenticatedUser?.name,
      creatorType: CreatorType.User,
    };
  }, [authenticatedUser]);

  const creator = useMemo(() => {
    return currentGroup
      ? {
          creatorId: currentGroup.id,
          creatorName: currentGroup.name,
          creatorType: CreatorType.Group,
        }
      : userCreator;
  }, [currentGroup, userCreator]);

  const onCreatorChange = useCallback(
    (newCreator: Creator) => {
      if (newCreator.creatorType === CreatorType.Group) {
        setCurrentGroupWrapper(newCreator.creatorId ?? null);
      } else {
        setCurrentGroupWrapper(null);
      }
    },
    [setCurrentGroupWrapper],
  );

  const {
    classes: {
      name,
      dropdownOptionColor,
      dropdownMenuList,
      selectDropdown,
      avatarWrapper,
      menuItemWrapper,
      menuIconWrapper,
    },
    cx,
  } = useCreatorStatusStyles({
    width: anchorElementRef.current?.offsetWidth || selectElementRef.current?.offsetWidth,
  });
  const { translate } = useTranslation();
  const { primarySidebarExpanded } = useLeftNavigationState();

  const menuItems = useMemo(() => {
    return [
      <MenuItem
        key={userCreator.creatorId}
        selected={userCreator.creatorId === creator.creatorId}
        value={userCreator.creatorId}
        onClick={() => onCreatorChange(userCreator)}>
        <Grid container wrap='nowrap' className={menuItemWrapper}>
          <CreatorThumbnailContainer creator={userCreator} />
          <Typography
            className={cx(name, dropdownOptionColor)}
            title={userCreator.creatorName}
            variant='largeLabel2'
            noWrap>
            {userCreator.creatorName}
          </Typography>
        </Grid>
      </MenuItem>,
      ...groups.map((group) => (
        <MenuItem
          key={group.id}
          selected={group.id === creator.creatorId}
          value={group.id}
          onClick={() =>
            onCreatorChange({
              creatorId: group.id,
              creatorName: group.name,
              creatorType: CreatorType.Group,
            })
          }>
          <Grid container wrap='nowrap' className={menuItemWrapper}>
            <CreatorThumbnailContainer
              creator={{
                creatorId: group.id,
                creatorName: group.name,
                creatorType: CreatorType.Group,
              }}
            />
            <Typography
              className={cx(name, dropdownOptionColor)}
              title={group.name}
              variant='largeLabel2'
              noWrap>
              {group.name}
            </Typography>
          </Grid>
        </MenuItem>
      )),
      groups.length < groupsMembershipLimit && (
        <MenuItem
          key='create-group'
          onClick={() => Router.push(urls.creatorHub.dashboard.getCreateGroupUrl())}>
          <Grid container wrap='nowrap' className={menuItemWrapper}>
            <AddIcon fontSize='large' className={menuIconWrapper} />
            <Typography
              className={cx(dropdownOptionColor, name)}
              title={translate('Action.CreateGroup')}
              variant='largeLabel2'
              noWrap>
              {translate('Action.CreateGroup')}
            </Typography>
          </Grid>
        </MenuItem>
      ),
    ];
  }, [
    userCreator,
    creator.creatorId,
    menuItemWrapper,
    cx,
    name,
    dropdownOptionColor,
    groups,
    menuIconWrapper,
    translate,
    onCreatorChange,
  ]);

  if (!primarySidebarExpanded) {
    return <CreatorThumbnailContainer creator={creator} className={avatarWrapper} />;
  }

  return (
    <FormControl fullWidth ref={selectElementRef}>
      <Select
        classes={{
          root: selectDropdown,
        }}
        SelectProps={{
          open,
          onOpen: () => {
            setOpen(true);
          },
          onClose: () => {
            setOpen(false);
          },
          MenuProps: {
            PaperProps: {
              className: dropdownMenuList,
            },
          },
        }}
        label={translate('Label.ViewAs')}
        margin='none'
        size='medium'
        value={creator.creatorId}>
        {menuItems}
      </Select>
    </FormControl>
  );
};

export default CreatorStatus;
