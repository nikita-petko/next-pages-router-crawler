import type { FunctionComponent } from 'react';
import { useCallback, useState } from 'react';
import { useTranslation } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import ConfirmationSheet from '@modules/miscellaneous/components/ConfirmationSheet/ConfirmationSheet';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import type { LeaderboardConfig } from '../../types';
import LeaderboardRow from './LeaderboardRow';
import {
  HEADER_CELL_CLASS,
  HEADER_INNER_CLASS,
  ROW_BORDER_STYLE,
  SHRINK_CELL_CLASS,
} from './tableStyles';

// Sheet data outlives `open=false` so the description doesn't flash empty during the close animation.
type ToggleSheet = {
  open: boolean;
  key: string;
  nextIsActive: boolean;
  leaderboardName: string;
};

type DeleteSheet = {
  open: boolean;
  key: string;
  leaderboardName: string;
};

type Props = {
  config: LeaderboardConfig;
  isUpdating?: boolean;
  onToggleActive: (key: string, nextIsActive: boolean) => void;
  onEdit: (key: string) => void;
  onDelete: (key: string) => void;
};

const LeaderboardConfigsView: FunctionComponent<Props> = ({
  config,
  isUpdating = false,
  onToggleActive,
  onEdit,
  onDelete,
}) => {
  const intl = useTranslation();
  const { translate } = useTranslationWrapper(intl);
  const [toggleSheet, setToggleSheet] = useState<ToggleSheet>({
    open: false,
    key: '',
    nextIsActive: false,
    leaderboardName: '',
  });
  const [deleteSheet, setDeleteSheet] = useState<DeleteSheet>({
    open: false,
    key: '',
    leaderboardName: '',
  });

  const colName = translate(translationKey('Heading.Name', TranslationNamespace.Leaderboards));
  const colUnit = translate(translationKey('Heading.Unit', TranslationNamespace.Leaderboards));
  const colActive = translate(
    translationKey('Label.ActiveLeaderboard', TranslationNamespace.Leaderboards),
  );
  const colDataStore = translate(
    translationKey('Heading.OrderedDataStore', TranslationNamespace.Leaderboards),
  );
  const colScope = translate(translationKey('Heading.Scope', TranslationNamespace.Leaderboards));
  const colKeyTemplate = translate(
    translationKey('Heading.ODSKeyTemplate', TranslationNamespace.Leaderboards),
  );
  const editLabel = translate(
    translationKey('Heading.EditLeaderboard', TranslationNamespace.Leaderboards),
  );
  const deleteLabel = translate(
    translationKey('Heading.DeleteLeaderboard', TranslationNamespace.Leaderboards),
  );
  const updateActiveTitle = translate(
    translationKey('Heading.UpdateActiveLeaderboard', TranslationNamespace.Leaderboards),
  );
  const updateActiveDescription = translate(
    translationKey(
      toggleSheet.nextIsActive
        ? 'Description.UpdateActiveLeaderboardConfirmation'
        : 'Description.UpdateToInactiveLeaderboardConfirmation',
      TranslationNamespace.Leaderboards,
    ),
    { leaderboardName: toggleSheet.leaderboardName },
  );
  const deleteDescription = translate(
    translationKey('Description.DeleteLeaderboardConfirmation', TranslationNamespace.Leaderboards),
    { leaderboardName: deleteSheet.leaderboardName },
  );
  const continueLabel = intl.translate('Action.Continue');
  const deleteActionLabel = intl.translate('Action.Delete');

  const activeKeys = new Set(config.activeLeaderboardKeys);
  const lastIndex = config.leaderboards.length - 1;

  const handleActiveToggleClick = useCallback(
    (key: string, nextIsActive: boolean, leaderboardName: string) => {
      setToggleSheet({ open: true, key, nextIsActive, leaderboardName });
    },
    [],
  );

  const handleDeleteClick = useCallback((key: string, leaderboardName: string) => {
    setDeleteSheet({ open: true, key, leaderboardName });
  }, []);

  const handleToggleSheetOpenChange = useCallback((open: boolean) => {
    setToggleSheet((prev) => ({ ...prev, open }));
  }, []);

  const handleDeleteSheetOpenChange = useCallback((open: boolean) => {
    setDeleteSheet((prev) => ({ ...prev, open }));
  }, []);

  return (
    <div className='flex flex-col gap-xxlarge padding-top-large'>
      <div className='stroke-standard stroke-default radius-medium clip'>
        <table className='width-full' style={{ borderCollapse: 'collapse', borderSpacing: 0 }}>
          <thead>
            <tr style={ROW_BORDER_STYLE}>
              <th className={`${HEADER_CELL_CLASS} max-width-0`}>
                <div className={HEADER_INNER_CLASS}>{colName}</div>
              </th>
              <th className={`${HEADER_CELL_CLASS} max-width-0`}>
                <div className={HEADER_INNER_CLASS}>{colUnit}</div>
              </th>
              <th className={`${HEADER_CELL_CLASS} ${SHRINK_CELL_CLASS}`}>
                <div className={HEADER_INNER_CLASS}>{colActive}</div>
              </th>
              <th className={`${HEADER_CELL_CLASS} max-width-0`}>
                <div className={HEADER_INNER_CLASS}>{colDataStore}</div>
              </th>
              <th className={`${HEADER_CELL_CLASS} max-width-0`}>
                <div className={HEADER_INNER_CLASS}>{colKeyTemplate}</div>
              </th>
              <th className={`${HEADER_CELL_CLASS} max-width-0`}>
                <div className={HEADER_INNER_CLASS}>{colScope}</div>
              </th>
              <th className={SHRINK_CELL_CLASS} aria-hidden='true' />
            </tr>
          </thead>
          <tbody>
            {config.leaderboards.map((item, index) => (
              <LeaderboardRow
                key={item.key}
                item={item}
                isActive={activeKeys.has(item.key)}
                isLast={index === lastIndex}
                isDisabled={isUpdating}
                editLabel={String(editLabel)}
                deleteLabel={String(deleteLabel)}
                toggleAriaLabel={String(updateActiveTitle)}
                onActiveToggleClick={handleActiveToggleClick}
                onEditClick={onEdit}
                onDeleteClick={handleDeleteClick}
              />
            ))}
          </tbody>
        </table>
      </div>
      <ConfirmationSheet
        open={toggleSheet.open}
        onOpenChange={handleToggleSheetOpenChange}
        title={String(updateActiveTitle)}
        description={updateActiveDescription}
        confirmLabel={continueLabel}
        onConfirm={() => onToggleActive(toggleSheet.key, toggleSheet.nextIsActive)}
      />
      <ConfirmationSheet
        open={deleteSheet.open}
        onOpenChange={handleDeleteSheetOpenChange}
        title={String(deleteLabel)}
        description={deleteDescription}
        confirmLabel={deleteActionLabel}
        confirmVariant='Alert'
        onConfirm={() => onDelete(deleteSheet.key)}
      />
    </div>
  );
};

export default LeaderboardConfigsView;
