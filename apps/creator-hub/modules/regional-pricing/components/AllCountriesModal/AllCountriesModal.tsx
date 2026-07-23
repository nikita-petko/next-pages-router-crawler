import { useState } from 'react';
import { Icon } from '@rbx/foundation-ui';
import { useTranslation, withTranslation } from '@rbx/intl';
import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from '@rbx/ui';
import DebouncedTextField from '@modules/charts-generic/charts/DebouncedTextField';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import type { AllCountriesDisplayInfo } from '../../types';
import AllCountriesTable from './AllCountriesTable';

type Props = {
  isOpen: boolean;
  setOpen: (open: boolean) => void;
  loading?: boolean;
  allCountriesData: AllCountriesDisplayInfo[];
};

function AllCountriesModal({ isOpen, setOpen, loading, allCountriesData }: Props) {
  const { translate } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const filteredCountriesData = allCountriesData.map<AllCountriesDisplayInfo>((displayCol) => {
    return {
      displayHeader: displayCol.displayHeader,
      allCountriesDisplayInfo: displayCol.allCountriesDisplayInfo.filter(({ country }) =>
        country.toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    };
  });

  return (
    <Dialog fullWidth maxWidth='Medium' open={isOpen} onClose={() => setOpen(false)}>
      <DialogTitle className='padding-bottom-xxlarge'>
        {translate('Heading.AllCountriesModal')}
      </DialogTitle>
      {loading ? (
        <DialogContent className='flex items-center justify-center'>
          <CircularProgress />
        </DialogContent>
      ) : (
        <DialogContent>
          <DebouncedTextField
            id='all-countries-table-search'
            // Make label empty so it doesn't fly up the text field
            // Use aria label for accessibility instead
            label=''
            aria-label={translate('Label.Search')}
            placeholder={translate('Label.Search')}
            size='small'
            InputProps={{
              startAdornment: (
                <Icon
                  name='icon-filled-magnifying-glass'
                  size='Small'
                  className='margin-left-[14px]'
                />
              ),
              type: 'search',
            }}
            value={searchTerm}
            onDebouncedChange={setSearchTerm}
            debounceTime={100}
            fullWidth
          />
          <AllCountriesTable countriesData={filteredCountriesData} />
        </DialogContent>
      )}
      <DialogActions>
        <Button size='large' variant='contained' color='primary' onClick={() => setOpen(false)}>
          {translate('Action.Close')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default withTranslation(AllCountriesModal, [TranslationNamespace.RegionalPricing]);
