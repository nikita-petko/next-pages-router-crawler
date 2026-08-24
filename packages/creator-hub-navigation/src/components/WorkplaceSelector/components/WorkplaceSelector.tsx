import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslation } from '@rbx/intl';
import {
  Divider,
  ExpandMoreIcon,
  FormControl,
  Grid,
  Label,
  ListSubheader,
  makeStyles,
  Menu,
  MenuItem,
  outlinedInputClasses,
  Select,
  selectClasses,
  Typography,
  useMediaQuery,
  List,
  ListItem,
  useTheme,
} from '@rbx/ui';
import useNavigationConfigs from '../../../hooks/useNavigationConfigs';
import type { TSorts, TWorkspace } from '../../../providers/WorkspaceProvider/constants';
import useProductUrls from '../../../utils/useProductUrls';
import MobileDrawer from './MobileDrawer';
import SortMenu from './SortMenu';
import WorkplaceControls from './WorkplaceControls';
import WorkplaceItem from './WorkplaceItem';

type TWorkplaceSelectorProps = {
  collapsed: boolean;
  currentWorkspace: TWorkspace;
  workspaces: TWorkspace[];
  sortBy: TSorts;
  onWorkspaceSelect: (creator: TWorkspace) => void;
  onSortUpdate: (sort: TSorts) => void;
  onCreate: VoidFunction;
};

const SELECT_MENU_WIDTH = 218;
const useStyles = makeStyles()((theme) => ({
  paper: {
    backgroundColor: theme.palette.surface[300],
  },
  selectContainer: {
    // Full rail width so the closed chevron tip lines up with primary-rail New badges.
    // Lock to 40px so the larger chevron can't grow the control and nudge All Tools down.
    width: '100%',
    height: 40,
    minHeight: 40,
    maxHeight: 40,
    padding: 0,
    boxSizing: 'border-box',
    [`.${outlinedInputClasses.notchedOutline}`]: {
      border: 0,
    },
    [`.${selectClasses.select}`]: {
      // Leave room for 24×24 chevron + 4px right inset.
      padding: '0 28px 0 8px',
      height: 40,
      display: 'flex',
      alignItems: 'center',
      boxSizing: 'border-box',
    },
    // Keep ExpandMore orientation (down when closed / up when open) but pin it
    // at the rail edge so the tip still lines up with primary-rail New badges.
    // Absolutely positioned so it never contributes to layout height.
    [`.${selectClasses.icon}`]: {
      position: 'absolute',
      fontSize: 24,
      width: 24,
      height: 24,
      right: 4,
      top: '50%',
      transform: 'translateY(-50%)',
    },
    // Open → point up (MUI Select default 180° flip, keep vertical centering).
    [`.${selectClasses.iconOpen}`]: {
      transform: 'translateY(-50%) rotate(180deg)',
    },
  },
  selectContainerCollapsed: {
    width: '100%',
    height: 40,
    minHeight: 40,
    maxHeight: 40,
    [`.${selectClasses.select}`]: {
      padding: '0 28px 0 8px',
    },
    [`.${selectClasses.icon}`]: {
      display: 'none',
    },
  },
  selectMenu: {
    width: SELECT_MENU_WIDTH,
  },
  menuItem: {
    margin: '0px 4px',
  },
  menuList: {
    gap: 2,
    padding: '4px 0px',
    display: 'flex',
    flexDirection: 'column',
  },
  sortMenu: {
    marginLeft: 20,
    marginTop: -6,
  },
  sortMenuList: {
    minWidth: 220,
  },

  drawerPaper: {
    padding: 12,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    backgroundColor: theme.palette.surface[300],
  },
  current: {
    margin: '0px 8px',
    padding: 8,
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  currentWorkplaceList: {
    paddingBottom: '0px',
  },
  listItem: {
    padding: '0px',
  },
  link: {
    color: theme.palette.content.muted,
    textDecoration: 'none',
    width: '100%',
    height: '100%',
    padding: '8px 4px',
    borderRadius: 8,
    '&:hover': {
      color: theme.palette.content.standard,
      backgroundColor: theme.palette.states.selected,
    },
  },
}));

const WorkplaceSelector: React.FunctionComponent<TWorkplaceSelectorProps> = ({
  currentWorkspace,
  workspaces,
  sortBy,
  collapsed,
  onCreate,
  onSortUpdate,
  onWorkspaceSelect,
}) => {
  const { translate } = useTranslation();
  const {
    cx,
    classes: {
      paper,
      selectMenu,
      selectContainer,
      selectContainerCollapsed,
      menuList,
      menuItem,
      sortMenu,
      sortMenuList,
      listItem,
      currentWorkplaceList,
      link,
      current,
    },
  } = useStyles();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);
  const [sortButtonEl, setSortButtonEl] = useState<HTMLButtonElement | null>(null);

  const { Dashboard } = useProductUrls();
  const { enableGroupModeration } = useNavigationConfigs();

  const isMobile = useMediaQuery((theme) => theme.breakpoints.down('Medium'));
  const {
    transitions: {
      duration: { standard: transitionTime },
    },
  } = useTheme();
  const isDrawerOpen = isMobile && isMenuOpen;
  const isSelectOpen = !isMobile && isMenuOpen;
  const isSortDrawerOpen = isMobile && isSortMenuOpen;
  const isMenuSortOpen = !isMobile && isSortMenuOpen;
  const [selectedWorkspace, setSelectedWorkspace] = useState(currentWorkspace);

  // If menu is close update the sort menu once the close transition is done
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (!isMenuOpen && isSortMenuOpen) {
      timeout = setTimeout(() => setIsSortMenuOpen(false), transitionTime);
    }

    return () => {
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, [isMenuOpen, isSortMenuOpen, transitionTime]);

  // Wait for menu to be closed before updating the selected workspace to prevent content flashing as it animation out
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (!isMenuOpen) {
      timeout = setTimeout(() => setSelectedWorkspace(currentWorkspace), transitionTime);
    }

    return () => {
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, [currentWorkspace, isMenuOpen, transitionTime]);

  const onCreateWrapper = useCallback(() => {
    setIsMenuOpen(false);
    onCreate();
  }, [onCreate]);

  const onClose = useCallback(() => {
    setIsSortMenuOpen(false);
  }, []);

  const onWorkspaceSelectWrapper = useCallback(
    (workspace: TWorkspace) => {
      setIsMenuOpen(false);
      onWorkspaceSelect(workspace);
    },
    [onWorkspaceSelect],
  );

  const currentWorkplaceContent = (
    <Grid classes={{ root: current }} key='current-workplace'>
      <WorkplaceItem workspace={selectedWorkspace} size='large' />
      {selectedWorkspace.creatorType === 'Group' && (
        <List classes={{ root: currentWorkplaceList }}>
          <ListItem classes={{ root: listItem }}>
            <Link href={Dashboard.groupProfile} className={link}>
              <Typography variant='smallLabel2'>{translate('Label.Settings')}</Typography>
            </Link>
          </ListItem>
          <ListItem classes={{ root: listItem }}>
            <Link href={Dashboard.groupMembers} className={link}>
              <Typography variant='smallLabel2'>{translate('Label.Members')}</Typography>
            </Link>
          </ListItem>
          <ListItem classes={{ root: listItem }}>
            <Link href={Dashboard.groupRoles} className={link}>
              <Typography variant='smallLabel2'>{translate('Label.Roles')}</Typography>
            </Link>
          </ListItem>
          {enableGroupModeration && (
            <ListItem classes={{ root: listItem }}>
              <Link href={Dashboard.groupModeration} className={link}>
                <Typography variant='smallLabel2'>{translate('Label.Moderation')}</Typography>
              </Link>
            </ListItem>
          )}
          <ListItem classes={{ root: listItem }}>
            <Link href={Dashboard.groupActivityHistory} className={link}>
              <Typography variant='smallLabel2'>{translate('Label.ActivityHistory')}</Typography>
            </Link>
          </ListItem>
        </List>
      )}
    </Grid>
  );

  const menuContent = [
    currentWorkplaceContent,
    <Divider key='diver' />,
    <WorkplaceControls
      key='controls'
      sortButtonRef={setSortButtonEl}
      onCreate={onCreateWrapper}
      setIsSortMenuOpen={setIsSortMenuOpen}
    />,
    ...workspaces.flatMap((workspace) => {
      if (
        workspace.creatorType === selectedWorkspace.creatorType &&
        workspace.creatorId === selectedWorkspace.creatorId
      ) {
        return null;
      }

      return (
        <MenuItem
          key={`${workspace.creatorId}-${workspace.creatorType}`}
          value={workspace.creatorId}
          classes={{ root: menuItem }}
          onClick={() => onWorkspaceSelectWrapper(workspace)}>
          <WorkplaceItem
            workspace={workspace}
            size='large'
            adornment={
              workspace.creatorType === 'User' ? (
                <Typography variant='smallLabel2'>
                  <Label labelText={translate('Label.You')} />
                </Typography>
              ) : undefined
            }
          />
        </MenuItem>
      );
    }),
  ];

  return (
    <FormControl fullWidth>
      <Menu
        classes={{
          list: sortMenuList,
          paper: cx(paper, sortMenu),
        }}
        open={isMenuSortOpen}
        anchorEl={sortButtonEl}
        onClose={onClose}
        onClick={onClose}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}>
        <ListSubheader>
          <Typography variant='captionHeader'>{translate('Label.SortBy')}</Typography>
        </ListSubheader>
        <SortMenu sortBy={sortBy} onSortUpdate={onSortUpdate} />
      </Menu>
      <Select
        classes={{ root: cx(selectContainer, { [selectContainerCollapsed]: collapsed }) }}
        margin='none'
        size='medium'
        value={currentWorkspace.creatorId}
        renderValue={() => (
          <WorkplaceItem workspace={currentWorkspace} collapsed={collapsed} variant='largeLabel2' />
        )}
        SelectProps={{
          open: isSelectOpen,
          IconComponent: ExpandMoreIcon,
          onClose: () => setIsMenuOpen(false),
          onOpen: () => {
            setIsMenuOpen(true);
          },
          MenuProps: {
            slotProps: {
              paper: {
                className: cx(paper, selectMenu),
              },
            },
            MenuListProps: {
              classes: { root: menuList },
            },
          },
        }}>
        {menuContent}
      </Select>
      <MobileDrawer
        isDrawerOpen={isDrawerOpen}
        isSortMenuOpen={isSortDrawerOpen}
        setIsMenuOpen={setIsMenuOpen}
        sortBy={sortBy}
        setIsSortMenuOpen={setIsSortMenuOpen}
        onSortUpdate={onSortUpdate}>
        {menuContent}
      </MobileDrawer>
    </FormControl>
  );
};

export default WorkplaceSelector;
