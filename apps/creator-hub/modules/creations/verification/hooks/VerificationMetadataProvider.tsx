import type { FunctionComponent } from 'react';
import React, { useMemo } from 'react';
import { skipToken, useQuery } from '@tanstack/react-query';
import { useAuthentication } from '@modules/authentication/providers';
import ageVerificationClient from '@modules/clients/ageVerification';
import marketplaceSalesClient from '@modules/clients/marketplacesales';
import premiumfeaturesClient from '@modules/clients/premiumfeatures';
import subscriptionsClient, { ProductType } from '@modules/clients/subscriptions';
import usersClient from '@modules/clients/users';
import VerificationMetadataContext from './VerificationMetadataContext';

const VerificationMetadataProvider: FunctionComponent<React.PropsWithChildren> = ({ children }) => {
  const { user } = useAuthentication();

  const { data: creationAccessMetadata } = useQuery({
    queryKey: ['creations', 'creationAccess'],
    queryFn: () => marketplaceSalesClient.checkCreationAccess(),
  });

  const { data: verifiedAgeData } = useQuery({
    queryKey: ['creations', 'verifiedAge'],
    queryFn: () => ageVerificationClient.isUserAgeVerified(),
  });

  const { data: ageBracket } = useQuery({
    queryKey: ['creations', 'ageBracket'],
    queryFn: () => usersClient.getAgeBracket(),
  });

  const { data: userSubscription } = useQuery({
    queryKey: ['creations', 'userSubscription', user?.id],
    queryFn:
      user?.id != null ? () => premiumfeaturesClient.getUserSubscription(user.id) : skipToken,
  });

  const { data: blackbirdSubscription } = useQuery({
    queryKey: ['creations', 'blackbirdSubscription'],
    queryFn: async () => {
      const response = await subscriptionsClient.listSubscriptions({
        productType: ProductType.Blackbird,
        expirationTimestampMsStart: Date.now(),
        resultsPerPage: 1,
      });
      return response?.subscriptions?.[0] ?? undefined;
    },
  });

  const providerValue = useMemo(
    () => ({
      ageBracket,
      verifiedAgeData,
      creationAccessMetadata,
      userSubscription,
      blackbirdSubscription,
    }),
    [ageBracket, verifiedAgeData, creationAccessMetadata, userSubscription, blackbirdSubscription],
  );

  return (
    <VerificationMetadataContext.Provider value={providerValue}>
      {children}
    </VerificationMetadataContext.Provider>
  );
};

export default VerificationMetadataProvider;
