import React from 'react';
import { Select, MenuItem, TSelectProps } from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
import { languages } from '../utils/languages';

type LanguageSelectProps = Omit<TSelectProps, 'children' | 'options'>;

/**
 * <Select> with language options.
 */
const LanguageSelect: React.FC<LanguageSelectProps> = (props) => {
  const { translate } = useTranslation();
  return (
    <Select fullWidth {...props}>
      {languages.map(({ translationKey, code }) => (
        <MenuItem key={code} value={code}>
          {translate(translationKey)}
        </MenuItem>
      ))}
    </Select>
  );
};

export default LanguageSelect;
