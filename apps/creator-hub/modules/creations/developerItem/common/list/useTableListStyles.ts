import { makeStyles } from '@rbx/ui';

const useTableListStyles = makeStyles<void, 'operationIcon'>()((theme, _, classes) => ({
  container: {
    marginTop: 24,
    minHeight: 450,
    [theme.breakpoints.down('Large')]: {
      padding: '0 12px',
    },
  },
  tableHeader: {
    color: theme.palette.actionV2.primaryBrand.fill,
  },
  iconColumn: {
    width: 60,
  },
  operationColumn: {
    width: 60,
    position: 'relative',
  },
  tableRow: {
    cursor: 'pointer',
    [`&:hover .${classes.operationIcon}`]: {
      visibility: 'visible',
    },
  },
  operationIcon: {
    color: theme.palette.content.standard,
    background: theme.palette.actionV2.secondary.fill,
  },
  xsInvisibleColumn: {
    [theme.breakpoints.down('Medium')]: {
      display: 'none',
    },
  },
  smInvisibleColumn: {
    [theme.breakpoints.down('Large')]: {
      display: 'none',
    },
  },
  mdInvisibleColumn: {
    [theme.breakpoints.down('XLarge')]: {
      display: 'none',
    },
  },
}));

export default useTableListStyles;
