import type { UrlObject } from 'node:url';
import React, { useCallback } from 'react';
import Link from 'next/link';
import type { TTreeItemProps, TTypographyProps } from '@rbx/ui';
import { makeStyles, TreeItem, treeItemClasses, Typography } from '@rbx/ui';
import isModifiedClick from '../utils/isModifiedClick';
import withNavAdornmentSize from '../utils/withNavAdornmentSize';
import {
  navTreeContentWithTrailingClass,
  navTreeExpandOnlyClass,
  navTreeLabelClass,
  navTreeTrailingClass,
} from './NavigationTree';

const useStyles = makeStyles()(() => {
  return {
    // Match primary RailItem: the interactive control fills the hover row.
    // Insets live on the Link (not TreeItem content) so hit target === hover box.
    link: {
      fontWeight: 'inherit',
      color: 'inherit',
      textDecoration: 'none',
      display: 'flex',
      flex: 1,
      width: '100%',
      minWidth: 0,
      minHeight: 40,
      alignItems: 'center',
      alignSelf: 'stretch',
      padding: '8px 4px 8px 0',
      boxSizing: 'border-box',
      position: 'static' as const,
      '&::after': {
        content: '""',
        position: 'absolute' as const,
        inset: 0,
      },
    },
    // Parent rows: right inset is on the chevron, not the link.
    linkWithExpandIcon: {
      paddingRight: 0,
    },
    // [depth+label | trailing badge] — chevron lives in TreeItem iconContainer
    contentRow: {
      display: 'flex',
      alignItems: 'center',
      width: '100%',
      minWidth: 0,
      flex: 1,
      minHeight: 40,
      padding: '8px 4px 8px 0',
      boxSizing: 'border-box',
    },
    contentRowInsideLink: {
      padding: 0,
      minHeight: 0,
    },
    contentRowWithExpandIcon: {
      paddingRight: 0,
    },
    label: {
      flex: '1 1 0',
      minWidth: 0,
      // Depth padding applied via NavigationTree (12 / 24 / 36 / 48 / 60)
      '[data-selected] &': {
        fontWeight: 'inherit',
      },
    },
    // Trailing slot: badge sits here; expand/external icon is sibling iconContainer.
    // pl-8 from label. Expand/collapse uses iconContainer's 4px right margin.
    // External icons: 16×16 glyph in a 24×24 box — same outer box as the chevron
    // so both share one vertical center (block avoids inline SVG baseline offset).
    trailing: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-end',
      alignSelf: 'center',
      flexShrink: 0,
      height: 24,
      paddingLeft: 8,
      gap: 4,
      color: 'var(--color-content-default)',
      '& > .MuiSvgIcon-root': {
        display: 'block',
        fontSize: 16,
        width: 16,
        height: 16,
        padding: 4,
        boxSizing: 'content-box',
        color: 'inherit',
      },
    },
    // Label/LabelMedium — category headings. Max 2 lines, then ellipsis.
    // Line height matches Body/BodyMedium (Size_500 / 20px) so wrapped lines aren't cramped.
    category: {
      display: '-webkit-box',
      overflow: 'hidden',
      '-webkit-box-orient': 'vertical',
      WebkitLineClamp: 2,
      color: 'var(--color-content-emphasis)',
      textOverflow: 'ellipsis',
      whiteSpace: 'normal',
      overflowWrap: 'anywhere',
      fontFamily: 'var(--Config-Text-Font, "Builder Sans")',
      fontSize: 14,
      fontStyle: 'normal',
      fontWeight: 600,
      lineHeight: '20px',
      '[data-selected] &': {
        fontWeight: 600,
      },
    },
    // Body/BodyMedium — subgroups / nested items. Max 2 lines, then ellipsis.
    subheading: {
      display: '-webkit-box',
      overflow: 'hidden',
      '-webkit-box-orient': 'vertical',
      WebkitLineClamp: 2,
      color: 'var(--color-content-default)',
      textOverflow: 'ellipsis',
      whiteSpace: 'normal',
      overflowWrap: 'anywhere',
      fontFamily: 'var(--Config-Text-Font, "Builder Sans")',
      fontSize: 14,
      fontStyle: 'normal',
      fontWeight: 400,
      lineHeight: '20px',
      '[data-selected] &': {
        fontWeight: 400,
        color: 'var(--color-content-default)',
      },
    },
  };
});

const stopModifiedClickPropagation = (e: React.MouseEvent) => {
  if (isModifiedClick(e.nativeEvent)) {
    e.stopPropagation();
  }
};

type TNavigationTreeItemProps = {
  variant?: TTypographyProps['variant'];
  href?: UrlObject | string;
  /** Trailing badge / status — sits left of expand/external icon when both present. */
  adornment?: React.ReactNode;
} & Omit<TTreeItemProps, 'ref'>;

/** Collapse/expand for nested nav groups — 100ms ease-out */
const GROUP_TRANSITION = {
  timeout: 100,
  easing: {
    enter: 'ease-out',
    exit: 'ease-out',
  },
} as const;

const NavigationTreeItem: React.FunctionComponent<TNavigationTreeItemProps> = ({
  nodeId,
  href,
  label,
  children,
  adornment,
  variant = 'smallLabel1',
  classes: classesProp,
  slotProps: slotPropsProp,
  disableSelection,
  onClick,
  ...treeItemProps
}) => {
  const {
    cx,
    classes: {
      link,
      linkWithExpandIcon,
      contentRow,
      contentRowInsideLink,
      contentRowWithExpandIcon,
      label: labelStyles,
      trailing,
      category,
      subheading,
    },
  } = useStyles();

  const isCategory = variant === 'smallLabel2';
  const sizedAdornment = adornment ? withNavAdornmentSize(adornment) : undefined;
  // Dropdown / section labels (Create, APIs and tools, …) have no href — they only
  // expand/collapse and must not keep a selected highlight after click.
  const isSelectionDisabled = disableSelection ?? href == null;
  const hasExpandIcon = React.Children.count(children) > 0;

  // Fire the consumer's onClick for side-effects (analytics, optimistic state)
  // but let the <Link> handle navigation natively — preserving cmd-click, etc.
  // Chevron clicks only expand/collapse and must not reach the consumer's onClick.
  // Modified clicks (cmd, shift, alt) skip the consumer callback so optimistic
  // state doesn't stick when navigation opens in a different tab/window.
  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLLIElement>) => {
      const target = event.target instanceof Element ? event.target : null;
      if (hasExpandIcon && target?.closest(`.${treeItemClasses.iconContainer}`)) {
        return;
      }
      onClick?.(event);
    },
    [hasExpandIcon, onClick],
  );

  let treeItemLabel = (
    <div
      className={cx(
        contentRow,
        href ? contentRowInsideLink : undefined,
        hasExpandIcon ? contentRowWithExpandIcon : undefined,
      )}>
      <Typography
        classes={{
          root: cx(navTreeLabelClass, labelStyles, isCategory ? category : subheading),
        }}
        variant={variant}>
        {label}
      </Typography>
      {sizedAdornment ? (
        <span className={cx(navTreeTrailingClass, trailing)}>{sizedAdornment}</span>
      ) : null}
    </div>
  );
  if (href) {
    treeItemLabel = (
      <Link
        className={cx(link, hasExpandIcon ? linkWithExpandIcon : undefined)}
        href={href}
        onClick={stopModifiedClickPropagation}>
        {treeItemLabel}
      </Link>
    );
  }

  return (
    <TreeItem
      nodeId={nodeId}
      label={treeItemLabel}
      classes={{
        ...classesProp,
        content: cx(
          classesProp?.content,
          adornment ? navTreeContentWithTrailingClass : undefined,
          // Expand-only rows suppress the focused-looks-selected fill; links don't.
          isSelectionDisabled ? navTreeExpandOnlyClass : undefined,
        ),
      }}
      slotProps={{
        ...slotPropsProp,
        groupTransition: GROUP_TRANSITION,
      }}
      {...treeItemProps}
      onClick={handleClick}
      disableSelection={isSelectionDisabled}>
      {children}
    </TreeItem>
  );
};

export default NavigationTreeItem;
