import { CircularProgress, Container, makeStyles, Typography } from '@rbx/ui';
import React, { FC } from 'react';
import ChartAbnormalStatus from './ChartAbnormalStatus';

export type ChartPlaceholderProps = {
  status: ChartAbnormalStatus;
  description?: string;
  secondaryDescription?: string;
};

const useStyles = makeStyles()(() => ({
  container: {
    textAlign: 'center',
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    display: 'grid',
    placeItems: 'center',
  },
}));

const ChartPlaceholder: FC<ChartPlaceholderProps> = ({
  status,
  description,
  secondaryDescription,
}) => {
  const {
    classes: { container },
  } = useStyles();

  const isLoading = status === ChartAbnormalStatus.Loading;

  return (
    <Container disableGutters classes={{ root: container }}>
      <div>
        {isLoading ? <CircularProgress /> : null}
        <Typography display='block' variant='h6' marginTop='8px'>
          {description}
        </Typography>
        <Typography display='block' variant='body2'>
          {secondaryDescription}
        </Typography>
      </div>
    </Container>
  );
};

export default ChartPlaceholder;
