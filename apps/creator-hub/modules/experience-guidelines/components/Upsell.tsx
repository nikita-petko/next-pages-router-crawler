import React, { FunctionComponent } from 'react';
import { Button, useMediaQuery, Typography, Link } from '@rbx/ui';
import usePageNotFoundStyles from '@modules/miscellaneous/error/components/ErrorPage.styles';
import { urls } from '@modules/miscellaneous/common';

const { www } = urls;
const ExperienceBlockedUpsell: FunctionComponent<React.PropsWithChildren<unknown>> = () => {
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
    </React.Fragment>
  );
};

export default ExperienceBlockedUpsell;
