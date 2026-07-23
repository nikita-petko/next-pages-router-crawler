import React from 'react';
import Link from 'next/link';
import { Breadcrumbs, makeStyles, Typography, Link as UILink } from '@rbx/ui';

export interface Props {
  pages: { href?: string; title: string }[];
}

const useStyles = makeStyles()((theme) => ({
  linkStyle: {
    fontWeight: theme.typography.fontWeightRegular,
    color: theme.palette.content.muted,
  },
}));

/**
 * Breadcrumbs for Agreements Manager pages
 * TODO: [future] evaluate integration in AppBreadcrumbs (abech)
 */
const IpBreadcrumbs: React.FC<Props> = ({ pages }) => {
  const { classes } = useStyles();
  return (
    <Breadcrumbs aria-label='breadcrumb'>
      {pages.map((page, index) =>
        page.href ? (
          <UILink
            component={Link}
            className={classes.linkStyle}
            // eslint-disable-next-line react/no-array-index-key -- ordering does not change
            key={index}
            href={page.href}
            color='inherit'>
            {page.title}
          </UILink>
        ) : (
          <Typography
            // eslint-disable-next-line react/no-array-index-key -- ordering does not change
            key={index}
            color='primary'>
            {page.title}
          </Typography>
        ),
      )}
    </Breadcrumbs>
  );
};

export default IpBreadcrumbs;
