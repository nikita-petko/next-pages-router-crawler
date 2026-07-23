import type { FC } from 'react';
import { useTranslation } from '@rbx/intl';
import { Chip } from '@rbx/ui';

/**
 * Chip to show on the Videos tab in the navigation sidebar saying "New".
 */
const VideosNewChip: FC = () => {
  const { translate } = useTranslation();

  return (
    <Chip
      label={translate('Label.New')}
      color='primaryBrand'
      variant='filled'
      component='span'
      size='small'
    />
  );
};

export default VideosNewChip;
