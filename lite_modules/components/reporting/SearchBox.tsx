import { IconButton } from '@rbx/foundation-ui';
import { TextField } from '@rbx/ui';
import { useState } from 'react';

import useSearchBoxStyles from '@components/reporting/SearchBox.styles';
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

  const {
    classes: { closeButton, searchBox },
  } = useSearchBoxStyles();

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        handleCampaignNameSearchChange(tentativeSearchTerm);
      }}>
      <TextField
        className={searchBox}
        disabled={campaignsIsLoading || filterRequestIsLoading}
        id='campaign-name-search'
        InputProps={{
          endAdornment: campaignNameSearch && tentativeSearchTerm === campaignNameSearch && (
            <IconButton
              ariaLabel={translate('Description.ClearSearchInput')}
              className={closeButton}
              data-testid='clearSearchIcon'
              icon='icon-regular-x'
              onClick={() => {
                setTentativeSearchTerm('');
                handleCampaignNameSearchChange('');
              }}
              size='Small'
              variant='Utility'
            />
          ),
        }}
        label={translate('Label.SearchCampaign')}
        onChange={(e) => setTentativeSearchTerm(e.target.value)}
        size='small'
        value={tentativeSearchTerm}
        variant='outlined'
      />
    </form>
  );
};

export default SearchBox;
