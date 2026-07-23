import type { FunctionComponent } from 'react';
import React, { useCallback, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { CustomSignalType } from '@rbx/client-matchmaking-api/v1';
import { useTranslation } from '@rbx/intl';
import { Dialog, Grid, Divider, DialogTitle, DialogContent, DialogActions, Button } from '@rbx/ui';
import { FormMode } from '@modules/miscellaneous/common';
import AggregationType from '../enums/AggregationType';
import ComparisonType from '../enums/ComparisonType';
import useConfigurationManagement from '../hooks/useConfigurationManagement';
import useShowToastMessage from '../hooks/useShowToastMessage';
import type { AttributesInfo } from '../types/AttributesInfo';
import type { CustomSignal, CustomSignalFormValues } from '../types/ConfigurationInfo';
import {
  getCustomSignalDefaultValues,
  getCustomSignalFailureLabel,
  getCustomSignalFromFormValues,
  getCustomSignalSuccessLabel,
} from '../utils/FormUtils';
import useCustomSignalStyles from './CustomSignalDialog.styles';
import CustomSignalForm from './CustomSignalForm';

export interface CustomSignalDialogProps {
  configId: string;
  isDialogOpen: boolean;
  currentSignal?: CustomSignal;
  allAttributes?: AttributesInfo[];
  onClose: () => void;
  onConfirm: (customSignal: CustomSignal) => void;
  onDelete: (signalName: string) => void;
}

const CustomSignalDialog: FunctionComponent<React.PropsWithChildren<CustomSignalDialogProps>> = ({
  configId,
  isDialogOpen,
  currentSignal,
  allAttributes,
  onClose,
  onConfirm,
  onDelete,
}) => {
  const formReturn = useForm({
    mode: FormMode.OnTouched,
    reValidateMode: FormMode.OnChange,
    defaultValues: getCustomSignalDefaultValues(currentSignal),
  });
  const { handleAddCustomSignal, handleUpdateCustomSignal, handleDeleteCustomSignal } =
    useConfigurationManagement();
  const {
    classes: { dialogGrid, button },
  } = useCustomSignalStyles();
  const { translate } = useTranslation();
  const { showSuccessToast, showFailureToast } = useShowToastMessage();
  const formValues = formReturn.watch();

  const isInvalidForm = useMemo(() => {
    const {
      customSignalType,
      aggregationType,
      playerAttributeId,
      serverAttributeId,
      name,
      comparisonType,
      numericalConstantValue,
      stringConstantValue,
      maxRelevantDifference,
      distributionType,
    } = formValues;

    if (!name) {
      return true;
    }
    switch (customSignalType) {
      case CustomSignalType.PlayerCategorical:
        return !playerAttributeId || !distributionType;
      case CustomSignalType.PlayerNumerical:
        return !playerAttributeId ||
          !aggregationType ||
          !maxRelevantDifference ||
          aggregationType === AggregationType.Sum
          ? !numericalConstantValue
          : false;
      case CustomSignalType.ServerCategorical:
        return (
          !serverAttributeId ||
          !comparisonType ||
          (comparisonType === ComparisonType.Player ? !playerAttributeId : false) ||
          (comparisonType === ComparisonType.ConstantValue ? !stringConstantValue : false)
        );
      case CustomSignalType.ServerNumerical:
        return (
          !serverAttributeId ||
          !comparisonType ||
          !maxRelevantDifference ||
          (comparisonType === ComparisonType.ConstantValue ? !numericalConstantValue : false)
        );
      default:
        return true;
    }
  }, [formValues]);

  const isEditingSignal = useMemo(() => {
    return currentSignal !== undefined;
  }, [currentSignal]);

  const buttonLabel = useMemo(() => {
    return isEditingSignal ? 'Button.SaveChanges' : 'Button.CreateSignal';
  }, [isEditingSignal]);

  const handleSaveSignal = useCallback(async () => {
    const customSignal = getCustomSignalFromFormValues(formValues);
    let isSuccessful = false;
    if (!isEditingSignal) {
      isSuccessful = await handleAddCustomSignal(customSignal, configId);
    } else {
      isSuccessful = await handleUpdateCustomSignal(customSignal, customSignal?.name, configId);
    }
    if (isSuccessful) {
      showSuccessToast(getCustomSignalSuccessLabel(false, isEditingSignal), translate);
      // Reset form after successful save so next time dialog opens it's fresh
      if (!isEditingSignal) {
        formReturn.reset(getCustomSignalDefaultValues(undefined));
      }
      onConfirm(customSignal);
    } else {
      showFailureToast(getCustomSignalFailureLabel(false, isEditingSignal), translate);
    }
  }, [
    configId,
    formValues,
    formReturn,
    handleAddCustomSignal,
    handleUpdateCustomSignal,
    isEditingSignal,
    onConfirm,
    showFailureToast,
    showSuccessToast,
    translate,
  ]);

  const handleDeleteSignal = useCallback(async () => {
    const isSuccessful = await handleDeleteCustomSignal(configId, currentSignal?.name ?? '');
    if (isSuccessful) {
      showSuccessToast(getCustomSignalSuccessLabel(true, isEditingSignal), translate);
      onDelete(currentSignal?.name ?? '');
    } else {
      showFailureToast(getCustomSignalFailureLabel(true, isEditingSignal), translate);
    }
  }, [
    configId,
    currentSignal?.name,
    handleDeleteCustomSignal,
    isEditingSignal,
    onDelete,
    showFailureToast,
    showSuccessToast,
    translate,
  ]);

  return (
    <Dialog open={isDialogOpen} maxWidth='Large'>
      <DialogTitle>{translate('Dialog.CustomSignal')} </DialogTitle>
      <DialogContent>
        <Grid className={dialogGrid}>
          <Divider />
          <CustomSignalForm
            name='name'
            isFormInvalid={isInvalidForm}
            isEditingSignal={isEditingSignal}
            allAttributes={allAttributes}
            formReturn={formReturn}
            formValues={formValues}
          />
        </Grid>
      </DialogContent>
      <DialogActions>
        <Grid
          container
          display='flex'
          justifyContent={isEditingSignal ? 'space-between' : 'flex-end'}>
          {isEditingSignal && (
            <Grid>
              <Button
                className={button}
                variant='contained'
                color='destructive'
                onClick={handleDeleteSignal}>
                {translate('Button.DeleteSignal')}
              </Button>
            </Grid>
          )}
          <Grid>
            <Button className={button} variant='contained' color='secondary' onClick={onClose}>
              {translate('Button.Cancel')}
            </Button>
            <Button
              disabled={isInvalidForm}
              variant='contained'
              color='primaryBrand'
              onClick={handleSaveSignal}>
              {translate(buttonLabel)}
            </Button>
          </Grid>
        </Grid>
      </DialogActions>
    </Dialog>
  );
};

export default CustomSignalDialog;
