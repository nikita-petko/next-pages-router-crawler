import React, { useMemo } from 'react';
import type { Control, FieldValues, UseControllerProps } from 'react-hook-form';
import { useTranslation } from '@rbx/intl';
import { Typography, Grid } from '@rbx/ui';
import AggregationType from '../../enums/AggregationType';
import type { AttributesInfo } from '../../types/AttributesInfo';
import type { PlayerNumericalPaths } from '../../types/FormTypes';
import { getAttributeName } from '../../utils/ConfigurationUtils';
import { aggregationTranslationKeys } from '../../utils/translationGetter';
import AggregationTypeTitleSelector from './AggregationTypeTitleSelector';
import ConstantValueSignalField from './ConstantValueSignalField';
import MaxDiffField from './MaxDiffField';

export interface PlayerNumericalSignalFormProps<
  T extends FieldValues,
> extends UseControllerProps<T> {
  hasMaxDiffErrors: boolean;
  hasNumericalConstantErrors: boolean;
  attribute?: AttributesInfo;
  aggregationType?: AggregationType;
  control: Control<T>;
  paths: PlayerNumericalPaths<T>;
  onMaxDiffChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAggregationTypeChange: (aggregationType: AggregationType) => void;
  onNumericalConstantChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const PlayerNumericalSignalForm = function PlayerNumericalSignalFormProps<T extends FieldValues>({
  hasMaxDiffErrors,
  hasNumericalConstantErrors,
  attribute,
  aggregationType,
  control,
  paths,
  onMaxDiffChange,
  onAggregationTypeChange,
  onNumericalConstantChange,
}: PlayerNumericalSignalFormProps<T>): React.JSX.Element {
  const { translate, translateHTML } = useTranslation();
  const attributeName = useMemo(() => {
    return getAttributeName(attribute) ?? '';
  }, [attribute]);

  const isSumAggregationType = useMemo(() => {
    if (!aggregationType) {
      return false;
    }
    return aggregationType === AggregationType.Sum;
  }, [aggregationType]);

  return (
    <Grid container direction='column'>
      <Typography variant='captionBody' color='primary'>
        {translateHTML(`Dialog.ChooseAggregation`, [
          {
            opening: 'boldStart',
            closing: 'boldEnd',
            content: () => <strong>{attributeName}</strong>,
          },
        ])}
      </Typography>
      <AggregationTypeTitleSelector
        attributeName={attributeName}
        selectedAggregationType={aggregationType}
        onSelect={onAggregationTypeChange}
      />
      {aggregationType && aggregationType !== AggregationType.Sum && (
        <Typography style={{ marginTop: 20 }} variant='captionBody' color='primary'>
          {translate('Dialog.PlayerAggregationTypeDescription', {
            attribute: attributeName,
            aggregationType: translate(aggregationTranslationKeys[aggregationType]),
          })}
        </Typography>
      )}
      {isSumAggregationType && (
        <Grid item display='flex' direction='row' alignItems='center'>
          <Typography
            style={{ marginTop: 10, marginRight: 10, whiteSpace: 'pre' }}
            variant='captionBody'
            color='primary'>
            {translate('Dialog.PlayerSumDescription', {
              attribute: attributeName,
            })}
          </Typography>
          <ConstantValueSignalField
            isNumericConstant
            hasErrors={hasNumericalConstantErrors}
            control={control}
            path={paths.numericalConstantPath}
            onConstantChange={onNumericalConstantChange}
            name={paths.numericalConstantPath}
          />
        </Grid>
      )}
      {aggregationType && (
        <MaxDiffField
          name={paths?.maxDiffPath}
          isDense={isSumAggregationType}
          hasErrors={hasMaxDiffErrors}
          control={control}
          path={paths.maxDiffPath}
          onMaxDiffChange={onMaxDiffChange}
        />
      )}
    </Grid>
  );
};

export default PlayerNumericalSignalForm;
