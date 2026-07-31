import type { FunctionComponent, ReactNode } from 'react';

export type DevelopmentItemsToolbarProps = {
  assetTypeControl: ReactNode;
  filterControl?: ReactNode;
  searchControl: ReactNode;
  viewControl: ReactNode;
};

const DevelopmentItemsToolbar: FunctionComponent<DevelopmentItemsToolbarProps> = ({
  assetTypeControl,
  filterControl,
  searchControl,
  viewControl,
}) => (
  <div className='flex flex-col gap-large width-full min-width-0'>
    <div className='flex items-center gap-medium width-full min-width-0'>
      <div className='grow-1 min-width-0'>{searchControl}</div>
      {filterControl != null && <div className='shrink-0'>{filterControl}</div>}
    </div>
    <div className='flex items-center gap-large wrap width-full min-width-0'>
      {assetTypeControl}
      <div className='shrink-0 margin-left-auto'>{viewControl}</div>
    </div>
  </div>
);

export default DevelopmentItemsToolbar;
