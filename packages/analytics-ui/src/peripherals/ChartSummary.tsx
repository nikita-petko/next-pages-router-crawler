import type { FC } from 'react';
import React, { useMemo } from 'react';
import type { TIconProps } from '@rbx/ui';
import { Container, InfoOutlinedIcon, makeStyles, Tooltip, Typography } from '@rbx/ui';
import type ChartAbnormalStatus from './ChartAbnormalStatus';
import type { ComparisonChipProps } from './ComparisonChip';
import ComparisonChip from './ComparisonChip';

export type ChartSummaryProps = {
  summaryValue: string;
  description: string;
  tooltip?: string;
  StartSummaryIcon?: React.FunctionComponent<React.PropsWithChildren<TIconProps>>;
  comparisonChipSpec?: ComparisonChipProps;
  abnormalStatus?: ChartAbnormalStatus;
  centered?: boolean;
};

const useStyles = makeStyles()(() => ({
  container: {
    width: 'unset',
    margin: 'unset',
    textTransform: 'none', // MUI Tab auto capitalizes text, so we need to override it
  },
  statsContainer: {
    display: 'flex',
    alignItems: 'center',
  },
  statsContainerCentered: {
    justifyContent: 'center',
  },
  tooltipIcon: {
    verticalAlign: 'middle',
    margin: '0 0 2px 4px',
  },
}));

const ChartSummary: FC<ChartSummaryProps> = ({
  summaryValue,
  description,
  tooltip,
  StartSummaryIcon,
  comparisonChipSpec,
  abnormalStatus,
  centered,
}) => {
  const {
    classes: { statsContainer, statsContainerCentered, container, tooltipIcon },
    cx,
  } = useStyles();

  const comparisonChip = useMemo(() => {
    return comparisonChipSpec ? <ComparisonChip {...comparisonChipSpec} /> : null;
  }, [comparisonChipSpec]);

  const stats = useMemo(() => {
    if (abnormalStatus) {
      return <Typography variant='h2'>--</Typography>;
    }
    return (
      <>
        {StartSummaryIcon ? <StartSummaryIcon fontSize='small' /> : null}
        <Typography
          variant='h2'
          marginRight={comparisonChip ? '8px' : '0'}
          marginLeft={StartSummaryIcon ? '4px' : '0'}>
          {summaryValue}
        </Typography>
        {comparisonChip}
      </>
    );
  }, [StartSummaryIcon, abnormalStatus, comparisonChip, summaryValue]);

  return (
    <Container disableGutters classes={{ root: container }}>
      <Typography variant='body2' color='secondary'>
        {description}
        {tooltip && (
          <Tooltip title={tooltip} arrow>
            <InfoOutlinedIcon fontSize='small' classes={{ root: tooltipIcon }} />
          </Tooltip>
        )}
      </Typography>
      <div className={cx(statsContainer, centered && statsContainerCentered)}>{stats}</div>
    </Container>
  );
};

export default ChartSummary;
