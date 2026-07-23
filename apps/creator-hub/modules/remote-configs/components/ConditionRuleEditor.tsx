import { FC, useMemo } from 'react';
import { Button, Dropdown, IconButton, Menu, MenuItem } from '@rbx/foundation-ui';
import {
  RAQIV2Dimension,
  RAQIV2DimensionDisplayConfig,
  RAQIV2DimensionValueType,
} from '@rbx/creator-hub-analytics-config';
import { useTranslation } from '@rbx/intl';
import {
  USER_SEGMENTATION_DIMENSIONS,
  getDimensionRenderer,
  getSingleDimensionBreakdownLabel,
  useRAQIV2TranslationDependencies,
} from '@modules/experience-analytics-shared';
import {
  FoundationLikeMultiSelect,
  FoundationLikeMenu as MultiSelectMenu,
  FoundationLikeMenuItem as MultiSelectMenuItem,
} from '@modules/charts-generic';
import { translationKey, useTranslationWrapper } from '@modules/analytics-translations';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { RpnOperator } from '../api/universeConfigsClientEnums';
import type { TargetingClauseFormData } from '../types/FormData';

const conditionDimensions: ReadonlyArray<RAQIV2Dimension> = [
  ...USER_SEGMENTATION_DIMENSIONS,
  RAQIV2Dimension.Country,
  RAQIV2Dimension.Locale,
  RAQIV2Dimension.Platform,
];

type DimensionOption = { value: RAQIV2Dimension; label: string };
type DimensionValueOption = { value: string; label: string };
type ClauseOperator = TargetingClauseFormData['operator'];

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
    return supported === undefined ? true : supported;
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
};

const ConditionRuleEditor: FC<ConditionRuleEditorProps> = ({
  clauses,
  onUpdateClause,
  onRemoveClause,
  onAddClause,
  isDisabled = false,
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
    return conditionDimensions.reduce<Record<RAQIV2Dimension, DimensionValueOption[]>>(
      (acc, dim) => {
        const values = getDimensionValuesFromDisplayConfig(dim);
        acc[dim] = [...values]
          .map((v) => ({
            value: v,
            label: String(
              getSingleDimensionBreakdownLabel(
                { dimension: dim, value: v },
                translationDependencies,
              ).name,
            ),
          }))
          .sort((a, b) => a.label.localeCompare(b.label));
        return acc;
      },
      {} as Record<RAQIV2Dimension, DimensionValueOption[]>,
    );
  }, [translationDependencies]);

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
  const equalsLabel = tPendingTranslation(
    'Equals',
    'Operator option that includes matching values in the targeting condition.',
    translationKey(
      'Label.ConfigCreation.AddTargeting.Operator.Equals',
      TranslationNamespace.UniverseConfigAndExperimentation,
    ),
  );
  const notEqualsLabel = tPendingTranslation(
    'Not equals',
    'Operator option that excludes matching values from the targeting condition.',
    translationKey(
      'Label.ConfigCreation.AddTargeting.Operator.NotEquals',
      TranslationNamespace.UniverseConfigAndExperimentation,
    ),
  );
  const andLabel = tPendingTranslation(
    'And',
    'Logical joiner between condition clauses meaning all clauses must match.',
    translationKey(
      'Label.ConfigCreation.AddTargeting.LogicalJoiner.And',
      TranslationNamespace.UniverseConfigAndExperimentation,
    ),
  );
  const orLabel = tPendingTranslation(
    'Or',
    'Logical joiner between condition clauses meaning any clause can match.',
    translationKey(
      'Label.ConfigCreation.AddTargeting.LogicalJoiner.Or',
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

  const gridTemplateColumns = 'minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1.4fr) auto auto';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div
        style={{
          fontSize: 14,
          fontWeight: 700,
          color: 'var(--color-content-emphasis)',
        }}>
        {appliesIfLabel}
      </div>
      {clauses.map((clause) => {
        const clauseValueOptions = valueOptionsByDimension[clause.dimension] ?? [];
        return (
          <div
            key={clause.id}
            style={{
              display: 'grid',
              gridTemplateColumns,
              gap: 8,
              alignItems: 'end',
            }}>
            <Dropdown
              size='Large'
              value={clause.dimension}
              placeholder={dimensionPlaceholder}
              isDisabled={isDisabled}
              onValueChange={(value) =>
                onUpdateClause(clause.id, (c) => ({
                  ...c,
                  dimension: value as RAQIV2Dimension,
                  values: [],
                }))
              }>
              <Menu>
                {dimensionOptions.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value} title={opt.label} />
                ))}
              </Menu>
            </Dropdown>

            <Dropdown
              size='Large'
              value={clause.operator}
              placeholder={equalsLabel}
              isDisabled={isDisabled}
              onValueChange={(value) =>
                onUpdateClause(clause.id, (c) => ({
                  ...c,
                  operator: value as ClauseOperator,
                }))
              }>
              <Menu>
                <MenuItem value={RpnOperator.Eq} title={equalsLabel} />
                <MenuItem value={RpnOperator.Ne} title={notEqualsLabel} />
              </Menu>
            </Dropdown>

            <FoundationLikeMultiSelect
              size='Large'
              placeholder={valuePlaceholder}
              value={clause.values}
              isDisabled={isDisabled}
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
            </FoundationLikeMultiSelect>

            <Button
              type='button'
              variant='Standard'
              isDisabled={isDisabled}
              onClick={() =>
                onUpdateClause(clause.id, (c) => ({
                  ...c,
                  joinerToNext:
                    c.joinerToNext === RpnOperator.And ? RpnOperator.Or : RpnOperator.And,
                }))
              }>
              {clause.joinerToNext === RpnOperator.And ? andLabel : orLabel}
            </Button>

            <IconButton
              type='button'
              variant='Standard'
              icon='icon-regular-trash-can'
              ariaLabel={deleteLabel}
              isDisabled={isDisabled || clauses.length <= 1}
              onClick={() => onRemoveClause(clause.id)}
            />
          </div>
        );
      })}
      <div>
        <Button type='button' variant='Standard' isDisabled={isDisabled} onClick={onAddClause}>
          {addClauseLabel}
        </Button>
      </div>
    </div>
  );
};

export default ConditionRuleEditor;
