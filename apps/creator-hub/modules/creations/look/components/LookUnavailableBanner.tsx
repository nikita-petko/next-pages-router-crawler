import type { FunctionComponent } from 'react';
import React, { useMemo, useState } from 'react';
import type { LookItemDetailV2 } from '@rbx/client-look-api/v1';
import { useTranslation } from '@rbx/intl';
import { Button, Alert, AlertTitle, Typography, makeStyles } from '@rbx/ui';
import useVerificationStyles from '../../verification/components/Verification.styles';

export interface LookUnavailableBannerProps {
  items: LookItemDetailV2[];
  creatingUniverseId?: number | null;
}

const useStyles = makeStyles()(() => ({
  bannerContainer: {
    marginTop: '24px',
    marginBottom: '20px',
  },
}));

const LookUnavailableBanner: FunctionComponent<
  React.PropsWithChildren<LookUnavailableBannerProps>
> = ({ items, creatingUniverseId }) => {
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

  // IEC looks (those with a creating universe) are composed of private
  // template assets that are intentionally not catalog-purchasable on their
  // own; the unavailability is expected and would mislead the creator into
  // thinking the look itself is unavailable. Non-IEC looks send the field
  // back as null / undefined / 0, so fall through to the regular banner
  // logic in all of those cases.
  const isIecLook = creatingUniverseId != null && creatingUniverseId > 0;
  if (isIecLook) {
    return null;
  }

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
