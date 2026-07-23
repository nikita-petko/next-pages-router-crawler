import { Typography, Grid, Select, MenuItem } from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
import React, { useMemo } from 'react';
import { Control, FieldValues, UseControllerProps } from 'react-hook-form';
import { serverNumericalTranslationKeys } from '../../utils/translationGetter';
import { ServerNumericalPaths } from '../../types/FormTypes';
import { AttributesInfo } from '../../types/AttributesInfo';
import { getAttributeName } from '../../utils/ConfigurationUtils';
import ConstantValueSignalField from './ConstantValueSignalField';
import MaxDiffField from './MaxDiffField';
import ComparisonType from '../../enums/ComparisonType';

export interface ServerNumericalSignalFormProps<T extends FieldValues>
  extends UseControllerProps<T> {
  hasMaxDiffErrors: boolean;
  hasNumericalConstantErrors: boolean;
  attribute?: AttributesInfo;
  selectedPlayerAttribute?: AttributesInfo;
  playerAttributes?: AttributesInfo[];
  comparisonType?: ComparisonType;
  control: Control<T>;
  paths: ServerNumericalPaths<T>;
  onMaxDiffChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPlayerAttributeChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onComparisonTypeChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onNumericalConstantChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const ServerNumericalSignalForm = function ServerNumericalSignalFormProps<T extends FieldValues>({
  hasNumericalConstantErrors,
  hasMaxDiffErrors,
  attribute,
  selectedPlayerAttribute,
  playerAttributes,
  comparisonType,
  control,
  paths,
  onMaxDiffChange,
  onComparisonTypeChange,
  onPlayerAttributeChange,
  onNumericalConstantChange,
}: ServerNumericalSignalFormProps<T>): React.JSX.Element {
  const { translate } = useTranslation();
  const attributeName = useMemo(() => {
    return getAttributeName(attribute) ?? '';
  }, [attribute]);

  return (
    <Grid container direction='column'>
      <Grid item display='flex' direction='row' alignItems='center'>
        <Typography variant='captionBody' color='primary' style={{ marginTop: 10 }}>
          {translate('Dialog.ServerNumerical', {
            attribute: attributeName,
          })}
        </Typography>
        <Select
          style={{ marginTop: 10, marginLeft: 10, marginRight: 10, flex: 1 }}
          size='small'
          value={comparisonType}
          onChange={onComparisonTypeChange}
          inputProps={{ 'aria-label': translate('Label.SortBy') }}>
          {Object.values(ComparisonType).map((type) => (
            <MenuItem key={type} value={type}>
              <Typography variant='captionBody' color='primary'>
                {translate(serverNumericalTranslationKeys[type], {
                  attribute: attributeName,
                })}
              </Typography>
            </MenuItem>
          ))}
        </Select>
        {comparisonType === ComparisonType.Player && (
          <Select
            style={{
              marginLeft: 5,
              marginRight: 5,
              marginTop: 10,
              width: '200px',
            }}
            size='small'
            disabled={!playerAttributes || playerAttributes.length === 0}
            value={selectedPlayerAttribute?.id}
            onChange={onPlayerAttributeChange}
            inputProps={{ 'aria-label': 'playerAttribute' }}>
            {playerAttributes?.map((attr) => (
              <MenuItem key={attr.id} value={attr?.id}>
                <Typography variant='captionBody' color='primary'>
                  {attr?.playerAttribute?.name ?? ''}
                </Typography>
              </MenuItem>
            ))}
          </Select>
        )}
        {comparisonType === ComparisonType.ConstantValue && (
          <Grid style={{ marginTop: -2, maxWidth: '150px' }}>
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
      </Grid>
      {comparisonType && (
        <MaxDiffField
          name={paths?.maxDiffPath}
          isDense
          hasErrors={hasMaxDiffErrors}
          control={control}
          path={paths.maxDiffPath}
          onMaxDiffChange={onMaxDiffChange}
        />
      )}
    </Grid>
  );
};

export default ServerNumericalSignalForm;
