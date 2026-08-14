import type { FunctionComponent } from 'react';
import React, { useCallback, useEffect, useState } from 'react';
import Router from 'next/router';
import { ChevronRightIcon, collapseClasses, makeStyles, treeItemClasses, TreeView } from '@rbx/ui';

/** Class names shared with NavigationTreeItem for depth + trailing layout. */
export const navTreeLabelClass = 'navTreeLabel';
export const navTreeTrailingClass = 'navTreeTrailing';
/** Content row with a trailing badge/external — tightens chevron gap to 4px. */
export const navTreeContentWithTrailingClass = 'navTreeContentWithTrailing';
/** Expand/collapse-only row (no href) — focus must not look like the current page. */
export const navTreeExpandOnlyClass = 'navTreeExpandOnly';

const useNavigationTreeStyles = makeStyles()((theme) => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,

    // Nesting / depth: indent the label only (trailing icon + badge stay right-aligned).
    // Multiples of 12: category 12, subcategory 24, then 36, 48, 60.
    // See Figma "Trailing + depth" (Creator Hub IA 2026).
    [`& .${treeItemClasses.groupTransition}`]: {
      paddingTop: 8,
      marginLeft: 0,
    },

    [`& .${navTreeLabelClass}`]: {
      paddingLeft: 12,
    },
    [`& .${treeItemClasses.groupTransition} .${navTreeLabelClass}`]: {
      paddingLeft: 24,
    },
    [`& .${treeItemClasses.groupTransition} .${treeItemClasses.groupTransition} .${navTreeLabelClass}`]:
      {
        paddingLeft: 36,
      },
    [`& .${treeItemClasses.groupTransition} .${treeItemClasses.groupTransition} .${treeItemClasses.groupTransition} .${navTreeLabelClass}`]:
      {
        paddingLeft: 48,
      },
    [`& .${treeItemClasses.groupTransition} .${treeItemClasses.groupTransition} .${treeItemClasses.groupTransition} .${treeItemClasses.groupTransition} .${navTreeLabelClass}`]:
      {
        paddingLeft: 60,
      },

    // Min 40px hit box; rows may grow for 2-line clamped labels.
    // Match primary RailItem: no padding on the hover row — insets live on the
    // Link / label so the interactive control fills the hover box.
    // Chevron rows: 4px rail-edge inset via iconContainer marginRight.
    [`& .${treeItemClasses.content}`]: {
      minHeight: 40,
      height: 'auto',
      padding: 0,
      borderRadius: 8,
      flexDirection: 'row-reverse',
      alignItems: 'center',
      boxSizing: 'border-box',
      cursor: 'pointer',
      [`& .${treeItemClasses.label}`]: {
        padding: 0,
        flex: 1,
        minWidth: 0,
        alignSelf: 'stretch',
        display: 'flex',
      },
    },

    // Expand/collapse chevron: 24×24. Default 8px from label → chevron; 4px from
    // the right edge (marginRight). When a New badge / external is present,
    // gap shrinks to 4px so it matches badge ↔ external. Avoid :has() — jsdom/nwsapi
    // can't parse it when TreeItem ids contain `/` (e.g. eligibility/us-o18-devex-rate),
    // which breaks getByRole in tests.
    [`& .${treeItemClasses.iconContainer}`]: {
      // Collapse by default so leaf rows have no dead zone on the right.
      width: 0,
      minWidth: 0,
      margin: 0,
      padding: 0,
      overflow: 'hidden',
      color: 'var(--color-content-default)',
    },
    [`& .${treeItemClasses.iconContainer}:not(:empty)`]: {
      display: 'flex',
      width: 24,
      minWidth: 24,
      height: 24,
      margin: 0,
      marginRight: 4,
      padding: 0,
      overflow: 'visible',
      // 8px from label to chevron (no trailing adornment)
      paddingLeft: 8,
      flexShrink: 0,
      alignItems: 'center',
      justifyContent: 'center',
      alignSelf: 'center',
      boxSizing: 'content-box',
      // Kill MUI's default svg fontSize:18 so chevron is a true 24×24, matching
      // the external icon's 24×24 hit box for vertical centering.
      '& .MuiSvgIcon-root': {
        display: 'block',
        fontSize: '24px !important',
        width: '24px !important',
        height: '24px !important',
        color: 'inherit',
      },
    },
    // Badge/external already in trailing — 4px to chevron (same as trailing gap).
    [`& .${treeItemClasses.content}.${navTreeContentWithTrailingClass} .${treeItemClasses.iconContainer}:not(:empty)`]:
      {
        paddingLeft: 4,
      },
    [`& .${treeItemClasses.iconContainer}:empty`]: {
      width: 0,
      minWidth: 0,
      margin: 0,
      padding: 0,
    },

    // Expand/collapse-only rows
    [`&& .${treeItemClasses.content}.${navTreeExpandOnlyClass}[data-focused]:not([data-selected])`]:
      {
        backgroundColor: 'transparent',
      },
    // Hover / active page / focused navigable link: bg/shift-200.
    [`&& .${treeItemClasses.content}:hover, && .${treeItemClasses.content}.${navTreeExpandOnlyClass}[data-focused]:not([data-selected]):hover, && .${treeItemClasses.content}[data-selected], && .${treeItemClasses.content}[data-selected][data-focused], && .${treeItemClasses.content}[data-focused]:not(.${navTreeExpandOnlyClass})`]:
      {
        backgroundColor: 'var(--color-shift-200)',
      },
    // Pressed / selected+hover / focused navigable link + hover: bg/shift-300.
    [`&& .${treeItemClasses.content}:active:hover, && .${treeItemClasses.content}[data-selected]:hover, && .${treeItemClasses.content}[data-selected][data-focused]:hover, && .${treeItemClasses.content}[data-focused]:not(.${navTreeExpandOnlyClass}):hover`]:
      {
        backgroundColor: 'var(--color-shift-300)',
      },

    [`& .${treeItemClasses.label}`]: {
      padding: 0,
      flex: 1,
      minWidth: 0,
      alignSelf: 'stretch',
      display: 'flex',
      fontSize: theme.typography.fontSize,
    },

    // Subgroups under an expanded parent use Content.Default (incl. selected)
    [`& .${treeItemClasses.groupTransition} .${treeItemClasses.label}, & .${treeItemClasses.groupTransition} [data-selected] .${treeItemClasses.label}`]:
      {
        color: 'var(--color-content-default)',
      },

    [`& .${collapseClasses.wrapperInner}`]: {
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
    },
  },
  collapseIcon: {
    transform: 'rotate(-90deg)',
    color: 'inherit',
  },
  expandIcon: {
    transform: 'rotate(90deg)',
    color: 'inherit',
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

  const [pendingSelected, setPendingSelected] = useState<string | null>(null);
  if (pendingSelected != null && selected === pendingSelected) {
    setPendingSelected(null);
  }
  const selectedItems = pendingSelected ?? selected ?? null;

  useEffect(() => {
    const events = Router.events;
    if (!events) {
      return undefined;
    }
    const revertPending = () => {
      setPendingSelected(null);
    };
    events.on('routeChangeError', revertPending);
    return () => {
      events.off('routeChangeError', revertPending);
    };
  }, []);

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

  const onSelectedItemsChange = useCallback(
    (event: React.SyntheticEvent | null, itemIds: string | null) => {
      // Latch the click optimistically so the fill moves before the route settles.
      if (itemIds != null) {
        setPendingSelected(itemIds);
      }
      if (onNodeSelect && event && itemIds) {
        onNodeSelect(event, itemIds);
      }
    },
    [onNodeSelect],
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
      // Prefer null over '' so "no page selected" isn't an empty-string item id.
      selectedItems={selectedItems}
      onSelectedItemsChange={onSelectedItemsChange}>
      {children}
    </TreeView>
  );
};

export default NavigationTree;
