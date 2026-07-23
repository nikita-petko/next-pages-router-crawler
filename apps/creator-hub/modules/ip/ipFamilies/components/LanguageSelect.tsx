import React from 'react';
import { useTranslation } from '@rbx/intl';
import type { TSelectProps } from '@rbx/ui';
import { Select, MenuItem } from '@rbx/ui';
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
