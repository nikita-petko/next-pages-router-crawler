import type { ReactNode } from 'react';
import React from 'react';
import { ProgressCircle } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { Pagination } from '@rbx/ui';

export type PaginatedMemberListProps<TItem> = {
  items: TItem[];
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  emptyMessage?: string;
  hideResults?: boolean;
  renderItem: (item: TItem) => ReactNode;
  page: number;
  onPreviousPage: () => void;
  onNextPage: () => void;
  isPreviousDisabled: boolean;
  isNextDisabled: boolean;
};

/**
 * Renders a page of member rows with previous/next pagination controls.
 */
const PaginatedMemberList = <TItem,>({
  items,
  isLoading,
  isFetching,
  isError,
  emptyMessage,
  hideResults = false,
  renderItem,
  page,
  onPreviousPage,
  onNextPage,
  isPreviousDisabled,
  isNextDisabled,
}: PaginatedMemberListProps<TItem>): React.JSX.Element => {
  const { translate } = useTranslation();

  const isListLoading = isLoading || (isFetching && items.length === 0);

  if (isListLoading) {
    return (
      <div className='flex justify-center padding-large width-full'>
        <ProgressCircle
          variant='Indeterminate'
          size='Medium'
          ariaLabel={translate('Label.Loading')}
        />
      </div>
    );
  }

  if (isError) {
    return (
      <div className='padding-large text-align-x-center text-body-medium content-muted'>
        {translate('Error.GroupMembers')}
      </div>
    );
  }

  const hasItems = !hideResults && items.length > 0;

  if (!hasItems) {
    return (
      <div className='padding-large text-align-x-center text-body-medium content-muted'>
        {emptyMessage ?? translate('Label.NoMembers')}
      </div>
    );
  }

  return (
    <div className='flex flex-col gap-medium width-full'>
      {items.map(renderItem)}
      <div className='flex justify-center padding-medium'>
        <Pagination
          nextProps={{
            disabled: isNextDisabled,
            onClick: onNextPage,
          }}
          page={page + 1}
          previousProps={{
            disabled: isPreviousDisabled,
            onClick: onPreviousPage,
          }}
          shape='rounded'
          size='medium'
          variant='reduced'
        />
      </div>
    </div>
  );
};

export default PaginatedMemberList;
