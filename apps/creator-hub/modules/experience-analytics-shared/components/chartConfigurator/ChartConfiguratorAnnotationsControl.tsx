import type { FC, ReactNode, RefObject } from 'react';
import { useCallback, useMemo } from 'react';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { FoundationLikeMultiSelect } from '@modules/charts-generic/components/FoundationLikeMultiSelect/FoundationLikeMultiSelect';
import {
  Menu,
  MenuItem,
  MenuSection,
} from '@modules/charts-generic/components/FoundationLikeMultiSelect/FoundationLikeMultiSelectMenu';
import { AnnotationType } from '@modules/clients/analytics';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { isValidEnumValue } from '@modules/miscellaneous/utils/enumUtils';
import {
  AnnotationCategoryLabelKey,
  AnnotationConfig,
  AnnotationSelectableCategory,
  type AnnotationOptions,
} from '../../constants/annotationConfig';
import useRAQIV2TranslationDependencies from '../../hooks/useRAQIV2TranslationDependencies';

export type ChartConfiguratorAnnotationOptionRendererArgs = {
  readonly option: AnnotationOptions;
  readonly label: string;
};

type ChartConfiguratorAnnotationsControlProps = {
  readonly className?: string;
  readonly options: readonly AnnotationOptions[];
  readonly value: readonly AnnotationOptions[];
  readonly defaultValue?: readonly AnnotationOptions[];
  readonly onChange: (value: AnnotationOptions[]) => void;
  readonly onOpenChange?: (open: boolean) => void;
  readonly formatValueExtraLabels?: readonly string[];
  readonly hasValueOverride?: boolean;
  readonly additionalInsidePointerRefs?: readonly RefObject<HTMLElement | null>[];
  readonly renderOption?: (args: ChartConfiguratorAnnotationOptionRendererArgs) => ReactNode;
};

type TranslationDependencies = ReturnType<typeof useRAQIV2TranslationDependencies>;

const EMPTY_FORMAT_VALUE_EXTRA_LABELS: readonly string[] = [];

export const reconcileAnnotationSelection = (
  current: readonly AnnotationOptions[],
  next: readonly AnnotationOptions[],
  defaults?: readonly AnnotationOptions[],
): AnnotationOptions[] => {
  if (next.length === 0 && current.length === 0) {
    return defaults ? [...defaults] : [];
  }
  if (
    (!current.includes('None') && next.includes('None')) ||
    (current.length > 0 && next.length === 0)
  ) {
    return ['None'];
  }
  return next.filter((o) => o !== 'None');
};

export const isAnnotationOption = (value: string): value is AnnotationOptions => {
  if (value === 'None') {
    return true;
  }
  if (isValidEnumValue(AnnotationSelectableCategory, value)) {
    return true;
  }
  return isValidEnumValue(AnnotationType, value) && !AnnotationConfig[value].category;
};

export const getAnnotationOptionLabel = (
  option: AnnotationOptions,
  translate: TranslationDependencies['translate'],
): string => {
  if (option === 'None') {
    return translate(translationKey('Label.None', TranslationNamespace.Analytics)) || 'None';
  }
  if (isValidEnumValue(AnnotationSelectableCategory, option)) {
    return translate(AnnotationCategoryLabelKey[option]) || option;
  }
  return translate(AnnotationConfig[option].labelKey) || option;
};

const ChartConfiguratorAnnotationsControl: FC<ChartConfiguratorAnnotationsControlProps> = ({
  className,
  options,
  value,
  defaultValue,
  onChange,
  onOpenChange,
  formatValueExtraLabels = EMPTY_FORMAT_VALUE_EXTRA_LABELS,
  hasValueOverride,
  additionalInsidePointerRefs,
  renderOption,
}) => {
  const { translate } = useRAQIV2TranslationDependencies();
  const label =
    translate(translationKey('Label.Dimension.Annotations', TranslationNamespace.Analytics)) ||
    'Annotations';

  const getOptionLabel = useCallback(
    (option: AnnotationOptions): string => getAnnotationOptionLabel(option, translate),
    [translate],
  );

  const handleChange = useCallback(
    (nextValues: string[]) => {
      const cleanedNext = nextValues.filter(isAnnotationOption);
      onChange(reconcileAnnotationSelection(value, cleanedNext, defaultValue));
    },
    [defaultValue, onChange, value],
  );

  const formatValue = useCallback(
    (values: string[]) => {
      const labelled = values
        .filter(isAnnotationOption)
        .filter((v) => v !== 'None')
        .map((v) => getOptionLabel(v));
      labelled.push(...formatValueExtraLabels);
      if (labelled.length === 0) {
        return getOptionLabel('None');
      }
      return labelled.join(', ');
    },
    [formatValueExtraLabels, getOptionLabel],
  );

  const renderedOptions = useMemo(
    () =>
      options.map((option) => {
        const optionLabel = getOptionLabel(option);
        const renderedOption = renderOption?.({ option, label: optionLabel });
        if (renderedOption !== undefined) {
          return renderedOption;
        }
        return <MenuItem key={option} value={option} title={optionLabel} />;
      }),
    [getOptionLabel, options, renderOption],
  );
  const mutableValue = useMemo(() => [...value], [value]);

  return (
    <FoundationLikeMultiSelect
      className={className}
      label={label}
      size='Medium'
      placeholder={label}
      value={mutableValue}
      onValueChange={handleChange}
      onOpenChange={onOpenChange}
      formatValue={formatValue}
      hasValue={hasValueOverride ?? value.length > 0}
      additionalInsidePointerRefs={additionalInsidePointerRefs}>
      <Menu>
        <MenuSection>{renderedOptions}</MenuSection>
      </Menu>
    </FoundationLikeMultiSelect>
  );
};

export default ChartConfiguratorAnnotationsControl;
