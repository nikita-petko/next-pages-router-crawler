import type { FC, ReactNode } from 'react';
import { useMemo } from 'react';
import { Card, Grid, InfoOutlinedIcon, Tooltip, Typography } from '@rbx/ui';
import type { FormattedText } from '@modules/analytics-translations/types';
import type { GenericChartState } from '../../charts/types/ChartTypes';
import { noDataSymbol } from '../../components/MetricValue/MetricValue';
import type { TCardStyleConfig } from '../../types/CardStyleConfig';
import GenericCardContentWrapper from '../GenericCardContentWrapper';
import useGenericSummaryCardStyles from './GenericSummaryCard.styles';
import { useSummaryCardHeaderActions } from './SummaryCardHeaderActionsContext';

type GenericSummaryCardProps = {
  label: { labelText: FormattedText; tooltip?: FormattedText };
  value: ReactNode;
  /**
   * Optional icon rendered immediately before the value (e.g. Robux icon for
   * Robux-unit metrics). Caller is responsible for sizing.
   */
  valueLeadingIcon?: ReactNode;
  /**
   * Optional element rendered to the right of the value (e.g. a comparison
   * chip showing period-over-period change).
   */
  comparisonChip?: ReactNode;
  /**
   * Optional actions rendered inline with the title (e.g. edit/overflow).
   * When omitted, falls back to `SummaryCardHeaderActionsProvider` if present.
   */
  headerActions?: ReactNode;
  fullWidth?: boolean;
  fitContentWidth?: boolean;
  styleConfig?: TCardStyleConfig;
} & GenericChartState;

const GenericSummaryCard: FC<GenericSummaryCardProps> = ({
  label: { labelText: label, tooltip },
  value,
  valueLeadingIcon,
  comparisonChip,
  headerActions,
  fullWidth,
  fitContentWidth,
  isDataLoading,
  isResponseFailed,
  isUserForbidden,
  styleConfig,
}) => {
  const {
    classes: {
      card,
      cardContent,
      titleRow,
      titleLabel,
      headerActions: headerActionsClass,
      cardColumn,
      valueSlot,
      gridItemFitContent,
      valueSlotFitContent,
    },
  } = useGenericSummaryCardStyles();
  const contextHeaderActions = useSummaryCardHeaderActions();
  const resolvedHeaderActions = headerActions ?? contextHeaderActions;
  const gridItemProps = fullWidth
    ? { XSmall: 12 as const }
    : fitContentWidth
      ? { className: gridItemFitContent }
      : {};

  const labelComponent = useMemo(
    () => (
      <div className={titleRow} data-testid='summary-card-title-row'>
        <div className={titleLabel}>
          <Typography variant='body1'>{label}</Typography>
          {tooltip && (
            <Tooltip
              title={tooltip}
              placement='top'
              arrow
              enterTouchDelay={0}
              leaveTouchDelay={3000}>
              <InfoOutlinedIcon fontSize='small' style={{ paddingLeft: 4 }} />
            </Tooltip>
          )}
        </div>
        {resolvedHeaderActions ? (
          <div className={headerActionsClass} data-testid='summary-card-header-actions'>
            {resolvedHeaderActions}
          </div>
        ) : null}
      </div>
    ),
    [headerActionsClass, label, resolvedHeaderActions, titleLabel, titleRow, tooltip],
  );
  const innerValueComponent =
    typeof value === 'string' ? (
      <Typography variant='h1'>{value}</Typography>
    ) : (
      <div
        className={fitContentWidth ? `${valueSlot} ${valueSlotFitContent}` : valueSlot}
        data-testid='summary-card-value-slot'>
        {value}
      </div>
    );

  // Keep the chip fully visible in narrow tiles (overflow:hidden): value can
  // shrink/wrap, chip never shrinks, and wrap drops the chip if needed.
  const valueComponent =
    valueLeadingIcon || comparisonChip ? (
      <div className='flex wrap items-center gap-small min-width-0 width-full'>
        {valueLeadingIcon ? (
          <div className='flex items-center shrink-0'>{valueLeadingIcon}</div>
        ) : null}
        <div className='min-width-0'>{innerValueComponent}</div>
        {comparisonChip ? <div className='shrink-0'>{comparisonChip}</div> : null}
      </div>
    ) : (
      innerValueComponent
    );

  // Summary cards show custom error state with the no data symbol for non 403 errors
  if (isResponseFailed && !isUserForbidden) {
    return (
      <Grid item {...gridItemProps}>
        <Card className={card}>
          <GenericCardContentWrapper
            cardContentClass={cardContent}
            isDataLoading
            isResponseFailed={false}
            isUserForbidden={false}
            styleConfig={styleConfig}>
            <Grid container direction='column' className={cardColumn}>
              {labelComponent}
              <Typography variant='h1'>{noDataSymbol}</Typography>
            </Grid>
          </GenericCardContentWrapper>
        </Card>
      </Grid>
    );
  }

  return (
    <Grid item {...gridItemProps}>
      <Card className={card}>
        <GenericCardContentWrapper
          cardContentClass={cardContent}
          isDataLoading={isDataLoading}
          isResponseFailed={isResponseFailed}
          isUserForbidden={isUserForbidden}
          styleConfig={styleConfig}>
          <Grid container direction='column' className={cardColumn}>
            {labelComponent}
            {valueComponent}
          </Grid>
        </GenericCardContentWrapper>
      </Card>
    </Grid>
  );
};

export default GenericSummaryCard;
