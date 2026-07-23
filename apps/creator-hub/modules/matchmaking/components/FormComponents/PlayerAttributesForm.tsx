import React, { FunctionComponent, useCallback, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Grid, Typography, Link, TextField, Divider } from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
import FormMode from '@modules/miscellaneous/common/enums/FormMode';
import { useCurrentGame } from '@modules/providers/game/GameProvider';
import datastoresClient from '@modules/clients/datastores';
import { getProductionCreatorHubUrl } from '@rbx/env-utils';
import { maxSearchResults } from '../../constants';
import useConfigureAttributesFormStyles from './ConfigureAttributesForm.styles';
import AttributeDataType from '../../enums/AttributeDataType';
import {
  getPlayerAttributesFormOptions,
  getPlayerAttributesFormDefaultValues,
  getBooleanValueType,
} from '../../utils/FormUtils';
import BooleanValueType from '../../enums/BooleanValueType';
import { PlayerAttributesDetailedInfo } from '../../types/AttributesInfo';
import AttributeDataTypeSelect from './AttributeDataTypeSelect';
import ConstantValueSelection from './ConstantValueSelection';
import MatchmakingButtonGroup from './MatchmakingButtonGroup';
import NameTextField from './NameTextField';
import DataStoreAutocomplete from './DataStoreAutocomplete';

export type PlayerAttributesFormProps = {
  currentAttribute?: PlayerAttributesDetailedInfo;
  isEditingAttribute: boolean;
  onSave: (attribute: PlayerAttributesDetailedInfo) => void;
  onCancel: () => void;
  onDelete: () => void;
};

const PlayerAttributesForm: FunctionComponent<
  React.PropsWithChildren<PlayerAttributesFormProps>
> = ({ currentAttribute, isEditingAttribute, onSave, onCancel, onDelete }) => {
  const {
    classes: { container, dataStoreFormContainer, dataStoreTitleContainer, divider },
  } = useConfigureAttributesFormStyles();
  const { translate, translateHTML } = useTranslation();
  const { gameDetails } = useCurrentGame();
  // setup form
  const { control, formState, getValues, resetField, setValue } =
    useForm<PlayerAttributesDetailedInfo>({
      mode: FormMode.OnTouched,
      reValidateMode: FormMode.OnChange,
      defaultValues: getPlayerAttributesFormDefaultValues(currentAttribute),
    });
  const { errors, isDirty, isValid, isValidating } = formState;
  const [dataType, setDataType] = useState<AttributeDataType | null>(
    currentAttribute?.dataType ?? null,
  );
  const [booleanDataValue, setBooleanDataValue] = useState<BooleanValueType | null>(
    currentAttribute?.dataType === AttributeDataType.Boolean
      ? getBooleanValueType(currentAttribute?.constantValue ?? null)
      : null,
  );
  const [isLoadingDataStoreNames, setIsLoadingDataStoreNames] = useState(false);
  const [dataStoreNames, setDataStoreNames] = useState<string[]>([]);

  const formOptions = useMemo(() => {
    return getPlayerAttributesFormOptions(dataType);
  }, [dataType]);

  const handleDataTypeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedType = AttributeDataType[event.target.value as keyof typeof AttributeDataType];
    resetField('constantValue', { defaultValue: '' });
    setBooleanDataValue(null);
    setDataType(selectedType);
  };

  const getDataStoreNames = useCallback(
    (input: string) => {
      const gameId = gameDetails?.id;
      if (gameId) {
        setIsLoadingDataStoreNames(true);
        datastoresClient
          .listDatastores(gameId, maxSearchResults, '', input)
          .then((response) => {
            const dataStores = response.datastores.map((datastore) => datastore.name);
            setDataStoreNames(dataStores);
          })
          .catch(() => {
            throw new Error('failed to fetch datastores');
          })
          .finally(() => {
            setIsLoadingDataStoreNames(false);
          });
      }
    },
    [gameDetails?.id],
  );

  const handleRadioOnchange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedType = BooleanValueType[event.target.value as keyof typeof BooleanValueType];
    setBooleanDataValue(selectedType);
  };

  const dataStoreDescription = translateHTML('Description.DataStoreLearnMore', [
    {
      opening: 'startLink',
      closing: 'endLink',
      content(chunks) {
        return (
          <Link
            href={`${getProductionCreatorHubUrl(process.env.buildTarget)}/docs/matchmaking/attributes-and-signals#custom-attributes`}
            target='_blank'
            underline='always'>
            {chunks}
          </Link>
        );
      },
    },
  ]);

  const handlePlayerFormUpdate = useCallback(() => {
    const formValues = getValues();
    onSave(formValues);
  }, [getValues, onSave]);

  const onDataStoreNameSelect = useCallback(
    (name: string) => {
      setValue('dataStoreLocation.dataStoreName', name);
    },
    [setValue],
  );

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
          errorMessage={errors.dataType?.message ?? ''}
          isDisabled={!!isEditingAttribute}
          name='dataType'
          control={control}
          formState={formState}
          handleChange={handleDataTypeChange}
        />
        <ConstantValueSelection
          errorMessage={errors.constantValue?.message ?? ''}
          dataType={dataType}
          isRequired
          booleanDataValue={booleanDataValue}
          handleRadioChange={handleRadioOnchange}
          formState={formState}
          control={control}
          name='constantValue'
        />
      </Grid>
      <Grid className={dataStoreFormContainer}>
        <Grid container direction='column' className={dataStoreTitleContainer}>
          <Typography variant='h1'>{translate('Heading.DataStoreSettings')}</Typography>
          <Typography variant='body1'>{dataStoreDescription}</Typography>
        </Grid>
        <DataStoreAutocomplete
          formState={formState}
          control={control}
          name='dataStoreLocation.dataStoreName'
          isEditActive
          isLoading={isLoadingDataStoreNames}
          selectedDataStoreName={getValues('dataStoreLocation.dataStoreName') ?? undefined}
          dataStoreNames={dataStoreNames}
          onNameSelect={onDataStoreNameSelect}
          onInputChange={getDataStoreNames}
        />
        <Controller
          name='dataStoreLocation.keyTemplate'
          control={control}
          rules={formOptions.dataStoreLocation.keyTemplate}
          render={({ field }) => (
            <TextField
              {...field}
              error={!!errors.dataStoreLocation?.keyTemplate}
              fullWidth
              required
              id='dataStoreKeyTemplate'
              inputProps={{ maxLength: 100 }}
              label={translate('Label.DataStoreKeyTemplate')}
              helperText={
                errors.dataStoreLocation?.keyTemplate &&
                errors.dataStoreLocation?.keyTemplate.message
                  ? translate(errors.dataStoreLocation?.keyTemplate?.message ?? '')
                  : translate('Description.DataStoreKeyTemplate')
              }
            />
          )}
        />
        <Controller
          name='dataStoreLocation.valuePath'
          control={control}
          rules={formOptions.dataStoreLocation.valuePath}
          render={({ field }) => (
            <TextField
              {...field}
              error={!!errors.dataStoreLocation?.valuePath}
              fullWidth
              id='dataStorePath'
              inputProps={{ maxLength: 100 }}
              label={translate('Label.DataStoreValuePath')}
              helperText={translate('Description.DataStoreValuePath')}
            />
          )}
        />
        <Controller
          name='dataStoreLocation.scope'
          control={control}
          rules={formOptions.dataStoreLocation.scope}
          render={({ field }) => (
            <TextField
              {...field}
              error={!!errors.dataStoreLocation?.scope}
              fullWidth
              id='dataStoreScope'
              inputProps={{ maxLength: 100 }}
              label={translate('Label.DataStoreScope')}
              helperText={translate('Description.DataStoreScope')}
            />
          )}
        />
      </Grid>
      <Divider className={divider} />
      <MatchmakingButtonGroup
        onSave={handlePlayerFormUpdate}
        onCancel={onCancel}
        onDelete={onDelete}
        showDeleteButton={!!isEditingAttribute}
        isDeleteAllowed
        isSavingDisabled={!isDirty || (!isValidating && !isValid)}
      />
    </Grid>
  );
};

export default PlayerAttributesForm;
