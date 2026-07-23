import React, { FunctionComponent } from 'react';
import { useMediaQuery, Typography, Link } from '@rbx/ui';
import usePageNotFoundStyles from '@modules/miscellaneous/error/components/ErrorPage.styles';

const ExperienceBlockedAgeRestricted: FunctionComponent<React.PropsWithChildren<unknown>> = () => {
  const isCompact = useMediaQuery((theme) => theme.breakpoints.down('Medium'));
  const {
    classes: { textHeader },
  } = usePageNotFoundStyles();

  return (
    <React.Fragment>
      <Typography
        color='primary'
        variant='h1'
        className={textHeader}
        align={isCompact ? 'center' : 'left'}>
        Age Restricted
      </Typography>
      <br />
      <Typography color='secondary' align={isCompact ? 'center' : 'left'}>
        This experience is not accessible due to age restrictions.
      </Typography>
      <br />
      <br />
      <Typography color='secondary'>
        <span>Return to&nbsp;</span>
        <Link href='/dashboard/creations'>Creations</Link>
      </Typography>
    </React.Fragment>
  );
};

export default ExperienceBlockedAgeRestricted;
