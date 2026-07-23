import { FunctionComponent, useCallback, useEffect, useMemo, useState } from 'react';
import { Button, CircularProgress, useDialog, Grid, OpenInNewIcon } from '@rbx/ui';
import { useRouter } from 'next/router';
import { useTranslation, withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { EmptyGrid } from '@modules/miscellaneous/common';
import { FailureView } from '@modules/miscellaneous/common/components/FailureView';
import { useCurrentGame } from '@modules/providers/game/GameProvider';
import { useTranslationWrapper, translationKey } from '@modules/analytics-translations';
import { useCurrentGroup } from '@modules/providers/groups/GroupsProvider';
import { ErrorPage } from '@modules/miscellaneous/error';
import { StatusCodes } from '@rbx/core';
import { useAuthentication } from '@modules/authentication/providers';
import { HubMeta } from '@rbx/creator-hub-history';
import CloudPricingClientProvider, {
  useCloudPricingClient,
} from '../../CloudPricingClientProvider';
import UnlockServiceForm from '../../components/UnlockServiceForm/UnlockServiceForm';
import {
  ServiceConfiguration,
  ServiceId,
  UnlockEligibilities,
  Account,
  BudgetLevel,
  ResourceId,
} from '../../types';
import useUnlockServicePageContainerStyles from './UnlockServicePageContainer.styles';
import StripeElementsProvider from '../../components/StripeElementsProvider/StripeElementsProvider';
import useTopMessage from '../../../utils/useTopMessage';
import {
  CardVerificationResultEnum,
  DialogResponseStatusEnum,
} from '../../components/shared/stripeConstants';
import AddAccountSettingsInfoDialog from '../../components/AddAccountSettingsInfoDialog/AddAccountSettingsInfoDialog';
import AddAccountAndPaymentDialog from '../../components/AddAccountAndPaymentDialog/AddAccountAndPaymentDialog';
import SelectPaymentMethodDialog from '../../components/SelectPaymentMethodDialog/SelectPaymentMethodDialog';
import {
  getCreatorTypeAndId,
  parseOverrideId,
  getAccountSettingsUrl,
  getPaymentUrl,
  getActivitiesUrl,
  parseEligibilities,
} from '../../../utils/common';
import UnlockServiceAlert from '../../components/UnlockServiceAlert/UnlockServiceAlert';
import UnlockEmptyState from '../../components/UnlockEmptyState/UnlockEmptyState';

const UnlockServicePageContainer: FunctionComponent = () => {
  const {
    classes: { linkButtons, openIcon },
  } = useUnlockServicePageContainerStyles();
  const router = useRouter();
  const { reload: routerReload } = useRouter();
  const { userIdOverride, groupIdOverride } = router.query;
  const userIdOverrideString = userIdOverride as string | undefined;
  const groupIdOverrideString = groupIdOverride as string | undefined;

  const { translate } = useTranslationWrapper(useTranslation());
  const cloudPricingClient = useCloudPricingClient();
  const { isLoadingGame, gameDetails } = useCurrentGame();
  const currentGroup = useCurrentGroup();
  const { user } = useAuthentication();
  const { open, close, configure } = useDialog();
  const { showSuccessMessage, showFailureMessage } = useTopMessage();

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isPageInitFailed, setIsPageInitFailed] = useState<boolean>(false);
  const [serviceConfigurations, setServiceConfigurations] = useState<ServiceConfiguration[]>([]);
  const [account, setAccount] = useState<boolean>(false);
  const [defaultPaymentProfile, setDefaultPaymentProfile] = useState<boolean>(false);
  const [paymentProfiles, setPaymentProfiles] = useState<boolean>(false);
  const [disableSwitch, setDisableSwitch] = useState<boolean>(false);
  const [isEligible, setIsEligible] = useState<UnlockEligibilities>({
    generalEligibility: false,
    premiumEligibility: false,
  });
  const [notAuthorized, setNotAuthorized] = useState<boolean>(false);

  const { creatorType, creatorId, userId } = useMemo(() => {
    return getCreatorTypeAndId(currentGroup, user);
  }, [currentGroup, user]);

  const userOverride = parseOverrideId(userIdOverride);
  const groupOverride = parseOverrideId(groupIdOverride);

  const setAllStates = (value: boolean) => {
    setPaymentProfiles(value);
    setDefaultPaymentProfile(value);
    setAccount(value);
    setDisableSwitch(!value);
  };

  const loadAccAndPaymentData = useCallback(
    async (setDefault: boolean) => {
      let accountRes;
      try {
        accountRes = await cloudPricingClient.getAccountSettings(
          creatorId,
          creatorType,
          userOverride,
          groupOverride,
        );
        if (accountRes) {
          setAccount(true);
        }
      } catch {
        setAccount(false);
      }

      const paymentProfilesRes = await cloudPricingClient.listPaymentProfiles(userId);
      if (paymentProfilesRes.paymentProfiles) {
        setPaymentProfiles(true);
        if (setDefault && paymentProfilesRes.paymentProfiles[0]) {
          const paymentInfo = paymentProfilesRes.paymentProfiles[0];
          await cloudPricingClient.setPaymentProfiles(
            creatorType,
            creatorId,
            paymentInfo?.paymentProfileId ?? '',
            paymentInfo?.paymentProfileOwnerType ?? '',
          );
        }
      }

      const paymentProfileRes = await cloudPricingClient.getPaymentProfiles(
        creatorType,
        creatorId,
        userOverride,
        groupOverride,
      );
      if (paymentProfileRes) {
        setDefaultPaymentProfile(true);
      }
      // If the user is missing any of the required information, disable the form
      if (!accountRes || !paymentProfileRes || !paymentProfilesRes.paymentProfiles) {
        setDisableSwitch(true);
      } else {
        setDisableSwitch(false);
      }
    },
    [cloudPricingClient, userId, creatorId, creatorType, userOverride, groupOverride],
  );

  const loadPageData = useCallback(
    async (universeId: number) => {
      setIsLoading(true);
      try {
        // We want to check if the user is Eligible, if they're eligible then their account is not Suspended.
        // If the account is not Suspended then we can check if Premium is true
        const eligibilityResponse = await cloudPricingClient.checkEligibility(
          creatorType,
          creatorId,
        );
        const eligibilities = parseEligibilities(eligibilityResponse);
        // If the account is Suspended, we must check if the user is missing any Eligibility, if they are then defer to Eligibility page
        setIsEligible(eligibilities);
        setIsPageInitFailed(false);

        // Only call the rest of the endpoints if the user has general eligibility
        if (eligibilities.generalEligibility) {
          await loadAccAndPaymentData(false);
        }

        // Get the service configurations
        try {
          const serviceSettings = await cloudPricingClient.getUnlockServiceSettings(universeId);
          setServiceConfigurations(serviceSettings.serviceConfigurations);
          setNotAuthorized(false);
        } catch {
          setNotAuthorized(true);
        }
      } catch {
        setIsPageInitFailed(true);
      } finally {
        setIsLoading(false);
      }
    },
    [
      setIsLoading,
      setServiceConfigurations,
      setIsPageInitFailed,
      cloudPricingClient,
      creatorId,
      creatorType,
      loadAccAndPaymentData,
    ],
  );

  useEffect(() => {
    if (gameDetails?.id) {
      loadPageData(gameDetails.id);
    }
  }, [gameDetails?.id, loadPageData]);

  const enableDataStoreStorageSilent = useCallback(
    async (universeId: number) => {
      const storageResource = {
        resourceId: ResourceId.Storage,
        unlocked: true,
        monthlyBudget: null,
        unitCost: {},
        price: {},
      } as ServiceConfiguration['resourceConfigurations'][0];
      const minimalStorageServiceConfig: ServiceConfiguration = {
        serviceId: ServiceId.DataStoreStorage,
        budgetLevel: BudgetLevel.ServiceOnly,
        monthlyBudget: null,
        resourceConfigurations: [storageResource],
      };

      let configsWithStorage: ServiceConfiguration[];
      try {
        let fetchedConfigs: ServiceConfiguration[] | undefined;
        try {
          const res = await cloudPricingClient.getUnlockServiceSettings(universeId);
          fetchedConfigs = res.serviceConfigurations;
        } catch {
          await new Promise((r) => setTimeout(r, 1500));
          const res = await cloudPricingClient.getUnlockServiceSettings(universeId);
          fetchedConfigs = res.serviceConfigurations;
        }
        const storageService = fetchedConfigs?.find(
          (s) => s.serviceId === ServiceId.DataStoreStorage,
        );
        const storageResources = storageService?.resourceConfigurations?.length
          ? storageService.resourceConfigurations.map((r) => ({
              ...r,
              unlocked: true,
              monthlyBudget: null,
            }))
          : [storageResource];
        const storageServiceConfig: ServiceConfiguration = storageService
          ? { ...storageService, resourceConfigurations: storageResources }
          : minimalStorageServiceConfig;
        configsWithStorage = storageService
          ? fetchedConfigs!.map((s) =>
              s.serviceId === ServiceId.DataStoreStorage ? storageServiceConfig : s,
            )
          : [...(fetchedConfigs ?? []), storageServiceConfig];
      } catch {
        // GET failed (e.g. new account); still send the write with data-store-storage only
        configsWithStorage = [minimalStorageServiceConfig];
      }

      try {
        await cloudPricingClient.sendUnlockServiceUpdate(universeId, {
          serviceConfigurations: configsWithStorage,
        });
      } catch {
        // Non-blocking / silent
      }
    },
    [cloudPricingClient],
  );

  const handleStripeElementsProviderResponse = useCallback(
    async (stripeResponse: CardVerificationResultEnum, setDefault: boolean) => {
      if (stripeResponse === CardVerificationResultEnum.SUCCESS) {
        await loadAccAndPaymentData(setDefault);
        showSuccessMessage(
          translate(
            translationKey('Message.UnlockUpdatedSuccessfully', TranslationNamespace.CloudServices),
          ),
        );
        close();
      } else if (
        stripeResponse === CardVerificationResultEnum.CARD_AUTHENTICATION_FAILED ||
        stripeResponse === CardVerificationResultEnum.UNKNOWN_ERROR
      ) {
        showFailureMessage(
          translate(
            translationKey('Message.UnlockUpdatedFailure', TranslationNamespace.CloudServices),
          ),
        );
        close();
      }
    },
    [loadAccAndPaymentData, close, showFailureMessage, showSuccessMessage, translate],
  );

  const handleDialogResponse = useCallback(
    async (responseStatus: DialogResponseStatusEnum) => {
      if (responseStatus === DialogResponseStatusEnum.SUCCESS) {
        showSuccessMessage(
          translate(
            translationKey('Message.UnlockUpdatedSuccessfully', TranslationNamespace.CloudServices),
          ),
        );
        close();
        setAllStates(true);

        // Auto-enroll new user in data-store-storage (turn on, no budget)
        const universeId = gameDetails?.id;
        if (universeId) {
          await enableDataStoreStorageSilent(universeId);
        }
      } else if (responseStatus === DialogResponseStatusEnum.UNAUTHORIZED) {
        showFailureMessage(
          translate(translationKey('Message.UnauthorizedUser', TranslationNamespace.CloudServices)),
        );
        close();
      } else {
        showFailureMessage(
          translate(
            translationKey('Message.UnlockUpdatedFailure', TranslationNamespace.CloudServices),
          ),
        );
        close();
      }
    },
    [
      close,
      gameDetails?.id,
      showFailureMessage,
      showSuccessMessage,
      translate,
      enableDataStoreStorageSilent,
    ],
  );

  const saveAccountInfo = useCallback(
    async (accountInfo: Account) => {
      try {
        await cloudPricingClient.updateAccountSettings(creatorId, creatorType, accountInfo);
        showSuccessMessage(
          translate(
            translationKey('Message.UnlockUpdatedSuccessfully', TranslationNamespace.CloudServices),
          ),
        );
        close();
        setAllStates(true);
      } catch {
        showFailureMessage(
          translate(
            translationKey('Message.UnlockUpdatedFailure', TranslationNamespace.CloudServices),
          ),
        );
        close();
      }
    },
    [
      cloudPricingClient,
      creatorId,
      creatorType,
      close,
      showFailureMessage,
      showSuccessMessage,
      translate,
    ],
  );

  // Add new payment method dialog
  const stripeDialog = useMemo(
    () =>
      gameDetails && gameDetails?.id && userId ? (
        <CloudPricingClientProvider>
          <StripeElementsProvider
            creatorId={userId}
            closeDialog={close}
            enableDialog
            setAsDefault
            step={0}
            confirmAddressAndCard={() => {}}
            handleStripeResponse={handleStripeElementsProviderResponse}
          />
        </CloudPricingClientProvider>
      ) : null,
    [gameDetails, close, userId, handleStripeElementsProviderResponse],
  );

  // Add account settings and payment information dialog
  const addAccountAndPaymentDialog = useMemo(
    () =>
      gameDetails && gameDetails?.id && creatorType ? (
        <CloudPricingClientProvider>
          <AddAccountAndPaymentDialog
            creatorType={creatorType}
            creatorId={creatorId}
            userId={userId}
            closeDialog={close}
            savedPayments={paymentProfiles}
            saveStatus={handleDialogResponse}
          />
        </CloudPricingClientProvider>
      ) : null,
    [gameDetails, close, creatorId, creatorType, userId, paymentProfiles, handleDialogResponse],
  );

  // Add account settings dialog
  const accountSettingsDialog = useMemo(
    () =>
      creatorType && creatorId ? (
        <CloudPricingClientProvider>
          <AddAccountSettingsInfoDialog
            closeDialog={close}
            saveAccountResponse={saveAccountInfo}
            forStep={false}
          />
        </CloudPricingClientProvider>
      ) : null,
    [creatorType, creatorId, close, saveAccountInfo],
  );

  // Payment selector dialog
  const defaultPaymentDialog = useMemo(
    () =>
      creatorType && creatorId ? (
        <CloudPricingClientProvider>
          <SelectPaymentMethodDialog
            creatorType={creatorType}
            creatorId={creatorId}
            userId={userId}
            closeDialog={close}
            saveStatus={handleStripeElementsProviderResponse}
          />
        </CloudPricingClientProvider>
      ) : null,
    [creatorType, creatorId, userId, close, handleStripeElementsProviderResponse],
  );

  const onCreate = useCallback(() => {
    // Missing account and payment information
    if (!account && !defaultPaymentProfile) {
      configure(addAccountAndPaymentDialog);
      open();
    }
    // Missing payment profiles
    else if (account && !defaultPaymentProfile && !paymentProfiles) {
      configure(stripeDialog);
      open();
    }
    // Missing account
    else if (!account && defaultPaymentProfile && paymentProfiles) {
      configure(accountSettingsDialog);
      open();
    }
    // Missing default payment
    else if (account && !defaultPaymentProfile && paymentProfiles) {
      configure(defaultPaymentDialog);
      open();
    }
  }, [
    account,
    defaultPaymentProfile,
    paymentProfiles,
    open,
    configure,
    accountSettingsDialog,
    defaultPaymentDialog,
    stripeDialog,
    addAccountAndPaymentDialog,
  ]);

  const alertComponent = useMemo(() => {
    return (
      <UnlockServiceAlert
        account={account}
        paymentProfiles={paymentProfiles}
        paymentProfile={defaultPaymentProfile}
        onCreate={onCreate}
      />
    );
  }, [defaultPaymentProfile, paymentProfiles, account, onCreate]);

  if (notAuthorized && !isLoadingGame && !isLoading) {
    return <ErrorPage errorCode={StatusCodes.FORBIDDEN} />;
  }

  if (!isLoadingGame && !isLoading && isPageInitFailed && !notAuthorized) {
    return (
      <FailureView
        title={translate(translationKey('Heading.FailedToLoadPage', TranslationNamespace.Error))}
        message={translate(translationKey('Message.FailedToLoadPage', TranslationNamespace.Error))}
        buttonText={translate(
          translationKey('Action.FailedToLoadPage', TranslationNamespace.Error),
        )}
        onReload={() => routerReload()}
      />
    );
  }

  if (!isLoading && !isPageInitFailed && !isEligible.generalEligibility) {
    return (
      <Grid container item XSmall={12}>
        <Grid item container XSmall={12}>
          <HubMeta
            hubOnly
            title={translate(
              translationKey('Title.ExtendedServices', TranslationNamespace.CloudServices),
            )}
          />
        </Grid>
        <UnlockEmptyState />
      </Grid>
    );
  }

  if (gameDetails && gameDetails.id && serviceConfigurations.length > 0 && isEligible) {
    return (
      <div>
        <Grid container item XSmall={12}>
          <HubMeta
            hubOnly
            title={translate(
              translationKey('Title.ExtendedServices', TranslationNamespace.CloudServices),
            )}
          />
          {alertComponent}
          <Grid item XSmall={12} XLarge={10}>
            <Button
              color='secondary'
              size='small'
              variant='outlined'
              className={linkButtons}
              onClick={() => {
                window.open(
                  getActivitiesUrl(
                    userIdOverrideString,
                    groupIdOverrideString,
                    creatorType,
                    creatorId,
                  ),
                );
              }}>
              {translate(translationKey('Label.ManageBilling', TranslationNamespace.CloudServices))}
              <OpenInNewIcon className={openIcon} />
            </Button>

            <Button
              color='secondary'
              size='small'
              variant='outlined'
              className={linkButtons}
              onClick={() => {
                window.open(getPaymentUrl(userIdOverrideString));
              }}>
              {translate(translationKey('Label.ViewPayments', TranslationNamespace.CloudServices))}
              <OpenInNewIcon className={openIcon} />
            </Button>

            <Button
              color='secondary'
              size='small'
              variant='outlined'
              className={linkButtons}
              onClick={() => {
                window.open(
                  getAccountSettingsUrl(
                    userIdOverrideString,
                    groupIdOverrideString,
                    creatorType,
                    creatorId,
                  ),
                );
              }}>
              {translate(
                translationKey('Label.ManageAccountSettings', TranslationNamespace.CloudServices),
              )}
              <OpenInNewIcon className={openIcon} />
            </Button>
          </Grid>
          <Grid item XSmall={12}>
            <UnlockServiceForm
              universeId={gameDetails.id}
              serviceConfigurations={serviceConfigurations}
              updateServiceConfigurations={setServiceConfigurations}
              isEligible={isEligible}
              disableSwitch={disableSwitch}
            />
          </Grid>
        </Grid>
      </div>
    );
  }
  return (
    <EmptyGrid>
      <CircularProgress />
    </EmptyGrid>
  );
};

export default withTranslation(UnlockServicePageContainer, [
  TranslationNamespace.Controls,
  TranslationNamespace.Error,
  TranslationNamespace.CloudServices,
]);
