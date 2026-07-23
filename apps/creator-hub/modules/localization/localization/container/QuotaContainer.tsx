import React, { Fragment, FunctionComponent, useCallback, useEffect, useState } from 'react';
import { Grid, Typography, Link, Skeleton, ReportProblemOutlinedIcon } from '@rbx/ui';
import { DateTimeFormatter } from '@rbx/core';
import { useLocalization, useTranslation, Locale } from '@rbx/intl';
import { gameInternationalizationClient } from '@modules/clients';
import CreatorDashboardContext from '@modules/eventStream/enum/CreatorDashboardContext';
import CreatorDashboardEventType from '@modules/eventStream/enum/CreatorDashboardEventType';
import CreatorDashboardSource from '@modules/eventStream/enum/CreatorDashboardSource';
import { useEventTrackerProvider } from '@modules/eventStream/eventTrackerProvider';
import type { TrackerClientRequest } from '@modules/eventStream/constants/eventConstants';
import { getProductionCreatorHubUrl } from '@rbx/env-utils';
import Quota from '../components/Quota';
import useContainerStyles from './QuotaContainer.styles';
import Panel from '../../common/components/Panel';

export interface QuotaSectionProps {
  gameId: number;
}

const QuotaContainer: FunctionComponent<React.PropsWithChildren<QuotaSectionProps>> = ({
  gameId,
}) => {
  const { trackerClient } = useEventTrackerProvider();
  const { translate } = useTranslation();
  const { locale } = useLocalization();
  const {
    classes: { gridContainer, anchor, quotaSkeleton, dateSkeleton, errorText, renewalDateText },
  } = useContainerStyles();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [dataFetchingError, setDataFetchingError] = useState<Error>();
  const [renewalDate, setRenewalDate] = useState<string>('');
  const [initialQuota, setInitialQuota] = useState<number>(0);
  const [monthlyQuota, setMonthlyQuota] = useState<number>(0);
  const [initialBalance, setInitialBalance] = useState<number>(0);
  const [monthlyBalance, setMonthlyBalance] = useState<number>(0);

  const sendTrackerClientRequest = () => {
    const quotaTrackerClientRequest: TrackerClientRequest = {
      eventType: CreatorDashboardEventType.LearnMoreAutomaticQuota,
      context: CreatorDashboardContext.Click,
      additionalProperties: {
        Source: CreatorDashboardSource.LocalizationAutomaticQuotas,
      },
    };
    trackerClient.sendEvent(quotaTrackerClientRequest);
  };

  const getQuota = useCallback(async () => {
    try {
      setIsLoading(true);
      const quota = await gameInternationalizationClient.getTranslationQuota({ gameId });
      if (
        quota.bankQuota?.capacity === undefined ||
        quota.bankQuota?.remaining === undefined ||
        quota.monthlyQuota?.capacity === undefined ||
        quota.monthlyQuota?.remaining === undefined ||
        quota.monthlyQuota?.nextRefreshDate === undefined
      ) {
        throw new Error('Null data fetched');
      }
      setInitialQuota(quota.bankQuota.capacity);
      setInitialBalance(quota.bankQuota.remaining);
      setMonthlyQuota(quota.monthlyQuota.capacity);
      setMonthlyBalance(quota.monthlyQuota.remaining);
      setRenewalDate(
        new DateTimeFormatter(locale ?? Locale.English).getCustomDateTime(
          quota.monthlyQuota.nextRefreshDate,
        ),
      );
    } catch (e) {
      if (e instanceof Error) {
        setDataFetchingError(e);
      }
    } finally {
      setIsLoading(false);
    }
  }, [gameId, locale]);

  useEffect(() => {
    getQuota();
  }, [getQuota]);

  if (isLoading) {
    return (
      <Panel title={translate('Title.Quota')}>
        <Grid className={gridContainer} container>
          <Fragment>
            <Skeleton animate className={quotaSkeleton} />
            <Skeleton animate className={quotaSkeleton} />
          </Fragment>
        </Grid>
        <Skeleton animate className={dateSkeleton} />
      </Panel>
    );
  }
  if (dataFetchingError) {
    return (
      <Grid container alignItems='center'>
        <ReportProblemOutlinedIcon fontSize='small' />
        <Typography className={errorText} variant='footer'>
          {translate('Message.FailedToFetchQuotaData')}
        </Typography>
      </Grid>
    );
  }
  return (
    <Panel title={translate('Title.Quota')}>
      <Grid className={gridContainer} container spacing={1}>
        <Quota
          quota={initialQuota}
          balance={initialBalance}
          description={translate('Label.InitialQuota')}
        />
        <Quota
          quota={monthlyQuota}
          balance={monthlyBalance}
          description={translate('Label.MonthlyQuota')}
        />
      </Grid>
      <Grid container alignItems='center'>
        <Typography className={renewalDateText} variant='footer'>
          {translate('Description.QuotaRenewalDate')}
          {renewalDate}
        </Typography>
        <span>
          <Link
            href={`${getProductionCreatorHubUrl(process.env.buildTarget)}/docs/production/localization/automatic-translations#enabling-translations`}
            onClick={sendTrackerClientRequest}
            target='_blank'>
            <Typography className={anchor} variant='footer'>
              {translate('Action.LearnMore')}
            </Typography>
          </Link>
        </span>
      </Grid>
    </Panel>
  );
};

export default QuotaContainer;
