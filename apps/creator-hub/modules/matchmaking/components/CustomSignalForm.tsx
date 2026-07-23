import { Typography, Grid, TextField, Select, MenuItem, Divider } from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
import React, { Fragment, useCallback, useMemo, useState } from 'react';
import { Controller, FieldValues, UseControllerProps, UseFormReturn } from 'react-hook-form';
import { CustomSignalType } from '@rbx/clients/matchmakingApi/v1';
import { CustomSignalFormValues } from '../types/ConfigurationInfo';
import { getCustomSignalFormOptions } from '../utils/FormUtils';
import { AttributesInfo } from '../types/AttributesInfo';
import AggregationType from '../enums/AggregationType';
import SignalPreviewAccordion from './SignalPreviewAccordion';
import PlayerNumericalSignalForm from './FormComponents/PlayerNumericalSignalForm';
import PlayerCategoricalSignalForm from './FormComponents/PlayerCategoricalSignalForm';
import DistributionType from '../enums/DistributionType';
import ComparisonType from '../enums/ComparisonType';
import ServerNumericalSignalForm from './FormComponents/ServerNumericalSignalForm';
import ServerCategoricalSignalForm from './FormComponents/ServerCategoricalSignalForm';
import {
  getAttributeFromId,
  getAttributeInfoFromCustomSignal,
  getAttributeName,
} from '../utils/ConfigurationUtils';
import useCustomSignalStyles from './CustomSignalDialog.styles';

export interface CustomSignalFormProps<T extends FieldValues> extends UseControllerProps<T> {
  isEditingSignal: boolean;
  isFormInvalid: boolean;
  allAttributes?: AttributesInfo[] | undefined;
  formValues: T;
  formReturn: UseFormReturn<T>;
}

const CustomSignalForm = function CustomSignalFormProps({
  allAttributes,
  isEditingSignal,
  isFormInvalid,
  formValues,
  formReturn,
}: CustomSignalFormProps<CustomSignalFormValues>): React.JSX.Element {
  const { translate } = useTranslation();
  const { control, formState, setValue, resetField, register } = formReturn;
  const { errors } = formState;
  const [selectedAttribute, setSelectedAttribute] = useState<AttributesInfo | undefined>(
    getAttributeInfoFromCustomSignal(formValues, allAttributes),
  );
  const [selectedPlayerAttribute, setSelectedPlayerAttribute] = useState<
    AttributesInfo | undefined
  >(getAttributeFromId(formValues?.playerAttributeId, allAttributes));
  const {
    classes: { signalFormContainer, divider },
  } = useCustomSignalStyles();

  register('comparisonType');
  register('playerAttributeId');
  register('serverAttributeId');
  register('maxRelevantDifference');
  register('numericalConstantValue');
  register('stringConstantValue');
  register('distributionType');
  register('aggregationType');

  const resetFields = useCallback(
    (resetAll: boolean) => {
      resetField('playerAttributeId');
      resetField('numericalConstantValue');
      resetField('stringConstantValue');
      if (resetAll) {
        resetField('comparisonType');
        setSelectedPlayerAttribute(undefined);
        resetField('serverAttributeId');
        resetField('maxRelevantDifference');
        resetField('distributionType');
        resetField('aggregationType');
      }
    },
    [resetField],
  );

  const formOptions = useMemo(() => {
    return getCustomSignalFormOptions();
  }, []);

  const handleMaxDiffChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const numericValue = parseInt(event.target.value, 10);
      const isNumeric = !Number.isNaN(numericValue);
      if (isNumeric || event.target.value === '0') {
        setValue('maxRelevantDifference', numericValue, {
          shouldDirty: true,
          shouldValidate: true,
        });
      }
    },
    [setValue],
  );

  const handleNumericalConstantChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const numericValue = parseInt(event.target.value, 10);
      const isNumeric = !Number.isNaN(numericValue);
      if (isNumeric || event.target.value === '0') {
        setValue('numericalConstantValue', numericValue, {
          shouldDirty: true,
          shouldValidate: true,
        });
      }
    },
    [setValue],
  );

  const handleStringConstantChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setValue('stringConstantValue', event.target.value, {
        shouldDirty: true,
        shouldValidate: true,
      });
    },
    [setValue],
  );

  const handleAttributeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const attribute = allAttributes?.find((attr) => attr?.id === e?.target?.value);
      setSelectedAttribute(attribute);
      setValue('customSignalType', attribute?.customSignalType);
      resetFields(true);
      switch (attribute?.customSignalType) {
        case CustomSignalType.PlayerCategorical:
        case CustomSignalType.PlayerNumerical:
          setValue('playerAttributeId', attribute?.id);
          break;
        case CustomSignalType.ServerCategorical:
        case CustomSignalType.ServerNumerical:
          setValue('serverAttributeId', attribute?.id);
          break;
        default:
      }
    },
    [allAttributes, resetFields, setValue],
  );

  const handleAggregationTypeChange = useCallback(
    (aggregationType: AggregationType) => {
      setValue('aggregationType', aggregationType, {
        shouldDirty: true,
        shouldValidate: true,
      });
      resetField('numericalConstantValue');
    },
    [resetField, setValue],
  );

  const handleComparisonTypeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const comparisonType = e?.target?.value as ComparisonType;
      setValue('comparisonType', comparisonType, {
        shouldDirty: true,
        shouldValidate: true,
      });
      resetFields(false);
      setSelectedPlayerAttribute(undefined);
    },
    [resetFields, setValue],
  );

  const handleDistributionTypeChange = useCallback(
    (distributionType: DistributionType) => {
      setValue('distributionType', distributionType, {
        shouldDirty: true,
        shouldValidate: true,
      });
    },
    [setValue],
  );

  const playerAttributesInfo = useMemo(() => {
    return allAttributes?.filter(
      (attr) =>
        attr.customSignalType === CustomSignalType.PlayerCategorical ||
        attr.customSignalType === CustomSignalType.PlayerNumerical,
    );
  }, [allAttributes]);

  const handlePlayerAttributeChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setValue('playerAttributeId', event.target.value, {
        shouldDirty: true,
        shouldValidate: true,
      });
      const playerAttr = playerAttributesInfo?.find((attr) => attr.id === event.target.value);
      setSelectedPlayerAttribute(playerAttr);
    },
    [playerAttributesInfo, setValue],
  );

  const formContent = useMemo(() => {
    if (!selectedAttribute?.customSignalType) {
      return undefined;
    }
    switch (selectedAttribute?.customSignalType) {
      case CustomSignalType.PlayerNumerical:
        return (
          <PlayerNumericalSignalForm
            hasMaxDiffErrors={!!errors?.maxRelevantDifference}
            hasNumericalConstantErrors={!!errors?.numericalConstantValue}
            attribute={selectedAttribute}
            aggregationType={formValues.aggregationType}
            control={control}
            paths={{
              maxDiffPath: 'maxRelevantDifference',
              numericalConstantPath: 'numericalConstantValue',
            }}
            onMaxDiffChange={handleMaxDiffChange}
            onAggregationTypeChange={handleAggregationTypeChange}
            onNumericalConstantChange={handleNumericalConstantChange}
            name='playerAttributeId'
          />
        );
      case CustomSignalType.PlayerCategorical:
        return (
          <PlayerCategoricalSignalForm
            attribute={selectedAttribute}
            distributionType={formValues.distributionType}
            onDistributionTypeChange={handleDistributionTypeChange}
          />
        );
      case CustomSignalType.ServerNumerical:
        return (
          <ServerNumericalSignalForm
            hasMaxDiffErrors={!!errors?.maxRelevantDifference}
            hasNumericalConstantErrors={!!errors?.numericalConstantValue}
            attribute={selectedAttribute}
            selectedPlayerAttribute={selectedPlayerAttribute}
            playerAttributes={playerAttributesInfo}
            comparisonType={formValues.comparisonType}
            control={control}
            paths={{
              comparisonType: 'comparisonType',
              maxDiffPath: 'maxRelevantDifference',
              numericalConstantPath: 'numericalConstantValue',
              playerAttributePath: 'playerAttributeId',
            }}
            onMaxDiffChange={handleMaxDiffChange}
            onPlayerAttributeChange={handlePlayerAttributeChange}
            onComparisonTypeChange={handleComparisonTypeChange}
            onNumericalConstantChange={handleNumericalConstantChange}
            name='serverAttributeId'
          />
        );
      case CustomSignalType.ServerCategorical:
        return (
          <ServerCategoricalSignalForm
            hasStringConstantErrors={!!errors?.stringConstantValue}
            attribute={selectedAttribute}
            playerAttributes={playerAttributesInfo}
            selectedPlayerAttribute={selectedPlayerAttribute}
            comparisonType={formValues.comparisonType}
            control={control}
            paths={{
              comparisonType: 'comparisonType',
              maxDiffPath: 'maxRelevantDifference',
              stringConstantPath: 'stringConstantValue',
              playerAttributePath: 'playerAttributeId',
            }}
            onPlayerAttributeChange={handlePlayerAttributeChange}
            onComparisonTypeChange={handleComparisonTypeChange}
            onStringConstantChange={handleStringConstantChange}
            name='serverAttributeId'
          />
        );
      default:
        return undefined;
    }
  }, [
    control,
    errors?.maxRelevantDifference,
    errors?.numericalConstantValue,
    errors?.stringConstantValue,
    formValues.aggregationType,
    formValues.comparisonType,
    formValues.distributionType,
    handleAggregationTypeChange,
    handleComparisonTypeChange,
    handleDistributionTypeChange,
    handleMaxDiffChange,
    handleNumericalConstantChange,
    handlePlayerAttributeChange,
    handleStringConstantChange,
    playerAttributesInfo,
    selectedAttribute,
    selectedPlayerAttribute,
  ]);

  return (
    <Grid
      sx={{ minWidth: { xs: '350px', sm: '500px', md: '1000px' }, mb: 2 }}
      container
      direction='column'
      className={signalFormContainer}>
      <Typography style={{ marginBottom: 10 }} variant='captionHeader' color='primary'>
        {translate('Dialog.SignalDetails')}
      </Typography>
      <Controller
        name='name'
        control={control}
        rules={formOptions.name}
        render={({ field }) => (
          <TextField
            {...field}
            error={!!errors.name}
            fullWidth
            required
            id='name'
            disabled={isEditingSignal}
            inputProps={{ maxLength: formOptions.name.maxLength }}
            label={translate('Dialog.SignalName')}
            helperText={
              errors.name && errors.name.message ? translate(errors.name?.message ?? '') : null
            }
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setValue('name', e.target.value, {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
          />
        )}
      />
      <Controller
        name='description'
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            fullWidth
            id='description'
            inputProps={{ maxLength: formOptions.description.maxLength }}
            label={translate('Dialog.Description')}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setValue('description', e.target.value, {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
          />
        )}
      />
      <Typography style={{ marginTop: 20 }} variant='captionHeader' color='primary'>
        {translate('Dialog.SignalConfiguration')}
      </Typography>
      <Typography variant='captionBody' color='primary'>
        {translate('Dialog.AttributeReferenced')}
      </Typography>
      <Select
        value={selectedAttribute?.id}
        disabled={!allAttributes}
        label={translate('Dialog.Attribute')}
        fullWidth
        required
        onChange={handleAttributeChange}>
        {allAttributes &&
          allAttributes.map((attribute) => (
            <MenuItem key={attribute.id} value={attribute.id}>
              {getAttributeName(attribute)}
            </MenuItem>
          ))}
      </Select>
      {selectedAttribute && (
        <Fragment>
          <Fragment key={selectedAttribute?.id}>{formContent}</Fragment>
          <Fragment>
            <Divider />
            <SignalPreviewAccordion
              disabled={isFormInvalid}
              signalValues={formValues}
              attribute={selectedAttribute}
              selectedPlayerAttributeName={selectedPlayerAttribute?.playerAttribute?.name}
            />
            <Divider className={divider} />
          </Fragment>
        </Fragment>
      )}
    </Grid>
  );
};

export default CustomSignalForm;
