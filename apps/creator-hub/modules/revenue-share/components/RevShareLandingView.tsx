// Presents the revenue-share landing page with tabs, filters, agreement rows, and target action routing.
import { useCallback, useMemo, useState, type ChangeEvent, type FunctionComponent } from 'react';
import { Button, Chip, Tabs, TabsList, TabsTrigger, TextInput } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useRevShareClientTablePagination } from '../hooks/useRevShareClientTablePagination';
import {
  RevShareTargetType,
  type ManagerAgreement,
  type RecipientAgreement,
  type RevShareTarget,
} from '../interface/RevShareViewModel';
import {
  filterLandingManagerAgreements,
  filterLandingRecipientAgreements,
} from '../utils/revShareModel';
import type { RevSharePerspective } from '../utils/revShareRouteState';
import RevShareLandingTable from './tables/RevShareLandingTable';

type RevShareLandingViewBaseProps = {
  managerRows: ManagerAgreement[];
  recipientRows: RecipientAgreement[];
  onManagerRowClick?: (row: ManagerAgreement) => void;
  onRecipientRowClick?: (row: RecipientAgreement) => void;
  onNewAgreement?: () => void;
  emptyMessage?: string;
  isUserView?: boolean;
  focusTarget?: RevShareTarget | null;
};

export type RevShareLandingViewProps = RevShareLandingViewBaseProps &
  (
    | { perspective?: undefined; onPerspectiveChange?: undefined }
    | {
        perspective: RevSharePerspective;
        onPerspectiveChange: (perspective: RevSharePerspective) => void;
      }
  );

type TopTab = RevSharePerspective;
type SubTab = 'experiences' | 'ugc';

const TOP_TABS: TopTab[] = ['managed', 'recipient'];

const isTopTab = (value: string): value is TopTab => TOP_TABS.some((tab) => tab === value);

const matchesTargetNameQuery = (targetName: string, query: string) => {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  return normalizedQuery === '' || targetName.toLocaleLowerCase().includes(normalizedQuery);
};

const RevShareLandingView: FunctionComponent<RevShareLandingViewProps> = ({
  managerRows,
  recipientRows,
  onManagerRowClick,
  onRecipientRowClick,
  onNewAgreement,
  emptyMessage,
  isUserView = false,
  focusTarget,
  perspective,
  onPerspectiveChange,
}) => {
  const { tPendingTranslation } = useTranslationWrapper(useTranslation());
  const [internalTopTab, setInternalTopTab] = useState<TopTab>(
    isUserView ? 'recipient' : 'managed',
  );
  const topTab = isUserView ? 'recipient' : (perspective ?? internalTopTab);
  const focusTargetKey = focusTarget ? `${focusTarget.type}:${focusTarget.id}` : null;
  const [previousFocusTargetKey, setPreviousFocusTargetKey] = useState(focusTargetKey);
  const [subTab, setSubTab] = useState<SubTab>(
    focusTarget?.type === RevShareTargetType.Ugc ? 'ugc' : 'experiences',
  );
  const [query, setQuery] = useState('');

  if (focusTarget && focusTargetKey !== previousFocusTargetKey) {
    setPreviousFocusTargetKey(focusTargetKey);
    setSubTab(focusTarget.type === RevShareTargetType.Ugc ? 'ugc' : 'experiences');
  }

  const isSelectedTargetType = useCallback(
    (agreement: ManagerAgreement | RecipientAgreement) => {
      if (subTab === 'experiences') {
        return agreement.target.type === RevShareTargetType.Experience;
      }
      return agreement.target.type !== RevShareTargetType.Experience;
    },
    [subTab],
  );
  const filteredManagerRows = useMemo(
    () =>
      filterLandingManagerAgreements(managerRows)
        .filter(isSelectedTargetType)
        .filter((row) => matchesTargetNameQuery(row.targetName, query)),
    [managerRows, isSelectedTargetType, query],
  );
  const filteredRecipientRows = useMemo(
    () =>
      filterLandingRecipientAgreements(recipientRows)
        .filter(isSelectedTargetType)
        .filter((row) => matchesTargetNameQuery(row.targetName, query)),
    [recipientRows, isSelectedTargetType, query],
  );

  const activeFilteredCount =
    topTab === 'managed' ? filteredManagerRows.length : filteredRecipientRows.length;
  const paginationResetKey = `${topTab}:${subTab}:${query.trim().toLocaleLowerCase()}`;
  const { page, rowsPerPage, onPageChange, onRowsPerPageChange } = useRevShareClientTablePagination(
    {
      count: activeFilteredCount,
      resetKey: paginationResetKey,
    },
  );
  const pagination = useMemo(
    () => ({
      page,
      rowsPerPage,
      totalRows: activeFilteredCount,
      onPageChange,
      onRowsPerPageChange,
    }),
    [page, rowsPerPage, activeFilteredCount, onPageChange, onRowsPerPageChange],
  );

  const recipientSubtitle = isUserView
    ? tPendingTranslation(
        'Revenue splits you receive a share of. Splits are paid out daily.',
        'Subtitle for recipient tab in individual user view; describes agreements where the user receives a share.',
        translationKey('Label.RecipientUserSubtitle', TranslationNamespace.RevenueShareAgreements),
      )
    : tPendingTranslation(
        'Revenue splits your group receives a share of. Splits are paid out daily.',
        'Subtitle for recipient tab in group view; describes agreements where the group receives a share.',
        translationKey('Label.RecipientGroupSubtitle', TranslationNamespace.RevenueShareAgreements),
      );
  const subtitle =
    !isUserView && topTab === 'managed'
      ? tPendingTranslation(
          'Royalty splits for the experiences and items your group owns. Splits are paid out daily.',
          'Subtitle for managed tab; describes royalty splits for group-owned experiences and items.',
          translationKey('Label.ManagedSubtitle', TranslationNamespace.RevenueShareAgreements),
        )
      : recipientSubtitle;

  const handleExperiencesSelect = useCallback((checked: boolean) => {
    if (checked) {
      setSubTab('experiences');
    }
  }, []);

  const handleUgcSelect = useCallback((checked: boolean) => {
    if (checked) {
      setSubTab('ugc');
    }
  }, []);

  const handleTopTabChange = useCallback(
    (value: string) => {
      if (!isTopTab(value)) {
        return;
      }
      if (onPerspectiveChange) {
        onPerspectiveChange(value);
        return;
      }
      setInternalTopTab(value);
    },
    [onPerspectiveChange],
  );

  const handleQueryChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setQuery(event.currentTarget.value);
  }, []);

  const getTopTabLabel = (tab: TopTab): string => {
    if (tab === 'managed') {
      return tPendingTranslation(
        'Managed',
        'Tab label for revenue share agreements managed by the current group.',
        translationKey('Label.Managed', TranslationNamespace.RevenueShareAgreements),
      );
    }
    return tPendingTranslation(
      'Recipient',
      'Tab label for revenue share agreements where the current group is a recipient.',
      translationKey('Label.Recipient', TranslationNamespace.RevenueShareAgreements),
    );
  };

  const newAgreementLabel = tPendingTranslation(
    'New agreement',
    'Button label to start creating a new revenue share agreement.',
    translationKey('Label.NewAgreement', TranslationNamespace.RevenueShareAgreements),
  );
  const searchLabel = tPendingTranslation(
    'Search experiences or UGC items',
    'Accessible label and placeholder for the revenue share target picker search.',
    translationKey('Label.SearchTargets', TranslationNamespace.RevenueShareAgreements),
  );
  const newAgreementAction = onNewAgreement ? (
    <Button variant='Emphasis' size='Medium' onClick={onNewAgreement}>
      {newAgreementLabel}
    </Button>
  ) : null;

  return (
    <div className='flex flex-col gap-large width-full'>
      <div className='flex items-start justify-between'>
        <div className='flex flex-col gap-xsmall'>
          <h2 className='text-heading-medium content-emphasis margin-none'>
            {tPendingTranslation(
              'Current revenue share agreements',
              'Page heading for the revenue share agreements landing view.',
              translationKey(
                'Heading.CurrentAgreements',
                TranslationNamespace.RevenueShareAgreements,
              ),
            )}
          </h2>
          <span className='text-body-medium content-muted'>{subtitle}</span>
        </div>
        {!isUserView && topTab === 'managed' && newAgreementAction}
      </div>

      {!isUserView && (
        <div className='width-full [box-shadow:inset_0_calc(-1*var(--stroke-thick))_0_var(--color-stroke-muted)]'>
          <Tabs
            value={topTab}
            onValueChange={handleTopTabChange}
            variant='Inlined'
            fitBehavior='Fit'
            size='Medium'
            className='width-full'>
            <TabsList>
              {TOP_TABS.map((tab) => (
                <TabsTrigger key={tab} value={tab}>
                  {getTopTabLabel(tab)}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      )}

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
          isChecked={subTab === 'experiences'}
          onCheckedChange={handleExperiencesSelect}
        />
        <Chip
          text={tPendingTranslation(
            'UGC Items',
            'Filter chip label for UGC items.',
            translationKey('Label.UgcItems', TranslationNamespace.RevenueShareAgreements),
          )}
          size='Medium'
          isChecked={subTab === 'ugc'}
          onCheckedChange={handleUgcSelect}
        />
      </div>

      {topTab === 'managed' ? (
        <RevShareLandingTable
          rows={filteredManagerRows}
          mode='manager'
          onRowClick={onManagerRowClick}
          emptyMessage={emptyMessage}
          focusTarget={focusTarget}
          pagination={pagination}
        />
      ) : (
        <RevShareLandingTable
          rows={filteredRecipientRows}
          mode='recipient'
          onRowClick={onRecipientRowClick}
          emptyMessage={emptyMessage}
          focusTarget={focusTarget}
          pagination={pagination}
        />
      )}
    </div>
  );
};

export default RevShareLandingView;
