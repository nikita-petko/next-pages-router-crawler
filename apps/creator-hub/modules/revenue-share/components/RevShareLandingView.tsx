import { useCallback, useMemo, useState, type FunctionComponent } from 'react';
import { Button, Chip, Tabs, TabsList, TabsTrigger } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import {
  RevShareTargetType,
  type ManagerAgreement,
  type RecipientAgreement,
  type RevShareTarget,
} from '../interface/RevShareViewModel';
import RevShareLandingTable from './tables/RevShareLandingTable';

export type RevShareLandingViewProps = {
  managerRows: ManagerAgreement[];
  recipientRows: RecipientAgreement[];
  onManagerRowClick?: (row: ManagerAgreement) => void;
  onRecipientRowClick?: (row: RecipientAgreement) => void;
  onNewAgreement?: () => void;
  emptyMessage?: string;
  isUserView?: boolean;
  focusTarget?: RevShareTarget | null;
};

type TopTab = 'managed' | 'recipient';
type SubTab = 'experiences' | 'ugc';

const TOP_TABS: TopTab[] = ['managed', 'recipient'];

const isTopTab = (value: string): value is TopTab => TOP_TABS.some((tab) => tab === value);

const RevShareLandingView: FunctionComponent<RevShareLandingViewProps> = ({
  managerRows,
  recipientRows,
  onManagerRowClick,
  onRecipientRowClick,
  onNewAgreement,
  emptyMessage,
  isUserView = false,
  focusTarget,
}) => {
  const { tPendingTranslation } = useTranslationWrapper(useTranslation());
  const [topTab, setTopTab] = useState<TopTab>(isUserView ? 'recipient' : 'managed');
  const [subTab, setSubTab] = useState<SubTab>(
    focusTarget?.type === RevShareTargetType.Ugc ? 'ugc' : 'experiences',
  );

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
    () => managerRows.filter(isSelectedTargetType),
    [managerRows, isSelectedTargetType],
  );
  const filteredRecipientRows = useMemo(
    () => recipientRows.filter(isSelectedTargetType),
    [recipientRows, isSelectedTargetType],
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

  const handleTopTabChange = useCallback((value: string) => {
    if (isTopTab(value)) {
      setTopTab(value);
    }
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

  return (
    <div className='flex flex-col gap-large width-full'>
      {/* Title row: heading + "New agreement" button */}
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
        {!isUserView && topTab === 'managed' && onNewAgreement && (
          <Button variant='Emphasis' size='Medium' onClick={onNewAgreement}>
            {tPendingTranslation(
              'New agreement',
              'Button label to start creating a new revenue share agreement.',
              translationKey('Label.NewAgreement', TranslationNamespace.RevenueShareAgreements),
            )}
          </Button>
        )}
      </div>

      {/* Top-level tabs: Managed / Recipient (hidden in user view) */}
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

      {/* Sub-pills: Experiences / UGC Items */}
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

      {/* Table */}
      {topTab === 'managed' ? (
        <RevShareLandingTable
          rows={filteredManagerRows}
          mode='manager'
          onRowClick={onManagerRowClick}
          emptyMessage={emptyMessage}
          focusTarget={focusTarget}
        />
      ) : (
        <RevShareLandingTable
          rows={filteredRecipientRows}
          mode='recipient'
          onRowClick={onRecipientRowClick}
          emptyMessage={emptyMessage}
        />
      )}
    </div>
  );
};

export default RevShareLandingView;
