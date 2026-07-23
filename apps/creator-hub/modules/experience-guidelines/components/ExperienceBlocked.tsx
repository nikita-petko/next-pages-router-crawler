import type { FunctionComponent } from 'react';
import React from 'react';
import { Grid } from '@rbx/ui';
import { useAuthentication } from '@modules/authentication/providers';
import CreatorHubLayout from '@modules/creator-hub-layout/CreatorHubLayout';
import usePageNotFoundStyles from '@modules/miscellaneous/error/components/ErrorPage.styles';
import {
  errorImagePath,
  errorImageDimension,
} from '@modules/miscellaneous/error/constants/assetConstants';

const ExperienceBlocked: FunctionComponent<React.PropsWithChildren> = ({ children }) => {
  const { user } = useAuthentication();

  const {
    classes: {
      background,
      loggedinErrorArea,
      guestErrorArea,
      errorImage,
      loggedinImageArea,
      guestImageArea,
    },
  } = usePageNotFoundStyles();

  const isLoggedIn = user !== null;
  return (
    <CreatorHubLayout>
      <div className='items-center justify-center height-full width-full flex'>
        <Grid container item className={background} justifyContent='center' alignItems='center'>
          <Grid item className={isLoggedIn ? loggedinErrorArea : guestErrorArea} Medium={6}>
            {children}
          </Grid>
          <Grid item className={isLoggedIn ? loggedinImageArea : guestImageArea} Medium={6}>
            <img
              className={errorImage}
              src={errorImagePath}
              alt='error'
              width={errorImageDimension}
              height={errorImageDimension}
            />
          </Grid>
        </Grid>
      </div>
    </CreatorHubLayout>
  );
};

export default ExperienceBlocked;
