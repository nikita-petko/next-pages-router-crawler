import { useCallback, type FC } from 'react';
import { Dropdown, Icon, Menu, MenuItem, MenuSection } from '@rbx/foundation-ui';
import type { Locale } from '@rbx/intl';
import { toLocaleNativeName, useTranslation, withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { isMomentsUploadLocale, MOMENTS_UPLOAD_LOCALES } from '../utils/momentsUploadLocaleUtils';

type MomentsLanguageSelectProps = {
  value: Locale | undefined;
  onChange: (locale: Locale) => void;
  isDisabled?: boolean;
};

const MomentsLanguageSelect: FC<MomentsLanguageSelectProps> = ({
  value,
  onChange,
  isDisabled = false,
}) => {
  const { translate } = useTranslation();

  const languageLabel = translate('CreateMomentModal.LanguageInput.Label');
  const languagePlaceholder = translate('CreateMomentModal.LanguageInput.Placeholder');

  const handleValueChange = useCallback(
    (nextValue: string) => {
      if (isMomentsUploadLocale(nextValue)) {
        onChange(nextValue);
      }
    },
    [onChange],
  );

  return (
    <div className='width-full' data-testid='moments-language-select'>
      <Dropdown
        className='width-full [&_.content-system-alert]:text-caption-medium'
        size='Medium'
        label={languageLabel}
        ariaLabel={languageLabel}
        placeholder={languagePlaceholder}
        value={value}
        isDisabled={isDisabled}
        onValueChange={handleValueChange}>
        <Menu>
          <MenuSection>
            {MOMENTS_UPLOAD_LOCALES.map((locale) => (
              <MenuItem
                key={locale}
                value={locale}
                title={toLocaleNativeName(locale)}
                trailing={value === locale && <Icon name='icon-filled-check' size='Medium' />}
              />
            ))}
          </MenuSection>
        </Menu>
      </Dropdown>
    </div>
  );
};

export default withTranslation(MomentsLanguageSelect, [TranslationNamespace.Creations]);
