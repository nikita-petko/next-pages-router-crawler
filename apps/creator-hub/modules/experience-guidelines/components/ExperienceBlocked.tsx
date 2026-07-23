import React, { FunctionComponent } from 'react';
import { Grid } from '@rbx/ui';
import { useAuthentication } from '@modules/authentication/providers';
import usePageNotFoundStyles from '@modules/miscellaneous/error/components/ErrorPage.styles';
import {
  errorImagePath,
  errorImageDimension,
} from '@modules/miscellaneous/error/constants/assetConstants';
import AppNavigationLayout from '@modules/navigation/layout/components/AppLayout';

const ExperienceBlocked: FunctionComponent<React.PropsWithChildren<unknown>> = ({ children }) => {
  const { user } = useAuthentication();

  const {
    classes: {
      root,
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
    <AppNavigationLayout>
      <Grid className={root} alignItems='center' justifyContent='center' container>
        <Grid container item className={background} justifyContent='center' alignItems='flex-start'>
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
      </Grid>
    </AppNavigationLayout>
  );
};

export default ExperienceBlocked;
