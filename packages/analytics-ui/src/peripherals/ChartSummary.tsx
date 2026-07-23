import React, { FC, useMemo } from 'react';
import { Container, InfoOutlinedIcon, makeStyles, TIconProps, Tooltip, Typography } from '@rbx/ui';
import ComparisonChip, { ComparisonChipProps } from './ComparisonChip';
import ChartAbnormalStatus from './ChartAbnormalStatus';

export type ChartSummaryProps = {
  summaryValue: string;
  description: string;
  tooltip?: string;
  StartSummaryIcon?: React.FunctionComponent<React.PropsWithChildren<TIconProps>>;
  comparisonChipSpec?: ComparisonChipProps;
  abnormalStatus?: ChartAbnormalStatus;
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
}) => {
  const {
    classes: { statsContainer, container, tooltipIcon },
  } = useStyles();

  const comparisonChip = useMemo(() => {
    return comparisonChipSpec ? <ComparisonChip {...comparisonChipSpec} /> : null;
  }, [comparisonChipSpec]);

  const stats = useMemo(() => {
    if (abnormalStatus) {
      return <Typography variant='h2'>--</Typography>;
    }
    return (
      <React.Fragment>
        {StartSummaryIcon ? <StartSummaryIcon fontSize='small' /> : null}
        <Typography variant='h2' marginRight='8px' marginLeft={StartSummaryIcon ? '4px' : '0'}>
          {summaryValue}
        </Typography>
        {comparisonChip}
      </React.Fragment>
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
      <div className={statsContainer}>{stats}</div>
    </Container>
  );
};

export default ChartSummary;
