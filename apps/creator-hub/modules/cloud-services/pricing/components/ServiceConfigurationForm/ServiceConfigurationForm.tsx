import React, { Fragment, FunctionComponent, useCallback, useMemo, useRef } from 'react';
import { Controller, Control, useFormContext, ControllerRenderProps } from 'react-hook-form';
import { FormControlLabel, Grid, Switch, Typography, RadioGroup, useDialog } from '@rbx/ui';
import { useTranslation, withTranslation } from '@rbx/intl';
import { useTranslationWrapper, translationKey } from '@modules/analytics-translations';
import TranslationNamespace from '@modules/miscellaneous/localization/enums/TranslationNamespace';
import {
  TUnlockServiceForm,
  resourceIdToUnlockTranslationKeys,
  ResourceId,
  ServiceId,
} from '../../types';
import useServiceConfigurationFormStyles from './ServiceConfigurationForm.styles';
import getBudgetRules from '../../../utils/getBudgetRules';
import { pricingLinkTags, BudgetField, buildConfirmResetDialog } from '../shared/FormHelpers';

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
> = ({
  control,
  index,
  serviceIndex,
  disableSwitch = false,
  isServiceLevel = false,
  serviceId,
}) => {
  const isDataStoreOnly = isServiceLevel && serviceId === ServiceId.DataStore;
  const { open, close: closeDialog, configure } = useDialog();
  const { formState, watch, setValue, resetField } = useFormContext();
  const { errors } = formState;
  const {
    classes: {
      currencySymbol,
      resourceTitle,
      resourceDescription,
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

  const handleUnlockClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
      if (isUnlocked) {
        e.preventDefault();
        e.stopPropagation();
        configure(confirmResetServiceLimitDialog);
        open();
      }
    },
    [isUnlocked, configure, confirmResetServiceLimitDialog, open],
  );

  const handleUnlockChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
    fieldOnChange: ControllerRenderProps<
      TUnlockServiceForm,
      `unlockConfiguration.${number}.resourceConfigurations.${number}.isUnlocked`
    >['onChange'],
  ) => {
    const { checked } = e.target;
    await fieldOnChange(checked);
    if (checked && monthlyBudget === '') {
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
      const currentInput = { isUnlimitedBudget: e.target.value === 'true', budget };
      fieldOnChange(currentInput);
      if (e.target.value === 'false') {
        budgetFieldRef.current?.focus();
      }
    },
    [budgetFieldRef],
  );

  return (
    <Grid container item direction='row' XSmall={12}>
      <Grid container item justifyContent='space-between' alignItems='center' wrap='nowrap'>
        <Grid item>
          <Controller
            name={`unlockConfiguration.${serviceIndex}.resourceConfigurations.${index[0]}.resourceId`}
            render={({ field: renderField }) => (
              <Fragment>
                {isDataStoreOnly ? (
                  <React.Fragment>
                    <Typography variant='subtitle2' component='div' className={resourceTitle}>
                      {translate(
                        translationKey('Title.AccessInUnlock', TranslationNamespace.CloudServices),
                      )}
                    </Typography>
                    <Typography variant='body2' className={resourceDescription}>
                      {translateHTML(
                        translationKey(
                          'Description.RequestResourceInUnlock',
                          TranslationNamespace.CloudServices,
                        ),
                        pricingLinkTags(),
                      )}
                    </Typography>
                  </React.Fragment>
                ) : (
                  <React.Fragment>
                    <Typography variant='subtitle2' component='div' className={resourceTitle}>
                      {translate(
                        translationKey(
                          resourceIdToUnlockTranslationKeys[renderField.value as ResourceId].title,
                          TranslationNamespace.CloudServices,
                        ),
                      )}
                    </Typography>
                    {index.map((_, arrayIndex) => (
                      <Grid container item direction='column' key={renderField.value as ResourceId}>
                        <Controller
                          key={renderField.value as ResourceId}
                          name={`unlockConfiguration.${serviceIndex}.resourceConfigurations.${arrayIndex}`}
                          render={({ field: resourceItem }) => (
                            <Typography variant='body2' className={resourceDescription}>
                              {translateHTML(
                                translationKey(
                                  resourceIdToUnlockTranslationKeys[
                                    resourceItem.value.resourceId as ResourceId
                                  ].description,
                                  TranslationNamespace.CloudServices,
                                ),
                                pricingLinkTags(),
                                { unitCost: resourceItem.value.unitCost },
                              )}
                            </Typography>
                          )}
                        />
                      </Grid>
                    ))}
                  </React.Fragment>
                )}
              </Fragment>
            )}
          />
        </Grid>
        <Grid item>
          <Controller
            name={`unlockConfiguration.${serviceIndex}.resourceConfigurations.${index[0]}.isUnlocked`}
            control={control}
            render={({ field: renderField }) => (
              <FormControlLabel
                value='false'
                checked={isUnlocked}
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
                  render={({ field: currencyField }) => (
                    <BudgetField
                      id={`unlockConfiguration-${serviceIndex}-serviceBudget`}
                      disabled={disableSwitch}
                      value={monthlyBudgetField.value}
                      onChange={(e) => monthlyBudgetField.onChange(e.target.value)}
                      onFocus={(e) => monthlyBudgetField.onChange(e.target.value)}
                      error={
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- (@mbae, 05/09/24) React 18 migration: Owners need to properly type their form context
                        !!(errors?.unlockConfiguration as any)?.[serviceIndex]?.serviceBudget
                      }
                      errorMessage={
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- (@mbae, 05/09/24) React 18 migration: Owners need to properly type their form context
                        (errors?.unlockConfiguration as any)?.[serviceIndex]?.serviceBudget
                          ?.message || ''
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

export default withTranslation(ServiceConfigurationForm, [TranslationNamespace.CloudServices]);
