import React from 'react';
import { useTranslation } from '@rbx/intl';
import { Button } from '@rbx/ui';

type TButtonVariants = 'Initiate' | 'Cancel';
type TOwnershipTransferButtonProps = {
  variant: TButtonVariants;
  disabled?: boolean;
  onClick: () => void;
};

const variantTranslationStrings: Record<TButtonVariants, string> = {
  Initiate: 'Action.InitiateOwnershipTransfer',
  Cancel: 'Action.CancelOwnershipTransfer',
};
const OwnershipTransferButton = ({ variant, onClick, disabled }: TOwnershipTransferButtonProps) => {
  const text = variantTranslationStrings[variant];
  const { translate } = useTranslation();

  return (
    <Button
      color='secondary'
      variant='contained'
      size='small'
      disabled={disabled}
      onClick={onClick}>
      {translate(text)}
    </Button>
  );
};

export default OwnershipTransferButton;
