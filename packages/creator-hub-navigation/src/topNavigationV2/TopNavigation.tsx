import React, { FunctionComponent, useCallback } from 'react';
import { Grid, makeStyles, Tab, Tabs } from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
import TopNavigationDropdownTab from '../topNavigation/components/TopNavigationDropdownTab';
import NotificationTray from './components/NotificationTray';
import AuthenticationStatusContainer from '../layout/components/AuthenticationStatusContainer';
import { clickCreatorIconEventModel, clickTabEventModel } from '../event/eventConstants';
import { useEventLogger } from '../providers/EventProvider';
import { TNavigationTab } from './constants';
import CreatorHubHeader from './components/CreatorHubHeader';
import CompactHeader from './components/CompactHeader';

const useTopNavigationStyles = makeStyles()((theme) => ({
  root: {
    height: 60,
    borderBottom: `1px solid ${theme.palette.surface.outline}`,
    padding: '0 48px 0 36px',
    [theme.breakpoints.down('XLarge')]: {
      padding: '0 32px 0 20px',
    },
    [theme.breakpoints.down('Medium')]: {
      padding: '0 24px 0 12px',
    },
  },

  nav: {
    display: 'flex',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  links: {
    display: 'flex',
    alignItems: 'center',
  },

  tabs: {
    [theme.breakpoints.down('Large')]: {
      display: 'none',
    },
  },

  tab: {
    textTransform: 'none',
    padding: '0 12px',
    [theme.breakpoints.up('XXLarge')]: {
      padding: '0 20px',
    },
    opacity: 1,
    minWidth: 0,
    '&:focus-visible': {
      outline: `${theme.palette.content.standard} auto`,
      outlineOffset: '-8px',
    },
  },

  rightContent: {
    display: 'flex',
    flexDirection: 'row',
  },
}));

type TTopNavigationProps = {
  tabs: TNavigationTab[];
  isCompact?: boolean;
  creatorHubUrl: string;
  openDrawer: VoidFunction;
};

export const TopNavigation: FunctionComponent<TTopNavigationProps> = ({
  tabs,
  creatorHubUrl,
  isCompact = false,
  openDrawer,
}) => {
  const sendEvent = useEventLogger();
  const { translate } = useTranslation();
  const {
    classes: { root, nav, tabs: tabsClass, links, tab: tabClass, rightContent },
  } = useTopNavigationStyles();

  const productTab = tabs.find((tab) => tab.current);
  const tabsValue = productTab?.key || false;

  const onTabClick = useCallback(
    ({ tab, tabHref }: { tab: string; tabHref?: string }) => {
      sendEvent(clickTabEventModel(tab));
      setTimeout(() => {
        window.open(tabHref, '_self');
      }, 100);
    },
    [sendEvent],
  );

  const onHeaderClick = useCallback(() => {
    sendEvent(clickCreatorIconEventModel);
  }, [sendEvent]);

  return (
    <header>
      <Grid classes={{ root }}>
        <Grid component='nav' classes={{ root: nav }}>
          <Grid classes={{ root: links }}>
            {isCompact ? (
              <CompactHeader
                creatorHubUrl={creatorHubUrl}
                sendEvent={sendEvent}
                productTab={productTab}
                openDrawer={openDrawer}
              />
            ) : (
              <CreatorHubHeader creatorHubUrl={creatorHubUrl} onClick={onHeaderClick} />
            )}
            <Tabs
              value={tabsValue}
              classes={{ root: tabsClass }}
              TabIndicatorProps={{ hidden: true }}>
              {tabs.map(({ key, current, title, href: tabHref, dropdown }) => {
                if (dropdown) {
                  return <TopNavigationDropdownTab key={key} tab={dropdown} focused={current} />;
                }
                return (
                  <Tab
                    value={key}
                    key={key}
                    label={translate(title)}
                    component='a'
                    onClick={(e: React.MouseEvent) => {
                      e.preventDefault();
                      onTabClick({ tab: key, tabHref });
                    }}
                    href={tabHref}
                    classes={{ root: tabClass }}
                  />
                );
              })}
            </Tabs>
          </Grid>
          <Grid id='right' classes={{ root: rightContent }}>
            <NotificationTray />
            <AuthenticationStatusContainer />
          </Grid>
        </Grid>
      </Grid>
    </header>
  );
};

export default TopNavigation;
