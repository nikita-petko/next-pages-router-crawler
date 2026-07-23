import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { captureException } from '@sentry/nextjs';
import { rightsClient } from '@modules/clients';
import {
  IPContent,
  IPContentContentTypeEnum,
  IPFamilyLicensingEligibilityReasonsEnum,
  IPFamilyOwnershipTypesEnum,
  IPFamilyRightsScopesEnum,
  IPFamilyStatusEnum,
  ListIpContentsByIpFamilyRequest,
  ListIpFamiliesByAccountRequest,
} from '@rbx/clients/rightsV1';
import { Doc } from '@modules/miscellaneous/common/components/uploaders';
import { listAll } from '@modules/clients/utils';
import { useRobloxAuthentication } from '@rbx/auth';
import { useCurrentAccountContext } from '../../components/AccountProvider';
import uploadImageAssetsIfNeeded, { ImageAsset } from '../../utils/uploadImageAssetsIfNeeded';
import createDocuments from '../../rights/hooks/document';
import {
  GET_IP_FAMILY_QUERY_KEY,
  IP_CONTENTS_QUERY_KEY,
  IP_FAMILIES_QUERY_KEY,
  LIST_IP_CONTENTS_BY_FAMILY,
  LIST_IP_CONTENTS_BY_FAMILY_PAGINATED,
  LIST_IP_FAMILIES,
} from '../queryKeys';
import batchArray from '../utils/batchArray';

const MAX_IP_CONTENTS_BATCH_CREATE_SIZE = 50;

export const useIpFamiliesQuery = (
  params?: Omit<ListIpFamiliesByAccountRequest, 'accountId' | 'pageToken'>,
) => {
  const { account } = useCurrentAccountContext();
  const accountId = account?.id;

  return useQuery({
    queryKey: IP_FAMILIES_QUERY_KEY,
    queryFn: async () => {
      if (!accountId) {
        throw new Error('Missing account ID');
      }

      const ipFamilies = await listAll({
        api: (pageToken: string | undefined) =>
          rightsClient.listIpFamiliesByAccount({
            pageSize: 100,
            ...params,
            accountId,
            pageToken,
          }),
        getItems: (response) => response.ipFamilies || [],
        getPageToken: (response) => response.nextPageToken,
      });

      return {
        ipFamilies,
      };
    },
  });
};

export const usePaginatedIpFamiliesQuery = (
  params?: Omit<ListIpFamiliesByAccountRequest, 'accountId'>,
  options?: {
    enabled?: boolean;
  },
) => {
  const { account } = useCurrentAccountContext();
  const accountId = account?.id;

  return useQuery({
    queryKey: LIST_IP_FAMILIES(account?.id || '', params?.pageSize, params?.pageToken),
    queryFn: async () => {
      if (!accountId) {
        throw new Error('Missing account ID');
      }

      const ipFamilies = await rightsClient.listIpFamiliesByAccount({
        pageSize: 100,
        ...params,
        accountId,
      });
      return {
        ...ipFamilies,
        ipFamilies: ipFamilies.ipFamilies || [], // the API types this loosely, so we'll enforce array to simplify
      };
    },
    enabled: options?.enabled ?? true,
  });
};

export const useIpFamilyQuery = (ipFamilyId?: string) => {
  const { account } = useCurrentAccountContext();
  const accountId = account?.id;

  return useQuery({
    queryKey: GET_IP_FAMILY_QUERY_KEY(ipFamilyId || 'disabled'),
    queryFn: async () => {
      if (!accountId || !ipFamilyId) {
        throw new Error('Missing account ID or ipFamilyId');
      }
      const data = await rightsClient.getIpFamilyId({
        accountId,
        ipFamilyId,
      });

      return data;
    },
    enabled: !!ipFamilyId,
  });
};

interface CreateIpFamilyLegacyParams {
  name: string;
  primaryKeywords: { keyword: string; language: string }[];
  secondaryKeywords: { keywords: string[]; language: string }[];
  images: ImageAsset[];
  documents: Doc[];
  genAiOptOut: boolean;
}

// [Deprecated] Use useCreateIpFamilyMutation instead
export const useCreateIpFamilyLegacyMutation = () => {
  const { account } = useCurrentAccountContext();
  const queryClient = useQueryClient();
  const accountId = account?.id;
  const { user } = useRobloxAuthentication();

  return useMutation({
    mutationFn: async (data: CreateIpFamilyLegacyParams) => {
      if (!accountId) {
        throw new Error('Missing account ID');
      }
      if (!user) {
        throw new Error('Missing user');
      }

      let documentIds: string[] = [];
      const files = data.documents.map((file) => file.file);
      const filteredFiles = files.filter((file) => file !== undefined);
      documentIds = await createDocuments(filteredFiles);

      const ipFamily = await rightsClient.createIpFamily({
        accountId,
        iPFamily: {
          name: data.name,
          documentIds,
          genAiOptOut: data.genAiOptOut,
          status: IPFamilyStatusEnum.Approved, // This is set to approved to match what the business logic will override for legacy users
        },
      });
      if (!ipFamily.id) {
        throw new Error('Missing ID');
      }

      const imageAssetIds: number[] = [];
      if (data.images.length > 0) {
        const { imageAssetIds: uploadedAssetIds } = await uploadImageAssetsIfNeeded({
          imageAssets: data.images,
          userId: user.id,
        });
        imageAssetIds.push(...uploadedAssetIds);
      }

      const contents: IPContent[] = [];

      if (data.primaryKeywords) {
        contents.push(
          ...data.primaryKeywords.map((keywordData) => ({
            contentType: IPContentContentTypeEnum.Text,
            contentValue: keywordData.keyword,
            ipFamilyId: ipFamily.id,
            isPrimary: true,
            locale: keywordData.language,
          })),
        );
      }

      if (data.secondaryKeywords) {
        contents.push(
          ...data.secondaryKeywords.flatMap((keywordData) =>
            keywordData.keywords.map((keyword) => ({
              contentType: IPContentContentTypeEnum.Text,
              contentValue: keyword,
              ipFamilyId: ipFamily.id,
              isPrimary: false,
              locale: keywordData.language,
            })),
          ),
        );
      }

      if (imageAssetIds.length > 0) {
        contents.push(
          ...imageAssetIds.map((imageAssetId) => ({
            contentType: IPContentContentTypeEnum.Image,
            contentValue: imageAssetId.toString(),
            ipFamilyId: ipFamily.id,
            isPrimary: false,
          })),
        );
      }

      const batches = batchArray(contents, MAX_IP_CONTENTS_BATCH_CREATE_SIZE);
      for (let i = 0; i < batches.length; i += 1) {
        const batch = batches[i];
        // TODO: [future] if we fail during createIpContent then
        // we have created an ip family with partial content.
        // This seems less than ideal (kzhou, copied from abech)
        // eslint-disable-next-line no-await-in-loop -- Creation of IP contents is intentionally not concurrent to ensure that the backend is able to enforce validation without race conditions
        await rightsClient.batchCreateIpContents({
          accountId,
          batchCreateIPContentsRequest: {
            requests: batch.map((content) => ({
              ipContent: content,
            })),
          },
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: IP_FAMILIES_QUERY_KEY,
      });
      queryClient.invalidateQueries({
        queryKey: IP_CONTENTS_QUERY_KEY,
      });
    },
    onError: (error) => {
      captureException(error, {
        tags: { module: 'ip-families', operation: 'createIpFamilyLegacy' },
        extra: { accountId },
      });
    },
  });
};

interface CreateIpFamilyParams {
  name: string;
  documents: Doc[];
  licensingEligilityReasons: IPFamilyLicensingEligibilityReasonsEnum[];
  licensingInterest: boolean;
  ownershipContext: string;
  ownershipTypes: IPFamilyOwnershipTypesEnum[];
  ownershipUrls: string[];
  rightsScopes: IPFamilyRightsScopesEnum[];
  genAiOptOut: boolean;
  licTermsAccepted: boolean;
}

export const useCreateIpFamilyMutation = () => {
  const { account } = useCurrentAccountContext();
  const queryClient = useQueryClient();
  const accountId = account?.id;
  const { user } = useRobloxAuthentication();
  return useMutation({
    mutationFn: async (data: CreateIpFamilyParams) => {
      if (!accountId) {
        throw new Error('Missing account ID');
      }
      if (!user) {
        throw new Error('Missing user');
      }

      let documentIds: string[] = [];
      const files = data.documents.map((file) => file.file);
      const filteredFiles = files.filter((file) => file !== undefined);
      documentIds = await createDocuments(filteredFiles);

      const ipFamily = await rightsClient.createIpFamily({
        accountId,
        iPFamily: {
          name: data.name,
          documentIds,
          licensingEligibilityReasons: data.licensingEligilityReasons,
          licensingInterest: data.licensingInterest,
          ownershipContext: data.ownershipContext,
          ownershipTypes: data.ownershipTypes,
          ownershipUrls: data.ownershipUrls,
          rightsScopes: data.rightsScopes,
          genAiOptOut: data.genAiOptOut,
          licTermsAccepted: data.licTermsAccepted,
          status: IPFamilyStatusEnum.Pending,
        },
      });
      if (!ipFamily.id) {
        throw new Error('Missing ID');
      }
      return ipFamily;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: IP_FAMILIES_QUERY_KEY,
      });
    },
    onError: (error) => {
      captureException(error, {
        tags: { module: 'ip-families', operation: 'createIpFamily' },
        extra: { accountId },
      });
    },
  });
};

interface UpdateIpFamilyParams {
  ipFamilyId: string;
  name: string;
  newDocuments: Doc[];
  licensingEligilityReasons: IPFamilyLicensingEligibilityReasonsEnum[];
  licensingInterest: boolean;
  ownershipContext: string;
  ownershipTypes: IPFamilyOwnershipTypesEnum[];
  ownershipUrls: string[];
  rightsScopes: IPFamilyRightsScopesEnum[];
  genAiOptOut: boolean;
  licTermsAccepted: boolean;
}

/**
 * Updates the IP family and sets its status to pending.
 *
 */
export const useUpdateIpFamilyMutation = () => {
  const { account } = useCurrentAccountContext();
  const queryClient = useQueryClient();
  const accountId = account?.id;
  const { user } = useRobloxAuthentication();
  return useMutation({
    mutationFn: async (data: UpdateIpFamilyParams) => {
      if (!accountId) {
        throw new Error('Missing account ID');
      }
      if (!user) {
        throw new Error('Missing user');
      }
      if (!data.ipFamilyId) {
        throw new Error('Missing ID');
      }

      const ipFamily = await rightsClient.getIpFamilyId({
        accountId,
        ipFamilyId: data.ipFamilyId,
      });

      let documentIds: string[] = [];
      const files = data.newDocuments.map((file) => file.file);
      const filteredFiles = files.filter((file) => file !== undefined);
      documentIds = await createDocuments(filteredFiles);

      let allDocuments: string[];
      if (ipFamily.documentIds === undefined) {
        allDocuments = [...documentIds];
      } else {
        allDocuments = [...ipFamily.documentIds, ...documentIds];
      }

      const updatedIpFamily = await rightsClient.updateIpFamily({
        accountId,
        ipFamilyId: data.ipFamilyId,
        iPFamily: {
          name: data.name,
          documentIds: allDocuments,
          licensingEligibilityReasons: data.licensingEligilityReasons,
          licensingInterest: data.licensingInterest,
          ownershipContext: data.ownershipContext,
          ownershipTypes: data.ownershipTypes,
          ownershipUrls: data.ownershipUrls,
          rightsScopes: data.rightsScopes,
          genAiOptOut: data.genAiOptOut,
          licTermsAccepted: data.licTermsAccepted,
          status: IPFamilyStatusEnum.Pending,
        },
      });
      return updatedIpFamily;
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: IP_FAMILIES_QUERY_KEY,
      });
    },
  });
};

interface CreateIpContentsAndAddToIpFamilyParams {
  ipFamilyId: string;
  primaryKeywords?: { keyword: string; language: string; citation: string }[];
  secondaryKeywords?: { keyword: string; language: string; citation: string }[];
  images?: { asset: ImageAsset; citation: string }[];
  additionalOwnershipUrls: string[];
  additionalDocuments: Doc[];
}

/**
 * A hook that updates the IP family with additional supporting documentation and then
 * creates IP contents for the IP family.
 */
export const useCreateIpContentsAndAddToIpFamily = () => {
  const { account } = useCurrentAccountContext();
  const queryClient = useQueryClient();
  const accountId = account?.id;
  const { user } = useRobloxAuthentication();

  return useMutation({
    mutationFn: async (data: CreateIpContentsAndAddToIpFamilyParams) => {
      if (!accountId) {
        throw new Error('Missing account ID');
      }
      if (!user) {
        throw new Error('Missing user');
      }
      if (data.additionalDocuments.length !== 0 || data.additionalOwnershipUrls.length !== 0) {
        let documentIds: string[] = [];
        const files = data.additionalDocuments.map((file) => file.file);
        const filteredFiles = files.filter((file) => file !== undefined);
        documentIds = await createDocuments(filteredFiles);
        const ipFamily = await rightsClient.getIpFamilyId({
          accountId,
          ipFamilyId: data.ipFamilyId,
        });
        let allDocumentIds: string[];
        if (ipFamily.documentIds === undefined || ipFamily.documentIds.length === 0) {
          allDocumentIds = [...documentIds];
        } else {
          allDocumentIds = [...ipFamily.documentIds, ...documentIds];
        }
        let allOwnershipUrls: string[];
        if (ipFamily.ownershipUrls === undefined || ipFamily.ownershipUrls.length === 0) {
          allOwnershipUrls = [...data.additionalOwnershipUrls];
        } else {
          allOwnershipUrls = [...ipFamily.ownershipUrls, ...data.additionalOwnershipUrls];
        }
        await rightsClient.updateIpFamily({
          accountId,
          ipFamilyId: data.ipFamilyId,
          iPFamily: {
            // Keep the existing status
            ...ipFamily,
            documentIds: allDocumentIds,
            ownershipUrls: allOwnershipUrls,
          },
        });
      }

      const imageAssetIds: number[] = [];
      if (data.images !== undefined && data.images.length > 0) {
        const { imageAssetIds: uploadedAssetIds } = await uploadImageAssetsIfNeeded({
          imageAssets: data.images.map((image) => image.asset),
          userId: user.id,
        });
        imageAssetIds.push(...uploadedAssetIds);
      }

      const contents: IPContent[] = [];

      if (data.primaryKeywords) {
        contents.push(
          ...data.primaryKeywords.map((keywordData) => ({
            contentType: IPContentContentTypeEnum.Text,
            contentValue: keywordData.keyword,
            ipFamilyId: data.ipFamilyId,
            isPrimary: true,
            locale: keywordData.language,
            citation: keywordData.citation,
          })),
        );
      }

      if (data.secondaryKeywords) {
        contents.push(
          ...data.secondaryKeywords.map((keywordData) => ({
            contentType: IPContentContentTypeEnum.Text,
            contentValue: keywordData.keyword,
            ipFamilyId: data.ipFamilyId,
            isPrimary: false,
            locale: keywordData.language,
            citation: keywordData.citation,
          })),
        );
      }

      if (imageAssetIds.length > 0) {
        contents.push(
          ...imageAssetIds.map((imageAssetId, index) => ({
            contentType: IPContentContentTypeEnum.Image,
            contentValue: imageAssetId.toString(),
            ipFamilyId: data.ipFamilyId,
            isPrimary: false,
            citation: data.images?.[index]?.citation ?? '',
          })),
        );
      }
      // Creation of IP contents is intentionally not concurrent to ensure that the backend is able to enforce validation without
      // running into race conditions.
      const batches = batchArray(contents, MAX_IP_CONTENTS_BATCH_CREATE_SIZE);
      for (let i = 0; i < batches.length; i += 1) {
        const batch = batches[i];
        // TODO: [future] if we fail during createIpContent then
        // we have created an ip family with partial content.
        // This seems less than ideal (kzhou, copied from abech)
        // eslint-disable-next-line no-await-in-loop -- Creation of IP contents is intentionally not concurrent to ensure that the backend is able to enforce validation without race conditions
        await rightsClient.batchCreateIpContents({
          accountId,
          batchCreateIPContentsRequest: {
            requests: batch.map((content) => ({
              ipContent: content,
            })),
          },
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: IP_CONTENTS_QUERY_KEY,
      });
      queryClient.invalidateQueries({
        queryKey: IP_FAMILIES_QUERY_KEY,
      });
    },
    onError: (error, variables) => {
      captureException(error, {
        tags: { module: 'ip-families', operation: 'createIpContentsAndAddToFamily' },
        extra: { accountId, ipFamilyId: variables.ipFamilyId },
      });
    },
  });
};

export const useCreateIpContentMutation = () => {
  const { account } = useCurrentAccountContext();
  const queryClient = useQueryClient();
  const accountId = account?.id;

  return useMutation({
    mutationFn: async (data: IPContent) => {
      return rightsClient.createIpContent({
        accountId: accountId!,
        iPContent: data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: IP_CONTENTS_QUERY_KEY,
      });
    },
    onError: (error) => {
      captureException(error, {
        tags: { module: 'ip-families', operation: 'createIpContent' },
        extra: { accountId },
      });
    },
  });
};

export const useListIpContentsByFamilyQuery = (
  params: Omit<ListIpContentsByIpFamilyRequest, 'accountId'>,
) => {
  const { account } = useCurrentAccountContext();
  const accountId = account?.id;

  return useQuery({
    queryKey: LIST_IP_CONTENTS_BY_FAMILY_PAGINATED(
      params.ipFamilyId,
      params.pageSize,
      params.pageToken,
    ),
    queryFn: async () => {
      if (!accountId) {
        throw new Error('Missing account ID');
      }
      const ipContent = await rightsClient.listIpContentsByIpFamily({
        pageSize: 100,
        ...params,
        accountId,
      });

      return {
        ...ipContent,
        ipContents: ipContent.ipContents || [], // the API types this loosely, so we'll enforce array to simplify
      };
    },
  });
};

export const useListAllIpContentsByIpFamily = (
  params: Omit<ListIpContentsByIpFamilyRequest, 'accountId' | 'pageToken'>,
) => {
  const { account } = useCurrentAccountContext();
  const accountId = account?.id;

  return useQuery({
    queryKey: LIST_IP_CONTENTS_BY_FAMILY(params.ipFamilyId),
    queryFn: async () => {
      if (!accountId) {
        throw new Error('Missing account ID');
      }
      const ipContents = await listAll({
        api: (pageToken: string | undefined) =>
          rightsClient.listIpContentsByIpFamily({
            pageSize: 100,
            ...params,
            accountId,
            pageToken,
          }),
        getItems: (response) => response.ipContents || [],
        getPageToken: (response) => response.nextPageToken,
      });

      return {
        ipContents,
      };
    },
  });
};

export const useArchiveIpContentMutation = () => {
  const { account } = useCurrentAccountContext();
  const queryClient = useQueryClient();
  const accountId = account?.id;

  return useMutation({
    mutationFn: async (data: { ipContentId: string }) => {
      if (!accountId) {
        throw new Error('Missing account ID');
      }
      await rightsClient.archiveIpContent({
        accountId,
        ipContentId: data.ipContentId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: IP_CONTENTS_QUERY_KEY,
      });
      queryClient.invalidateQueries({
        queryKey: IP_FAMILIES_QUERY_KEY,
      });
    },
    onError: (error, variables) => {
      captureException(error, {
        tags: { module: 'ip-families', operation: 'archiveIpContent' },
        extra: { accountId, ipContentId: variables.ipContentId },
      });
    },
  });
};

export interface UpdateTextIpContentParams {
  type: 'text';
  text: string;
  locale: string;
  citation: string;
}

export interface UpdateImageIpContentParams {
  type: 'image';
  image: ImageAsset;
  citation: string;
}

type UpdateIpContentParams = {
  ipContentId: string;
  ipContent: IPContent;
} & (UpdateTextIpContentParams | UpdateImageIpContentParams);

export const useUpdateIpContentMutation = ({
  onSuccess,
  onError,
}: {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
} = {}) => {
  const queryClient = useQueryClient();
  const { account } = useCurrentAccountContext();
  const accountId = account?.id;
  const { user } = useRobloxAuthentication();

  return useMutation({
    mutationFn: async ({ ipContentId, ipContent, ...params }: UpdateIpContentParams) => {
      if (!accountId) {
        throw new Error('Missing account ID');
      }
      if (!user) {
        throw new Error('Missing user');
      }
      const ipContentData = {
        ...ipContent,
        citation: params.citation,
      };

      switch (params.type) {
        case 'text':
          ipContentData.locale = params.locale;
          ipContentData.contentValue = params.text;
          break;
        case 'image': {
          const { imageAssetIds: uploadedAssetIds } = await uploadImageAssetsIfNeeded({
            imageAssets: [params.image],
            userId: user.id,
          });
          if (uploadedAssetIds.length !== 1) {
            throw new Error(`Expected 1 uploaded image, but got ${uploadedAssetIds.length}`);
          }
          ipContentData.contentValue = uploadedAssetIds[0].toString();
          break;
        }
        default:
          params satisfies never;
      }

      return rightsClient.updateIpContent({
        accountId,
        ipContentId,
        iPContent: ipContentData,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: IP_CONTENTS_QUERY_KEY });
      onSuccess?.();
    },
    onError: (error, variables) => {
      captureException(error, {
        tags: { module: 'ip-families', operation: 'updateIpContent' },
        extra: { accountId, ipContentId: variables.ipContentId },
      });
      onError?.(error);
    },
  });
};
