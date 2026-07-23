import React from 'react';
import { useTranslation } from '@rbx/intl';
import { Typography } from '@rbx/ui';
import { PUNISHMENT_TYPE } from '../../../../utils/constants';

type TDeleteDescriptionProps = {
  punishmentTypeDescription?: string;
};

/**
 * Delete description. Shown to deleted users
 */
const DeleteDescriptionPageItem: React.FC<TDeleteDescriptionProps> = ({
  punishmentTypeDescription,
}) => {
  const { translate } = useTranslation();

  if (punishmentTypeDescription !== PUNISHMENT_TYPE.Delete) {
    return null;
  }

  return (
    <Typography variant='body2' data-testid='delete-description'>
      {translate('Description.Delete')}
    </Typography>
  );
};

export default DeleteDescriptionPageItem;
