import React, { FunctionComponent, useMemo, useState } from 'react';
import { useTranslation } from '@rbx/intl';
import { Button, Alert, AlertTitle, Typography, makeStyles } from '@rbx/ui';
import { LookItemDetailV2 } from '@rbx/clients/lookApi';
import useVerificationStyles from '../../verification/components/Verification.styles';

export interface LookUnavailableBannerProps {
  items: LookItemDetailV2[];
}

const useStyles = makeStyles()(() => ({
  bannerContainer: {
    marginTop: '24px',
    marginBottom: '20px',
  },
}));

const LookUnavailableBanner: FunctionComponent<
  React.PropsWithChildren<LookUnavailableBannerProps>
> = ({ items }) => {
  const { translate } = useTranslation();
  const {
    classes: { bannerContainer },
  } = useStyles();
  const {
    classes: { alertStyle },
  } = useVerificationStyles();

  const [showAlert, setShowAlert] = useState<boolean>(true);

  const { unavailableItems } = useMemo(() => {
    const unavailable: LookItemDetailV2[] = [];

    items.forEach((item) => {
      if (item.isPurchasable === false) {
        unavailable.push(item);
      }
    });

    return { unavailableItems: unavailable };
  }, [items]);

  if (unavailableItems.length === 0 || !showAlert) {
    return null;
  }

  return (
    <div className={bannerContainer}>
      <Alert
        severity='warning'
        onClose={undefined}
        className={alertStyle}
        action={
          <Button size='small' onClick={() => setShowAlert(false)}>
            x
          </Button>
        }>
        <AlertTitle>{translate('Heading.LookUnavailable')}</AlertTitle>
        <Typography variant='smallLabel2' component='span'>
          {translate('Description.LookUnavailable')}
        </Typography>
      </Alert>
    </div>
  );
};

export default LookUnavailableBanner;
