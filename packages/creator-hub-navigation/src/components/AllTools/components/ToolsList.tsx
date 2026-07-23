import React, { useCallback } from 'react';
import Router from 'next/router';
import { Grid, List, makeStyles, Typography } from '@rbx/ui';
import { TTool } from '../hooks/useTools';

const useStyles = makeStyles()((theme) => ({
  container: {
    breakInside: 'avoid',
  },
  label: {
    display: 'block',
    padding: '10px 8px 10px 12px',
    lineHeight: '140%',
  },

  link: {
    textDecoration: 'none',
    color: 'inherit',
    display: 'flex',
    width: '100%',
    alignItems: 'center',
    borderRadius: 8,
    '&:hover': {
      backgroundColor: theme.palette.states.hover,
    },
  },
  list: {
    paddingTop: 4,
    paddingBottom: 4,
  },
  listItem: {
    display: 'block',
    paddingLeft: 24,
  },
}));

type TToolsListProps = {
  tool: TTool;
  onToolSelect: (key: string) => void;
};

const ToolsList: React.FC<TToolsListProps> = ({ onToolSelect, tool }) => {
  const {
    cx,
    classes: { container, label, link, listItem, list },
  } = useStyles();

  const toolLabel = (
    <Typography variant='smallLabel2' classes={{ root: label }}>
      {tool.label}
    </Typography>
  );

  const onClick = useCallback(
    (
      e: React.MouseEvent<HTMLAnchorElement, MouseEvent>,
      { key, href, external = false }: { key: string; href: string; external?: boolean },
    ) => {
      e.preventDefault();
      onToolSelect(key);
      setTimeout(() => {
        const isAbsoluteUrl = href.startsWith('http');
        if (isAbsoluteUrl) {
          const target = external ? '_blank' : '_self';
          window.open(href, target);
        } else {
          Router.push(href);
        }
      }, 100);
    },
    [onToolSelect],
  );

  return (
    <Grid classes={{ root: container }}>
      {tool.href ? (
        <a
          href={tool.href}
          className={link}
          onClick={(e) =>
            onClick(e, { key: tool.key, href: tool.href as string, external: tool.external })
          }>
          {toolLabel}
          {tool.adornment}
        </a>
      ) : (
        <React.Fragment>
          {toolLabel}
          {tool.adornment}
        </React.Fragment>
      )}
      {tool.items && (
        <List classes={{ root: list }}>
          {tool.items.map((item) => (
            <a
              key={item.key}
              href={item.href}
              className={link}
              onClick={(e) => onClick(e, item)}
              target={item.external ? '_blank' : undefined}
              rel={item.external ? 'noreferrer' : undefined}>
              <Typography variant='smallLabel1' classes={{ root: cx(label, listItem) }}>
                {item.label}
              </Typography>
              {item.adornment}
            </a>
          ))}
        </List>
      )}
    </Grid>
  );
};

export default ToolsList;
