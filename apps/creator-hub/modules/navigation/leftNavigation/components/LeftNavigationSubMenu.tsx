import type { FunctionComponent } from 'react';
import React from 'react';
import type { TIconProps } from '@rbx/ui';
import { TreeItem, Typography, Grid, ArrowDropDownRoundedIcon } from '@rbx/ui';
import type { MenuItem } from '../interface/menuItem';
import useLeftNavigationStyles from './LeftNavigation.styles';
import LeftNavigationMenuLabel from './LeftNavigationMenuLabel';

const CollapseIcon: FunctionComponent<TIconProps> = (props) => (
  <ArrowDropDownRoundedIcon {...props} color='disabled' style={{ transform: 'rotate(180deg)' }} />
);

const ExpandIcon: FunctionComponent<TIconProps> = (props) => (
  <ArrowDropDownRoundedIcon {...props} color='disabled' />
);

export interface FeaturesProps<T = unknown> {
  nodeId: string;
  header: string;
  items: MenuItem<T>[];
  onSelectItem: (item: MenuItem<T>) => void;
  parentItem?: MenuItem<T>;
}

const LeftNavigationSubMenu = <T,>({
  nodeId,
  header,
  items,
  onSelectItem,
  parentItem,
}: FeaturesProps<T>) => {
  const labelContent = parentItem ? (
    <Grid
      onClick={(event) => {
        onSelectItem(parentItem);
        event.preventDefault();
      }}>
      <Typography variant='smallLabel2' color='primary'>
        {header}
      </Typography>
    </Grid>
  ) : (
    <Typography variant='smallLabel2' color='primary'>
      {header}
    </Typography>
  );
  const { classes: styles } = useLeftNavigationStyles();

  // TODO (mbae 08/28/23) CRF-3901: TreeView usage in CD
  // NOTE (mbae 08/28/23): translate(-4px) is applied to TreeView headers two-levels deep,
  // which is not correct, but our usage of TreeView in CD is fighting the design system.
  return (
    <TreeItem
      nodeId={nodeId}
      label={labelContent}
      slots={{
        collapseIcon: CollapseIcon,
        expandIcon: ExpandIcon,
      }}
      classes={{
        content: styles.treeParentItemContent,
      }}>
      {items.map((item) => {
        const { title, key, subItems } = item;
        return subItems ? (
          <LeftNavigationSubMenu
            nodeId={`parent-${key}`}
            key={`parent-${key}`}
            header={title}
            items={subItems}
            onSelectItem={onSelectItem}
          />
        ) : (
          <TreeItem
            key={item.key}
            nodeId={item.key}
            label={<LeftNavigationMenuLabel item={item} />}
            onClick={() => onSelectItem(item)}
            classes={{
              content: styles.treeItemContent,
            }}
          />
        );
      })}
    </TreeItem>
  );
};

export default LeftNavigationSubMenu;
