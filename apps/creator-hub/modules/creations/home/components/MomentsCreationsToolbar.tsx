import type { FC } from 'react';
import { useTranslation } from '@rbx/intl';
import { Button } from '@rbx/ui';
import { openCreateMomentsDialog } from './CreateMomentsDialog';

const handleCreateClick = () => openCreateMomentsDialog();

const MomentsCreationsToolbar: FC = () => {
  const { translate } = useTranslation();

  return (
    <div className='flex max-width-full relative max-large:padding-top-[24px]'>
      <Button
        color='primaryBrand'
        size='large'
        type='button'
        variant='contained'
        onClick={handleCreateClick}>
        {translate('Action.CreateMoments' /* TranslationNamespace.Creations */)}
      </Button>
    </div>
  );
};

export default MomentsCreationsToolbar;
