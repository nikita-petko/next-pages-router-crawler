import React from 'react';
import { useTranslation } from '@rbx/intl';
import { Typography } from '@rbx/ui';

/**
 * A cell that displays a error message.
 * Useful in cases where the table row is only partially loaded.
 */
const CellError = () => {
  const { translate } = useTranslation();
  return (
    <Typography color='error' variant='body2'>
      {translate('Error.LoadingData')}
    </Typography>
  );
};

export default CellError;
