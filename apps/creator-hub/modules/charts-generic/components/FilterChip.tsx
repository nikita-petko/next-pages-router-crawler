import React, { useState, useRef, useLayoutEffect, useCallback, useMemo } from 'react';
import { CancelIcon, Chip, IconButton, Tooltip } from '@rbx/ui';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useTranslation } from '@rbx/intl';
import { translationKey, useTranslationWrapper } from '@modules/analytics-translations';
import useFilterChipsStyles from './FilterChip.styles';

interface FilterChipProps {
  label: string;
  disabled?: boolean;
  onDelete: () => void;
}

const chipStyle = {
  maxWidth: 256,
};

const CloseIconForDisabledChip = ({ onDelete }: { onDelete: () => void }) => {
  const {
    classes: { closeIconForDisabledChip },
  } = useFilterChipsStyles();
  const onClickSpan = useCallback(() => {
    onDelete();
  }, [onDelete]);
  const { translate } = useTranslationWrapper(useTranslation());
  const label = translate(translationKey('Action.DeleteFilter', TranslationNamespace.Analytics));
  return (
    <IconButton onClick={onClickSpan} className={closeIconForDisabledChip} aria-label={label}>
      <CancelIcon data-testid='disabled-chip-cancel-icon' />
    </IconButton>
  );
};

function FilterChip({ label, disabled, onDelete }: FilterChipProps) {
  const {
    classes: { tooltip },
  } = useFilterChipsStyles();
  const chipRef = useRef<HTMLDivElement>(null);
  const [tooltipLabel, setTooltipLabel] = useState('');

  useLayoutEffect(() => {
    if (chipRef.current?.clientWidth === chipStyle.maxWidth) {
      setTooltipLabel(label);
    }
  }, [label]);

  const deleteIconForDisabledChip = useMemo(() => {
    if (disabled) {
      return <CloseIconForDisabledChip onDelete={onDelete} />;
    }
    return null;
  }, [disabled, onDelete]);

  const body = (
    <Chip
      data-testid='filter-chip'
      ref={chipRef}
      label={label}
      onDelete={onDelete}
      variant='filled'
      color='secondary'
      style={chipStyle}
      disabled={disabled}
    />
  );

  const { translate } = useTranslationWrapper(useTranslation());
  if (disabled) {
    const unsupportedLabel = translate(
      translationKey('Description.UnsupportedFilter', TranslationNamespace.Analytics),
    );
    return (
      <Tooltip title={unsupportedLabel} arrow data-testid='filter-chip-disabled-tooltip'>
        <span style={{ position: 'relative' }}>
          {body}
          {deleteIconForDisabledChip}
        </span>
      </Tooltip>
    );
  }
  return (
    <Tooltip title={tooltipLabel} classes={{ tooltip }} arrow data-testid='filter-chip-tooltip'>
      {body}
    </Tooltip>
  );
}

export default FilterChip;
