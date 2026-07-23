import React, { FunctionComponent, useMemo, useCallback, useEffect, useState } from 'react';
import { useSettings } from '@modules/settings';
import {
  usersClient,
  ageVerificationClient,
  marketplaceSalesClient,
  premiumfeaturesClient,
  subscriptionsClient,
  ProductType,
  Subscription,
  VerifiedAgeResponse,
  AgeBracketResponse,
  CheckCreationAccessResponse,
  UserSubscriptionResponse,
  developClient,
} from '@modules/clients';
import { useAuthentication } from '@modules/authentication/providers';
import { RobloxWebWebAPIModelsApiArrayResponseRobloxApiDevelopAssetModel } from '@rbx/clients/develop/v1';
import VerificationMetadataContext from './VerificationMetadataContext';

const VerificationMetadataProvider: FunctionComponent<React.PropsWithChildren<unknown>> = ({
  children,
}) => {
  const [verifiedAgeData, setVerifiedAgeData] = useState<VerifiedAgeResponse | undefined>(
    undefined,
  );
  const [ageBracket, setAgeBracket] = useState<AgeBracketResponse | undefined>(undefined);
  const [userSubscription, setuserSubscription] = useState<UserSubscriptionResponse | undefined>(
    undefined,
  );
  const [creationAccessMetadata, setCreationAccessMetadata] = useState<
    CheckCreationAccessResponse | undefined
  >(undefined);
  const [assetDetailsMetadata, setAssetDetailsMetadata] = useState<
    RobloxWebWebAPIModelsApiArrayResponseRobloxApiDevelopAssetModel | undefined
  >(undefined);
  const [blackbirdSubscription, setBlackbirdSubscription] = useState<Subscription | undefined>(
    undefined,
  );
  const { user } = useAuthentication();
  const { settings, isFetched } = useSettings();

  const fetchDetails = useCallback(async () => {
    // Load ID Verification + Premium Membership data
    const [
      verifiedAgeResponse,
      ageBracketResponse,
      userSubscriptionResponse,
      blackbirdSubscriptionResponse,
    ] = await Promise.allSettled([
      ageVerificationClient.isUserAgeVerified(),
      usersClient.getAgeBracket(),
      premiumfeaturesClient.getUserSubscription(user?.id ?? 0),
      subscriptionsClient.listSubscriptions({
        productType: ProductType.Blackbird,
        expirationTimestampMsStart: Date.now(),
        resultsPerPage: 1,
      }),
    ]);

    if (blackbirdSubscriptionResponse.status === 'fulfilled') {
      const first = blackbirdSubscriptionResponse.value?.subscriptions?.[0];
      setBlackbirdSubscription(first ?? undefined);
    } else {
      setBlackbirdSubscription(undefined);
    }

    if (verifiedAgeResponse.status === 'fulfilled') {
      setVerifiedAgeData(verifiedAgeResponse.value ?? undefined);
    } else {
      setVerifiedAgeData(undefined);
    }

    if (ageBracketResponse.status === 'fulfilled') {
      setAgeBracket(ageBracketResponse.value ?? undefined);
    } else {
      setAgeBracket(undefined);
    }

    if (userSubscriptionResponse.status === 'fulfilled') {
      setuserSubscription(userSubscriptionResponse.value ?? undefined);
    } else {
      setuserSubscription(undefined);
    }

    // Load creation access data
    try {
      const checkCreationAccessResponse = await marketplaceSalesClient.checkCreationAccess();
      setCreationAccessMetadata(checkCreationAccessResponse ?? undefined);
    } catch {
      setCreationAccessMetadata(undefined);
    }

    if (settings?.dynamicPriceFloorAssetWhitelist) {
      const ids = settings?.dynamicPriceFloorAssetWhitelist.split(';').map(parseFloat);
      const developClientResponse = await developClient.getAssetDetails(ids);
      setAssetDetailsMetadata(developClientResponse);
    }
  }, [settings, user?.id]);

  useEffect(() => {
    if (isFetched) {
      fetchDetails();
    }
  }, [fetchDetails, settings, isFetched]);

  const providerValue = useMemo(
    () => ({
      ageBracket,
      verifiedAgeData,
      creationAccessMetadata,
      userSubscription,
      blackbirdSubscription,
      assetDetailsMetadata,
    }),
    [
      ageBracket,
      verifiedAgeData,
      creationAccessMetadata,
      userSubscription,
      blackbirdSubscription,
      assetDetailsMetadata,
    ],
  );
  return (
    <VerificationMetadataContext.Provider value={providerValue}>
      {children}
    </VerificationMetadataContext.Provider>
  );
};

export default VerificationMetadataProvider;
