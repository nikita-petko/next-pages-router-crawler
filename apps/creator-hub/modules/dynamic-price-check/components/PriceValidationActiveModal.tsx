import { memo } from 'react';
import { Dialog, DialogTemplate } from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
import useSetUniverseFixedPrice from '../queries/useSetUniverseFixedPrice';
import useSetUniversePinnedLocation from '../queries/useSetUniversePinnedLocation';
import type { TestingType } from '../types';

interface PriceValidationActiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onError: () => void;
  universeId?: number;
  testing?: TestingType | null;
}

/**
 * Warning dialog to inform the user that price optimization tests cannot
 * be run while dynamic price check is enabled.
 *
 * Confirmation will disable dynamic price check.
 */
const PriceValidationActiveModal = ({
  isOpen,
  onClose,
  onError,
  universeId,
  testing,
}: PriceValidationActiveModalProps) => {
  const { translate } = useTranslation();

  const { setUniverseFixedPrice } = useSetUniverseFixedPrice(universeId!, { onError });
  const { setUniversePinnedLocation } = useSetUniversePinnedLocation(universeId!, { onError });

  const handleDisableClick = async () => {
    if (!universeId) {
      onError();
      return;
    }

    switch (testing) {
      case 'price':
        await setUniverseFixedPrice({ targetStatus: 'Disabling' });
        break;
      case 'location':
        await setUniversePinnedLocation({ targetStatus: 'Disabling' });
        break;
      default:
        onError();
        return;
    }

    onClose();
  };

  return (
    <Dialog fullWidth maxWidth='Medium' open={isOpen} onClose={onClose}>
      <DialogTemplate
        cancelText={translate('Action.Cancel')}
        confirmText={translate('Action.PriceCheckEnabledWarning')}
        content={translate('Description.PriceCheckEnabledWarning')}
        onCancel={onClose}
        onConfirm={handleDisableClick}
        title={translate('Heading.PriceCheckEnabledWarning')}
      />
    </Dialog>
  );
};

export default memo(PriceValidationActiveModal);
