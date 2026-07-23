import React from 'react';
import { Button, Grid } from '@rbx/ui';
// import useApplicationStyles from './ApplicationStyles';

interface ApplyFooterProps {
  primaryLabel: string;
  primaryEnabled: boolean;
  secondaryLabel: string;
  isLoading?: boolean;
  onBack: () => void;
  onNext: () => void;
}

const ApplyFooter = ({
  primaryLabel,
  primaryEnabled,
  secondaryLabel,
  isLoading = false,
  onNext,
  onBack,
}: ApplyFooterProps) => {
  // const styles = useApplicationStyles();

  return (
    <Grid item container width='100%' spacing={2}>
      {/* Commenting out sticky footer until fixed */}
      {/* <StickyFooter
        primary={{
          label: primaryLabel,
          variant: 'contained',
          onClick: onNext,
          disabled: !primaryEnabled
        }}
        secondary={{
          label: secondaryLabel,
          color: 'secondary',
          variant: 'outlined',
          onClick: onBack
        }}
        classes={{ root: styles.stickyFooter }}
      /> */}
      <Grid item>
        <Button variant='outlined' color='primary' size='large' onClick={onBack}>
          {secondaryLabel}
        </Button>
      </Grid>
      <Grid item>
        <Button
          variant='contained'
          size='large'
          disabled={!primaryEnabled}
          loading={isLoading}
          onClick={onNext}>
          {primaryLabel}
        </Button>
      </Grid>
    </Grid>
  );
};

export default ApplyFooter;
