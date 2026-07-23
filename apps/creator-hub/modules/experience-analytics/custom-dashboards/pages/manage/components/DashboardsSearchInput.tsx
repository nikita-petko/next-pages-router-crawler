import { type ChangeEvent, type FC, useCallback } from 'react';
import { IconButton, TextInput } from '@rbx/foundation-ui';
import { useManagePageTranslations } from '../useManagePageTranslations';

/**
 * Manage-page search field (no debounce; substring filter on name +
 * description). `disabled` reserves vertical space during Loading without
 * inviting interaction.
 */
type DashboardsSearchInputProps = {
  readonly value: string;
  readonly onChange: (next: string) => void;
  readonly onClear: () => void;
  readonly disabled?: boolean;
};

const DashboardsSearchInput: FC<DashboardsSearchInputProps> = ({
  value,
  onChange,
  onClear,
  disabled = false,
}) => {
  const t = useManagePageTranslations();

  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      onChange(event.target.value);
    },
    [onChange],
  );

  const showClear = value.length > 0 && !disabled;

  return (
    <div className='max-width-[336px] width-full'>
      <TextInput
        size='Medium'
        variant='Standard'
        value={value}
        onChange={handleChange}
        placeholder={t.searchPlaceholder}
        aria-label={t.searchPlaceholder}
        isDisabled={disabled}
        leadingIconName='icon-regular-magnifying-glass'
        trailingIconNode={
          showClear ? (
            <IconButton
              variant='Standard'
              size='XSmall'
              ariaLabel={t.searchClearLabel}
              onClick={onClear}
              icon='icon-regular-x'
            />
          ) : undefined
        }
      />
    </div>
  );
};

export default DashboardsSearchInput;
