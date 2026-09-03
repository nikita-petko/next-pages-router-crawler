import { Fragment } from 'react';
import { getFormattedDateTime } from '@rbx/core';
import { Grid, Typography, Divider } from '@rbx/ui';

interface LastRegeneratedDetailsProps {
  className?: string;
  lastGeneratedUserName?: string;
  timestamp: Date;
  label: string;
}

const LastGeneratedDetails = ({
  lastGeneratedUserName,
  timestamp,
  label,
  className,
}: LastRegeneratedDetailsProps) => {
  return (
    <>
      <Grid
        className={className}
        item
        container
        justifyContent='space-between'
        alignItems='flex-end'>
        <div>
          <Typography variant='h6' component='h6'>
            {label}
          </Typography>
          {timestamp && (
            <Typography variant='body1' component='p' color='primary'>
              {getFormattedDateTime(timestamp)}
            </Typography>
          )}
        </div>

        {lastGeneratedUserName !== undefined && (
          <Typography variant='body1' color='primary'>
            {lastGeneratedUserName}
          </Typography>
        )}
      </Grid>
      <Divider />
    </>
  );
};

export default LastGeneratedDetails;
