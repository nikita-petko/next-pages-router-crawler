import React, { FunctionComponent, useCallback, useState } from 'react';
import { ChevronRightIcon, collapseClasses, makeStyles, treeItemClasses, TreeView } from '@rbx/ui';

const useNavigationTreeStyles = makeStyles()((theme) => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,

    [`& .${treeItemClasses.focused}`]: {
      backgroundColor: 'unset',
    },

    [`& .${treeItemClasses.groupTransition}`]: {
      paddingTop: 4,
      marginLeft: 0,

      [`& .${treeItemClasses.groupTransition}`]: {
        marginLeft: 24,
      },

      [`& .${treeItemClasses.content}`]: {
        paddingLeft: 24,
        [`& .${treeItemClasses.label}`]: {
          padding: 2,
        },
      },
    },

    [`& .${treeItemClasses.content}`]: {
      minHeight: 40,
      padding: 0,
      flexDirection: 'row-reverse',
      [`& .${treeItemClasses.label}`]: {
        padding: 0,
      },
      [`&:hover .${treeItemClasses.label}`]: {
        color: theme.palette.content.standard,
      },
      [`&.${treeItemClasses.selected} .${treeItemClasses.label}`]: {
        color: theme.palette.content.standard,
        fontWeight: theme.typography.fontWeightBold,
      },
    },

    [`& .${treeItemClasses.label}`]: {
      padding: 0,
      color: theme.palette.content.standard,
      fontSize: theme.typography.fontSize,
    },

    [`& .${treeItemClasses.iconContainer}:empty`]: {
      width: 0,
    },

    [`& .${collapseClasses.wrapperInner}`]: {
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
    },
  },
  collapseIcon: {
    transform: 'rotate(-90deg)',
  },
  expandIcon: {
    transform: 'rotate(90deg)',
  },
}));

export type TNavigationTreeProps = {
  defaultSelected?: string;
  defaultExpanded?: string[];
  selected?: string;
  onNodeSelect?: (event: React.SyntheticEvent, nodeIds: string) => void;
  onExpanded?: (nodeId: string) => void;
  onCollapsed?: (nodeId: string) => void;
};

const NavigationTree: FunctionComponent<React.PropsWithChildren<TNavigationTreeProps>> = ({
  children,
  onExpanded,
  onCollapsed,
  defaultExpanded,
  defaultSelected,
  selected,
  onNodeSelect,
}) => {
  const {
    classes: { root, expandIcon, collapseIcon },
  } = useNavigationTreeStyles();
  const [expandedItems, setExpandedItems] = useState(defaultExpanded ?? []);

  const onExpandedItemsChange = useCallback(
    (_: React.SyntheticEvent | null, nodeIds: string[]) => {
      if (onExpanded) {
        nodeIds.filter((nodeId) => !expandedItems.includes(nodeId)).forEach(onExpanded);
      }
      if (onCollapsed) {
        expandedItems.filter((nodeId) => !nodeIds.includes(nodeId)).forEach(onCollapsed);
      }
      setExpandedItems(nodeIds);
    },
    [expandedItems, onCollapsed, onExpanded],
  );

  return (
    <TreeView
      variant='default'
      defaultExpandIcon={<ChevronRightIcon classes={{ root: expandIcon }} />}
      defaultCollapseIcon={<ChevronRightIcon classes={{ root: collapseIcon }} />}
      classes={{ root }}
      expandedItems={expandedItems}
      onExpandedItemsChange={onExpandedItemsChange}
      defaultSelectedItems={defaultSelected}
      selectedItems={selected}
      onSelectedItemsChange={
        onNodeSelect
          ? (event, itemIds) => {
            if (event && itemIds) {
              onNodeSelect(event, itemIds);
            }
          }
          : undefined
      }>
      {children}
    </TreeView>
  );
};

export default NavigationTree;
