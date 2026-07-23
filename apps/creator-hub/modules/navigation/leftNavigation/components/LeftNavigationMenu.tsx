import React, { Fragment, FunctionComponent } from 'react';
import { Key } from '@rbx/core';
import { Typography, TreeItem, TreeView } from '@rbx/ui';
import { MenuItem } from '../interface/menuItem';
import LeftNavigationSubMenu from './LeftNavigationSubMenu';
import useLeftNavigationStyles from './LeftNavigation.styles';
import LeftNavigationMenuLabel from './LeftNavigationMenuLabel';

// TODO (mbae, 10/25/22): CRF-1647 Make usages of LeftNavigation MenuItem and its usages generic
export interface LeftNavigationMenuProps {
  header?: string;
  items: MenuItem[];
  onSelectItem: (item: MenuItem) => void;
  sidebarSubHeaderClassNameOverride?: string;
  activeKey?: string;
  defaultExpanded?: string[];
  onExpandedItemsChange?: (event: React.SyntheticEvent | null, itemIds: string[]) => void;
}
// TODO: Figure out a way to fix LeftNavigationMenu so that the Link component actually works
const LeftNavigationMenu: FunctionComponent<React.PropsWithChildren<LeftNavigationMenuProps>> = ({
  header,
  items,
  activeKey,
  onSelectItem,
  sidebarSubHeaderClassNameOverride,
  defaultExpanded,
  onExpandedItemsChange,
}) => {
  const { classes: styles } = useLeftNavigationStyles();

  return (
    <Fragment>
      {header && (
        <Typography
          className={sidebarSubHeaderClassNameOverride || styles.sidebarSubHeaderText}
          variant='overline'
          component='h1'>
          {header}
        </Typography>
      )}
      <TreeView
        classes={{ root: styles.treeViewRoot }}
        selectedItems={activeKey ?? ''}
        key={header}
        defaultExpandedItems={defaultExpanded ?? []}
        onExpandedItemsChange={onExpandedItemsChange}>
        {items.map((item) => {
          const { title, key, subItems = null } = item;

          return subItems && subItems.length > 0 ? (
            <LeftNavigationSubMenu
              nodeId={`parent-${key}`}
              key={key}
              header={title}
              items={subItems}
              onSelectItem={onSelectItem}
              activeKey={activeKey}
              parentItem={item.isParentLink ? item : undefined}
            />
          ) : (
            <TreeItem
              classes={{
                content: styles.treeParentItemContent,
              }}
              nodeId={key}
              key={key}
              onClick={(event: React.MouseEvent<HTMLLIElement>) => {
                event.preventDefault();
                onSelectItem(item);
              }}
              onKeyDown={(e: React.KeyboardEvent<HTMLLIElement>) => {
                if (e.key === Key.Enter) {
                  e.preventDefault();
                  onSelectItem(item);
                }
              }}
              label={
                <Typography variant='smallLabel2' color='primary'>
                  <LeftNavigationMenuLabel item={item} />
                </Typography>
              }
            />
          );
        })}
      </TreeView>
    </Fragment>
  );
};

export default LeftNavigationMenu;
