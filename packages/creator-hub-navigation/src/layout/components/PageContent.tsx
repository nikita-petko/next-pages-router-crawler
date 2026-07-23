import React from 'react';
import { Grid, makeStyles } from '@rbx/ui';
import PublicFooter from '../../footer/PublicFooter';
import PrivateFooter from '../../footer/PrivateFooter';
import useFooterBehavior from '../../hooks/useFooterBehavior';
import useScrollStyles from '../../hooks/useScrollStyles';
import { CONTENT_GRID_AREA, MAX_CONTENT_WIDTH } from '../constants';

type TPageContentProps = {
  usePublicFooter?: boolean;
  stickyContent?: React.ReactNode;
  banner?: React.ReactNode;
  id?: string;
  additionalLinks?: React.ReactNode;
};

const useStyles = makeStyles()((theme) => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    minWidth: 0,
    gridArea: CONTENT_GRID_AREA,
    padding: '0px 32px',
    alignItems: 'center',
    [theme.breakpoints.down('Medium')]: {
      padding: '0px 20px',
    },
  },
  banner: {
    width: 'calc(100% + 64px)',
    [theme.breakpoints.down('Medium')]: {
      width: 'calc(100% + 40px)',
    },
  },
  content: {
    alignSelf: 'center',
    display: 'flex',
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'space-between',
    maxWidth: MAX_CONTENT_WIDTH,
    paddingTop: '16px',
    position: 'relative',
    width: '100%',
    [theme.breakpoints.down('Medium')]: {
      paddingTop: '8px',
    },
  },
  sticky: {
    maxWidth: MAX_CONTENT_WIDTH,
    position: 'sticky',
    paddingBottom: '16px',
    top: 0,
    width: '100%',
    zIndex: theme.zIndex.mobileStepper, // NOTE (@leoliu, 01/21/26) we were using appbar zIndex before, but this causes issues with Popover Foundation Menu content
  },
}));

const PageContent = React.forwardRef<HTMLDivElement, React.PropsWithChildren<TPageContentProps>>(
  ({ children, stickyContent, usePublicFooter, banner, id, additionalLinks }, ref) => {
    const footerBehavior = useFooterBehavior();
    const {
      cx,
      classes: { root, content, sticky, banner: bannerClass },
    } = useStyles();
    const {
      classes: { scroll },
    } = useScrollStyles();

    return (
      <Grid ref={ref} id={id} classes={{ root: cx(root, scroll) }}>
        {stickyContent && <Grid classes={{ root: sticky }}>{stickyContent}</Grid>}
        {banner && <Grid classes={{ root: bannerClass }}>{banner}</Grid>}
        <Grid classes={{ root: content }}>{children}</Grid>
        {usePublicFooter && <PublicFooter />}
        <PrivateFooter behavior={footerBehavior} additionalLinks={additionalLinks} />
      </Grid>
    );
  },
);

PageContent.displayName = 'PageContent';

export default PageContent;
