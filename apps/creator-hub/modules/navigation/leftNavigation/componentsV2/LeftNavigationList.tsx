import type { ReactNode } from 'react';
import React, { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import {
  List,
  ListItemText,
  ListItemIcon,
  ListSubheader,
  Collapse,
  Grid,
  IconButton,
  ArrowDropDownRoundedIcon,
  ListItemSecondaryAction,
  ListItemButton,
} from '@rbx/ui';
import { Link } from '@modules/miscellaneous/components';
import type Feature from '../../feature/interfaces/Feature';
import type { MenuItem } from '../interface/menuItem';
import useLeftNavigationListStyles from './LeftNavigationList.styles';

type LeftNavigationListFeature = Pick<Feature, 'path' | 'getExternalPath'>;

const LeftNavigationListItem = <T extends LeftNavigationListFeature>({
  item,
  activeKey,
  onSelectItem,
  parentItem,
  expanded,
}: React.PropsWithChildren<{
  item: MenuItem<T>;
  parentItem?: MenuItem<T>;
  activeKey?: string;
  expanded?: boolean;
  onSelectItem: (item: MenuItem<T>) => void;
}>) => {
  const { classes: styles } = useLeftNavigationListStyles();
  const router = useRouter();

  const getLabelNode = useCallback(
    (labelInfoNode: ReactNode, path?: string, externalPath?: string) => {
      const hrefURL = externalPath ?? {
        pathname: path,
        query: router.query,
      };

      return (
        <Link
          variant='body1'
          className={styles.sidebarLink}
          display='block'
          href={hrefURL}
          onClick={(event) => {
            event.preventDefault();
          }}>
          {labelInfoNode}
        </Link>
      );
    },
    [router.query, styles.sidebarLink],
  );
  const { title, key, adornment, subItems } = item;
  const currentItem = item.content;
  const content = getLabelNode(
    title,
    currentItem?.path,
    currentItem?.getExternalPath ? currentItem.getExternalPath() : undefined,
  );
  const icon = key === activeKey ? (item.activeIcon ?? item.icon) : item.icon;
  const onClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement | HTMLButtonElement>) => {
      event.preventDefault();
      onSelectItem(item);
    },
    [item, onSelectItem],
  );
  return (
    <ListItemButton key={key} selected={key === activeKey} onClick={onClick} disableRipple>
      <ListItemIcon className={styles.listItemIcon}>{icon}</ListItemIcon>
      <ListItemSecondaryAction className={styles.listItemAdornment}>
        {adornment}
      </ListItemSecondaryAction>
      <ListItemText
        primary={parentItem ? undefined : content}
        secondary={parentItem ? content : undefined}
      />
      {subItems && subItems.length > 0 ? (
        <ListItemSecondaryAction>
          <IconButton color='secondary' onClick={onClick} aria-label='more' disableRipple>
            <ArrowDropDownRoundedIcon
              color='disabled'
              style={{ transform: expanded ? 'rotate(180deg)' : 'none' }}
            />
          </IconButton>
        </ListItemSecondaryAction>
      ) : null}
    </ListItemButton>
  );
};

export interface LeftNavigationMenuProps<T extends LeftNavigationListFeature = Feature> {
  header?: string;
  items: MenuItem<T>[];
  onSelectItem: (item: MenuItem<T>) => void;
  activeKey?: string;
  defaultExpanded?: string[];
  iconOnly?: boolean;
}
const LeftNavigationList = <T extends LeftNavigationListFeature>({
  header,
  items,
  activeKey,
  onSelectItem,
  defaultExpanded,
  iconOnly = false,
}: React.PropsWithChildren<LeftNavigationMenuProps<T>>) => {
  const { classes: styles, cx } = useLeftNavigationListStyles();
  const [expandedItems, setExpandedItems] = useState(defaultExpanded ?? []);
  const activeParentKey = useMemo(
    () => items.find((item) => item.subItems?.some((subItem) => subItem.key === activeKey))?.key,
    [activeKey, items],
  );
  const expandedList = useMemo(() => {
    if (activeParentKey === undefined) {
      return expandedItems;
    }
    return [...new Set([...expandedItems, activeParentKey])];
  }, [activeParentKey, expandedItems]);

  if (iconOnly) {
    return (
      <Grid container direction='column' className={styles.iconOnlyList}>
        {items.map((item) => {
          const selected =
            item.key === activeKey ||
            (item.subItems && item.subItems.find((subItem) => subItem.key === activeKey));
          const icon = selected ? (item.activeIcon ?? item.icon) : item.icon;
          return (
            <Grid
              item
              key={item.key}
              className={cx(styles.iconOnlyItem, {
                [styles.iconOnlyItemSelected]: !!selected,
              })}>
              <IconButton aria-label={item.title} color='secondary'>
                {icon}
              </IconButton>
            </Grid>
          );
        })}
      </Grid>
    );
  }

  return (
    <List subheader={<ListSubheader className={styles.listSubheader}>{header}</ListSubheader>}>
      {items.map((item) => {
        const { key, subItems = null } = item;
        const expandChildList = expandedList.includes(item.key);
        return (
          <React.Fragment key={`wrap-${key}`}>
            <LeftNavigationListItem
              key={key}
              item={item}
              onSelectItem={(selectedItem) => {
                if (selectedItem.subItems) {
                  if (expandChildList) {
                    setExpandedItems(
                      expandedItems.filter((expandedKey) => expandedKey !== selectedItem.key),
                    );
                  } else {
                    setExpandedItems(expandedItems.concat(selectedItem.key));
                  }
                }
                onSelectItem(selectedItem);
              }}
              activeKey={activeKey}
              expanded={expandChildList}
            />
            {subItems && subItems.length > 0 ? (
              <Collapse in={expandChildList} timeout='auto' unmountOnExit>
                <List disablePadding dense>
                  {subItems.map((subItem) => {
                    return (
                      <LeftNavigationListItem
                        key={subItem.key}
                        item={subItem}
                        parentItem={item}
                        onSelectItem={onSelectItem}
                        activeKey={activeKey}
                      />
                    );
                  })}
                </List>
              </Collapse>
            ) : null}
          </React.Fragment>
        );
      })}
    </List>
  );
};

export default LeftNavigationList;
