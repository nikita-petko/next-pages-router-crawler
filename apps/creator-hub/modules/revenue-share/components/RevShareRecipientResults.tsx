// Presents matching user and group revenue share recipients in accessible, selectable result columns.
import { useCallback, useMemo, type FunctionComponent, type ReactNode } from 'react';
import { useTranslation } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import CreatorType from '@modules/miscellaneous/common/enums/Creator';
import ThumbnailWithNames from '@modules/miscellaneous/components/ThumbnailWithNames';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import {
  RevShareRecipientType,
  type RevShareRecipientSearchResult,
} from '../interface/RevShareViewModel';
import { asNumberTypedId } from '../utils/revShareUtils';

type RevShareRecipientResultsProps = {
  users: readonly RevShareRecipientSearchResult[];
  groups: readonly RevShareRecipientSearchResult[];
  onSelect: (recipient: RevShareRecipientSearchResult) => void;
  isLoading?: boolean;
  error?: string;
  id?: string;
};

const ColumnEmpty: FunctionComponent<{ label: string }> = ({ label }) => (
  <span className='text-label-small content-muted padding-x-small padding-y-small'>{label}</span>
);

const ResultRow: FunctionComponent<{
  item: RevShareRecipientSearchResult;
  onSelect: (recipient: RevShareRecipientSearchResult) => void;
}> = ({ item, onSelect }) => {
  const target = useMemo(() => {
    const id = asNumberTypedId(item.id);
    if (item.type === RevShareRecipientType.User) {
      return {
        id,
        displayName: item.name,
        ...(item.username ? { name: item.username } : {}),
      };
    }
    return { id, name: item.name };
  }, [item.id, item.name, item.type, item.username]);
  const handleSelect = useCallback(() => {
    onSelect(item);
  }, [item, onSelect]);

  return (
    <button
      type='button'
      onClick={handleSelect}
      className='flex items-center width-full padding-x-small padding-y-xsmall radius-small cursor-pointer hover:bg-surface-300 stroke-none [background:transparent] [text-align:left]'>
      <ThumbnailWithNames
        target={target}
        targetType={item.type === RevShareRecipientType.User ? CreatorType.User : CreatorType.Group}
        variant='compact'
        disableLink
      />
    </button>
  );
};

const ResultColumn: FunctionComponent<{ heading: string; children: ReactNode }> = ({
  heading,
  children,
}) => (
  <div className='flex flex-col gap-xsmall min-width-0 [flex:1_1_0]'>
    <span className='text-label-small content-muted padding-x-small'>{heading}</span>
    <div className='flex flex-col'>{children}</div>
  </div>
);

const RevShareRecipientResults: FunctionComponent<RevShareRecipientResultsProps> = ({
  users,
  groups,
  onSelect,
  isLoading = false,
  error,
  id,
}) => {
  const { tPendingTranslation } = useTranslationWrapper(useTranslation());
  const peopleHeading = tPendingTranslation(
    'People ({count})',
    'Heading for user results in recipient search; {count} is the number of results.',
    translationKey('Label.PeopleCount', TranslationNamespace.RevenueShareAgreements),
    { count: String(users.length) },
  );
  const groupsHeading = tPendingTranslation(
    'Groups ({count})',
    'Heading for group results in recipient search; {count} is the number of results.',
    translationKey('Label.GroupsCount', TranslationNamespace.RevenueShareAgreements),
    { count: String(groups.length) },
  );
  const noPeople = tPendingTranslation(
    'No people found',
    'Empty message for user recipient search results.',
    translationKey('Label.NoPeopleFound', TranslationNamespace.RevenueShareAgreements),
  );
  const noGroups = tPendingTranslation(
    'No groups found',
    'Empty message for group recipient search results.',
    translationKey('Label.NoGroupsFound', TranslationNamespace.RevenueShareAgreements),
  );

  return (
    <div
      id={id}
      aria-live='polite'
      aria-busy={isLoading}
      className='bg-surface-200 radius-medium clip'>
      <div className='[max-height:320px] [overflow-y:auto] padding-x-xsmall padding-bottom-xsmall padding-top-small'>
        {isLoading ? (
          <span className='text-body-medium content-muted padding-small'>
            {tPendingTranslation(
              'Searching…',
              'Loading message while recipient search results are fetched.',
              translationKey('Label.Searching', TranslationNamespace.RevenueShareAgreements),
            )}
          </span>
        ) : error ? (
          <span role='alert' className='text-body-medium content-system-alert padding-small'>
            {error}
          </span>
        ) : (
          <div className='flex gap-small'>
            <ResultColumn heading={peopleHeading}>
              {users.length === 0 ? (
                <ColumnEmpty label={noPeople} />
              ) : (
                users.map((user) => <ResultRow key={user.id} item={user} onSelect={onSelect} />)
              )}
            </ResultColumn>
            <ResultColumn heading={groupsHeading}>
              {groups.length === 0 ? (
                <ColumnEmpty label={noGroups} />
              ) : (
                groups.map((group) => <ResultRow key={group.id} item={group} onSelect={onSelect} />)
              )}
            </ResultColumn>
          </div>
        )}
      </div>
    </div>
  );
};

export default RevShareRecipientResults;
