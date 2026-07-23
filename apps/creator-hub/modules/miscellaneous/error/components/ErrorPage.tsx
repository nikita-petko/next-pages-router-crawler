import React, { FunctionComponent } from 'react';
import { useMediaQuery, Grid, Typography } from '@rbx/ui';
import { useTranslation, withTranslation } from '@rbx/intl';
import { useAuthentication } from '@modules/authentication/providers';
import { TranslationNamespace } from '../../localization';
import { errorImagePath, errorImageDimension } from '../constants/assetConstants';
import { errorCodeKeyDictionary, ErrorCode } from '../constants/errorCodeKeyConstants';
import useErrorPageStyles from './ErrorPage.styles';
import AccessDeniedPage from './AccessDeniedPage';
import AccessDeniedAgeOrReasonPage from './AgeOrRegionAccessDenied';

interface ErrorPageProps {
  errorCode: ErrorCode;
  isAgeOrRegionRestricted?: boolean;
}

const ErrorPage: FunctionComponent<React.PropsWithChildren<ErrorPageProps>> = ({
  errorCode,
  isAgeOrRegionRestricted = false,
}) => {
  const { user } = useAuthentication();
  const { translate } = useTranslation();

  const isCompact = useMediaQuery((theme) => theme.breakpoints.down('Medium'));
  const {
    classes: {
      root,
      background,
      loggedinErrorArea,
      guestErrorArea,
      errorImage,
      textHeader,
      loggedinImageArea,
      guestImageArea,
    },
  } = useErrorPageStyles();

  const { headingKey, descriptionKey } = errorCodeKeyDictionary[errorCode];

  const isLoggedIn = user !== null;

  if (errorCode === 403) {
    return isAgeOrRegionRestricted ? <AccessDeniedAgeOrReasonPage /> : <AccessDeniedPage />;
  }

  return (
    <Grid className={root} alignItems='center' justifyContent='center' container>
      <Grid container item className={background} justifyContent='center' alignItems='flex-start'>
        <Grid item className={isLoggedIn ? loggedinErrorArea : guestErrorArea} Medium={6}>
          <Typography
            color='primary'
            variant='h1'
            className={textHeader}
            align={isCompact ? 'center' : 'left'}>
            {translate(headingKey)}
          </Typography>
          <br />
          <Typography color='secondary' align={isCompact ? 'center' : 'left'}>
            {translate(descriptionKey)}
          </Typography>
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
  );
};

export default withTranslation(ErrorPage, [TranslationNamespace.Error]);
