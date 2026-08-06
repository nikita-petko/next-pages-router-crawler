import type { UrlObject } from 'node:url';
import type { FunctionComponent } from 'react';
import React from 'react';
import { useRouter } from 'next/router';
import { makeStyles } from '@rbx/ui';
import { Link } from '@modules/miscellaneous/components';
import type Feature from '../../feature/interfaces/Feature';
import type { MenuItem } from '../interface/menuItem';

const useStyles = makeStyles()((theme) => ({
  root: {
    fontWeight: 'inherit',
    color: theme.palette.content.standard,
    width: '100%',
  },
  labelRow: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    flexWrap: 'nowrap',
  },
  labelText: {
    flexGrow: 1,
    minWidth: 0,
    overflowWrap: 'break-word',
  },
  trailing: {
    display: 'flex',
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: 24,
    paddingLeft: 8,
    whiteSpace: 'nowrap',
  },
}));

export interface LeftNavigationMenuLabelProps {
  item: MenuItem;
}
const LeftNavigationMenuLabel: FunctionComponent<
  React.PropsWithChildren<LeftNavigationMenuLabelProps>
> = ({ item }) => {
  const router = useRouter();
  const { title, adornment } = item;
  const {
    classes: { root, labelRow, labelText, trailing },
  } = useStyles();

  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- MenuItem.content is typed unknown by the shared nav contract; left-nav items always carry a Feature
  const currentItem = item.content as Feature;
  const labelInfoNode = adornment ? (
    <div className={labelRow}>
      <span className={labelText}>{title}</span>
      <span className={trailing}>{adornment}</span>
    </div>
  ) : (
    title
  );
  const path = currentItem?.path;
  const externalPath = currentItem?.getExternalPath ? currentItem.getExternalPath() : undefined;

  const hrefURL: string | UrlObject = (externalPath ?? false) || {
    pathname: path,
    query: router.query,
  };

  return path ? (
    <Link
      classes={{ root }}
      underline='none'
      href={hrefURL}
      display='block'
      onClick={(event) => {
        event.preventDefault();
      }}>
      {labelInfoNode}
    </Link>
  ) : (
    labelInfoNode
  );
};

export default LeftNavigationMenuLabel;
