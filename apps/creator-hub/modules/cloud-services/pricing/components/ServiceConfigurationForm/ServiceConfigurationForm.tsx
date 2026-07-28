import type { FunctionComponent } from 'react';
import React, { useCallback, useMemo, useRef } from 'react';
import type { Control, ControllerRenderProps } from 'react-hook-form';
import { Controller, useFormContext } from 'react-hook-form';
import { useTranslation, withTranslation } from '@rbx/intl';
import { Grid, RadioGroup, useDialog } from '@rbx/ui';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import TranslationNamespace from '@modules/miscellaneous/localization/enums/TranslationNamespace';
import getBudgetRules from '../../../utils/getBudgetRules';
import type { TUnlockServiceForm } from '../../types';
import { resourceIdToUnlockTranslationKeys, ServiceId } from '../../types';
import { pricingLinkTags, BudgetField, buildConfirmResetDialog } from '../shared/FormHelpers';
import UnlockToggleRow from '../shared/UnlockToggleRow';
import useServiceConfigurationFormStyles from './ServiceConfigurationForm.styles';

type TServiceConfigurationFormProps = {
  control: Control<TUnlockServiceForm>;
  index: Array<number>;
  serviceIndex: number;
  disableSwitch: boolean;
  isServiceLevel?: boolean;
  serviceId?: string;
};

const ServiceConfigurationForm: FunctionComponent<
  React.PropsWithChildren<TServiceConfigurationFormProps>
> = ({ control, index, serviceIndex, disableSwitch, isServiceLevel = false, serviceId }) => {
  const isDataStoreOnly = isServiceLevel && serviceId === ServiceId.DataStore;
  const { open, close: closeDialog, configure } = useDialog();
  const { formState, watch, setValue, resetField } = useFormContext<TUnlockServiceForm>();
  const { errors } = formState;
  const {
    classes: {
      resourceFormContainer,
      radioLabel,
      descriptionText,
      hidden,
      errorMessageContainer,
      budgetTextField,
    },
    cx,
  } = useServiceConfigurationFormStyles();
  const budgetFieldRef = useRef<HTMLInputElement | null>(null);
  const { translate, translateHTML } = useTranslationWrapper(useTranslation());

  const isUnlocked = watch(
    `unlockConfiguration.${serviceIndex}.resourceConfigurations.${index[0]}.isUnlocked`,
  );
  const monthlyBudget = watch(`unlockConfiguration.${serviceIndex}.serviceBudget`);
  const confirmResetServiceLimitDialog = useMemo(
    () =>
      buildConfirmResetDialog({
        translate: translate as (key: ReturnType<typeof translationKey>) => string,
        onConfirm: () => {
          setValue(
            `unlockConfiguration.${serviceIndex}.resourceConfigurations.${index[0]}.isUnlocked`,
            false,
            { shouldValidate: true, shouldDirty: true },
          );
          resetField(`unlockConfiguration.${serviceIndex}.serviceBudget`);
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
      fieldOnChange: ControllerRenderProps<
        TUnlockServiceForm,
        `unlockConfiguration.${number}.resourceConfigurations.${number}.isUnlocked`
      >['onChange'],
    ) => {
      if (isUnlocked && !checked) {
        configure(confirmResetServiceLimitDialog);
        open();
        return;
      }
      fieldOnChange(checked);
      if (checked && monthlyBudget === '') {
        budgetFieldRef.current?.focus();
      }
    },
    [isUnlocked, configure, confirmResetServiceLimitDialog, open, monthlyBudget],
  );

  const handleLimitChange = useCallback(
    (
      e: React.ChangeEvent<HTMLInputElement>,
      fieldOnChange: ControllerRenderProps['onChange'],
      budget: string,
    ) => {
      const currentInput = { isUnlimitedBudget: e.target.value === 'true', budget };
      fieldOnChange(currentInput);
      if (e.target.value === 'false') {
        budgetFieldRef.current?.focus();
      }
    },
    [budgetFieldRef],
  );

  const budgetRules = useMemo(() => getBudgetRules(isUnlocked, translate), [isUnlocked, translate]);

  const ariaUnlock = translate(
    translationKey('Action.Unlock', TranslationNamespace.CloudServices),
  ) as string;

  return (
    <Grid container item direction='column' XSmall={12}>
      <Controller
        name={`unlockConfiguration.${serviceIndex}.resourceConfigurations.${index[0]}.resourceId`}
        control={control}
        render={({ field: renderField }) => {
          const resourceId = renderField.value;
          const title = isDataStoreOnly
            ? (translate(
                translationKey('Title.AccessInUnlock', TranslationNamespace.CloudServices),
              ) as string)
            : (translate(
                translationKey(
                  resourceIdToUnlockTranslationKeys[resourceId].title,
                  TranslationNamespace.CloudServices,
                ),
              ) as string);

          const description = isDataStoreOnly ? (
            translateHTML(
              translationKey(
                'Description.RequestResourceInUnlock',
                TranslationNamespace.CloudServices,
              ),
              pricingLinkTags(),
            )
          ) : (
            <Controller
              name={`unlockConfiguration.${serviceIndex}.resourceConfigurations.${index[0]}`}
              control={control}
              render={({ field: resourceItem }) => (
                <>
                  {translateHTML(
                    translationKey(
                      resourceIdToUnlockTranslationKeys[resourceItem.value.resourceId].description,
                      TranslationNamespace.CloudServices,
                    ),
                    pricingLinkTags(),
                    { unitCost: resourceItem.value.unitCost },
                  )}
                </>
              )}
            />
          );

          return (
            <Controller
              name={`unlockConfiguration.${serviceIndex}.resourceConfigurations.${index[0]}.isUnlocked`}
              control={control}
              render={({ field: toggleField }) => (
                <UnlockToggleRow
                  title={title}
                  description={description}
                  isChecked={toggleField.value}
                  isDisabled={disableSwitch}
                  ariaLabel={ariaUnlock}
                  onCheckedChange={(checked: boolean) =>
                    handleUnlockToggleChange(checked, toggleField.onChange)
                  }
                />
              )}
            />
          );
        }}
      />
      <Grid item className={cx(resourceFormContainer, { [hidden]: !isUnlocked })}>
        <Controller
          name={`unlockConfiguration.${serviceIndex}.serviceBudget`}
          control={control}
          rules={budgetRules}
          render={({ field: monthlyBudgetField }) => (
            <RadioGroup
              {...monthlyBudgetField}
              value={monthlyBudgetField.value}
              onChange={(e) =>
                handleLimitChange(e, monthlyBudgetField.onChange, monthlyBudgetField.value)
              }
              name={`unlockConfiguration.${serviceIndex}.serviceBudget.isUnlimitedBudget`}
              id={`unlockConfiguration-${serviceIndex}-serviceBudget-isUnlimitedBudget`}>
              <Grid item XSmall={12} className={radioLabel}>
                <Controller
                  name={`unlockConfiguration.${serviceIndex}.resourceConfigurations.${index[0]}.currency`}
                  control={control}
                  render={({ field: currencyField }) => (
                    <BudgetField
                      id={`unlockConfiguration-${serviceIndex}-serviceBudget`}
                      disabled={disableSwitch}
                      value={monthlyBudgetField.value}
                      onChange={(e) => monthlyBudgetField.onChange(e.target.value)}
                      onFocus={(e) => monthlyBudgetField.onChange(e.target.value)}
                      error={!!errors?.unlockConfiguration?.[serviceIndex]?.serviceBudget}
                      errorMessage={
                        errors?.unlockConfiguration?.[serviceIndex]?.serviceBudget?.message ?? ''
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

export default withTranslation(ServiceConfigurationForm, [TranslationNamespace.CloudServices]);
