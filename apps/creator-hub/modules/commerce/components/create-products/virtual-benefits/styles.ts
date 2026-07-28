import { makeStyles } from '@rbx/ui';

const useStyles = makeStyles()((theme) => ({
  catalogItemText: {
    fontFamily: 'Builder Sans',
    fontWeight: 600,
    fontSize: '12px',
    lineHeight: '100%',
  },
  productNameText: {
    fontFamily: 'Builder Sans',
    fontWeight: 'bold',
    fontSize: '20px',
    lineHeight: '120%',
    display: '-webkit-box',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
  },
  errorBorder: {
    borderColor: '#F45B52',
  },
  thumbnailContainer: {
    height: 60,
    width: 60,
    borderRadius: theme.border.radius.xsmall.borderRadius,
    overflow: 'hidden',
  },
  grantableSelectionContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    ...theme.border.radius.topLeft.medium,
    ...theme.border.radius.topRight.medium,
    border: `1px solid ${theme.palette.surface.outline}`,
  },
  grantableSelectionContainerRoundedBottom: {
    ...theme.border.radius.bottomLeft.medium,
    ...theme.border.radius.bottomRight.medium,
  },
  grantableItemContainer: {
    maxHeight: '350px',
    minHeight: 'max-content',
    minWidth: '100%',
    overflow: 'auto',
  },
  grantableSelectionRow: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    maxHeight: '100px',
    padding: theme.spacing(2),
    width: '100%',
  },
  grantableSelectionRowBottomBorder: {
    borderBottom: `1px solid ${theme.palette.surface.outline}`,
  },
  grantableThumbnailContainerImage: {
    minWidth: '64px',
    minHeight: '64px',
    width: '64px',
    height: '64px',
  },
  grantableThumbnailContainer: {
    paddingTop: 0,
    maxHeight: '64px',
    maxWidth: '64px',
    height: '64px !important',
    ...theme.border.radius.small,
    marginRight: theme.spacing(2),
  },
  grantableSelectionPaginationContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
    ...theme.border.radius.bottomLeft.small,
    ...theme.border.radius.bottomRight.small,
    width: '100%',
    border: `1px solid ${theme.palette.surface.outline}`,
    borderTop: 'none',
    paddingRight: theme.spacing(1),
  },
  avatarSelectionContainerTitle: {
    padding: theme.spacing(2),
    width: '100%',
    borderBottom: `1px solid ${theme.palette.surface.outline}`,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  },
}));

export default useStyles;
