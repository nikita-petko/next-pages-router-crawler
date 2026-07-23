import React, { FunctionComponent, useCallback, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Grid, Select, MenuItem, Divider } from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
import FormMode from '@modules/miscellaneous/common/enums/FormMode';
import useConfigureAttributesFormStyles from './ConfigureAttributesForm.styles';
import AttributeDataType from '../../enums/AttributeDataType';
import {
  getServerAttributesFormOptions,
  getServerAttributesFormDefaultValues,
  getBooleanValueType,
} from '../../utils/FormUtils';
import BooleanValueType from '../../enums/BooleanValueType';
import MatchmakingButtonGroup from './MatchmakingButtonGroup';
import { PlayerAttributesBriefInfo, ServerAttributesInfo } from '../../types/AttributesInfo';
import ConstantValueSelection from './ConstantValueSelection';
import NameTextField from './NameTextField';
import AttributeDataTypeSelect from './AttributeDataTypeSelect';
import { EqualityMatchAttributeType } from '../../enums/MatchAttributeType';
import { defaultValueTypeTranslationKeys } from '../../utils/translationGetter';

export type ServerAttributesFormProps = {
  currentAttribute?: ServerAttributesInfo;
  existingPlayerAttributes?: PlayerAttributesBriefInfo[];
  isEditingAttribute: boolean;
  onSave: (attribute: ServerAttributesInfo) => void;
  onCancel: () => void;
  onDelete: () => void;
};

const ServerAttributesForm: FunctionComponent<
  React.PropsWithChildren<ServerAttributesFormProps>
> = ({
  currentAttribute,
  existingPlayerAttributes,
  isEditingAttribute,
  onSave,
  onCancel,
  onDelete,
}) => {
  // setup form
  const { control, formState, resetField, getValues, setValue } = useForm<ServerAttributesInfo>({
    mode: FormMode.OnTouched,
    reValidateMode: FormMode.OnChange,
    defaultValues: getServerAttributesFormDefaultValues(currentAttribute),
  });
  const { errors, isDirty, isValid, isValidating } = formState;
  const {
    classes: { container, divider },
  } = useConfigureAttributesFormStyles();
  const { translate } = useTranslation();

  const [dataType, setDataType] = useState<AttributeDataType | null>(
    currentAttribute?.dataType ?? null,
  );
  const [booleanDataValue, setBooleanDataValue] = useState<BooleanValueType | null>(
    currentAttribute?.dataType === AttributeDataType.Boolean
      ? getBooleanValueType(currentAttribute?.constantValue ?? null)
      : null,
  );
  const [defaultValueType, setDefaultValueType] = useState<EqualityMatchAttributeType | undefined>(
    currentAttribute?.defaultValueType ?? undefined,
  );

  const formOptions = useMemo(() => {
    return getServerAttributesFormOptions(dataType, defaultValueType);
  }, [dataType, defaultValueType]);

  const filteredPlayerAttributes = existingPlayerAttributes?.filter(
    (attribute) => attribute.dataType === dataType,
  );

  const matchingPlayerAttributeHelperText = useMemo(() => {
    if (errors.matchingPlayerAttribute) {
      return translate(errors.matchingPlayerAttribute?.message ?? '');
    }
    if (!filteredPlayerAttributes) {
      return translate('Error.NoPlayerAttribute');
    }
    return null;
  }, [errors.matchingPlayerAttribute, filteredPlayerAttributes, translate]);

  const handleDataTypeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedType = AttributeDataType[event.target.value as keyof typeof AttributeDataType];
    resetField('constantValue', { defaultValue: '' });
    setBooleanDataValue(null);
    setDataType(selectedType);
  };

  const handleRadioOnchange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedType = BooleanValueType[event.target.value as keyof typeof BooleanValueType];
    setBooleanDataValue(selectedType);
  };

  const handleDefaultValueTypeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedType =
      EqualityMatchAttributeType[event.target.value as keyof typeof EqualityMatchAttributeType];
    resetField('matchingPlayerAttribute', { defaultValue: undefined });
    resetField('constantValue', { defaultValue: '' });
    setBooleanDataValue(null);
    setDefaultValueType(selectedType);
  };

  const handleServerFormUpdate = useCallback(() => {
    const formValues = getValues();
    onSave(formValues);
  }, [getValues, onSave]);

  return (
    <Grid container direction='column'>
      <Grid className={container}>
        <NameTextField
          isDisabled={!!currentAttribute}
          errorMessage={errors.name?.message ?? ''}
          formState={formState}
          control={control}
          name='name'
        />
        <AttributeDataTypeSelect
          isDisabled={!!isEditingAttribute}
          errorMessage={errors.dataType?.message ?? ''}
          name='dataType'
          control={control}
          formState={formState}
          handleChange={handleDataTypeChange}
        />
        {dataType && (
          <Controller
            name='defaultValueType'
            control={control}
            rules={formOptions.defaultValueType}
            render={({ field }) => (
              <Select
                {...field}
                error={!!errors.defaultValueType}
                label={translate('Label.MatchAttribute')}
                fullWidth
                required
                helperText={translate(errors.defaultValueType?.message ?? '') ?? null}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  field.onChange(e);
                  handleDefaultValueTypeChange(e);
                }}>
                {Object.values(EqualityMatchAttributeType).map((type) => (
                  <MenuItem key={type} value={type}>
                    {translate(defaultValueTypeTranslationKeys[type])}
                  </MenuItem>
                ))}
              </Select>
            )}
          />
        )}
        {defaultValueType === EqualityMatchAttributeType.PlayerAttribute && (
          <Controller
            name='matchingPlayerAttribute'
            control={control}
            rules={formOptions.matchingPlayerAttribute}
            render={({ field }) => (
              <Select
                {...field}
                value={field.value?.id}
                disabled={!filteredPlayerAttributes}
                error={!!errors.matchingPlayerAttribute}
                label={translate('Label.InferredPlayerAttribute')}
                fullWidth
                required
                helperText={matchingPlayerAttributeHelperText}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  const attribute = filteredPlayerAttributes?.find(
                    (attr) => attr.id === e?.target?.value,
                  );
                  field.onChange(e);
                  setValue('matchingPlayerAttribute', attribute, {
                    shouldDirty: true,
                    shouldValidate: true,
                  });
                }}>
                {filteredPlayerAttributes &&
                  filteredPlayerAttributes.map((attribute) => (
                    <MenuItem key={attribute.id} value={attribute.id}>
                      {attribute.name}
                    </MenuItem>
                  ))}
              </Select>
            )}
          />
        )}
        {defaultValueType === EqualityMatchAttributeType.ConstantValue && (
          <ConstantValueSelection
            errorMessage={errors.constantValue?.message ?? ''}
            dataType={dataType}
            isRequired={defaultValueType === EqualityMatchAttributeType.ConstantValue}
            booleanDataValue={booleanDataValue}
            handleRadioChange={handleRadioOnchange}
            formState={formState}
            control={control}
            name='constantValue'
          />
        )}
      </Grid>
      <Divider className={divider} />
      <MatchmakingButtonGroup
        onSave={handleServerFormUpdate}
        onCancel={onCancel}
        onDelete={onDelete}
        showDeleteButton={!!isEditingAttribute}
        isDeleteAllowed
        isSavingDisabled={!isDirty || (!isValidating && !isValid)}
      />
    </Grid>
  );
};

export default ServerAttributesForm;
