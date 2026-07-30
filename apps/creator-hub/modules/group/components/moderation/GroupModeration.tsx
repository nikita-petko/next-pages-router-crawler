import React from 'react';
import { useTranslation } from '@rbx/intl';
import BlockedFeaturesTable from './BlockedFeaturesTable';

const GroupModeration = () => {
  const { translate } = useTranslation();

  return (
    <div className='flex flex-col gap-xxlarge'>
      <div className='flex flex-col gap-y-small'>
        <span className='text-heading-small content-emphasis'>
          {translate('Heading.BlockedFeatures')}
        </span>
        <span className='text-body-medium content-secondary'>
          {translate('Description.BlockedFeatures')}
        </span>
      </div>
      <BlockedFeaturesTable />
    </div>
  );
};

export default GroupModeration;
