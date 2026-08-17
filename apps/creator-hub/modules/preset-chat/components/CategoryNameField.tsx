import type { ChangeEvent, FunctionComponent } from 'react';
import { TextInput } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { MaxCategoryNameLength } from '../constants/presetChatConstants';
import type { PresetStatus } from '../types';
import QuickWordsStatusBadge from './QuickWordsStatusBadge';

type CategoryNameFieldProps = {
  value: string;
  state: PresetStatus;
  onChange: (value: string) => void;
  isDisabled?: boolean;
};

const CategoryNameField: FunctionComponent<CategoryNameFieldProps> = ({
  value,
  state,
  onChange,
  isDisabled,
}) => {
  const { tPendingTranslation } = useTranslationWrapper(useTranslation());

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value);
  };

  return (
    <div className='flex items-end gap-medium'>
      <div className='grow'>
        <TextInput
          size='Medium'
          label={tPendingTranslation(
            'Category name',
            'Label for the category name input field',
            translationKey('Label.CategoryName', TranslationNamespace.PresetChat),
          )}
          isRequired
          maxLength={MaxCategoryNameLength}
          value={value}
          onChange={handleChange}
          isDisabled={isDisabled}
        />
      </div>
      <div className='height-1000 flex items-center'>
        <QuickWordsStatusBadge status={state} />
      </div>
    </div>
  );
};

export default CategoryNameField;
