import type { TDropdownSize } from '@rbx/foundation-ui';
import { Dropdown, Icon, Menu, MenuItem, MenuSection } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { languages } from '../utils/languages';

export interface LanguageSelectV2Props {
  value?: string;
  /** Called with the selected language code. */
  onChange: (value: string) => void;
  /** Called when the dropdown closes; wire to react-hook-form `field.onBlur`. */
  onBlur?: () => void;
  disabled?: boolean;
  label?: string;
  placeholder?: string;
  error?: boolean;
  helperText?: string;
  size?: TDropdownSize;
}

/**
 * Foundation UI variant of {@link LanguageSelect}. Renders a `Dropdown` of language
 * options using `@rbx/foundation-ui` instead of the legacy WebBlox `Select`.
 */
const LanguageSelectV2 = ({
  value,
  onChange,
  onBlur,
  disabled,
  label,
  placeholder,
  error,
  helperText,
  size = 'Medium',
}: LanguageSelectV2Props) => {
  const { translate } = useTranslation();

  return (
    <div className='width-full' data-testid='locale-select'>
      <Dropdown
        className='width-full [&_.content-system-alert]:text-caption-medium'
        size={size}
        label={label}
        ariaLabel={label ?? placeholder}
        placeholder={placeholder ?? ''}
        value={value === '' ? undefined : value}
        isDisabled={disabled}
        hasError={error}
        hint={helperText}
        onValueChange={(nextValue) => {
          // Commit the value, then blur so blur-based re-validation runs against the
          // just-selected value. Relying only on `onOpenChange` lags one selection
          // behind, since close can fire before the value commits.
          onChange(nextValue);
          onBlur?.();
        }}
        onOpenChange={(open) => {
          if (!open) {
            onBlur?.();
          }
        }}>
        <Menu>
          <MenuSection>
            {languages.map(({ translationKey, code }) => (
              <MenuItem
                key={code}
                value={code}
                title={translate(translationKey)}
                trailing={value === code && <Icon name='icon-filled-check' size={size} />}
              />
            ))}
          </MenuSection>
        </Menu>
      </Dropdown>
    </div>
  );
};

export default LanguageSelectV2;
