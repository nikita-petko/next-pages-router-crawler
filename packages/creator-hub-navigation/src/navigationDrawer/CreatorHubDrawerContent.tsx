import React, { FunctionComponent, useCallback } from 'react';
import {
  Typography,
  List,
  makeStyles,
  ListItemIcon,
  listItemClasses,
  listItemIconClasses,
  typographyClasses,
  ListItemButton,
  Link,
  Grid,
} from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
import { useEventLogger } from '../providers/EventProvider';
import { TNavigationTab } from '../topNavigationV2/constants';
import { clickListEventModel } from '../event/eventConstants';
import TopNavigationDrawerProductHeader from '../topNavigation/components/TopNavigationDrawerProductHeader';

const useStyles = makeStyles()((theme) => ({
  container: {
    padding: '16px 12px',
  },
  listItem: {
    borderRadius: 8,
    paddingTop: 12,
    paddingBottom: 12,
    '&:hover': {
      [`& .${typographyClasses.root}, & .${listItemIconClasses.root}`]: {
        color: theme.palette.content.standard,
      },
    },
    [`&.${listItemClasses.selected}, &.${listItemClasses.selected}:hover`]: {
      [`& .${typographyClasses.root}, & .${listItemIconClasses.root}`]: {
        color: theme.palette.content.standard,
        fontWeight: theme.typography.fontWeightMedium,
      },
    },
  },
  listItemIcon: {
    minWidth: 40,
  },
}));

type CreatorHubDrawerContentProps = {
  tabs: TNavigationTab[];
  onClickClose: () => void;
};

const CreatorHubDrawerContent: FunctionComponent<CreatorHubDrawerContentProps> = ({
  tabs,
  onClickClose,
}) => {
  const { translate } = useTranslation();
  const sendEvent = useEventLogger();
  const {
    classes: { container, listItem, listItemIcon },
  } = useStyles();

  const onTabClick = useCallback(
    (tab: TNavigationTab) => {
      sendEvent(clickListEventModel(tab.key));
      setTimeout(() => {
        window.open(tab.href, '_self');
      }, 100);
    },
    [sendEvent],
  );

  return (
    <Grid>
      <TopNavigationDrawerProductHeader
        header={translate('Heading.Creator')}
        onClickClose={onClickClose}
      />
      <List classes={{ root: container }}>
        {tabs.map((tab) => {
          const { icon } = tab;
          let { activeIcon } = tab;
          activeIcon = activeIcon || icon;

          return (
            <ListItemButton
              key={tab.key}
              onClick={(e: React.MouseEvent) => {
                e.preventDefault();
                onTabClick(tab);
              }}
              className={listItem}
              selected={tab.current}>
              {icon != null && (
                <ListItemIcon className={listItemIcon}>
                  {tab.current ? activeIcon : icon}
                </ListItemIcon>
              )}
              <Link href={tab.href} color='inherit' target='_blank' underline='none' tabIndex={-1}>
                <Typography color='secondary' variant='largeLabel1'>
                  {translate(tab.title)}
                </Typography>
              </Link>
            </ListItemButton>
          );
        })}
      </List>
    </Grid>
  );
};

export default CreatorHubDrawerContent;
