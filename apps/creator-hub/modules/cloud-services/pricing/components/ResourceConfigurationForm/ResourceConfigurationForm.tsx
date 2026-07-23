import type { FunctionComponent } from 'react';
import React, { useCallback, useMemo, useRef } from 'react';
import type { Control, ControllerRenderProps } from 'react-hook-form';
import { Controller, useFormContext } from 'react-hook-form';
import { useTranslation, withTranslation } from '@rbx/intl';
import { Grid, RadioGroup, useDialog } from '@rbx/ui';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import TranslationNamespace from '@modules/miscellaneous/localization/enums/TranslationNamespace';
import { numberFormatter } from '../../../utils/formatters';
import getBudgetRules from '../../../utils/getBudgetRules';
import type { TUnlockServiceForm } from '../../types';
import { resourceIdToUnlockTranslationKeys } from '../../types';
import { pricingLinkTags, BudgetField, buildConfirmResetDialog } from '../shared/FormHelpers';
import UnlockToggleRow from '../shared/UnlockToggleRow';
import useResourceConfigurationFormStyles from './ResourceConfigurationForm.styles';

type TResourceConfigurationFormProps = {
  originalValue: number;
  control: Control<TUnlockServiceForm>;
  index: number;
  serviceIndex: number;
  disableSwitch: boolean;
  saveWarning: (displayWarning: boolean) => void;
};

const ResourceConfigurationForm: FunctionComponent<
  React.PropsWithChildren<TResourceConfigurationFormProps>
> = ({ originalValue, control, index, serviceIndex, disableSwitch, saveWarning }) => {
  const { open, close: closeDialog, configure } = useDialog();
  const { formState, watch, setValue, resetField } = useFormContext<TUnlockServiceForm>();
  const { errors, dirtyFields } = formState;
  const {
    classes: {
      resourceFormContainer,
      descriptionText,
      hidden,
      errorMessageContainer,
      budgetTextField,
    },
    cx,
  } = useResourceConfigurationFormStyles();
  const budgetFieldRef = useRef<HTMLInputElement | null>(null);
  const { translate, translateHTML } = useTranslationWrapper(useTranslation());
  const isUnlocked = watch(
    `unlockConfiguration.${serviceIndex}.resourceConfigurations.${index}.isUnlocked`,
  );
  // We make all changes on the resourceBudget object rather than on the monthlyBudget field to avoid complicated reformatting logic.
  const monthlyBudget = watch(
    `unlockConfiguration.${serviceIndex}.resourceConfigurations.${index}.resourceBudget`,
  );

  const confirmResetServiceLimitDialog = useMemo(
    () =>
      buildConfirmResetDialog({
        translate: translate as (key: ReturnType<typeof translationKey>) => string,
        onConfirm: () => {
          setValue(
            `unlockConfiguration.${serviceIndex}.resourceConfigurations.${index}.isUnlocked`,
            false,
            {
              shouldValidate: true,
              shouldDirty: true,
            },
          );
          resetField(
            `unlockConfiguration.${serviceIndex}.resourceConfigurations.${index}.resourceBudget`,
          );
          closeDialog();
        },
        onCancel: () => {
          closeDialog();
        },
      }),
    [closeDialog, index, serviceIndex, setValue, resetField, translate],
  );

  const handleUnlockToggleChange = useCallback(
    (
      checked: boolean,
      currentValue: boolean,
      fieldOnChange: ControllerRenderProps<
        TUnlockServiceForm,
        `unlockConfiguration.${number}.resourceConfigurations.${number}.isUnlocked`
      >['onChange'],
    ) => {
      if (currentValue && !checked) {
        if (
          !dirtyFields.unlockConfiguration?.[serviceIndex]?.resourceConfigurations?.[index]
            ?.isUnlocked
        ) {
          configure(confirmResetServiceLimitDialog);
          open();
          return;
        }
        resetField(
          `unlockConfiguration.${serviceIndex}.resourceConfigurations.${index}.monthlyBudget`,
        );
      }
      fieldOnChange(checked);
      if (checked && monthlyBudget === '') {
        budgetFieldRef.current?.focus();
      }
    },
    [
      configure,
      confirmResetServiceLimitDialog,
      dirtyFields.unlockConfiguration,
      index,
      monthlyBudget,
      open,
      resetField,
      serviceIndex,
    ],
  );

  const budgetRules = useMemo(() => getBudgetRules(isUnlocked, translate), [isUnlocked, translate]);

  const handleLimitChange = useCallback(
    (
      e: React.ChangeEvent<HTMLInputElement>,
      fieldOnChange: ControllerRenderProps['onChange'],
      budget: string,
    ) => {
      const currentInput = budget;
      fieldOnChange(currentInput);
      if (e.target.value === 'false') {
        budgetFieldRef.current?.focus();
      }
    },
    [budgetFieldRef],
  );

  const ariaUnlock = translate(
    translationKey('Action.Unlock', TranslationNamespace.CloudServices),
  ) as string;

  return (
    <Grid container item direction='column' XSmall={12} spacing={0}>
      <Controller
        name={`unlockConfiguration.${serviceIndex}.resourceConfigurations.${index}.resourceId`}
        control={control}
        render={({ field: renderField }) => {
          const resourceId = renderField.value;
          const title = translate(
            translationKey(
              resourceIdToUnlockTranslationKeys[resourceId].title,
              TranslationNamespace.CloudServices,
            ),
          ) as string;
          return (
            <Controller
              name={`unlockConfiguration.${serviceIndex}.resourceConfigurations.${index}.price`}
              control={control}
              render={({ field: unitCostField }) => {
                const description = translateHTML(
                  translationKey(
                    resourceIdToUnlockTranslationKeys[resourceId].description,
                    TranslationNamespace.CloudServices,
                  ),
                  pricingLinkTags(),
                  {
                    unitCost: unitCostField.value.cost,
                    unitAmount: numberFormatter(unitCostField.value.unitAmount),
                  },
                );
                return (
                  <Controller
                    name={`unlockConfiguration.${serviceIndex}.resourceConfigurations.${index}.isUnlocked`}
                    control={control}
                    render={({ field: toggleField }) => (
                      <UnlockToggleRow
                        title={title}
                        description={description}
                        isChecked={toggleField.value}
                        isDisabled={disableSwitch}
                        ariaLabel={ariaUnlock}
                        onCheckedChange={(checked: boolean) =>
                          handleUnlockToggleChange(checked, toggleField.value, toggleField.onChange)
                        }
                      />
                    )}
                  />
                );
              }}
            />
          );
        }}
      />
      <Grid item className={cx(resourceFormContainer, { [hidden]: !isUnlocked })}>
        <Controller
          name={`unlockConfiguration.${serviceIndex}.resourceConfigurations.${index}.resourceBudget`}
          control={control}
          rules={budgetRules}
          render={({ field: monthlyBudgetField }) => (
            <RadioGroup
              {...monthlyBudgetField}
              value={monthlyBudgetField.value}
              onChange={(e) =>
                handleLimitChange(e, monthlyBudgetField.onChange, monthlyBudgetField.value)
              }
              name={`unlockConfiguration.${serviceIndex}.resourceConfigurations.${index}.isUnlocked`}
              id={`unlockConfiguration-${serviceIndex}-resourceConfigurations-${index}-isUnlocked`}>
              <Grid item XSmall={12}>
                <Controller
                  name={`unlockConfiguration.${serviceIndex}.resourceConfigurations.${index}.currency`}
                  control={control}
                  render={({ field: currencyField }) => (
                    <BudgetField
                      id={`unlockConfiguration-${serviceIndex}-resourceConfigurations-${index}-resourceBudget`}
                      disabled={disableSwitch}
                      value={monthlyBudgetField.value}
                      onChange={(e) => {
                        monthlyBudgetField.onChange(e.target.value);
                        saveWarning(
                          monthlyBudgetField.value.length > 0 &&
                            parseInt(e.target.value, 10) < originalValue,
                        );
                      }}
                      onFocus={(e) => monthlyBudgetField.onChange(e.target.value)}
                      error={
                        !!errors?.unlockConfiguration?.[serviceIndex]?.resourceConfigurations?.[
                          index
                        ]?.resourceBudget
                      }
                      errorMessage={
                        errors?.unlockConfiguration?.[serviceIndex]?.resourceConfigurations?.[index]
                          ?.resourceBudget?.message ?? ''
                      }
                      currency={currencyField.value}
                      budgetFieldRef={budgetFieldRef}
                      budgetTextFieldClassName={budgetTextField}
                      errorContainerClassName={errorMessageContainer}
                      descriptionClassName={descriptionText}
                    />
                  )}
                />
              </Grid>
            </RadioGroup>
          )}
        />
      </Grid>
    </Grid>
  );
};

export default withTranslation(ResourceConfigurationForm, [TranslationNamespace.CloudServices]);
