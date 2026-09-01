import React, { useCallback } from 'react';
import Link from 'next/link';
import { Grid, makeStyles, Typography } from '@rbx/ui';
import isModifiedClick from '../../../utils/isModifiedClick';
import type { TTool } from '../hooks/useTools';

const useStyles = makeStyles()((theme) => ({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  // Hover/hit box — uniform 40px rows + 8px gap (same grid as primary/L2 nav).
  // Depth + trailing only change horizontal insets; do not add vertical padding.
  itemBox: {
    display: 'flex',
    width: '100%',
    alignItems: 'center',
    borderRadius: 8,
    minHeight: 40,
    height: 40,
    // 12px from the right edge of the menu for text and trailing icons alike.
    padding: '0 12px 0 0',
    boxSizing: 'border-box',
  },
  label: {
    flex: '1 1 0',
    minWidth: 0,
    // Depth 1 (category)
    paddingLeft: 12,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    lineHeight: '20px',
    fontSize: 14,
  },
  heading: {
    fontWeight: 600,
    color: theme.palette.content.standard,
    // Match NavigationTree category / BodyMedium so headings don't clip.
    lineHeight: '20px',
  },
  // Depth 2 (subcategory) — multiples of 12; trailing stays right-aligned
  nestedLabel: {
    paddingLeft: 24,
    fontWeight: 400,
    color: theme.palette.content.muted,
  },
  // Trailing: sits inside the item's 12px right inset; pl-8 from label
  trailing: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    flexShrink: 0,
    height: 24,
    paddingLeft: 8,
    gap: 4,
    color: theme.palette.content.muted,
    '& .MuiSvgIcon-root': {
      color: 'inherit',
    },
  },
  link: {
    textDecoration: 'none',
    color: 'inherit',
    cursor: 'pointer',
    // Match primary/secondary nav: hover shift-200, pressed shift-300.
    // :active:hover (not bare :active) so press fill can't stick after navigation.
    '&:hover': {
      backgroundColor: theme.palette.states.hover,
    },
    '&:active:hover': {
      backgroundColor: theme.palette.states.selected,
    },
  },
  // Active page: shift-200. Active + hover/press: shift-300.
  selected: {
    backgroundColor: theme.palette.states.selected,
    '&:hover': {
      backgroundColor: theme.palette.states.hover,
    },
    '&:active:hover': {
      backgroundColor: theme.palette.states.selected,
    },
  },
  // Plain flex stack — avoid MUI List/<ul> defaults (padding-inline-start, list-item
  // display) that can leave nested tool rows looking empty in a tight column.
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    margin: 0,
    padding: 0,
  },
}));

type TToolLinkProps = {
  href: string;
  external: boolean | undefined;
  toolKey: string;
  className: string;
  ariaCurrent: 'page' | undefined;
  onClick: (e: React.MouseEvent<HTMLAnchorElement>, key: string) => void;
  children: React.ReactNode;
};

const ToolLink: React.FC<TToolLinkProps> = ({
  href,
  external,
  toolKey,
  className,
  ariaCurrent,
  onClick,
  children,
}) => {
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => onClick(e, toolKey),
    [onClick, toolKey],
  );
  const props = { href, className, 'aria-current': ariaCurrent, onClick: handleClick };
  if (external && href.startsWith('http')) {
    return (
      <a {...props} target='_blank' rel='noreferrer'>
        {children}
      </a>
    );
  }
  if (href.startsWith('http')) {
    return <a {...props}>{children}</a>;
  }
  return <Link {...props}>{children}</Link>;
};

type TToolsListProps = {
  tool: TTool;
  onToolSelect: (key: string) => void;
  /** Most-specific active key across all All Tools links. */
  selectedKey: string | null;
};

const ToolsList: React.FC<TToolsListProps> = ({ onToolSelect, tool, selectedKey }) => {
  const {
    cx,
    classes: { container, label, heading, nestedLabel, itemBox, trailing, link, selected, list },
  } = useStyles();

  const onClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>, key: string) => {
      if (isModifiedClick(e.nativeEvent)) {
        return;
      }
      onToolSelect(key);
    },
    [onToolSelect],
  );

  const href = tool.href;
  const isToolSelected = selectedKey === tool.key;

  const toolLabel = (
    <Typography variant='smallLabel2' classes={{ root: cx(label, heading) }}>
      {tool.label}
    </Typography>
  );

  const toolTrailing = tool.adornment ? <span className={trailing}>{tool.adornment}</span> : null;

  return (
    <Grid classes={{ root: container }}>
      {href ? (
        <ToolLink
          href={href}
          external={tool.external}
          toolKey={tool.key}
          className={cx(itemBox, link, isToolSelected && selected)}
          ariaCurrent={isToolSelected ? 'page' : undefined}
          onClick={onClick}>
          {toolLabel}
          {toolTrailing}
        </ToolLink>
      ) : (
        <div className={itemBox}>
          {toolLabel}
          {toolTrailing}
        </div>
      )}
      {tool.items && tool.items.length > 0 ? (
        <div className={list}>
          {tool.items.map((item) => {
            const isItemSelected = selectedKey === item.key;
            return (
              <ToolLink
                key={item.key}
                href={item.href}
                external={item.external}
                toolKey={item.key}
                className={cx(itemBox, link, isItemSelected && selected)}
                ariaCurrent={isItemSelected ? 'page' : undefined}
                onClick={onClick}>
                <Typography variant='smallLabel1' classes={{ root: cx(label, nestedLabel) }}>
                  {item.label}
                </Typography>
                {item.adornment ? <span className={trailing}>{item.adornment}</span> : null}
              </ToolLink>
            );
          })}
        </div>
      ) : null}
    </Grid>
  );
};

export default ToolsList;
