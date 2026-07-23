import React from 'react';
import {
  makeStyles,
  TreeItem,
  treeItemClasses,
  TTreeItemProps,
  TTypographyProps,
  Typography,
} from '@rbx/ui';
import Link from 'next/link';
import { UrlObject } from 'url';

const useStyles = makeStyles()(() => {
  return {
    link: {
      fontWeight: 'inherit',
      color: 'inherit',
      textDecoration: 'none',
      display: 'flex',
      width: '100%',
      height: '100%',
      minHeight: 40,
      alignItems: 'center',
      padding: 0,
    },
    label: {
      paddingLeft: 12,
      [`.${treeItemClasses.selected} &`]: {
        fontWeight: 'inherit',
      },
    },
  };
});

type TNavigationTreeItemProps = {
  variant?: TTypographyProps['variant'];
  href?: UrlObject | string;
} & Omit<TTreeItemProps, 'ref'>;

const NavigationTreeItem: React.FunctionComponent<TNavigationTreeItemProps> = ({
  nodeId,
  href,
  label,
  children,
  variant = 'smallLabel1',
  ...treeItemProps
}) => {
  const {
    classes: { link, label: labelStyles },
  } = useStyles();

  let treeItemLabel = (
    <Typography classes={{ root: labelStyles }} variant={variant}>
      {label}
    </Typography>
  );
  if (href) {
    treeItemLabel = (
      <Link className={link} href={href}>
        {treeItemLabel}
      </Link>
    );
  }

  return (
    <TreeItem nodeId={nodeId} label={treeItemLabel} {...treeItemProps}>
      {children}
    </TreeItem>
  );
};

export default NavigationTreeItem;
