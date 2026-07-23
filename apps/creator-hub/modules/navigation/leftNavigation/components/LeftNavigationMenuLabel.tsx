import React, { FunctionComponent } from 'react';
import { Grid, makeStyles } from '@rbx/ui';
import { Link } from '@modules/miscellaneous/common';
import { useRouter } from 'next/router';
import { UrlObject } from 'url';
import Feature from '../../feature/interfaces/Feature';
import { MenuItem } from '../interface/menuItem';

const useStyles = makeStyles()((theme) => ({
  root: {
    fontWeight: 'inherit',
    color: theme.palette.content.standard,
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
    classes: { root },
  } = useStyles();

  const currentItem = item.content as Feature;
  const labelInfoNode = adornment ? (
    <Grid container direction='row' alignItems='center'>
      {title}&nbsp;
      {adornment}
    </Grid>
  ) : (
    title
  );
  const path = currentItem?.path;
  const externalPath = currentItem?.getExternalPath ? currentItem.getExternalPath() : undefined;

  const hrefURL =
    externalPath ||
    ({
      pathname: path,
      query: router.query,
    } as UrlObject & string);

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
