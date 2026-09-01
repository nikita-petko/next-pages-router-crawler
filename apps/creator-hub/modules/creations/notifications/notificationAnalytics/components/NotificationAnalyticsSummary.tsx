import React from 'react';
import { useTranslation, withTranslation } from '@rbx/intl';
import { Grid, InfoOutlinedIcon, List, ListItem, Tooltip, Typography, makeStyles } from '@rbx/ui';
import useAnalyticsPageSummaryStyles from '@modules/charts-generic/layout/AnalyticsPageSummary.styles';
import AnalyticsPageSummaryContainer from '@modules/charts-generic/layout/AnalyticsPageSummaryContainer';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useNotificationsAnalyticsContext } from '../provider/NotificationsAnalyticsProvider';

const useNotificationAnalyticsSummaryStyles = makeStyles()((theme) => ({
  summaryHeader: {
    marginBottom: theme.spacing(2),
  },

  summaryHeaderTooltip: {
    marginLeft: theme.spacing(1),
  },
}));

interface NotificationAnalyticsSummaryProps {
  isDataLoading: boolean;
  isUserForbidden: boolean;
  isResponseFailed: boolean;
}

enum NotificationAnalyticsSummaryColumn {
  Impressions = 'impressions',
  Clicks = 'clicks',
  OptedInUsers = 'optedInUsers',
  ClickthroughRate = 'clickthroughRate',
  TurnoffRate = 'turnoffRate',
  DismissRate = 'dismissRate',
}

const NotificationAnalyticsSummaryColumns: Array<NotificationAnalyticsSummaryColumn> = [
  NotificationAnalyticsSummaryColumn.OptedInUsers,
  NotificationAnalyticsSummaryColumn.Impressions,
  NotificationAnalyticsSummaryColumn.Clicks,
  NotificationAnalyticsSummaryColumn.ClickthroughRate,
  NotificationAnalyticsSummaryColumn.DismissRate,
  NotificationAnalyticsSummaryColumn.TurnoffRate,
];

const NotificationAnalyticsSummaryColumDefinition: Record<
  NotificationAnalyticsSummaryColumn,
  {
    title: string;
    tooltip?: string;
    width: {
      xs?: number | 'auto';
      sm?: number | 'auto';
      md?: number | 'auto';
      lg?: number | 'auto';
      xl?: number | 'auto';
    };
  }
> = {
  [NotificationAnalyticsSummaryColumn.Impressions]: {
    title: 'Label.Impressions',
    width: { xs: 4, sm: 4, md: 4, lg: 3, xl: 2 },
  },
  [NotificationAnalyticsSummaryColumn.Clicks]: {
    title: 'Label.Clicks',
    width: { xs: 4, sm: 4, md: 4, lg: 3, xl: 2 },
  },
  [NotificationAnalyticsSummaryColumn.OptedInUsers]: {
    title: 'Label.OptedInUsers',
    tooltip: 'Tooltip.Table.CampaignAnalytics.OptedInUsers',
    width: { xs: 4, sm: 4, md: 4, lg: 3, xl: 2 },
  },
  [NotificationAnalyticsSummaryColumn.ClickthroughRate]: {
    title: 'Label.CTR',
    width: { xs: 4, sm: 4, md: 4, lg: 3, xl: 2 },
  },
  [NotificationAnalyticsSummaryColumn.TurnoffRate]: {
    title: 'Label.TurnoffRate',
    width: { xs: 4, sm: 4, md: 4, lg: 3, xl: 2 },
  },
  [NotificationAnalyticsSummaryColumn.DismissRate]: {
    title: 'Label.DismissRate',
    width: { xs: 4, sm: 4, md: 4, lg: 3, xl: 2 },
  },
};

const NotificationAnalyticsSummary: React.FC<
  React.PropsWithChildren<NotificationAnalyticsSummaryProps>
> = ({ isDataLoading, isUserForbidden, isResponseFailed }) => {
  const {
    classes: { summaryFont, list, listItem },
  } = useAnalyticsPageSummaryStyles();
  const {
    classes: { summaryHeader, summaryHeaderTooltip },
  } = useNotificationAnalyticsSummaryStyles();
  const { translate } = useTranslation();
  const { notificationsContentAnalyticsSummary } = useNotificationsAnalyticsContext();

  return (
    <>
      <Typography component='h3' variant='h3' className={summaryHeader}>
        {translate('Label.Analytics.Summary')}
      </Typography>
      <AnalyticsPageSummaryContainer
        isDataLoading={isDataLoading}
        isUserForbidden={isUserForbidden}
        isResponseFailed={isResponseFailed}>
        <Grid container>
          {NotificationAnalyticsSummaryColumns.map((column) => {
            const data = notificationsContentAnalyticsSummary[column];
            return (
              <Grid
                item
                XSmall={NotificationAnalyticsSummaryColumDefinition[column].width.xs ?? 3}
                Large={NotificationAnalyticsSummaryColumDefinition[column].width.md ?? 2}
                XLarge={NotificationAnalyticsSummaryColumDefinition[column].width.lg ?? 2}
                XXLarge={NotificationAnalyticsSummaryColumDefinition[column].width.xl ?? 2}
                key={column}>
                <List className={list}>
                  <ListItem className={listItem}>
                    {translate(NotificationAnalyticsSummaryColumDefinition[column].title)}
                    {NotificationAnalyticsSummaryColumDefinition[column].tooltip ? (
                      <Tooltip
                        title={translate(
                          NotificationAnalyticsSummaryColumDefinition[column].tooltip,
                        )}
                        className={summaryHeaderTooltip}
                        placement='bottom'
                        enterTouchDelay={0}
                        leaveTouchDelay={3000}>
                        <InfoOutlinedIcon fontSize='small' />
                      </Tooltip>
                    ) : null}
                  </ListItem>
                  <ListItem className={listItem}>
                    <Typography className={summaryFont}>{data}</Typography>
                  </ListItem>
                </List>
              </Grid>
            );
          })}
        </Grid>
      </AnalyticsPageSummaryContainer>
    </>
  );
};

export default withTranslation(NotificationAnalyticsSummary, [
  TranslationNamespace.Notifications,
  TranslationNamespace.Analytics,
]);
