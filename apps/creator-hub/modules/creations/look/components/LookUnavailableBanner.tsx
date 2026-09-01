import type { FunctionComponent } from 'react';
import React, { useMemo } from 'react';
import type { LookItemDetailV2 } from '@rbx/client-look-api/v1';
import { useTranslation } from '@rbx/intl';
import GenericVerificationAlert from '../../verification/components/GenericVerificationAlert';

export interface LookUnavailableBannerProps {
  items: LookItemDetailV2[];
  creatingUniverseId?: number | null;
}

const LookUnavailableBanner: FunctionComponent<
  React.PropsWithChildren<LookUnavailableBannerProps>
> = ({ items, creatingUniverseId }) => {
  const { translate } = useTranslation();

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

  if (unavailableItems.length === 0) {
    return null;
  }

  return (
    <div className='margin-top-medium margin-bottom-small'>
      <GenericVerificationAlert
        alertTitle={translate('Heading.LookUnavailable')}
        alertDescription={translate('Description.LookUnavailable')}
        severity='warning'
        externalLink={undefined}
        linkLabel={undefined}
        allowCloseDialog
      />
    </div>
  );
};

export default LookUnavailableBanner;
