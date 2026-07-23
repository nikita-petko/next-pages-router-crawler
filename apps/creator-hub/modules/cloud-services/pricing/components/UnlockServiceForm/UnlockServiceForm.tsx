import type { FunctionComponent } from 'react';
import { useCallback, useMemo, Fragment, useEffect, useState, useRef } from 'react';
import type { SubmitHandler } from 'react-hook-form';
import { FormProvider, useFieldArray, useForm } from 'react-hook-form';
import type { ResourceConfigurationPrice } from '@rbx/client-service-efficiency-api/v1';
import { Button, Dialog, DialogContent, DialogTitle } from '@rbx/foundation-ui';
import { useTranslation, withTranslation } from '@rbx/intl';
import {
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
  Divider,
  StickyFooter,
  Button as FooterButton,
} from '@rbx/ui';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { publishExtendedServicesCoresPlaceIds } from '@modules/clients/creatorConfigsPublicApi';
import { getResponseFromError } from '@modules/clients/utils';
import FormMode from '@modules/miscellaneous/common/enums/FormMode';
import TranslationNamespace from '@modules/miscellaneous/localization/enums/TranslationNamespace';
import { isValidEnumValue } from '@modules/miscellaneous/utils/enumUtils';
import {
  currencyMoneyFormatter,
  moneyToNumber,
  isValidMoneyString,
  stringToMoney,
} from '../../../utils/formatters';
import useTopMessage from '../../../utils/useTopMessage';
import { useCloudPricingClient } from '../../CloudPricingClientProvider';
import type { CorePlace } from '../../hooks/useUniversePlacesForCores';
import type {
  Money,
  ServiceConfiguration,
  ResourceConfiguration,
  TUnlockResourceForm,
  TUnlockServiceForm,
  TResourceIndexInfo,
  UnlockEligibilities,
} from '../../types';
import {
  BudgetLevel,
  ResourceId,
  ServiceId,
  serviceIdToUnlockTranslationKeys,
  PRICE_MAX_DECIMALS,
} from '../../types';
import CoresQuotaSection, { type CoresQuotaState } from '../CoresQuotaSection/CoresQuotaSection';
import CriticalResourceConfigurationForm, {
  type CriticalResourceState,
} from '../CriticalResourceConfigurationForm/CriticalResourceConfigurationForm';
import ResourceConfigurationForm from '../ResourceConfigurationForm/ResourceConfigurationForm';
import ServiceConfigurationForm from '../ServiceConfigurationForm/ServiceConfigurationForm';
import useUnlockServiceFormStyles from './UnlockServiceForm.styles';

export type TUnlockServiceFormProps = {
  universeId: number;
  disableSwitch: boolean;
  serviceConfigurations: ServiceConfiguration[];
  isEligible: UnlockEligibilities;
  updateServiceConfigurations: (data: ServiceConfiguration[]) => void;
  coresInitialPlaceIds?: number[];
  coresAvailablePlaces?: CorePlace[];
  coresIsLoadingPlaces?: boolean;
  onCoresPublished?: (placeIds: number[]) => void;
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
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- caller validates with isValidResourceConfiguration before invoking
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

const MANUALLY_BUILT_SERVICE_IDS = new Set<string>([
  ServiceId.DataStore,
  ServiceId.DataStoreStorage,
  ServiceId.Rcc,
]);

// Stable empty arrays so default props don't create a new reference each render,
// which would re-trigger downstream reset effects keyed on initial props.
const EMPTY_PLACE_IDS: number[] = [];
const EMPTY_AVAILABLE_PLACES: CorePlace[] = [];

// Sent when cores is enabled but the user left the monthly cap empty (or
// invalid). The backend treats a $0 budget as "no spending cap, free tier
// only" — the opt-in signal for the cores free tier. When cores is disabled
// the budget stays null.
const ZERO_USD_BUDGET: Money = { currencyCode: 'USD', units: 0, nanos: 0 };

export function buildRccRequest(coresState: {
  isEnabled: boolean;
  monthlyCap: string;
}): ServiceConfiguration {
  let monthlyBudget: Money | null = null;
  if (coresState.isEnabled) {
    monthlyBudget = isValidMoneyString(coresState.monthlyCap)
      ? stringToMoney(coresState.monthlyCap)
      : ZERO_USD_BUDGET;
  }
  return {
    serviceId: ServiceId.Rcc,
    budgetLevel: BudgetLevel.ServiceOnly,
    monthlyBudget,
    resourceConfigurations: [
      {
        resourceId: ResourceId.CcuCores,
        unlocked: coresState.isEnabled,
        monthlyBudget: null,
        unitCost: {},
        price: {} as ResourceConfigurationPrice,
      },
    ],
  } as ServiceConfiguration;
}

export function flattenServiceConfigurationRes(serviceConfigurations: ServiceConfiguration[]): {
  indexInfo: TResourceIndexInfo[];
  initFormValue: TUnlockServiceForm;
} {
  let runningIndex = 0;

  const nonDataStoreConfigs = serviceConfigurations.filter(
    (sc) => !MANUALLY_BUILT_SERVICE_IDS.has(sc.serviceId),
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

        const updatedIndexInfo = indexInfo.map(() => runningIndex++);
        const updatedFormValue = formValue.map((fv) => {
          const indexInfoItem = result.indexInfo.find(
            (ii) => (ii.serviceId as string) === serviceConf.serviceId,
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
              // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- isValidServiceConfiguration above narrows serviceId to ServiceId
              serviceId: serviceConf.serviceId as ServiceId,
              resourceIndexesInFormArray: updatedIndexInfo,
              monthlyBudget: serviceConf.monthlyBudget ?? null,
              budgetLevel: serviceConf.budgetLevel,
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
  if (!dataStoreConfig && !dataStoreStorageConfig) {
    return [];
  }

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
          price: rc.price ?? {},
        })),
      }
    : null;

  const storageResources = dataStoreStorageConfig?.resourceConfigurations?.length
    ? dataStoreStorageConfig.resourceConfigurations.map((rc) => ({
        resourceId: rc.resourceId,
        unlocked: true,
        monthlyBudget: null,
        unitCost: rc.unitCost ?? {},
        price: rc.price ?? {},
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
  coresInitialPlaceIds = EMPTY_PLACE_IDS,
  coresAvailablePlaces = EMPTY_AVAILABLE_PLACES,
  coresIsLoadingPlaces = false,
  onCoresPublished,
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
  const { showSuccessMessage, showFailureMessage } = useTopMessage();
  const cloudPricingClient = useCloudPricingClient();
  const [saveWarning, setSaveWarning] = useState<boolean>(false);
  const [warningDialogOpen, setWarningDialogOpen] = useState<boolean>(false);
  const { translate } = useTranslationWrapper(useTranslation());

  const dataStoreConfig = useMemo(
    () => serviceConfigurations.find((sc) => sc.serviceId === (ServiceId.DataStore as string)),
    [serviceConfigurations],
  );
  const dataStoreStorageConfig = useMemo(
    () =>
      serviceConfigurations.find((sc) => sc.serviceId === (ServiceId.DataStoreStorage as string)),
    [serviceConfigurations],
  );

  const rccConfig = useMemo(
    () => serviceConfigurations.find((sc) => sc.serviceId === (ServiceId.Rcc as string)),
    [serviceConfigurations],
  );
  const initialCoresUnlocked = !!rccConfig?.resourceConfigurations?.some((rc) => rc.unlocked);
  const initialCoresIsWholeExperience = initialCoresUnlocked && coresInitialPlaceIds.length === 0;
  const initialCoresMonthlyCap = rccConfig?.monthlyBudget
    ? moneyToNumber(rccConfig.monthlyBudget).toString()
    : '';

  const coresRef = useRef<CoresQuotaState>({
    isEnabled: initialCoresIsWholeExperience || coresInitialPlaceIds.length > 0,
    placeIds: coresInitialPlaceIds,
    isWholeExperience: initialCoresIsWholeExperience,
    monthlyCap: initialCoresMonthlyCap,
    hasError: false,
  });
  const [coresDirty, setCoresDirty] = useState(false);
  const [coresHasError, setCoresHasError] = useState(false);
  const [coresResetKey, setCoresResetKey] = useState(0);
  const handleCoresStateChange = useCallback((state: CoresQuotaState) => {
    coresRef.current = state;
  }, []);
  const resetCoresSection = useCallback(() => {
    setCoresResetKey((k) => k + 1);
    setCoresDirty(false);
    setCoresHasError(false);
  }, []);

  const initialAccessEnabled = useMemo(() => {
    if (!dataStoreConfig?.resourceConfigurations?.length) {
      return false;
    }
    return dataStoreConfig.resourceConfigurations.some((rc) => rc.unlocked);
  }, [dataStoreConfig]);

  const initialAccessBudget = useMemo(() => {
    if (!dataStoreConfig?.monthlyBudget) {
      return '';
    }
    return moneyToNumber(dataStoreConfig.monthlyBudget).toString();
  }, [dataStoreConfig]);

  const criticalRef = useRef<CriticalResourceState>({
    isAccessEnabled: initialAccessEnabled,
    accessBudget: initialAccessBudget,
    hasError: false,
  });
  const [criticalDirty, setCriticalDirty] = useState(false);
  const [criticalHasError, setCriticalHasError] = useState(false);
  const [criticalResetKey, setCriticalResetKey] = useState(0);
  const handleCriticalStateChange = useCallback((state: CriticalResourceState) => {
    criticalRef.current = state;
  }, []);
  const resetCriticalSection = useCallback(() => {
    setCriticalResetKey((k) => k + 1);
    setCriticalDirty(false);
    setCriticalHasError(false);
  }, []);

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
    let serviceUpdateSucceeded = false;
    try {
      const formValues = getValues();

      const dataWithServiceIds: TUnlockServiceForm = {
        unlockConfiguration: formValues.unlockConfiguration.map((uc, i) => ({
          ...uc,
          serviceId: indexInfo[i].serviceId,
          budgetLevel: indexInfo[i].budgetLevel,
        })),
      };

      const dataStoreRequestEntries = buildDataStoreRequest(
        criticalRef.current,
        dataStoreConfig,
        dataStoreStorageConfig,
      );

      const formRequest = cloudPricingClient.buildUnlockServiceRequest(
        dataWithServiceIds,
        indexInfo,
        serviceConfigurations.filter((sc) => !MANUALLY_BUILT_SERVICE_IDS.has(sc.serviceId)),
      );

      const rccEntries: ServiceConfiguration[] = coresDirty
        ? [
            buildRccRequest({
              isEnabled: coresRef.current.isEnabled,
              monthlyCap: coresRef.current.monthlyCap,
            }),
          ]
        : [];

      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- buildDataStoreRequest/buildRccRequest both produce ServiceConfiguration shapes; TS widens the spread to a union
      const mergedConfigs = [
        ...dataStoreRequestEntries,
        ...formRequest.serviceConfigurations,
        ...rccEntries,
      ] as ServiceConfiguration[];
      const mergedRequest = { serviceConfigurations: mergedConfigs };

      const res = await cloudPricingClient.sendUnlockServiceUpdate(universeId, mergedRequest);
      serviceUpdateSucceeded = true;

      const budgetLevels = serviceConfigurations.reduce<Record<string, BudgetLevel>>((acc, sc) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- API returns budgetLevel as a string; we treat it as the BudgetLevel enum throughout the form
        acc[sc.serviceId] = sc.budgetLevel as BudgetLevel;
        return acc;
      }, {});
      const resServiceConfigurations: ServiceConfiguration[] = res.serviceConfigurations.map(
        (sc) => ({
          ...sc,
          budgetLevel: budgetLevels[sc.serviceId] ?? sc.budgetLevel,
        }),
      );

      updateServiceConfigurations(resServiceConfigurations);
      setCriticalDirty(false);

      if (coresDirty) {
        const placeIdsToPublish =
          coresRef.current.isEnabled && !coresRef.current.isWholeExperience
            ? coresRef.current.placeIds
            : [];
        try {
          await publishExtendedServicesCoresPlaceIds(String(universeId), placeIdsToPublish);
          onCoresPublished?.(placeIdsToPublish);
          setCoresDirty(false);
        } catch {
          // Service Efficiency saved, but Creator Configs publish failed.
          // Keep coresDirty=true so the user can retry just this step. The next save
          // re-sends the (idempotent) Service Efficiency update and re-attempts publish.
          showFailureMessage(
            translate(
              translationKey(
                'Message.UnlockUpdatedPartialFailure',
                TranslationNamespace.CloudServices,
              ),
            ),
          );
          return;
        }
      }

      showSuccessMessage(
        translate(
          translationKey('Message.UnlockUpdatedSuccessfully', TranslationNamespace.CloudServices),
        ),
      );
    } catch (error) {
      if (serviceUpdateSucceeded) {
        // Defensive: any unexpected error after the service update is treated as a save failure
        // without rolling back local state (the Service Efficiency write itself succeeded).
        showFailureMessage(
          translate(
            translationKey('Message.UnlockUpdatedFailure', TranslationNamespace.CloudServices),
          ),
        );
        return;
      }
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
    coresDirty,
    onCoresPublished,
  ]);

  const isSubmitDisabled =
    (!!errors?.unlockConfiguration && !isValid) ||
    criticalHasError ||
    // Only block save on a cores error if the user actually edited the cores
    // section. A pre-existing invalid cores state (e.g. RCC unlocked but no
    // monthly cap saved) shouldn't prevent the user from saving unrelated
    // changes to other services.
    (coresHasError && coresDirty) ||
    (!isDirty && !criticalDirty && !coresDirty);

  const handleCancelClicked = () => {
    reset(initFormValue);
    resetCriticalSection();
    resetCoresSection();
  };

  const displayDialogWarning = (displayWarning: boolean) => {
    setSaveWarning(displayWarning);
  };

  const handleSaveClicked = useCallback(() => {
    if (saveWarning) {
      setWarningDialogOpen(true);
    } else {
      void handleSubmit(handleFormSubmit)();
    }
  }, [saveWarning, handleSubmit, handleFormSubmit]);

  useEffect(() => {
    reset(initFormValue);
  }, [initFormValue, reset]);

  const hasDataStores = !!(dataStoreConfig ?? dataStoreStorageConfig);

  return (
    <FormProvider {...formMethods}>
      <Grid container item XSmall={12} className={formContainer}>
        {rccConfig && (
          <CoresQuotaSection
            universeId={universeId}
            initialPlaceIds={coresInitialPlaceIds}
            initialIsWholeExperience={initialCoresIsWholeExperience}
            initialMonthlyCap={initialCoresMonthlyCap}
            availablePlaces={coresAvailablePlaces}
            isLoadingPlaces={coresIsLoadingPlaces}
            disableSwitch={disableSwitch}
            resetSignal={coresResetKey}
            onStateChange={handleCoresStateChange}
            onDirtyChange={setCoresDirty}
            onErrorChange={setCoresHasError}
          />
        )}

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
                {service.budgetLevel === BudgetLevel.ServiceOnly &&
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
                          variant='Utility'
                          size='Small'
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

                {service.budgetLevel !== BudgetLevel.ServiceOnly &&
                  service.resourceIndexesInFormArray.map((_, index) => {
                    const field = controlledFields[serviceIndex]?.resourceConfigurations?.[index];
                    if (!field) {
                      // useFieldArray's `fields` only resync to new defaultValues after the
                      // reset effect fires; skip stale renders where indexInfo is ahead of fields.
                      return null;
                    }
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
        <FooterButton
          {...{ 'data-testid': 'unlock-cancel-button' }}
          variant='outlined'
          color='primary'
          size='large'
          onClick={handleCancelClicked}
          disabled={isSubmitting}>
          {translate(translationKey('Action.Cancel', TranslationNamespace.CloudServices))}
        </FooterButton>
        <FooterButton
          {...{ 'data-testid': 'unlock-configuration-button' }}
          type='submit'
          variant='contained'
          color='primaryBrand'
          size='large'
          disabled={isSubmitDisabled}
          loading={isSubmitting}
          onClick={handleSaveClicked}>
          {translate(translationKey('Action.SaveChanges', TranslationNamespace.CloudServices))}
        </FooterButton>
      </Grid>
      <StickyFooter
        // Drop the default horizontal padding so the footer buttons line up
        // flush with the left edge of the accordions above.
        classes={{ root: 'padding-x-none' }}
        secondary={{
          variant: 'outlined',
          color: 'primary',
          size: 'large',
          onClick: handleCancelClicked,
          disabled: isSubmitting,
          label: translate(translationKey('Action.Cancel', TranslationNamespace.CloudServices)),
        }}
        primary={{
          variant: 'contained',
          color: 'primaryBrand',
          size: 'large',
          disabled: isSubmitDisabled,
          loading: isSubmitting,
          onClick: handleSaveClicked,
          label: translate(
            translationKey('Action.SaveChanges', TranslationNamespace.CloudServices),
          ),
        }}
      />
      <Dialog
        open={warningDialogOpen}
        onOpenChange={(isOpen: boolean) => setWarningDialogOpen(isOpen)}
        size='Medium'
        isModal
        hasCloseAffordance
        closeLabel={translate(translationKey('Action.Cancel', TranslationNamespace.CloudServices))}>
        <DialogContent>
          <div className='flex flex-col gap-medium padding-large'>
            <DialogTitle className='text-title-large'>
              {translate(
                translationKey('Title.WarningBudgetDecrease', TranslationNamespace.CloudServices),
              )}
            </DialogTitle>
            <span className='text-body-medium'>
              {translate(
                translationKey(
                  'Description.WarningBudgetDecrease',
                  TranslationNamespace.CloudServices,
                ),
              )}
              <br />
              <br />
              {translate(
                translationKey(
                  'Description.CancelConfirmation',
                  TranslationNamespace.CloudServices,
                ),
              )}
            </span>
            <div className='flex gap-small margin-top-small'>
              <Button
                variant='Emphasis'
                size='Medium'
                onClick={() => {
                  setWarningDialogOpen(false);
                  void handleSubmit(handleFormSubmit)();
                }}>
                {translate(
                  translationKey('Action.SaveChanges', TranslationNamespace.CloudServices),
                )}
              </Button>
              <Button
                variant='Standard'
                size='Medium'
                onClick={() => {
                  setWarningDialogOpen(false);
                  reset(initFormValue);
                  resetCriticalSection();
                  resetCoresSection();
                }}>
                {translate(translationKey('Action.Cancel', TranslationNamespace.CloudServices))}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </FormProvider>
  );
};

export default withTranslation(UnlockServiceForm, [TranslationNamespace.CloudServices]);
