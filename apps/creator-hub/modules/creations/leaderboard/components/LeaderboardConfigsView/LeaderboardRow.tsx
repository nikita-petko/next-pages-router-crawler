import { memo } from 'react';
import { IconButton, Toggle } from '@rbx/foundation-ui';
import type { LeaderboardConfigItem } from '../../types';
import { CELL_CLASS, ROW_BORDER_CLASS, SHRINK_CELL_CLASS, TEXT_CELL_CLASS } from './tableStyles';

type Props = {
  item: LeaderboardConfigItem;
  isActive: boolean;
  isLast: boolean;
  isDisabled: boolean;
  editLabel: string;
  deleteLabel: string;
  toggleAriaLabel: string;
  onActiveToggleClick: (key: string, nextIsActive: boolean, leaderboardName: string) => void;
  onEditClick: (key: string) => void;
  onDeleteClick: (key: string, leaderboardName: string) => void;
};

const LeaderboardRow = ({
  item,
  isActive,
  isLast,
  isDisabled,
  editLabel,
  deleteLabel,
  toggleAriaLabel,
  onActiveToggleClick,
  onEditClick,
  onDeleteClick,
}: Props) => {
  const keyTemplate = item.config.ordered_data_store.key_mapping_template;

  return (
    <tr className={`group transition-colors hover:bg-shift-200 ${isLast ? '' : ROW_BORDER_CLASS}`}>
      <td className={`${CELL_CLASS} ${TEXT_CELL_CLASS}`}>{item.config.leaderboard_name}</td>
      <td className={`${CELL_CLASS} ${TEXT_CELL_CLASS}`}>{item.config.unit}</td>
      <td className={`${CELL_CLASS} ${SHRINK_CELL_CLASS}`}>
        <Toggle
          aria-label={`${toggleAriaLabel}: ${item.config.leaderboard_name}`}
          size='Small'
          placement='Start'
          isChecked={isActive}
          isDisabled={isDisabled}
          onCheckedChange={(nextIsActive) =>
            onActiveToggleClick(item.key, nextIsActive, item.config.leaderboard_name)
          }
        />
      </td>
      <td className={`${CELL_CLASS} ${TEXT_CELL_CLASS}`}>{item.config.ordered_data_store.name}</td>
      <td className={`${CELL_CLASS} ${TEXT_CELL_CLASS} ${keyTemplate ? '' : 'content-muted'}`}>
        {keyTemplate ?? '—'}
      </td>
      <td className={`${CELL_CLASS} ${TEXT_CELL_CLASS}`}>{item.config.scope}</td>
      <td className={`${CELL_CLASS} ${SHRINK_CELL_CLASS}`}>
        <div className='flex items-center justify-end gap-xsmall opacity-[0] group-hover:opacity-[1] transition-opacity'>
          <IconButton
            size='Small'
            variant='Utility'
            icon='icon-regular-pencil'
            ariaLabel={editLabel}
            onClick={() => onEditClick(item.key)}
            className='!opacity-[1]'
          />
          <IconButton
            size='Small'
            variant='Utility'
            icon='icon-regular-trash-can'
            ariaLabel={deleteLabel}
            isDisabled={isDisabled}
            onClick={() => onDeleteClick(item.key, item.config.leaderboard_name)}
            className='!opacity-[1]'
          />
        </div>
      </td>
    </tr>
  );
};

export default memo(LeaderboardRow);
