import React, { FC, useCallback, useMemo } from 'react';
import {
  ChartResourceType,
  FoundationLikeMultiSelect,
  FoundationLikeMenu as Menu,
  FoundationLikeMenuSection as MenuSection,
  FoundationLikeMenuItem as MenuItem,
} from '@modules/charts-generic';
import { translationKey } from '@modules/analytics-translations';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { isValidEnumValue } from '@modules/miscellaneous/common/utils';
import {
  useCurrentAnnotationsBundleProvider,
  useRAQIV2TranslationDependencies,
  AnnotationSelectableCategory,
  AnnotationCategoryLabelKey,
  AnnotationConfig,
  getAnnotationOptionsFromAnnotationTypes,
  type AnnotationOptions,
} from '@modules/experience-analytics-shared';

const reconcileAnnotationSelection = (
  current: AnnotationOptions[],
  next: AnnotationOptions[],
  defaults?: AnnotationOptions[],
): AnnotationOptions[] => {
  if (next.length === 0 && current.length === 0) {
    return defaults ?? [];
  }
  if (
    (!current.includes('None') && next.includes('None')) ||
    (current.length > 0 && next.length === 0)
  ) {
    return ['None'];
  }
  return next.filter((o) => o !== 'None');
};

type ExploreModeAnnotationsControlProps = {
  resourceType: ChartResourceType;
  className?: string;
};

const ExploreModeAnnotationsControl: FC<ExploreModeAnnotationsControlProps> = ({
  resourceType,
  className,
}) => {
  const { translate } = useRAQIV2TranslationDependencies();

  const {
    supportedAnnotationTypes,
    defaultAnnotationTypes,
    selectedAnnotationOptions,
    onAnnotationOptionsChange,
  } = useCurrentAnnotationsBundleProvider(resourceType);

  const options = useMemo(
    () => getAnnotationOptionsFromAnnotationTypes(supportedAnnotationTypes),
    [supportedAnnotationTypes],
  );

  const defaultOptions = useMemo(
    () => getAnnotationOptionsFromAnnotationTypes(defaultAnnotationTypes),
    [defaultAnnotationTypes],
  );

  const getOptionLabel = useCallback(
    (option: AnnotationOptions): string => {
      if (option === 'None') {
        return translate(translationKey('Label.None', TranslationNamespace.Analytics)) || 'None';
      }
      if (isValidEnumValue(AnnotationSelectableCategory, option)) {
        return translate(AnnotationCategoryLabelKey[option]) || option;
      }
      return translate(AnnotationConfig[option].labelKey) || option;
    },
    [translate],
  );

  const onChange = useCallback(
    (nextValues: string[]) => {
      const reconciled = reconcileAnnotationSelection(
        selectedAnnotationOptions,
        nextValues as AnnotationOptions[],
        defaultOptions,
      );
      onAnnotationOptionsChange(reconciled);
    },
    [selectedAnnotationOptions, defaultOptions, onAnnotationOptionsChange],
  );

  const formatValue = useCallback(
    (values: string[]) => {
      if (values.length === 0 || (values.length === 1 && values[0] === 'None')) {
        return getOptionLabel('None');
      }
      return values
        .filter((v) => v !== 'None')
        .map((v) => getOptionLabel(v as AnnotationOptions))
        .join(', ');
    },
    [getOptionLabel],
  );

  if (supportedAnnotationTypes.length === 0) {
    return null;
  }

  const label =
    translate(translationKey('Label.Dimension.Annotations', TranslationNamespace.Analytics)) ||
    'Annotations';

  return (
    <FoundationLikeMultiSelect
      className={className}
      label={label}
      size='Medium'
      placeholder={label}
      value={selectedAnnotationOptions}
      onValueChange={onChange}
      formatValue={formatValue}>
      <Menu>
        <MenuSection>
          {options.map((option) => (
            <MenuItem key={option} value={option} title={getOptionLabel(option)} />
          ))}
        </MenuSection>
      </Menu>
    </FoundationLikeMultiSelect>
  );
};

export default ExploreModeAnnotationsControl;
