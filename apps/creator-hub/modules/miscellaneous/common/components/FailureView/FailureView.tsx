import React, { FunctionComponent, ReactNode } from 'react';
import { Button, Grid, Typography } from '@rbx/ui';
import { useTranslation, withTranslation } from '@rbx/intl';
import pageLoadFailureIconDark from '@rbx/foundation-images/pictograms/alert_dark.svg';
import pageLoadFailureIconLight from '@rbx/foundation-images/pictograms/alert_light.svg';
import useFailureViewStyles from './FailureView.styles';
import ThemedImage from '../ThemedImage';

export interface FailureViewProp {
  title?: string;
  message: string;
  buttonText?: string;
  onReload?: () => void;
  icon?: ReactNode;
  className?: string;
}

export const FailureView: FunctionComponent<React.PropsWithChildren<FailureViewProp>> = ({
  title,
  message,
  buttonText,
  onReload,
  icon,
  className,
}) => {
  const {
    classes: { failurePageContainer, textContainer, titleText },

    cx,
  } = useFailureViewStyles();
  const { translate } = useTranslation();
  return (
    <Grid
      container
      direction='column'
      justifyContent='center'
      alignItems='center'
      className={cx(failurePageContainer, className)}>
      {icon || (
        <ThemedImage
          lightSrc={pageLoadFailureIconLight}
          darkSrc={pageLoadFailureIconDark}
          alt='failure'
        />
      )}
      <div className={textContainer}>
        <Typography variant='body1' className={titleText}>
          {title}
        </Typography>
        <Typography variant='body1'>{message}</Typography>
      </div>
      {onReload && (
        <Button variant='outlined' size='small' color='primary' onClick={onReload}>
          {buttonText || translate('Action.FailedToLoadPage')}
        </Button>
      )}
    </Grid>
  );
};

export default withTranslation(FailureView, ['CreatorDashboard.Error']);
