import React, { FC, useMemo } from 'react';
import { Card, Grid, InfoOutlinedIcon, List, ListItem, Tooltip, Typography } from '@rbx/ui';
import { FormattedText } from '@modules/analytics-translations';
import GenericCardContentWrapper from '../GenericCardContentWrapper';
import useGenericSummaryCardStyles from './GenericSummaryCard.styles';
import type { TCardStyleConfig } from '../../types/CardStyleConfig';
import type { GenericChartState } from '../../charts/types/ChartTypes';
import { noDataSymbol } from '../../components/MetricValue/MetricValue';

type GenericSummaryCardProps = {
  label: { labelText: FormattedText; tooltip?: FormattedText };
  value: FormattedText;
  fullWidth?: boolean;
  styleConfig?: TCardStyleConfig;
} & GenericChartState;

const GenericSummaryCard: FC<GenericSummaryCardProps> = ({
  label: { labelText: label, tooltip },
  value,
  fullWidth,
  isDataLoading,
  isResponseFailed,
  isUserForbidden,
  styleConfig,
}) => {
  const {
    classes: { card, cardContent, list, listItem },
  } = useGenericSummaryCardStyles();

  const labelComponent = useMemo(
    () => (
      <List className={list}>
        <ListItem className={listItem}>
          <Typography variant='body1'>{label}</Typography>
          {tooltip && (
            <Tooltip title={tooltip} placement='bottom' enterTouchDelay={0} leaveTouchDelay={3000}>
              <InfoOutlinedIcon fontSize='small' style={{ paddingLeft: 4 }} />
            </Tooltip>
          )}
        </ListItem>
      </List>
    ),
    [label, list, listItem, tooltip],
  );

  // Summary cards show custom error state with the no data symbol for non 403 errors
  if (isResponseFailed && !isUserForbidden) {
    return (
      <Grid item XSmall={fullWidth ? 12 : undefined}>
        <Card className={card}>
          <GenericCardContentWrapper
            cardContentClass={cardContent}
            isDataLoading
            isResponseFailed={false}
            isUserForbidden={false}
            styleConfig={styleConfig}>
            <Grid container direction='column'>
              {labelComponent}
              <Typography variant='h1'>{noDataSymbol}</Typography>
            </Grid>
          </GenericCardContentWrapper>
        </Card>
      </Grid>
    );
  }

  return (
    <Grid item XSmall={fullWidth ? 12 : undefined}>
      <Card className={card}>
        <GenericCardContentWrapper
          cardContentClass={cardContent}
          isDataLoading={isDataLoading}
          isResponseFailed={isResponseFailed}
          isUserForbidden={isUserForbidden}
          styleConfig={styleConfig}>
          <Grid container direction='column'>
            {labelComponent}
            <Typography variant='h1'>{value}</Typography>
          </Grid>
        </GenericCardContentWrapper>
      </Card>
    </Grid>
  );
};

export default GenericSummaryCard;
