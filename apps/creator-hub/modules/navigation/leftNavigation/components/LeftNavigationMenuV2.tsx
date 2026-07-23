import type { FunctionComponent } from 'react';
import React from 'react';
import { NavigationTree, NavigationTreeItem } from '@rbx/creator-hub-navigation';
import { Typography, Grid, makeStyles, Divider } from '@rbx/ui';

export type TMenuItem = {
  key: string;
  label: string;
  href?: string;
  onClick?: React.MouseEventHandler<HTMLLIElement>;
  subItems?: TMenuItem[];
};

export type LeftNavigationMenuProps = {
  header?: string;
  items: TMenuItem[];
  activeKey?: string;
  defaultExpanded?: string[];
  icon?: React.ReactNode;
};

const useStyles = makeStyles()(() => ({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  headerContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  },
  header: {
    padding: '16px 12px',
  },
  icon: {
    height: 32,
    width: 32,
  },
}));

/**
 * Menu item used for LeftNavigationMenuV2
 * When target child items in activeKey and defaultExpanded keys need prefix with parent key
 * ex 'creations-overview'
 */
const LeftNavigationMenu: FunctionComponent<React.PropsWithChildren<LeftNavigationMenuProps>> = ({
  header,
  items,
  icon,
  activeKey,
  defaultExpanded,
}) => {
  const { classes: styles } = useStyles();

  return (
    <Grid classes={{ root: styles.container }}>
      {header && (
        <>
          <Grid classes={{ root: styles.headerContainer }}>
            {icon && <Grid classes={{ root: styles.icon }}>{icon}</Grid>}
            <Typography variant='largeLabel2' classes={{ root: styles.header }}>
              {header}
            </Typography>
          </Grid>
          <Divider />
        </>
      )}
      <NavigationTree selected={activeKey} defaultExpanded={defaultExpanded}>
        {items.map((item) => {
          return (
            <NavigationTreeItem
              key={item.key}
              label={item.label}
              nodeId={item.key}
              href={item.href}
              variant='smallLabel2'
              onClick={item.onClick}>
              {item.subItems?.map((subItem) => (
                <NavigationTreeItem
                  key={`${item.key}-${subItem.key}`}
                  label={subItem.label}
                  nodeId={subItem.key}
                  onClick={subItem.onClick}
                  href={subItem.href}
                />
              ))}
            </NavigationTreeItem>
          );
        })}
      </NavigationTree>
    </Grid>
  );
};

export default LeftNavigationMenu;
