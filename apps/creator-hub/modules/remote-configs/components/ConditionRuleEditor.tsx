import type { FC } from 'react';
import { useMemo } from 'react';
import {
  RAQIV2Dimension,
  RAQIV2DimensionDisplayConfig,
  RAQIV2DimensionValueType,
} from '@rbx/creator-hub-analytics-config';
import { Button, Dropdown, IconButton, Menu, MenuItem } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import FoundationMultiSelect from '@modules/charts-generic/components/FoundationLikeMultiSelect/FoundationLikeMultiSelect';
import {
  Menu as MultiSelectMenu,
  MenuItem as MultiSelectMenuItem,
} from '@modules/charts-generic/components/FoundationLikeMultiSelect/FoundationLikeMultiSelectMenu';
import { getSingleDimensionBreakdownLabel } from '@modules/experience-analytics-shared/adapters/genericRAQIV2ChartAdapter';
import getDimensionRenderer from '@modules/experience-analytics-shared/components/getDimensionRenderer';
import useRAQIV2TranslationDependencies from '@modules/experience-analytics-shared/hooks/useRAQIV2TranslationDependencies';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { RpnOperator } from '../api/universeConfigsClientEnums';
import type { TargetingClauseFormData } from '../types/FormData';

const conditionDimensions: ReadonlyArray<RAQIV2Dimension> = [
  RAQIV2Dimension.Country,
  RAQIV2Dimension.Locale,
  RAQIV2Dimension.UserSegmentationAccountAge,
  RAQIV2Dimension.UserSegmentationPayerStatus,
  RAQIV2Dimension.UserSegmentationPlatformSpenderStatus,
  RAQIV2Dimension.UserSegmentationActivationStatus,
  RAQIV2Dimension.UserSegmentationEngagementLevel,
  RAQIV2Dimension.UserSegmentationPlatformActivationStatus,
];

type DimensionOption = { value: RAQIV2Dimension; label: string };
type DimensionValueOption = { value: string; label: string };
type ClauseOperator = TargetingClauseFormData['operator'];

const clauseOperators: ReadonlyArray<ClauseOperator> = [RpnOperator.Eq, RpnOperator.Ne];
const conditionDimensionByValue = new Map<string, RAQIV2Dimension>(
  conditionDimensions.map((dimension) => [dimension, dimension]),
);
const clauseOperatorByValue = new Map<string, ClauseOperator>(
  clauseOperators.map((operator) => [operator, operator]),
);

const getDimensionValuesFromDisplayConfig = (dimension: RAQIV2Dimension): string[] => {
  const config = RAQIV2DimensionDisplayConfig[dimension];
  if (
    config.valueType !== RAQIV2DimensionValueType.Enum &&
    config.valueType !== RAQIV2DimensionValueType.DynamicWithPreset
  ) {
    return [];
  }
  const values = Object.values(config.dimensionValues ?? {});
  return values.filter((v) => {
    const supported = config.filterSupported?.[v];
    return supported ?? true;
  });
};

const sortDimensionValueOptionsByLabel = (a: DimensionValueOption, b: DimensionValueOption) =>
  a.label.localeCompare(b.label);

const getConditionDimension = (value: string): RAQIV2Dimension | undefined => {
  return conditionDimensionByValue.get(value);
};

const getClauseOperator = (value: string): ClauseOperator | undefined => {
  return clauseOperatorByValue.get(value);
};

// Sort dimension value options using the canonical breakdown ordering declared in
// the analytics config package. Priority: breakdownOrdering.completeOrder, then
// breakdownOrdering.partialOrder, then label-alphabetical as the final fallback.
const sortDimensionValueOptionsByConfig = (
  dimension: RAQIV2Dimension,
  options: readonly DimensionValueOption[],
): DimensionValueOption[] => {
  const ordering = RAQIV2DimensionDisplayConfig[dimension].breakdownOrdering;

  const explicitOrder =
    typeof ordering === 'object' ? (ordering.completeOrder ?? ordering.partialOrder) : undefined;

  if (!explicitOrder || explicitOrder.length === 0) {
    return [...options].sort(sortDimensionValueOptionsByLabel);
  }

  const orderIndex = new Map<string, number>(explicitOrder.map((v, i) => [v, i]));
  const indexFor = (v: string) => orderIndex.get(v) ?? Number.POSITIVE_INFINITY;

  return [...options].sort((a, b) => {
    const aIdx = indexFor(a.value);
    const bIdx = indexFor(b.value);
    if (aIdx !== bIdx) {
      return aIdx - bIdx;
    }
    return sortDimensionValueOptionsByLabel(a, b);
  });
};

type ConditionRuleEditorProps = {
  clauses: ReadonlyArray<TargetingClauseFormData>;
  onUpdateClause: (
    clauseId: string,
    updater: (c: TargetingClauseFormData) => TargetingClauseFormData,
  ) => void;
  onRemoveClause: (clauseId: string) => void;
  onAddClause: () => void;
  isDisabled?: boolean;
  // Allows callers to remove the final clause instead of preserving one required row.
  allowRemovingLastClause?: boolean;
  // Overrides the default "Applies if" heading when the editor is embedded in a different context.
  headingLabel?: string;
  // Overrides the default add button label without replacing the editor's add behavior.
  addButtonLabel?: string;
  // Lets callers render their own add controls outside the editor.
  hideAddButton?: boolean;
  // When true, highlights incomplete rows (dimension or values missing) after validation fails.
  shouldShowIncompleteErrors?: boolean;
};

const ConditionRuleEditor: FC<ConditionRuleEditorProps> = ({
  clauses,
  onUpdateClause,
  onRemoveClause,
  onAddClause,
  isDisabled = false,
  allowRemovingLastClause = false,
  headingLabel,
  addButtonLabel,
  hideAddButton = false,
  shouldShowIncompleteErrors = false,
}) => {
  const { tPendingTranslation, translate } = useTranslationWrapper(useTranslation());
  const translationDependencies = useRAQIV2TranslationDependencies();

  const dimensionOptions = useMemo<ReadonlyArray<DimensionOption>>(() => {
    return [...conditionDimensions]
      .map((dim) => ({
        value: dim,
        label: String(translationDependencies.translate(getDimensionRenderer(dim).name)),
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [translationDependencies]);

  const valueOptionsByDimension = useMemo(() => {
    const optionsByDimension = new Map<RAQIV2Dimension, DimensionValueOption[]>();

    conditionDimensions.forEach((dim) => {
      const values = getDimensionValuesFromDisplayConfig(dim);
      const options = values.map((v) => ({
        value: v,
        label: String(
          getSingleDimensionBreakdownLabel({ dimension: dim, value: v }, translationDependencies)
            .name,
        ),
      }));
      optionsByDimension.set(dim, sortDimensionValueOptionsByConfig(dim, options));
    });

    return optionsByDimension;
  }, [translationDependencies]);

  const selectedDimensionCounts = useMemo(() => {
    return clauses.reduce<Map<RAQIV2Dimension, number>>((acc, clause) => {
      if (!clause.dimension) {
        return acc;
      }
      acc.set(clause.dimension, (acc.get(clause.dimension) ?? 0) + 1);
      return acc;
    }, new Map<RAQIV2Dimension, number>());
  }, [clauses]);
  const hasReachedClauseLimit = clauses.length >= conditionDimensions.length;

  const appliesIfLabel = tPendingTranslation(
    'Applies if',
    'Label for the condition clause that specifies when a conditional value applies.',
    translationKey(
      'Label.ConfigCreation.AddTargeting.AppliesIf',
      TranslationNamespace.UniverseConfigAndExperimentation,
    ),
  );
  const dimensionPlaceholder = tPendingTranslation(
    'Select segment',
    'Placeholder in the dimension dropdown for selecting a targeting segment.',
    translationKey(
      'Placeholder.ConfigCreation.AddTargeting.Dimension',
      TranslationNamespace.UniverseConfigAndExperimentation,
    ),
  );
  const valuePlaceholder = tPendingTranslation(
    'Select values',
    'Placeholder in the values dropdown for selecting targeting filter values.',
    translationKey(
      'Placeholder.ConfigCreation.AddTargeting.Value',
      TranslationNamespace.UniverseConfigAndExperimentation,
    ),
  );
  const isInLabel = tPendingTranslation(
    'Is in',
    'Operator option that includes selected values in targeting condition.',
    translationKey(
      'Label.ConfigCreation.AddTargeting.Operator.IsIn',
      TranslationNamespace.UniverseConfigAndExperimentation,
    ),
  );
  const isNotInLabel = tPendingTranslation(
    'Is not in',
    'Operator option that excludes selected values from targeting condition.',
    translationKey(
      'Label.ConfigCreation.AddTargeting.Operator.IsNotIn',
      TranslationNamespace.UniverseConfigAndExperimentation,
    ),
  );
  const addClauseLabel = tPendingTranslation(
    'Add rule',
    'Button label to add a new targeting clause to the condition.',
    translationKey(
      'Action.EditCondition.AddClause',
      TranslationNamespace.UniverseConfigAndExperimentation,
    ),
  );
  const deleteLabel = translate(translationKey('Action.Delete', TranslationNamespace.Controls));
  const incompleteFilterMessage = tPendingTranslation(
    'Select values to complete this filter, or delete the row.',
    'Helper message shown when a targeting filter row is partially filled.',
    translationKey(
      'Message.ConfigCreation.AddTargeting.IncompleteFilter',
      TranslationNamespace.UniverseConfigAndExperimentation,
    ),
  );

  const gridTemplateColumns = 'minmax(220px, 1.4fr) minmax(140px, 1fr) minmax(220px, 1.6fr) auto';

  return (
    <div className='flex flex-col gap-xsmall'>
      <div className='text-label-medium content-emphasis'>{headingLabel ?? appliesIfLabel}</div>
      {clauses.map((clause) => {
        const clauseValueOptions = clause.dimension
          ? (valueOptionsByDimension.get(clause.dimension) ?? [])
          : [];
        const isDimensionDisabled = (dimension: RAQIV2Dimension): boolean => {
          return (
            (selectedDimensionCounts.get(dimension) ?? 0) > (dimension === clause.dimension ? 1 : 0)
          );
        };
        const sortedDimensionOptions = [...dimensionOptions].sort((left, right) => {
          const leftDisabled = isDimensionDisabled(left.value);
          const rightDisabled = isDimensionDisabled(right.value);
          if (leftDisabled === rightDisabled) {
            return 0;
          }
          return leftDisabled ? 1 : -1;
        });
        const rowHasInput = !!clause.dimension || clause.values.length > 0;
        const dimensionHasError = shouldShowIncompleteErrors && rowHasInput && !clause.dimension;
        const valuesHasError =
          shouldShowIncompleteErrors && rowHasInput && clause.values.length === 0;
        const rowHasError = dimensionHasError || valuesHasError;
        return (
          <div key={clause.id} className='flex flex-col gap-xxsmall'>
            <div className='grid gap-xsmall items-end' style={{ gridTemplateColumns }}>
              <Dropdown
                size='Large'
                value={clause.dimension}
                placeholder={dimensionPlaceholder}
                isDisabled={isDisabled}
                hasError={dimensionHasError}
                onValueChange={(value: string) => {
                  const dimension = getConditionDimension(value);
                  if (!dimension) {
                    return;
                  }

                  onUpdateClause(clause.id, (c) => ({
                    ...c,
                    dimension,
                    values: [],
                  }));
                }}>
                <Menu>
                  {sortedDimensionOptions.map((opt) => (
                    <MenuItem
                      key={opt.value}
                      value={opt.value}
                      title={opt.label}
                      disabled={isDimensionDisabled(opt.value)}
                    />
                  ))}
                </Menu>
              </Dropdown>

              <Dropdown
                size='Large'
                value={clause.operator}
                placeholder={isInLabel}
                isDisabled={isDisabled}
                onValueChange={(value: string) => {
                  const operator = getClauseOperator(value);
                  if (!operator) {
                    return;
                  }

                  onUpdateClause(clause.id, (c) => ({
                    ...c,
                    operator,
                  }));
                }}>
                <Menu>
                  <MenuItem value={RpnOperator.Eq} title={isInLabel} />
                  <MenuItem value={RpnOperator.Ne} title={isNotInLabel} />
                </Menu>
              </Dropdown>

              <FoundationMultiSelect
                size='Large'
                placeholder={valuePlaceholder}
                value={clause.values}
                isDisabled={isDisabled || !clause.dimension}
                hasError={valuesHasError}
                onValueChange={(values) => onUpdateClause(clause.id, (c) => ({ ...c, values }))}
                formatValue={(values) => {
                  const labelsByValue = new Map(clauseValueOptions.map((o) => [o.value, o.label]));
                  return values.map((v) => labelsByValue.get(v) ?? v).join(', ');
                }}>
                <MultiSelectMenu>
                  {clauseValueOptions.map((opt) => (
                    <MultiSelectMenuItem key={opt.value} value={opt.value} title={opt.label} />
                  ))}
                </MultiSelectMenu>
              </FoundationMultiSelect>

              <IconButton
                type='button'
                variant='Standard'
                icon='icon-regular-trash-can'
                ariaLabel={deleteLabel}
                isDisabled={isDisabled || (!allowRemovingLastClause && clauses.length <= 1)}
                onClick={() => onRemoveClause(clause.id)}
              />
            </div>
            {rowHasError ? (
              <span className='text-caption-small content-system-alert'>
                {incompleteFilterMessage}
              </span>
            ) : null}
          </div>
        );
      })}
      {!hideAddButton && (
        <div className='margin-y-small'>
          <Button
            type='button'
            variant='Standard'
            size='Small'
            isDisabled={isDisabled || hasReachedClauseLimit}
            onClick={onAddClause}>
            {addButtonLabel ?? addClauseLabel}
          </Button>
        </div>
      )}
    </div>
  );
};

export default ConditionRuleEditor;
