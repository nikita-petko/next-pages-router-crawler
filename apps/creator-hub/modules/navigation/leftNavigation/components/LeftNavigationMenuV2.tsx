import type { FunctionComponent } from 'react';
import React from 'react';
import { NavigationTree, NavigationTreeItem } from '@rbx/creator-hub-navigation';
import { Typography, Grid, makeStyles, Divider } from '@rbx/ui';

export type TMenuItem = {
  key: string;
  label: string;
  href?: string;
  onClick?: React.MouseEventHandler<HTMLLIElement>;
  /** Trailing badge / external icon — left of expand chevron when both present. */
  adornment?: React.ReactNode;
  subItems?: TMenuItem[];
};

export type LeftNavigationMenuProps = {
  header?: string;
  items: TMenuItem[];
  activeKey?: string;
  defaultExpanded?: string[];
  icon?: React.ReactNode;
};

const useStyles = makeStyles()((theme) => ({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  headerContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 0,
  },
  // Title/TitleLarge — rail title
  header: {
    display: 'flex',
    alignItems: 'center',
    height: 40,
    minHeight: 40,
    paddingLeft: 12,
    minWidth: 0,
    overflow: 'hidden',
    color: 'var(--color-content-emphasis)',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    fontFamily: 'var(--Config-Text-Font, "Builder Sans")',
    fontSize: 16,
    fontStyle: 'normal',
    fontWeight: 700,
    lineHeight: '140%',
  },
  divider: {
    borderColor: theme.palette.components.divider,
  },
  icon: {
    height: 32,
    width: 32,
    minWidth: 32,
    minHeight: 32,
    flexShrink: 0,
    overflow: 'hidden',
    borderRadius: 8,
    color: 'var(--color-content-emphasis)',
    // Thumbnails (e.g. group icon) must stay inside this box — a 150px image
    // otherwise paints over the nav items and the rail looks blank.
    '& img, & canvas, & > *': {
      width: '100%',
      height: '100%',
      maxWidth: '100%',
      maxHeight: '100%',
      objectFit: 'cover',
      display: 'block',
    },
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
          <Divider classes={{ root: styles.divider }} />
        </>
      )}
      {items.length > 0 && (
        <NavigationTree selected={activeKey} defaultExpanded={defaultExpanded}>
          {items.map((item) => {
            return (
              <NavigationTreeItem
                key={item.key}
                label={item.label}
                nodeId={item.key}
                href={item.href}
                adornment={item.adornment}
                variant='smallLabel2'
                onClick={item.onClick}>
                {item.subItems?.map((subItem) => (
                  <NavigationTreeItem
                    key={`${item.key}-${subItem.key}`}
                    label={subItem.label}
                    nodeId={subItem.key}
                    onClick={subItem.onClick}
                    href={subItem.href}
                    adornment={subItem.adornment}
                  />
                ))}
              </NavigationTreeItem>
            );
          })}
        </NavigationTree>
      )}
    </Grid>
  );
};

export default LeftNavigationMenu;
