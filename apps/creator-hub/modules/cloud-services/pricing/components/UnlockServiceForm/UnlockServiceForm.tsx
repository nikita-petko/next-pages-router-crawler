import React, {
  FunctionComponent,
  useCallback,
  useMemo,
  Fragment,
  useEffect,
  useState,
  useRef,
} from 'react';
import { FormProvider, SubmitHandler, useFieldArray, useForm } from 'react-hook-form';
import {
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button,
  Grid,
  Divider,
  DialogTemplate,
  useDialog,
} from '@rbx/ui';
import { isValidEnumValue } from '@modules/miscellaneous/common/utils';
import FormMode from '@modules/miscellaneous/common/enums/FormMode';
import { getResponseFromError } from '@modules/clients/utils';
import { useTranslation, withTranslation } from '@rbx/intl';
import { useTranslationWrapper, translationKey } from '@modules/analytics-translations';
import TranslationNamespace from '@modules/miscellaneous/localization/enums/TranslationNamespace';
import type { ResourceConfigurationPrice } from '@rbx/clients/serviceEfficiencyApi/v1';
import { useCloudPricingClient } from '../../CloudPricingClientProvider';
import useTopMessage from '../../../utils/useTopMessage';
import {
  Money,
  BudgetLevel,
  ResourceId,
  ServiceConfiguration,
  ResourceConfiguration,
  TUnlockResourceForm,
  ServiceId,
  TUnlockServiceForm,
  TResourceIndexInfo,
  serviceIdToUnlockTranslationKeys,
  PRICE_MAX_DECIMALS,
  UnlockEligibilities,
} from '../../types';
import ResourceConfigurationForm from '../ResourceConfigurationForm/ResourceConfigurationForm';
import ServiceConfigurationForm from '../ServiceConfigurationForm/ServiceConfigurationForm';
import CriticalResourceConfigurationForm, {
  type CriticalResourceState,
} from '../CriticalResourceConfigurationForm/CriticalResourceConfigurationForm';
import {
  currencyMoneyFormatter,
  moneyToNumber,
  isValidMoneyString,
  stringToMoney,
} from '../../../utils/formatters';
import useUnlockServiceFormStyles from './UnlockServiceForm.styles';

export type TUnlockServiceFormProps = {
  universeId: number;
  disableSwitch: boolean;
  serviceConfigurations: ServiceConfiguration[];
  isEligible: UnlockEligibilities;
  updateServiceConfigurations: (data: ServiceConfiguration[]) => void;
};

export function isValidServiceConfiguration(data: ServiceConfiguration): data is {
  serviceId: string;
  resourceConfigurations: ResourceConfiguration[];
  budgetLevel: BudgetLevel;
  monthlyBudget: Money | null;
} {
  return (
    !!(data.serviceId && data.resourceConfigurations) && isValidEnumValue(ServiceId, data.serviceId)
  );
}

export function isValidResourceConfiguration(
  data: ResourceConfiguration,
): data is Required<Omit<ResourceConfiguration, 'resourceId'>> & { resourceId: string } {
  return !!data.resourceId && isValidEnumValue(ResourceId, data.resourceId);
}

export function resourceConfToUnlockServiceForm(
  resourceConf: ResourceConfiguration,
): TUnlockResourceForm {
  return {
    resourceId: resourceConf.resourceId as ResourceId,
    isUnlocked: resourceConf.unlocked ?? false,
    monthlyBudget: resourceConf.monthlyBudget ?? null,
    currency: resourceConf.monthlyBudget?.currencyCode ?? 'USD',
    unitCost: currencyMoneyFormatter(resourceConf.unitCost, PRICE_MAX_DECIMALS),
    price: {
      cost: currencyMoneyFormatter(
        resourceConf.price.cost ?? resourceConf.unitCost,
        PRICE_MAX_DECIMALS,
      ),
      unitAmount: resourceConf.price.unitAmount ?? 1,
    },
    resourceBudget: resourceConf.monthlyBudget
      ? moneyToNumber(resourceConf.monthlyBudget).toString()
      : '',
  };
}

export function flattenResourceConfiguration(resourceConfigurations: ResourceConfiguration[]) {
  const resourcesIndex: number[] = [];
  const resourceFormValue = resourceConfigurations.reduce(
    (resourceConfs, resourceConf, resourceIndex) => {
      if (isValidResourceConfiguration(resourceConf)) {
        resourcesIndex.push(resourceIndex);
        return [...resourceConfs, resourceConfToUnlockServiceForm(resourceConf)];
      }
      return resourceConfs;
    },
    [] as TUnlockResourceForm[],
  );
  return { indexInfo: resourcesIndex, formValue: resourceFormValue };
}

const DATA_STORE_SERVICE_IDS = new Set<string>([ServiceId.DataStore, ServiceId.DataStoreStorage]);

export function flattenServiceConfigurationRes(serviceConfigurations: ServiceConfiguration[]): {
  indexInfo: TResourceIndexInfo[];
  initFormValue: TUnlockServiceForm;
} {
  let runningIndex = 0;

  // Exclude data-store services from the form -- they are handled by CriticalResourceConfigurationForm
  const nonDataStoreConfigs = serviceConfigurations.filter(
    (sc) => !DATA_STORE_SERVICE_IDS.has(sc.serviceId),
  );

  const initForm = nonDataStoreConfigs.reduce(
    (
      result: { indexInfo: TResourceIndexInfo[]; formValue: TUnlockResourceForm[] },
      serviceConf: ServiceConfiguration,
    ) => {
      if (isValidServiceConfiguration(serviceConf)) {
        const { indexInfo, formValue } = flattenResourceConfiguration(
          serviceConf.resourceConfigurations,
        );

        // eslint-disable-next-line no-plusplus -- We want to increment runningIndex after its current value has been returned.
        const updatedIndexInfo = indexInfo.map(() => runningIndex++);
        const updatedFormValue = formValue.map((fv) => {
          const indexInfoItem = result.indexInfo.find(
            (ii) => ii.serviceId === serviceConf.serviceId,
          );
          if (indexInfoItem) {
            return {
              ...fv,
              serviceId: indexInfoItem.serviceId,
              budgetLevel: indexInfoItem.budgetLevel,
              monthlyBudget: indexInfoItem.monthlyBudget,
              serviceBudget: indexInfoItem.monthlyBudget
                ? moneyToNumber(indexInfoItem.monthlyBudget).toString()
                : '',
            };
          }
          return fv;
        });

        return {
          indexInfo: [
            ...result.indexInfo,
            {
              serviceId: serviceConf.serviceId as ServiceId,
              resourceIndexesInFormArray: updatedIndexInfo,
              monthlyBudget: serviceConf.monthlyBudget ?? null,
              budgetLevel: serviceConf.budgetLevel as BudgetLevel,
              serviceBudget: serviceConf.monthlyBudget
                ? moneyToNumber(serviceConf.monthlyBudget).toString()
                : '',
            },
          ],
          formValue: [...result.formValue, ...updatedFormValue],
        };
      }
      return result;
    },
    { indexInfo: [], formValue: [] },
  );

  const serviceFormValue = initForm.indexInfo.map((ind) => {
    const unlockConfigurations = ind.resourceIndexesInFormArray.map(
      (index) => initForm.formValue[index],
    );
    return {
      resourceConfigurations: unlockConfigurations,
      serviceId: ind.serviceId,
      monthlyBudget: ind.monthlyBudget,
      budgetLevel: ind.budgetLevel,
      serviceBudget: ind.monthlyBudget ? moneyToNumber(ind.monthlyBudget).toString() : '',
    };
  });

  return {
    indexInfo: initForm.indexInfo,
    initFormValue: { unlockConfiguration: serviceFormValue },
  };
}

export function buildDataStoreRequest(
  criticalState: CriticalResourceState,
  dataStoreConfig: ServiceConfiguration | undefined,
  dataStoreStorageConfig: ServiceConfiguration | undefined,
) {
  if (!dataStoreConfig && !dataStoreStorageConfig) return [];

  const dataStoreEntry = dataStoreConfig
    ? {
        serviceId: ServiceId.DataStore as string,
        budgetLevel: BudgetLevel.ServiceOnly as string,
        monthlyBudget:
          criticalState.isAccessEnabled && isValidMoneyString(criticalState.accessBudget)
            ? stringToMoney(criticalState.accessBudget)
            : null,
        resourceConfigurations: (dataStoreConfig.resourceConfigurations ?? []).map((rc) => ({
          resourceId: rc.resourceId,
          unlocked: criticalState.isAccessEnabled,
          monthlyBudget: null,
          unitCost: rc.unitCost ?? {},
          price: (rc.price ?? {}) as ResourceConfigurationPrice,
        })),
      }
    : null;

  const storageResources = dataStoreStorageConfig?.resourceConfigurations?.length
    ? dataStoreStorageConfig.resourceConfigurations.map((rc) => ({
        resourceId: rc.resourceId,
        unlocked: true,
        monthlyBudget: null,
        unitCost: rc.unitCost ?? {},
        price: (rc.price ?? {}) as ResourceConfigurationPrice,
      }))
    : [
        {
          resourceId: ResourceId.Storage as string,
          unlocked: true,
          monthlyBudget: null,
          unitCost: {},
          price: {} as ResourceConfigurationPrice,
        },
      ];

  const storageEntry = {
    serviceId: ServiceId.DataStoreStorage as string,
    budgetLevel: BudgetLevel.ServiceOnly as string,
    monthlyBudget: null,
    resourceConfigurations: storageResources,
  };

  const entries = [dataStoreEntry, storageEntry];
  return entries.filter((e): e is NonNullable<typeof e> => e !== null);
}

const UnlockServiceForm: FunctionComponent<TUnlockServiceFormProps> = ({
  universeId,
  disableSwitch,
  serviceConfigurations,
  isEligible,
  updateServiceConfigurations,
}) => {
  const {
    classes: {
      formContainer,
      buttonContainer,
      accordion,
      serviceFormContainer,
      divider,
      premiumAlert,
      premiumButton,
      accordionTitle,
    },
  } = useUnlockServiceFormStyles();
  const { open, close: closeDialog, configure } = useDialog();
  const { showSuccessMessage, showFailureMessage } = useTopMessage();
  const cloudPricingClient = useCloudPricingClient();
  const [saveWarning, setSaveWarning] = useState<boolean>(false);
  const [criticalDirty, setCriticalDirty] = useState(false);
  const [criticalHasError, setCriticalHasError] = useState(false);
  const [criticalResetKey, setCriticalResetKey] = useState(0);
  const { translate } = useTranslationWrapper(useTranslation());

  // Separate data-store configs from the rest
  const dataStoreConfig = useMemo(
    () => serviceConfigurations.find((sc) => sc.serviceId === ServiceId.DataStore),
    [serviceConfigurations],
  );
  const dataStoreStorageConfig = useMemo(
    () => serviceConfigurations.find((sc) => sc.serviceId === ServiceId.DataStoreStorage),
    [serviceConfigurations],
  );

  // Derive initial critical resource state from service configurations
  const initialAccessEnabled = useMemo(() => {
    if (!dataStoreConfig?.resourceConfigurations?.length) return false;
    return dataStoreConfig.resourceConfigurations.some((rc) => rc.unlocked);
  }, [dataStoreConfig]);

  const initialAccessBudget = useMemo(() => {
    if (!dataStoreConfig?.monthlyBudget) return '';
    return moneyToNumber(dataStoreConfig.monthlyBudget).toString();
  }, [dataStoreConfig]);

  const criticalStateRef = useRef<CriticalResourceState>({
    isAccessEnabled: initialAccessEnabled,
    accessBudget: initialAccessBudget,
    hasError: false,
  });

  const handleCriticalStateChange = useCallback((state: CriticalResourceState) => {
    criticalStateRef.current = state;
  }, []);

  // Non-data-store form setup
  const { indexInfo, initFormValue } = useMemo(
    () => flattenServiceConfigurationRes(serviceConfigurations),
    [serviceConfigurations],
  );

  const formMethods = useForm<TUnlockServiceForm>({
    mode: FormMode.OnChange,
    reValidateMode: FormMode.OnChange,
    defaultValues: initFormValue,
    shouldUnregister: false,
  });

  const { control, watch, formState, handleSubmit, reset, getValues } = formMethods;
  const { isSubmitting, isValid, errors, isDirty } = formState;

  const { fields } = useFieldArray({
    control,
    shouldUnregister: false,
    name: 'unlockConfiguration',
  });
  const watchFieldArray = watch('unlockConfiguration');

  const controlledFields = fields.map((field, index) => {
    return {
      ...field,
      ...watchFieldArray?.[index],
    };
  });

  const handleFormSubmit: SubmitHandler<TUnlockServiceForm> = useCallback(async () => {
    try {
      const formValues = getValues();

      // Build request for non-data-store services via the form
      const dataWithServiceIds: TUnlockServiceForm = {
        unlockConfiguration: formValues.unlockConfiguration.map((uc, i) => ({
          ...uc,
          serviceId: indexInfo[i].serviceId,
          budgetLevel: indexInfo[i].budgetLevel,
        })),
      };

      // Build request for data-store services from the critical resource state
      const dataStoreRequestEntries = buildDataStoreRequest(
        criticalStateRef.current,
        dataStoreConfig,
        dataStoreStorageConfig,
      );

      // Merge: form-based services + data-store services
      const formRequest = cloudPricingClient.buildUnlockServiceRequest(
        dataWithServiceIds,
        indexInfo,
        serviceConfigurations.filter((sc) => !DATA_STORE_SERVICE_IDS.has(sc.serviceId)),
      );
      const mergedRequest = {
        serviceConfigurations: [
          ...dataStoreRequestEntries,
          ...formRequest.serviceConfigurations,
        ] as ServiceConfiguration[],
      };

      const res = await cloudPricingClient.sendUnlockServiceUpdate(universeId, mergedRequest);

      // Restore budgetLevel from config since backend may return incorrect values
      const budgetLevels = serviceConfigurations.reduce<Record<string, BudgetLevel>>((acc, sc) => {
        acc[sc.serviceId] = sc.budgetLevel as BudgetLevel;
        return acc;
      }, {});
      const resServiceConfigurations = res.serviceConfigurations.map((sc) => ({
        ...sc,
        budgetLevel: (budgetLevels[sc.serviceId] ?? sc.budgetLevel) as BudgetLevel,
      })) as ServiceConfiguration[];

      updateServiceConfigurations(resServiceConfigurations);
      setCriticalDirty(false);
      showSuccessMessage(
        translate(
          translationKey('Message.UnlockUpdatedSuccessfully', TranslationNamespace.CloudServices),
        ),
      );
    } catch (error) {
      const errorMessage = getResponseFromError(error);
      if (errorMessage?.status === 403 || errorMessage?.status === 401) {
        showFailureMessage(
          translate(
            translationKey('Description.UnlockNotAuthorized', TranslationNamespace.CloudServices),
          ),
        );
      } else {
        showFailureMessage(
          translate(
            translationKey('Message.UnlockUpdatedFailure', TranslationNamespace.CloudServices),
          ),
        );
      }
    }
  }, [
    showSuccessMessage,
    showFailureMessage,
    getValues,
    indexInfo,
    universeId,
    updateServiceConfigurations,
    cloudPricingClient,
    translate,
    serviceConfigurations,
    dataStoreConfig,
    dataStoreStorageConfig,
  ]);

  const resetCriticalForm = useCallback(() => {
    setCriticalResetKey((k) => k + 1);
    setCriticalDirty(false);
    setCriticalHasError(false);
  }, []);

  const isSubmitDisabled =
    (!!errors?.unlockConfiguration && !isValid) || criticalHasError || (!isDirty && !criticalDirty);

  const confirmReduceBudgetDialog = useMemo(
    () => (
      <DialogTemplate
        title={translate(
          translationKey('Title.WarningBudgetDecrease', TranslationNamespace.CloudServices),
        )}
        content={
          <span>
            {translate(
              translationKey(
                'Description.WarningBudgetDecrease',
                TranslationNamespace.CloudServices,
              ),
            )}
            <br />
            <br />
            {translate(
              translationKey('Description.CancelConfirmation', TranslationNamespace.CloudServices),
            )}
          </span>
        }
        confirmText={translate(
          translationKey('Action.SaveChanges', TranslationNamespace.CloudServices),
        )}
        cancelText={translate(translationKey('Action.Cancel', TranslationNamespace.CloudServices))}
        onConfirm={() => {
          handleSubmit(handleFormSubmit)();
          closeDialog();
        }}
        onCancel={() => {
          reset(initFormValue);
          resetCriticalForm();
          closeDialog();
        }}
      />
    ),
    [
      closeDialog,
      reset,
      resetCriticalForm,
      initFormValue,
      handleSubmit,
      handleFormSubmit,
      translate,
    ],
  );

  const handleCancelClicked = () => {
    reset(initFormValue);
    resetCriticalForm();
  };

  const displayDialogWarning = (displayWarning: boolean) => {
    setSaveWarning(displayWarning);
  };

  const setWarningDialogOpen = () => {
    configure(confirmReduceBudgetDialog);
    open();
  };

  useEffect(() => {
    reset(initFormValue);
  }, [initFormValue, reset]);

  const hasDataStores = !!(dataStoreConfig || dataStoreStorageConfig);

  return (
    <FormProvider {...formMethods}>
      <Grid container item XSmall={12} className={formContainer}>
        {/* Data Stores accordion - managed outside React Hook Form */}
        {hasDataStores && (
          <CriticalResourceConfigurationForm
            key={criticalResetKey}
            initialAccessEnabled={initialAccessEnabled}
            initialAccessBudget={initialAccessBudget}
            disableSwitch={disableSwitch}
            isPremiumEligible={isEligible.premiumEligibility}
            onStateChange={handleCriticalStateChange}
            onDirtyChange={setCriticalDirty}
            onErrorChange={setCriticalHasError}
          />
        )}

        {/* All other services - managed by React Hook Form */}
        {indexInfo.map((service, serviceIndex) => {
          return (
            <Accordion
              disableGutters
              variant='outlined'
              defaultExpanded
              className={accordion}
              key={service.serviceId}>
              <AccordionSummary className={accordionTitle}>
                {translate(
                  translationKey(
                    serviceIdToUnlockTranslationKeys[service.serviceId],
                    TranslationNamespace.CloudServices,
                  ),
                )}
              </AccordionSummary>
              <AccordionDetails className={serviceFormContainer}>
                {service.budgetLevel === 'ServiceOnly' &&
                  (isEligible.premiumEligibility ? (
                    <ServiceConfigurationForm
                      control={control}
                      serviceIndex={serviceIndex}
                      disableSwitch={disableSwitch}
                      index={service.resourceIndexesInFormArray}
                      isServiceLevel
                      serviceId={service.serviceId}
                    />
                  ) : (
                    <Alert
                      action={
                        <Button
                          color='inherit'
                          size='small'
                          onClick={() => window.open('/settings/eligibility')}
                          className={premiumButton}>
                          {translate(
                            translationKey(
                              'Label.CheckEligibility',
                              TranslationNamespace.CloudServices,
                            ),
                          )}
                        </Button>
                      }
                      severity='warning'
                      variant='outlined'
                      className={premiumAlert}>
                      {translate(
                        translationKey(
                          'Description.NotPremiumEligible',
                          TranslationNamespace.CloudServices,
                        ),
                        {
                          service: translate(
                            translationKey(
                              serviceIdToUnlockTranslationKeys[service.serviceId],
                              TranslationNamespace.CloudServices,
                            ),
                          ),
                        },
                      )}
                    </Alert>
                  ))}

                {service.budgetLevel !== 'ServiceOnly' &&
                  service.resourceIndexesInFormArray.map((_, index) => {
                    const field = controlledFields[serviceIndex].resourceConfigurations[index];
                    return (
                      <Fragment key={field.resourceId}>
                        {index !== 0 && <Divider className={divider} />}
                        <ResourceConfigurationForm
                          originalValue={parseInt(
                            initFormValue.unlockConfiguration[serviceIndex].resourceConfigurations[
                              index
                            ].resourceBudget,
                            10,
                          )}
                          control={control}
                          disableSwitch={disableSwitch}
                          serviceIndex={serviceIndex}
                          index={index}
                          saveWarning={displayDialogWarning}
                        />
                      </Fragment>
                    );
                  })}
              </AccordionDetails>
            </Accordion>
          );
        })}
      </Grid>
      <Grid container item XSmall={12} className={buttonContainer}>
        <Button
          variant='outlined'
          color='secondary'
          size='large'
          onClick={handleCancelClicked}
          disabled={isSubmitting}>
          {translate(translationKey('Action.Cancel', TranslationNamespace.CloudServices))}
        </Button>
        <Button
          data-testid='unlock-configuration-button'
          type='submit'
          variant='contained'
          size='large'
          disabled={isSubmitDisabled}
          onClick={() => {
            if (saveWarning) {
              setWarningDialogOpen();
            } else {
              handleSubmit(handleFormSubmit)();
            }
          }}
          loading={isSubmitting}>
          {translate(translationKey('Action.SaveChanges', TranslationNamespace.CloudServices))}
        </Button>
      </Grid>
    </FormProvider>
  );
};

export default withTranslation(UnlockServiceForm, [TranslationNamespace.CloudServices]);
