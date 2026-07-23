import { useRouter } from 'next/router';
import { useCallback } from 'react';
import { useTranslation } from '@rbx/intl';
import { Button, Alert, Typography, AlertTitle } from '@rbx/ui';
import { analyticsExperimentsCreateNavigationItem } from '@modules/charts-generic/constants/analyticsNavigationItems';
import AnalyticsQueryParams from '@modules/charts-generic/enums/AnalyticsQueryParams';
import buildExperienceAnalyticsUrlWithParams from '@modules/charts-generic/utils/analyticsUrlBuilder';
import { ExperimentProductType } from '@modules/remote-configs/api/universeExperimentationClientEnums';

const ExperimentationNudgeAlert = () => {
  const { translate } = useTranslation();
  const router = useRouter();
  const universeId = router.query.id as string;

  const renderAlertTitle = useCallback(() => {
    const alertTitleText = translate('Alert.Title.ExperimentationNudge');

    return <AlertTitle paddingBottom={1}>{alertTitleText}</AlertTitle>;
  }, [translate]);

  const renderAlertBody = useCallback(() => {
    const alertBodyText = translate('Alert.Body.ExperimentationNudge');
    return (
      <Typography variant='body2' component='span'>
        {alertBodyText}
      </Typography>
    );
  }, [translate]);

  return (
    <Alert
      severity='info'
      variant='standard'
      action={
        <Button
          onClick={() => {
            const url = buildExperienceAnalyticsUrlWithParams(
              analyticsExperimentsCreateNavigationItem,
              {
                [AnalyticsQueryParams.ExperimentType]: ExperimentProductType.Matchmaking,
              },
              Number(universeId),
            );
            router.push(url);
          }}
          color='inherit'
          size='small'>
          {translate('Label.CreateExperiment')}
        </Button>
      }>
      {renderAlertTitle()}
      {renderAlertBody()}
    </Alert>
  );
};

export default ExperimentationNudgeAlert;
