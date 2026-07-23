import type { FC } from 'react';
import { useMemo } from 'react';
import { useTranslation } from '@rbx/intl';
import { useMomentsStatusFilter } from '../hooks/useMomentsStatusFilter';
import type { MomentCreationStatusFilterTab } from '../types/MomentCreation';
import { MomentCreationStatus } from '../types/MomentCreation';
import MomentsStatusFilterPills from './MomentsStatusFilterPills';

const MomentsSubmenu: FC = () => {
  const { translate } = useTranslation();
  const { statusTab, setStatusTab } = useMomentsStatusFilter();

  const statusTabLabels = useMemo(
    (): Record<MomentCreationStatusFilterTab, string> => ({
      [MomentCreationStatus.ACTIVE]: translate(
        'MomentsTable.Pills.Active' /* TranslationNamespace.Creations */,
      ),
      [MomentCreationStatus.DRAFT]: translate(
        'MomentsTable.Pills.Draft' /* TranslationNamespace.Creations */,
      ),
    }),
    [translate],
  );

  return (
    <div className='flex max-width-full relative max-large:padding-top-[24px]'>
      <MomentsStatusFilterPills
        groupLabel={translate('MomentsTable.Header.Status')}
        labels={statusTabLabels}
        selected={statusTab}
        onChange={setStatusTab}
      />
    </div>
  );
};

export default MomentsSubmenu;
