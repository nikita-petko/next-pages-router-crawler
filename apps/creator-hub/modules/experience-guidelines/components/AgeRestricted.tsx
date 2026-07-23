import type { FunctionComponent } from 'react';
import React from 'react';
import { useMediaQuery, Typography, Link } from '@rbx/ui';
import usePageNotFoundStyles from '@modules/miscellaneous/error/components/ErrorPage.styles';

const ExperienceBlockedAgeRestricted: FunctionComponent<React.PropsWithChildren> = () => {
  const isCompact = useMediaQuery((theme) => theme.breakpoints.down('Medium'));
  const {
    classes: { textHeader },
  } = usePageNotFoundStyles();

  return (
    <>
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
    </>
  );
};

export default ExperienceBlockedAgeRestricted;
