import React from 'react';
import { Typography, TreeItem, TreeView } from '@rbx/ui';
import type { MenuItem } from '../interface/menuItem';
import useLeftNavigationStyles from './LeftNavigation.styles';
import LeftNavigationMenuLabel from './LeftNavigationMenuLabel';
import LeftNavigationSubMenu from './LeftNavigationSubMenu';

// TODO (mbae, 10/25/22): CRF-1647 Make usages of LeftNavigation MenuItem and its usages generic
export interface LeftNavigationMenuProps<T = unknown> {
  header?: string;
  items: MenuItem<T>[];
  onSelectItem: (item: MenuItem<T>) => void;
  sidebarSubHeaderClassNameOverride?: string;
  activeKey?: string;
  defaultExpanded?: string[];
  onExpandedItemsChange?: (event: React.SyntheticEvent | null, itemIds: string[]) => void;
}
// TODO: Figure out a way to fix LeftNavigationMenu so that the Link component actually works
const LeftNavigationMenu = <T,>({
  header,
  items,
  activeKey,
  onSelectItem,
  sidebarSubHeaderClassNameOverride,
  defaultExpanded,
  onExpandedItemsChange,
}: React.PropsWithChildren<LeftNavigationMenuProps<T>>) => {
  const { classes: styles } = useLeftNavigationStyles();

  return (
    <>
      {header && (
        <Typography
          className={sidebarSubHeaderClassNameOverride ?? styles.sidebarSubHeaderText}
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
                if (e.key === 'Enter') {
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
    </>
  );
};

export default LeftNavigationMenu;
