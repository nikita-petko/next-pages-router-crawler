import { IconButton, SearchInput } from '@rbx/foundation-ui';
import { useState } from 'react';

import { TranslationNamespace } from '@constants/localization';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';
import { NewFlowStoreType, useNewFlowStore } from '@stores/newFlowStoreProvider';

const SearchBox = () => {
  const { translate } = useNamespacedTranslation(TranslationNamespace.Report);
  const [tentativeSearchTerm, setTentativeSearchTerm] = useState<string>('');

  const campaignsIsLoading = useNewFlowStore(
    (state: NewFlowStoreType) => state.campaignsState.isLoading,
  );
  const filterRequestIsLoading = useNewFlowStore(
    (state: NewFlowStoreType) => state.filteredIdsState.isLoading,
  );
  const campaignNameSearch = useNewFlowStore(
    (state: NewFlowStoreType) => state.campaignNameFilterState.campaignNameSearch,
  );
  const handleCampaignNameSearchChange = useNewFlowStore(
    (state: NewFlowStoreType) => state.handleCampaignNameSearchChange,
  );

  const showClear = Boolean(campaignNameSearch) && tentativeSearchTerm === campaignNameSearch;

  return (
    <form
      className='width-[240px]'
      onSubmit={(event) => {
        event.preventDefault();
        handleCampaignNameSearchChange(tentativeSearchTerm);
      }}>
      <SearchInput
        aria-label={translate('Label.SearchCampaign')}
        id='campaign-name-search'
        isDisabled={campaignsIsLoading || filterRequestIsLoading}
        onChange={(e) => setTentativeSearchTerm(e.target.value)}
        placeholder={translate('Label.SearchCampaign')}
        size='Medium'
        trailingIconNode={
          showClear ? (
            <IconButton
              ariaLabel={translate('Description.ClearSearchInput')}
              data-testid='clearSearchIcon'
              icon='icon-regular-x'
              onClick={() => {
                setTentativeSearchTerm('');
                handleCampaignNameSearchChange('');
              }}
              size='XSmall'
              variant='Utility'
            />
          ) : undefined
        }
        value={tentativeSearchTerm}
      />
    </form>
  );
};

export default SearchBox;
