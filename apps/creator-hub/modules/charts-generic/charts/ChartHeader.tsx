import { InfoOutlinedIcon, Tooltip, Typography } from '@rbx/ui';
import React, { FunctionComponent, ReactElement, ReactNode, useCallback } from 'react';
import { FormattedText } from '@modules/analytics-translations';
import ChartExportButton from './TimeSeriesChartExportButton';
import useChartStyles from './Chart.styles';

export type ChartHeaderProps = {
  title: ReactNode;
  definitionTooltip?: FormattedText;
  onChartTooltipViewed?: (tooltipId: string) => void;
  exploreModeButton?: ReactNode;
  exportButton: ReactElement<typeof ChartExportButton> | null;
  chartControl?: ReactNode;
};

const ChartHeader: FunctionComponent<ChartHeaderProps> = ({
  title: titleText,
  definitionTooltip: definitionTooltipText,
  onChartTooltipViewed,
  exploreModeButton,
  exportButton,
  chartControl,
}) => {
  const {
    classes: { headerContainer, chartTitle, tooltipIconPadding, chartHeaderRightSideContainer },
  } = useChartStyles();

  const title = (
    <Typography align='left' className={chartTitle} variant='h5'>
      {titleText}
    </Typography>
  );

  const onTooltipClose = useCallback(() => {
    if (onChartTooltipViewed) {
      onChartTooltipViewed('chartInfo');
    }
  }, [onChartTooltipViewed]);

  const definitionTooltip = definitionTooltipText ? (
    <Tooltip
      title={definitionTooltipText}
      placement='bottom'
      onClose={onTooltipClose}
      enterTouchDelay={0}
      leaveTouchDelay={3000}>
      <div className={tooltipIconPadding}>
        <InfoOutlinedIcon fontSize='small' />
      </div>
    </Tooltip>
  ) : null;
  const rightSideControls =
    exportButton || exploreModeButton || chartControl ? (
      <div className={chartHeaderRightSideContainer}>
        {chartControl}
        {exploreModeButton}
        {exportButton}
      </div>
    ) : null;

  return (
    <div className={headerContainer}>
      {title}
      {definitionTooltip}
      {rightSideControls}
    </div>
  );
};

export default ChartHeader;
