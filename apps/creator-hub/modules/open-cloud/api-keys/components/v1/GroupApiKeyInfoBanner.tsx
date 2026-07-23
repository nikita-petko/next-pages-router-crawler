import { memo } from 'react';
import { Alert, AlertTitle, Typography } from '@rbx/ui';
import useGroupApiKeyInfoBannerStyles from './GroupApiKeyInfoBanner.styles';

type Props = {
  severity?: 'error' | 'warning' | 'info' | 'success';
  heading: string;
  description: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
  headingPaddingBottom?: string;
};

const GroupApiKeyInfoBanner = ({
  severity = 'error',
  heading,
  description,
  className,
  action,
  headingPaddingBottom = '8px',
}: Props) => {
  const {
    classes: { banner, alertTitle },
  } = useGroupApiKeyInfoBannerStyles({ headingPaddingBottom });

  return (
    <Alert
      severity={severity}
      variant='outlined'
      className={`${banner} ${className || ''}`}
      action={action}>
      <AlertTitle className={alertTitle}>{heading}</AlertTitle>
      <Typography variant='body1' component='div'>
        {description}
      </Typography>
    </Alert>
  );
};

export default memo(GroupApiKeyInfoBanner);
