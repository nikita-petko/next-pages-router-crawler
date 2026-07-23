import { useAuthentication } from '@modules/authentication/providers';
import { CreatorType as CreatorTypeEnum } from '@modules/miscellaneous/common';
import brandPlatformApiClient, {
  CreatorType,
  TaxIdType,
  CreatorContactType,
} from '@modules/clients/brandPlatform';
import { useCurrentGroup } from '@modules/providers/groups/GroupsProvider';
import { useCallback } from 'react';
import { useCloudPricingClient } from '@modules/cloud-services/pricing/CloudPricingClientProvider';
import type { Account } from '@modules/cloud-services/pricing/types';
import { InputFormData } from '../types';

export const useSubmitExtendedServicesAccountInfo = () => {
  const currentGroup = useCurrentGroup();
  const { user } = useAuthentication();
  const cloudPricingClient = useCloudPricingClient();

  return useCallback(
    async (account: Account) => {
      try {
        const response = await cloudPricingClient.updateAccountSettings(
          currentGroup?.id ?? user?.id ?? 0,
          currentGroup?.id ? CreatorTypeEnum.Group : CreatorTypeEnum.User,
          {
            accountName: account.accountName ?? '',
            accountTaxType: account.accountTaxType,
            taxId: account.taxId,
            taxIdType: account.taxIdType,
          } as Account,
        );

        return response;
      } catch {
        return null;
      }
    },
    [currentGroup, user, cloudPricingClient],
  );
};

export const useSubmitCreatorAccountInfo = () => {
  const currentGroup = useCurrentGroup();
  const { user } = useAuthentication();

  return useCallback(
    async (data: InputFormData) => {
      const request = {
        creatorType: currentGroup?.id ? CreatorType.Group : CreatorType.User,
        creatorId: String(currentGroup?.id ?? user?.id ?? 0),
        accountInfo: {
          entityName: data.accountInfo.entityName ?? '',
          taxId: {
            type: data.accountInfo.taxId.type ?? TaxIdType.Invalid,
            id: data.accountInfo.taxId.id ?? '',
          },
        },
      };

      // Ignore tax ID input values if either is not provided
      if (request.accountInfo.taxId.type === TaxIdType.Invalid || !request.accountInfo.taxId.id) {
        request.accountInfo.taxId = {
          type: TaxIdType.Invalid,
          id: '',
        };
      }

      // TODO(BRANDPLAT-444): Use the upsert API response instead of the request account info
      await brandPlatformApiClient.upsertCreatorAccountInfo(request);
      return request.accountInfo;
    },
    [currentGroup, user],
  );
};

export const useSubmitCreatorContact = (contactType: CreatorContactType) => {
  const currentGroup = useCurrentGroup();
  const { user } = useAuthentication();

  return useCallback(
    async (data: InputFormData) => {
      const request = {
        creatorType: currentGroup?.id ? CreatorType.Group : CreatorType.User,
        creatorId: String(currentGroup?.id ?? user?.id ?? 0),
        contactInfo: {
          contactType,
          name: data.contactInfo.name ?? '',
          email: data.contactInfo.email ?? '',
          address: {
            address1: data.contactInfo.address.address1 ?? '',
            address2: data.contactInfo.address.address2 ?? '',
            city: data.contactInfo.address.city ?? '',
            state: data.contactInfo.address.state ?? '',
            country: data.contactInfo.address.country ?? '',
            postalCode: data.contactInfo.address.postalCode ?? '',
          },
        },
      };

      // TODO(BRANDPLAT-444): Use the upsert API response instead of the request account info
      await brandPlatformApiClient.upsertCreatorContactInfo(request);
      return request.contactInfo;
    },
    [currentGroup, user, contactType],
  );
};
