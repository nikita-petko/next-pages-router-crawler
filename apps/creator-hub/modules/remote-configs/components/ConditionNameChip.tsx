import type { FC } from 'react';
import { Chip } from '@rbx/foundation-ui';
import { ColumnType } from '@modules/charts-generic/tables/types/GenericColumnType';
import type { CellDataType } from '@modules/charts-generic/tables/types/GenericTableType';
import { RPN_TOKEN_CHIP_TEXT_CLASSNAME } from './RpnTokenChipSegmentRow';

type ConditionNameChipProps = {
  label: string;
  align?: 'left' | 'right';
};

const ConditionNameChip: FC<ConditionNameChipProps> = ({ label, align = 'right' }) => {
  return (
    <div
      data-testid='condition-name-chip'
      className={`flex width-full ${align === 'right' ? 'justify-end' : 'justify-start'}`}>
      <Chip
        text={label}
        size='Small'
        variant='Standard'
        isChecked={false}
        className={`${RPN_TOKEN_CHIP_TEXT_CLASSNAME} pointer-events-none shrink-0 min-width-0 max-width-full`}
      />
    </div>
  );
};

export const asConditionNameChipCellData = <TActionOn = string,>(
  label: string,
): CellDataType<string, TActionOn> => ({
  type: ColumnType.Other,
  value: <ConditionNameChip label={label} />,
});

export default ConditionNameChip;
