import React, { Fragment, useMemo } from 'react';
import type { Control, FieldValues, UseControllerProps } from 'react-hook-form';
import { Controller } from 'react-hook-form';
import { useTranslation } from '@rbx/intl';
import { Typography, Select, MenuItem, TextField } from '@rbx/ui';
import AttributeDataType from '../../enums/AttributeDataType';
import ComparisonType from '../../enums/ComparisonType';
import type { AttributesInfo } from '../../types/AttributesInfo';
import type { ServeCategoricalPaths } from '../../types/FormTypes';
import { getAttributeName } from '../../utils/ConfigurationUtils';
import { ValidateData } from '../../utils/FormUtils';
import {
  booleanTypeTranslationKeys,
  serverCategoricalTranslationKeys,
} from '../../utils/translationGetter';

export interface ServerCategoricalSignalFormProps<
  T extends FieldValues,
> extends UseControllerProps<T> {
  hasStringConstantErrors: boolean;
  attribute?: AttributesInfo;
  selectedPlayerAttribute?: AttributesInfo;
  playerAttributes?: AttributesInfo[];
  comparisonType?: ComparisonType;
  control: Control<T>;
  paths: ServeCategoricalPaths<T>;
  onPlayerAttributeChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onComparisonTypeChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onStringConstantChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const ServerCategoricalSignalForm = function ServerCategoricalSignalFormProps<
  T extends FieldValues,
>({
  hasStringConstantErrors,
  attribute,
  selectedPlayerAttribute,
  playerAttributes,
  comparisonType,
  control,
  paths,
  onPlayerAttributeChange,
  onComparisonTypeChange,
  onStringConstantChange,
}: ServerCategoricalSignalFormProps<T>): React.JSX.Element {
  const { translate, translateHTML } = useTranslation();
  const attributeName = useMemo(() => {
    return getAttributeName(attribute) ?? '';
  }, [attribute]);

  return (
    <Typography
      variant='captionBody'
      color='primary'
      sx={{ marginTop: 2, alignItems: 'center', justifyItems: 'center', flexWrap: 'wrap' }}>
      {translateHTML('Dialog.ServerCategoricalDescription', [
        {
          opening: 'dropdownStart',
          closing: 'dropdownEnd',
          content: () => {
            return (
              <>
                <Select
                  style={{
                    marginLeft: 5,
                    marginRight: 5,
                    marginTop: -12,
                    flex: 1,
                    width: '200px',
                  }}
                  size='small'
                  value={comparisonType}
                  onChange={onComparisonTypeChange}
                  inputProps={{ 'aria-label': 'comparisonType' }}>
                  {Object.values(ComparisonType).map((type) => (
                    <MenuItem key={type} value={type}>
                      <Typography variant='captionBody' color='primary'>
                        {translate(serverCategoricalTranslationKeys[type], {
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
                      marginTop: -12,
                      width: '200px',
                    }}
                    disabled={!playerAttributes || playerAttributes.length === 0}
                    size='small'
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
                  <Fragment>
                    {attribute?.serverAttribute?.dataType === AttributeDataType.String && (
                      <Controller
                        name={paths.stringConstantPath}
                        control={control}
                        rules={{
                          required: 'Error.Required',
                          maxLength: 20,
                          validate: {
                            validDataType: (value) => ValidateData(value ?? null),
                          },
                        }}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            margin='dense'
                            style={{ width: '200px', marginRight: 5, marginTop: -12 }}
                            error={hasStringConstantErrors}
                            required
                            id='name'
                            size='small'
                            inputProps={{ maxLength: 20 }}
                            label=''
                            onChange={onStringConstantChange}
                          />
                        )}
                      />
                    )}
                    {attribute?.serverAttribute?.dataType === AttributeDataType.Boolean && (
                      <Controller
                        name={paths.stringConstantPath}
                        control={control}
                        rules={{
                          required: 'Error.Required',
                          validate: {
                            validDataType: (value) => ValidateData(value ?? null),
                          },
                        }}
                        render={({ field }) => (
                          <Select
                            required
                            {...field}
                            style={{
                              marginLeft: 5,
                              marginRight: 5,
                              marginTop: -12,
                              width: '100px',
                            }}
                            size='small'
                            onChange={onStringConstantChange}
                            inputProps={{ 'aria-label': 'serverAttribute' }}>
                            <MenuItem key='True' value='True'>
                              <Typography variant='captionBody' color='primary'>
                                {translate(booleanTypeTranslationKeys.True)}
                              </Typography>
                            </MenuItem>
                            <MenuItem key='False' value='False'>
                              <Typography variant='captionBody' color='primary'>
                                {translate(booleanTypeTranslationKeys.False)}
                              </Typography>
                            </MenuItem>
                          </Select>
                        )}
                      />
                    )}
                  </Fragment>
                )}
              </>
            );
          },
        },
      ])}
    </Typography>
  );
};

export default ServerCategoricalSignalForm;
