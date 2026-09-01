import { makeStyles } from '@rbx/ui';

const UseAssetPermissionsStyles = makeStyles()((theme) => ({
  alert: {
    borderRadius: 8,
    marginBottom: 8,
  },

  button: {
    '&:hover': {
      backgroundColor: 'inherit',
    },
    padding: 0,
    minWidth: 0,
  },

  sectionHeader: {
    paddingBottom: 16,
  },

  descriptionText: {
    paddingBottom: 14,
  },

  fixWidthColumn: {
    width: 160,
    height: 65,
  },

  card: {
    width: 1000,
    height: 400,
    [theme.breakpoints.down('Large')]: {
      flexDirection: 'column',
    },
  },

  cardText: {
    display: 'block',
    textAlign: 'center',
    marginTop: 160,
  },

  iconButton: {
    padding: 0,
  },

  actionContainerParent: {
    position: 'sticky',
    bottom: 0,
  },

  actionContainer: {
    marginLeft: -47,
    backdropFilter: 'blur(50px)',
    padding: '24px 48px',
    opacity: 1,
    zIndex: 2 /* Ensure it's above other content */,
    gap: 12,
  },

  xsInvisibleColumn: {
    [theme.breakpoints.down('Medium')]: {
      display: 'none',
    },
  },

  buttonText: {
    textTransform: 'none',
  },

  helperText: {
    marginLeft: 14,
    paddingBottom: 20,
  },

  paginationStyle: {
    borderBottom: 0,
  },

  tableHeadTitle: {
    whiteSpace: 'nowrap',
  },

  tooltipIconPadding: {
    paddingBottom: 20,
  },
}));

export default UseAssetPermissionsStyles;
