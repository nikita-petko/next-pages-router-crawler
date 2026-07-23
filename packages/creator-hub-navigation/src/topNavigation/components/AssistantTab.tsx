import type { FunctionComponent, MouseEventHandler } from 'react';
import React from 'react';
import { Icon } from '@rbx/foundation-ui';
import { Tab, Tabs, makeStyles } from '@rbx/ui';
import NavigationTranslate from '../../hooks/NavigationTranslate';
import useNavigationConfigs from '../../hooks/useNavigationConfigs';
import { assistantTab } from '../constants/navigationConstants';

export interface AssistantTabProps {
  persistent?: boolean; // always show the tab
  onClick?: MouseEventHandler<HTMLDivElement>;
}

const useAssistantTabStyles = makeStyles()((theme) => ({
  tabs: {
    // vertical align child tab texts by adopting
    // same padding as authentication nav item
    padding: '6px 0',
  },
  tab: {
    minWidth: 0,
    [theme.breakpoints.down('Medium')]: {
      paddingLeft: 10,
      paddingRight: 10,
    },
  },
  labelIcon: {
    display: 'inline-block',
    verticalAlign: 'middle',
    marginTop: -8,
    marginRight: 8,
    [theme.breakpoints.down('Large')]: {
      marginTop: -6,
      marginRight: 0,
    },
  },
  labelText: {
    [theme.breakpoints.down('Large')]: {
      display: 'none',
    },
  },
}));

const AssistantTab: FunctionComponent<AssistantTabProps> = ({ onClick, persistent = false }) => {
  const {
    classes: { labelIcon, tabs, tab, labelText },
  } = useAssistantTabStyles();
  const { currentProduct, enableAssistant } = useNavigationConfigs();

  return persistent || enableAssistant ? (
    <Tabs
      onClick={onClick}
      className={tabs}
      value={currentProduct}
      TabIndicatorProps={{ hidden: true }}>
      g
      <Tab
        value={assistantTab.key}
        className={tab}
        label={
          <div>
            <Icon name='icon-regular-nebula' className={labelIcon} size='Medium' />
            <span className={labelText}>
              <NavigationTranslate content={assistantTab.title} />
            </span>
          </div>
        }
        component='a'
        href={assistantTab.href}
      />
    </Tabs>
  ) : null;
};

export default AssistantTab;
