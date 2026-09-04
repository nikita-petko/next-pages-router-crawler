import { memo, useCallback, type ChangeEvent } from 'react';
import { SearchInput } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';

type Props = {
  searchQuery: string;
  onSearchChange: (value: string) => void;
};

function ExternalEligibilityReportActionBar({ searchQuery, onSearchChange }: Props) {
  const { translate } = useTranslation();
  const searchLabel = translate('Label.Search');
  const handleSearchChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => onSearchChange(event.target.value),
    [onSearchChange],
  );

  return (
    <div className='margin-bottom-medium flex flex-col items-stretch gap-medium medium:flex-row medium:items-center'>
      <div className='width-full medium:width-[305px]'>
        <SearchInput
          className='width-full'
          aria-label={searchLabel}
          placeholder={searchLabel}
          size='Medium'
          value={searchQuery}
          onChange={handleSearchChange}
        />
      </div>
    </div>
  );
}

export default memo(ExternalEligibilityReportActionBar);
