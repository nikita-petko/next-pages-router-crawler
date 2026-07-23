import type { FunctionComponent } from 'react';
import React from 'react';
import { Button, useMediaQuery, Typography, Link } from '@rbx/ui';
import usePageNotFoundStyles from '@modules/miscellaneous/error/components/ErrorPage.styles';
import { www } from '@modules/miscellaneous/urls';

const ExperienceBlockedUpsell: FunctionComponent<React.PropsWithChildren> = () => {
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
        Age Verification Required
      </Typography>
      <br />
      <Typography color='secondary' align={isCompact ? 'center' : 'left'}>
        Verify your age to access this experience.
      </Typography>
      <ol>
        <li>
          <Typography color='secondary' align={isCompact ? 'center' : 'left'}>
            Go to Account Info &gt; Verify My Age
          </Typography>
        </li>
        <li>
          <Typography color='secondary' align={isCompact ? 'center' : 'left'}>
            Complete the verification process
          </Typography>
        </li>
      </ol>
      <br />
      <Button color='primary' href={www.getAccountSettingsUrl()} variant='outlined'>
        Verify My Age
      </Button>
      <br />
      <br />
      <Typography color='secondary'>
        <span>Return to&nbsp;</span>
        <Link href='/dashboard/creations'>Creations</Link>
      </Typography>
    </>
  );
};

export default ExperienceBlockedUpsell;
