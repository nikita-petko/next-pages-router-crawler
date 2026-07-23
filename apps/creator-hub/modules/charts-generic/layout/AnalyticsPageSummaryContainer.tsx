import React, { FC, useMemo } from 'react';
import { CircularProgress, Grid, Typography } from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
import useAnalyticsPageSummaryStyles from './AnalyticsPageSummary.styles';

export type AnalyticsPageSummaryContainerProps = {
  isDataLoading: boolean;
  isUserForbidden: boolean;
  isResponseFailed: boolean;
};
export const AnalyticsPageSummaryContainer: FC<
  React.PropsWithChildren<AnalyticsPageSummaryContainerProps>
> = ({ children, isDataLoading, isUserForbidden, isResponseFailed }) => {
  const { translate } = useTranslation();
  const {
    classes: { summaryContainer, loadingContainer },
  } = useAnalyticsPageSummaryStyles();
  const content = useMemo(() => {
    if (isDataLoading) {
      return <CircularProgress />;
    }
    if (isUserForbidden) {
      return <Typography align='center'>{translate('Message.UserHasNoPermission')}</Typography>;
    }
    if (isResponseFailed) {
      return <Typography align='center'>{translate('Message.RequestFailure')}</Typography>;
    }
    return children;
  }, [isDataLoading, isUserForbidden, isResponseFailed, children, translate]);

  const isDataReady = !(isDataLoading || isUserForbidden || isResponseFailed);
  return (
    <Grid item XSmall={12}>
      <Grid className={`${summaryContainer} ${isDataReady ? '' : loadingContainer}`}>
        {content}
      </Grid>
    </Grid>
  );
};

export default AnalyticsPageSummaryContainer;
