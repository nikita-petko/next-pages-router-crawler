import type { FC } from 'react';
import { Button } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { openCreateMomentsDialog } from './CreateMomentsDialog';

const handleCreateClick = () => openCreateMomentsDialog();

const MomentsCreationsToolbar: FC = () => {
  const { translate } = useTranslation();

  return (
    <div className='flex max-width-full relative max-large:padding-top-[24px]'>
      <Button variant='Emphasis' size='Large' type='button' onClick={handleCreateClick}>
        {translate('Action.CreateMoments' /* TranslationNamespace.Creations */)}
      </Button>
    </div>
  );
};

export default MomentsCreationsToolbar;
