import React, { Fragment, FunctionComponent, useCallback, useMemo, useRef } from 'react';
import { Controller, Control, useFormContext, ControllerRenderProps } from 'react-hook-form';
import { FormControlLabel, Grid, Switch, Typography, RadioGroup, useDialog } from '@rbx/ui';
import { useTranslation, withTranslation } from '@rbx/intl';
import { useTranslationWrapper, translationKey } from '@modules/analytics-translations';
import TranslationNamespace from '@modules/miscellaneous/localization/enums/TranslationNamespace';
import { TUnlockServiceForm, resourceIdToUnlockTranslationKeys, ResourceId } from '../../types';
import useResourceConfigurationFormStyles from './ResourceConfigurationForm.styles';
import getBudgetRules from '../../../utils/getBudgetRules';
import { numberFormatter } from '../../../utils/formatters';
import { pricingLinkTags, BudgetField, buildConfirmResetDialog } from '../shared/FormHelpers';

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
> = ({ originalValue, control, index, serviceIndex, disableSwitch = false, saveWarning }) => {
  const { open, close: closeDialog, configure } = useDialog();
  const { formState, watch, setValue, resetField } = useFormContext();
  const { errors, dirtyFields } = formState;
  const {
    classes: {
      currencySymbol,
      resourceTitle,
      resourceDescription,
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

  const handleUnlockClick = useCallback(
    async (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
      if ((e.target as HTMLInputElement).checked) {
        if (!dirtyFields.unlockConfiguration?.[index]?.isUnlocked) {
          configure(confirmResetServiceLimitDialog);
          open();
        } else {
          resetField(
            `unlockConfiguration.${serviceIndex}.resourceConfigurations.${index}.monthlyBudget`,
          );
        }
      }
    },
    [
      dirtyFields.unlockConfiguration,
      index,
      serviceIndex,
      configure,
      confirmResetServiceLimitDialog,
      open,
      resetField,
    ],
  );

  const handleUnlockChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
    fieldOnChange: ControllerRenderProps<
      TUnlockServiceForm,
      `unlockConfiguration.${number}.resourceConfigurations.${number}.isUnlocked`
    >['onChange'],
  ) => {
    await fieldOnChange(e);
    if (e.target.checked && monthlyBudget === '') {
      budgetFieldRef.current?.focus();
    }
  };

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

  return (
    <Grid container item direction='row' XSmall={12} spacing={0}>
      <Grid container item justifyContent='space-between' alignItems='center' wrap='nowrap'>
        <Grid item>
          <Controller
            name={`unlockConfiguration.${serviceIndex}.resourceConfigurations.${index}.resourceId`}
            render={({ field: renderField }) => (
              <Fragment>
                <Typography variant='subtitle2' component='div' className={resourceTitle}>
                  {translate(
                    translationKey(
                      resourceIdToUnlockTranslationKeys[renderField.value as ResourceId].title,
                      TranslationNamespace.CloudServices,
                    ),
                  )}
                </Typography>
                <Controller
                  name={`unlockConfiguration.${serviceIndex}.resourceConfigurations.${index}.price`}
                  render={({ field: unitCostField }) => (
                    <Typography variant='body2' className={resourceDescription}>
                      {translateHTML(
                        translationKey(
                          resourceIdToUnlockTranslationKeys[renderField.value as ResourceId]
                            .description,
                          TranslationNamespace.CloudServices,
                        ),
                        pricingLinkTags(),
                        {
                          unitCost: unitCostField.value.cost,
                          unitAmount: numberFormatter(unitCostField.value.unitAmount),
                        },
                      )}
                    </Typography>
                  )}
                />
              </Fragment>
            )}
          />
        </Grid>
        <Grid item>
          <Controller
            name={`unlockConfiguration.${serviceIndex}.resourceConfigurations.${index}.isUnlocked`}
            control={control}
            render={({ field: renderField }) => (
              <FormControlLabel
                control={
                  <Switch
                    disabled={disableSwitch}
                    aria-label={translate(
                      translationKey('Action.Unlock', TranslationNamespace.CloudServices),
                    )}
                    checked={renderField.value}
                    onMouseDown={(e) => handleUnlockClick(e)}
                    onChange={(e) => handleUnlockChange(e, renderField.onChange)}
                  />
                }
                label=''
              />
            )}
          />
        </Grid>
      </Grid>
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
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- (@mbae, 05/09/24) React 18 migration: Owners need to properly type their form context
                        !!(errors?.unlockConfiguration as any)?.[serviceIndex]
                          ?.resourceConfigurations?.[index]?.resourceBudget
                      }
                      errorMessage={
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- (@mbae, 05/09/24) React 18 migration: Owners need to properly type their form context
                        (errors?.unlockConfiguration as any)?.[serviceIndex]
                          ?.resourceConfigurations?.[index]?.resourceBudget?.message || ''
                      }
                      currency={currencyField.value}
                      budgetFieldRef={budgetFieldRef}
                      currencySymbolClassName={currencySymbol}
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
