// Renders searchable experience and UGC target selection with tab filtering, pagination, loading, and retry states.
import { useCallback, useMemo, useState, type ChangeEvent, type FunctionComponent } from 'react';
import { Button, Chip, TextInput } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { CircularProgress } from '@rbx/ui';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { RevShareTargetType, type ManagerAgreement } from '../interface/RevShareViewModel';
import RevShareBackNav from './nav/RevShareBackNav';
import RevShareLandingTable from './tables/RevShareLandingTable';

export type RevShareTargetTab = 'experiences' | 'ugc';

export type RevShareTargetPickerViewProps = {
  rows: readonly ManagerAgreement[];
  onRowClick: (row: ManagerAgreement) => void;
  onBack: () => void;
  activeTab: RevShareTargetTab;
  onTabChange: (tab: RevShareTargetTab) => void;
  isUgcLoading: boolean;
  ugcError: Error | null;
  onRetryUgc: () => void;
  hasNextUgcPage: boolean;
  isFetchingNextUgcPage: boolean;
  onLoadNextUgcPage: () => void;
};

const RevShareTargetPickerView: FunctionComponent<RevShareTargetPickerViewProps> = ({
  rows,
  onRowClick,
  onBack,
  activeTab,
  onTabChange,
  isUgcLoading,
  ugcError,
  onRetryUgc,
  hasNextUgcPage,
  isFetchingNextUgcPage,
  onLoadNextUgcPage,
}) => {
  const { tPendingTranslation } = useTranslationWrapper(useTranslation());
  const [query, setQuery] = useState('');
  const filteredRows = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    return rows.filter((row) => {
      const matchesType =
        activeTab === 'experiences'
          ? row.target.type === RevShareTargetType.Experience
          : row.target.type === RevShareTargetType.Ugc;
      return (
        matchesType &&
        (normalizedQuery === '' || row.targetName.toLocaleLowerCase().includes(normalizedQuery))
      );
    });
  }, [activeTab, query, rows]);
  const handleQueryChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setQuery(event.currentTarget.value);
  }, []);
  const handleExperiencesSelect = useCallback(
    (checked: boolean) => {
      if (checked) {
        onTabChange('experiences');
      }
    },
    [onTabChange],
  );
  const handleUgcSelect = useCallback(
    (checked: boolean) => {
      if (checked) {
        onTabChange('ugc');
      }
    },
    [onTabChange],
  );
  const searchLabel = tPendingTranslation(
    'Search experiences or UGC items',
    'Accessible label and placeholder for the revenue share target picker search.',
    translationKey('Label.SearchTargets', TranslationNamespace.RevenueShareAgreements),
  );
  const ugcErrorMessage = tPendingTranslation(
    'Unable to load UGC items. Please try again.',
    'Error message when the revenue share UGC target inventory fails to load.',
    translationKey('Error.UgcTargetsLoadFailed', TranslationNamespace.RevenueShareAgreements),
  );
  const retryLabel = tPendingTranslation(
    'Retry',
    'Button label to retry loading UGC items in the revenue share target picker.',
    translationKey('Action.RetryUgcTargets', TranslationNamespace.RevenueShareAgreements),
  );
  const loadMoreLabel = tPendingTranslation(
    'Load more',
    'Button label to load the next page of UGC items in the revenue share target picker.',
    translationKey('Action.LoadMoreUgcTargets', TranslationNamespace.RevenueShareAgreements),
  );
  const loadingLabel = tPendingTranslation(
    'Loading',
    'Button label while loading the next page of UGC items in the revenue share target picker.',
    translationKey('Label.LoadingUgcTargets', TranslationNamespace.RevenueShareAgreements),
  );

  return (
    <div className='flex flex-col gap-large width-full'>
      <div className='flex'>
        <RevShareBackNav onBack={onBack} focusOnMount />
      </div>
      <div className='flex flex-col gap-xsmall'>
        <h2 className='text-heading-medium content-emphasis margin-none'>
          {tPendingTranslation(
            'New agreement',
            'Heading for selecting a target for a new revenue share agreement.',
            translationKey('Heading.NewAgreement', TranslationNamespace.RevenueShareAgreements),
          )}
        </h2>
        <span className='text-body-medium content-muted'>
          {tPendingTranslation(
            'Select an experience or UGC item to set up revenue sharing.',
            'Description for selecting a revenue share agreement target.',
            translationKey(
              'Label.SelectAgreementTarget',
              TranslationNamespace.RevenueShareAgreements,
            ),
          )}
        </span>
      </div>
      <TextInput
        type='search'
        size='Medium'
        aria-label={searchLabel}
        placeholder={searchLabel}
        value={query}
        onChange={handleQueryChange}
      />
      <div className='flex gap-xsmall'>
        <Chip
          text={tPendingTranslation(
            'Experiences',
            'Filter chip label for experiences.',
            translationKey('Label.Experiences', TranslationNamespace.RevenueShareAgreements),
          )}
          size='Medium'
          isChecked={activeTab === 'experiences'}
          onCheckedChange={handleExperiencesSelect}
        />
        <Chip
          text={tPendingTranslation(
            'UGC Items',
            'Filter chip label for UGC items.',
            translationKey('Label.UgcItems', TranslationNamespace.RevenueShareAgreements),
          )}
          size='Medium'
          isChecked={activeTab === 'ugc'}
          onCheckedChange={handleUgcSelect}
        />
      </div>
      {activeTab === 'ugc' && isUgcLoading ? (
        <div className='flex items-center justify-center width-full'>
          <CircularProgress />
        </div>
      ) : activeTab === 'ugc' && ugcError !== null ? (
        <div className='flex flex-col items-center gap-small width-full'>
          <span className='text-body-medium content-muted'>{ugcErrorMessage}</span>
          <Button type='button' variant='Standard' size='Medium' onClick={onRetryUgc}>
            {retryLabel}
          </Button>
        </div>
      ) : (
        <>
          <RevShareLandingTable rows={filteredRows} mode='manager' onRowClick={onRowClick} />
          {activeTab === 'ugc' && hasNextUgcPage ? (
            <div className='flex justify-center width-full'>
              <Button
                type='button'
                variant='Standard'
                size='Medium'
                isDisabled={isFetchingNextUgcPage}
                onClick={onLoadNextUgcPage}>
                {isFetchingNextUgcPage ? loadingLabel : loadMoreLabel}
              </Button>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
};

export default RevShareTargetPickerView;
