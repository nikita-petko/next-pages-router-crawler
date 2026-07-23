import { FC, useCallback, useMemo } from 'react';
import { TRAQIV2BreakdownDimension } from '@modules/clients/analytics';
import type { FormattedText } from '@modules/analytics-translations';
import { Dropdown, Icon, Menu, MenuItem, MenuSection } from '@rbx/foundation-ui';

const NONE_BREAKDOWN_KEY = '$__NONE__$';

type ExploreModeBreakdownControlProps = {
  label: FormattedText;
  placeholder: FormattedText;
  breakdown: readonly TRAQIV2BreakdownDimension[];
  breakdownDimensions: readonly TRAQIV2BreakdownDimension[];
  noBreakdownLabel: FormattedText;
  onBreakdownChange: (nextBreakdown: TRAQIV2BreakdownDimension[]) => void;
  getBreakdownLabel: (dimension: TRAQIV2BreakdownDimension) => FormattedText;
};

const ExploreModeBreakdownControl: FC<ExploreModeBreakdownControlProps> = ({
  label,
  placeholder,
  breakdown,
  breakdownDimensions,
  noBreakdownLabel,
  onBreakdownChange,
  getBreakdownLabel,
}) => {
  const onValueChange = useCallback(
    (value: string) => {
      if (value === NONE_BREAKDOWN_KEY) {
        onBreakdownChange([]);
        return;
      }

      const matched = breakdownDimensions.find((dimension) => dimension === value);
      if (matched) {
        onBreakdownChange([matched]);
      }
    },
    [breakdownDimensions, onBreakdownChange],
  );

  const breakdownMenuItems = useMemo(() => {
    return [
      <MenuItem
        key={NONE_BREAKDOWN_KEY}
        value={NONE_BREAKDOWN_KEY}
        title={noBreakdownLabel}
        trailing={
          breakdown.length === 0 ? <Icon name='icon-filled-check' size='Medium' /> : undefined
        }
      />,
      ...breakdownDimensions.map((dimension) => (
        <MenuItem
          key={dimension}
          value={dimension}
          title={getBreakdownLabel(dimension)}
          trailing={
            breakdown.includes(dimension) ? (
              <Icon name='icon-filled-check' size='Medium' />
            ) : undefined
          }
        />
      )),
    ];
  }, [breakdown, breakdownDimensions, getBreakdownLabel, noBreakdownLabel]);

  if (breakdownDimensions.length < 1) {
    return null;
  }

  return (
    <Dropdown
      label={label}
      size='Medium'
      value={breakdown.length > 0 ? breakdown[0] : NONE_BREAKDOWN_KEY}
      placeholder={placeholder}
      onValueChange={onValueChange}>
      <Menu>
        <MenuSection>{breakdownMenuItems}</MenuSection>
      </Menu>
    </Dropdown>
  );
};

export default ExploreModeBreakdownControl;
