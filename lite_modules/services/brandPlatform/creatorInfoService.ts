import brandPlatformClient from '@clients/brandPlatform';

interface CreatorAccountInfoResponse {
  creatorAccountInfo: {
    entityName: string;
    taxId: {
      id: string;
      type: string;
    };
  } | null;
}

interface CreatorContactInfoResponse {
  creatorContact: {
    address: {
      address1: string;
      address2: string;
      city: string;
      country: string;
      postalCode: string;
      state: string;
    };
    contactType: string;
    email: string;
    name: string;
  } | null;
}

export const getCreatorAccountInfo = async (
  userId: number,
): Promise<CreatorAccountInfoResponse> => {
  const response = await brandPlatformClient.get<CreatorAccountInfoResponse>({
    url: `/v1/brand-metadata/creator/account-info?CreatorId=${userId}&CreatorType=user`,
  });
  return response.data;
};

export const getCreatorContactInfo = async (
  userId: number,
): Promise<CreatorContactInfoResponse> => {
  const response = await brandPlatformClient.get<CreatorContactInfoResponse>({
    url: `/v1/brand-metadata/creator/contact-info?creatorType=user&creatorId=${userId}&contactType=legal`,
  });
  return response.data;
};
