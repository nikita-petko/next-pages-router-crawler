import React, { FunctionComponent, ReactNode, useCallback, useEffect, useState } from 'react';
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
import { Link } from '@modules/miscellaneous/common';
import { useRouter } from 'next/router';
import { UrlObject } from 'url';
import { Feature } from '../../feature';
import { MenuItem } from '../interface/menuItem';
import useLeftNavigationListStyles from './LeftNavigationList.styles';

const LeftNavigationListItem: FunctionComponent<
  React.PropsWithChildren<{
    item: MenuItem;
    parentItem?: MenuItem;
    activeKey?: string;
    expanded?: boolean;
    onSelectItem: (item: MenuItem) => void;
  }>
> = ({ item, activeKey, onSelectItem, parentItem, expanded }) => {
  const { classes: styles } = useLeftNavigationListStyles();
  const router = useRouter();

  const getLabelNode = useCallback(
    (labelInfoNode: ReactNode, path?: string, externalPath?: string) => {
      const hrefURL =
        externalPath ||
        ({
          pathname: path,
          query: router.query,
        } as UrlObject & string);

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
  const currentItem = item.content as Feature;
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

export interface LeftNavigationMenuProps {
  header?: string;
  items: MenuItem[];
  onSelectItem: (item: MenuItem) => void;
  activeKey?: string;
  defaultExpanded?: string[];
  iconOnly?: boolean;
}
const LeftNavigationList: FunctionComponent<React.PropsWithChildren<LeftNavigationMenuProps>> = ({
  header,
  items,
  activeKey,
  onSelectItem,
  defaultExpanded,
  iconOnly = false,
}) => {
  const { classes: styles, cx } = useLeftNavigationListStyles();
  const [expandedList, setExpandedList] = useState(defaultExpanded ?? []);
  useEffect(() => {
    const itemWithActiveChild = items.find(
      (item) => item.subItems && item.subItems.find((subItem) => subItem.key === activeKey),
    );
    if (itemWithActiveChild) {
      setExpandedList([itemWithActiveChild.key]);
    }
  }, [activeKey, items]);

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
                    setExpandedList(
                      expandedList.filter((expandedKey) => expandedKey !== selectedItem.key),
                    );
                  } else {
                    setExpandedList(expandedList.concat(selectedItem.key));
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
