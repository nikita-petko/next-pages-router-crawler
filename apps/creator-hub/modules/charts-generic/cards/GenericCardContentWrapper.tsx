import React, { FC, ReactNode } from 'react';

import { useTranslation } from '@rbx/intl';
import { CardContent, CircularProgress, Grid, Typography } from '@rbx/ui';

import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { translationKey, useTranslationWrapper } from '@modules/analytics-translations';
import { GenericChartState } from '../charts/types/ChartTypes';
import { TCardStyleConfig } from '../types/CardStyleConfig';

export type GenericCardContentWrapperSpec = {
  showNoDataMessage?: boolean;
  cardContentClass?: string;
  styleConfig?: TCardStyleConfig;
} & GenericChartState;

const GenericCardContentWrapper: FC<React.PropsWithChildren<GenericCardContentWrapperSpec>> = ({
  children,
  isDataLoading,
  isUserForbidden,
  isResponseFailed,
  showNoDataMessage,
  cardContentClass,
  styleConfig,
}) => {
  const { translate } = useTranslationWrapper(useTranslation());
  const wrapped = (body: ReactNode) => {
    return <CardContent className={cardContentClass}>{body}</CardContent>;
  };

  const emptyGridWrapper = (body: ReactNode) => {
    return (
      <Grid
        container
        justifyContent='center'
        alignItems='center'
        direction='column'
        height={styleConfig?.loadingBodyHeight}
        width={styleConfig?.loadingBodyWidth}>
        {body}
      </Grid>
    );
  };

  if (isDataLoading) {
    return emptyGridWrapper(<CircularProgress color='secondary' data-testid='loadingIndicator' />);
  }
  if (isUserForbidden) {
    return emptyGridWrapper(
      <Typography>
        {translate(translationKey('Message.UserHasNoPermission', TranslationNamespace.Analytics))}
      </Typography>,
    );
  }
  if (isResponseFailed) {
    return emptyGridWrapper(
      <Typography>
        {translate(translationKey('Message.RequestFailure', TranslationNamespace.Analytics))}
      </Typography>,
    );
  }
  if (showNoDataMessage) {
    return emptyGridWrapper(
      <Typography>
        {translate(translationKey('Message.NoDataReturn', TranslationNamespace.Analytics))}
      </Typography>,
    );
  }
  return wrapped(children);
};

export default GenericCardContentWrapper;
