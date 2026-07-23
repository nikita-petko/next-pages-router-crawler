import { makeStyles } from '@rbx/ui';

const useAppBreadcrumbStyles = makeStyles()((theme) => ({
  linkStyle: {
    fontWeight: theme.typography.fontWeightRegular,
    color: theme.palette.content.muted,
  },
  compactBreadCrumbLinkStyle: {
    textDecoration: 'none',
  },
  breadcrumb: {
    [theme.breakpoints.down('Medium')]: {
      display: 'none',
    },
  },
  breadcrumbBottomSpace: {
    marginBottom: 48,
  },
  compactBreadCrumb: {
    paddingLeft: 12,
    paddingRight: 12,
    paddingBottom: 24,
    paddingTop: 12,
  },
}));

export default useAppBreadcrumbStyles;
