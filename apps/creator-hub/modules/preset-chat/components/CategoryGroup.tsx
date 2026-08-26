import type { FunctionComponent, ReactNode } from 'react';
import { useCallback } from 'react';
import { useTranslation } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import type { CategoryFormState, PresetStatus } from '../types';
import CategoryNameField from './CategoryNameField';

type CategoryGroupProps = {
  categoryIndex: number;
  category: CategoryFormState;
  onNameChange: (id: string, name: string) => void;
  isDisabled?: boolean;
  overrideStatus?: PresetStatus;
  children?: ReactNode;
};

const CategoryGroup: FunctionComponent<CategoryGroupProps> = ({
  categoryIndex,
  category,
  onNameChange,
  isDisabled,
  overrideStatus,
  children,
}) => {
  const { tPendingTranslation } = useTranslationWrapper(useTranslation());

  const handleNameChange = useCallback(
    (name: string) => {
      onNameChange(category.id, name);
    },
    [category.id, onNameChange],
  );

  return (
    <section className='flex flex-col gap-large'>
      <div className='flex flex-col gap-small'>
        <h3 className='text-heading-small content-emphasis'>
          {tPendingTranslation(
            'Category {index}',
            'Heading for a preset category section; {index} is the category number',
            translationKey('Heading.Category', TranslationNamespace.PresetChat),
            { index: String(categoryIndex) },
          )}
        </h3>
        <CategoryNameField
          value={category.name}
          state={category.state}
          onChange={handleNameChange}
          isDisabled={isDisabled}
          overrideStatus={overrideStatus}
        />
      </div>
      {children}
    </section>
  );
};

export default CategoryGroup;
