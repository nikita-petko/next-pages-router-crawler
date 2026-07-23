import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { captureException } from '@sentry/nextjs';
import { contentLicensingClient } from '@modules/clients';
import {
  ContentStandardAnswer,
  type ContentStandardQuestionAnswerRequest,
  DauBucket,
  type LicensesCreateLicenseRequest,
  type LicensesUpdateLicenseRequest,
  LicenseVisibility,
  type ListingsCreateListingRequest,
  type ListingsUpdateListingRequest,
  UniverseContentMaturity,
} from '@rbx/clients/contentLicensingApi/v1';
import { useRobloxAuthentication } from '@rbx/auth';
import { listAll } from '@modules/clients/utils';
import { useCurrentAccountContext } from '../../../components/AccountProvider';
import uploadImageAssetsIfNeeded, { ImageAsset } from '../../../utils/uploadImageAssetsIfNeeded';
import { convertToContentStandardAnswer } from '../../utils/guidelinesAndRestrictions';
import {
  GET_IP_LISTING_QUERY_KEY,
  GET_LICENSES_QUERY_KEY,
  GET_LICENSE_QUERY_KEY,
  IP_LISTINGS_QUERY_KEY,
  LICENSES_QUERY_KEY,
  GET_AGREEMENTS_BY_LICENSE_QUERY_KEY,
} from '../../queryKeys';

export const DEFAULT_PAGE_SIZE = 100;

export const useIpListingsQuery = () => {
  const { account } = useCurrentAccountContext();
  const accountId = account?.id;

  return useQuery({
    queryKey: IP_LISTINGS_QUERY_KEY,
    queryFn: async () => {
      if (!accountId) {
        throw new Error('Missing account ID');
      }

      return contentLicensingClient.listIpListingsByAccount(
        accountId,
        DEFAULT_PAGE_SIZE,
        undefined, // pageToken
      );
    },
    enabled: !!accountId,
  });
};

export const useIpListingQuery = (ipListingId?: string) => {
  const { account } = useCurrentAccountContext();
  const accountId = account?.id;

  return useQuery({
    queryKey: GET_IP_LISTING_QUERY_KEY(ipListingId || ''),
    queryFn: async () => {
      if (!accountId) {
        throw new Error('Missing account ID');
      }
      if (!ipListingId) {
        throw new Error('Missing IP listing ID');
      }

      return contentLicensingClient.getIpListing(accountId, ipListingId);
    },
    enabled: !!ipListingId,
  });
};

export const useLicenseQuery = (licenseId: string) => {
  const { account } = useCurrentAccountContext();
  const accountId = account?.id;

  return useQuery({
    queryKey: GET_LICENSE_QUERY_KEY(licenseId),
    queryFn: async () => {
      if (!accountId) {
        throw new Error('Missing account ID');
      }

      return contentLicensingClient.getLicense(accountId, licenseId);
    },
    enabled: !!accountId,
  });
};

export const useAgreementsByLicenseQuery = ({
  licenseId,
  pageSize,
}: {
  licenseId: string;
  pageSize?: number;
}) => {
  const { account } = useCurrentAccountContext();
  const accountId = account?.id;

  return useQuery({
    queryKey: GET_AGREEMENTS_BY_LICENSE_QUERY_KEY(accountId, licenseId),
    queryFn: async () => {
      if (!accountId) {
        throw new Error('Missing account ID');
      }
      if (!licenseId) {
        throw new Error('Missing license ID');
      }

      return contentLicensingClient.listAgreementsByLicense(
        accountId,
        licenseId,
        pageSize,
        undefined, // cursor
        undefined, // filter
      );
    },
    enabled: !!licenseId,
  });
};

interface CreateIPListingParams extends Omit<ListingsCreateListingRequest, 'thumbnailAssetIds'> {
  thumbnails: ImageAsset[];
}

interface CreateLicenseParams extends LicensesCreateLicenseRequest {
  contentStandardsDocument?: Blob;
}

export const useCreateIpListingMutation = ({
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
    mutationFn: async ({ thumbnails, ...params }: CreateIPListingParams) => {
      if (!accountId) {
        throw new Error('Missing account ID');
      }
      if (!user) {
        throw new Error('Missing user');
      }
      if (!thumbnails) {
        throw new Error('Missing thumbnails');
      }

      const { imageAssetIds: thumbnailAssetIds } = await uploadImageAssetsIfNeeded({
        imageAssets: thumbnails,
        userId: user.id,
      });

      const contentLicensingIpListing: ListingsCreateListingRequest = {
        ipFamilyId: params.ipFamilyId,
        name: params.name,
        description: params.description,
        thumbnailAssetIds,
      };
      return contentLicensingClient.createIpListing(accountId, contentLicensingIpListing);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: IP_LISTINGS_QUERY_KEY });
      onSuccess?.();
    },
    onError: (error) => {
      captureException(error, {
        tags: { module: 'license-manager', operation: 'createIpListing' },
        extra: { accountId },
      });
      onError?.(error);
    },
  });
};

interface UpdateIPListingParams extends Omit<ListingsUpdateListingRequest, 'thumbnailAssetIds'> {
  thumbnails: ImageAsset[];
  ipListingId: string;
}

export const useUpdateIpListingMutation = ({
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
    mutationFn: async ({ ipListingId, thumbnails, ...params }: UpdateIPListingParams) => {
      if (!accountId) {
        throw new Error('Missing account ID');
      }
      if (!user) {
        throw new Error('Missing user');
      }
      if (!thumbnails) {
        throw new Error('Missing thumbnails');
      }

      const { imageAssetIds: thumbnailAssetIds } = await uploadImageAssetsIfNeeded({
        imageAssets: thumbnails,
        userId: user.id,
      });

      const contentLicensingIpListing: ListingsUpdateListingRequest = {
        name: params.name,
        description: params.description,
        thumbnailAssetIds,
      };
      return contentLicensingClient.updateIpListing(
        accountId,
        ipListingId,
        contentLicensingIpListing,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: IP_LISTINGS_QUERY_KEY });
      onSuccess?.();
    },
    onError: (error, variables) => {
      captureException(error, {
        tags: { module: 'license-manager', operation: 'updateIpListing' },
        extra: { accountId, ipListingId: variables.ipListingId },
      });
      onError?.(error);
    },
  });
};

export const useLicensesQuery = (ipListingId?: string) => {
  const { account } = useCurrentAccountContext();
  const accountId = account?.id;

  return useQuery({
    enabled: !!ipListingId,
    queryKey: GET_LICENSES_QUERY_KEY(ipListingId || ''),
    queryFn: async () => {
      if (!accountId) {
        throw new Error('Missing account ID');
      }

      // Generally, we'll expect at most a handful of licenses.
      // But for some reason if we get a paginated response, we'll just fetch all pages.
      const licenses = await listAll({
        api: (cursor: string | undefined) =>
          contentLicensingClient.listLicensesByIpListing(
            accountId,
            ipListingId || '', // should always be set (see `enabled` above)
            DEFAULT_PAGE_SIZE,
            cursor,
          ),
        getItems: (response) => response.licenses ?? [],
        getPageToken: (response) => response.nextPageToken ?? undefined,
      });

      return licenses;
    },
  });
};

export const useAddLicenseMutation = ({
  onSuccess,
  onError,
}: {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
} = {}) => {
  const queryClient = useQueryClient();
  const { account } = useCurrentAccountContext();
  const accountId = account?.id;

  return useMutation({
    mutationFn: async (params: CreateLicenseParams) => {
      if (!accountId) {
        throw new Error('Missing account ID');
      }

      let documentId: string | undefined;
      if (params.contentStandardsDocument) {
        const documentMetadata = await contentLicensingClient.uploadLicensingDocument(
          accountId,
          params.contentStandardsDocument,
        );
        documentId = documentMetadata.id ?? undefined;
      }

      const licenseResponse: LicensesCreateLicenseRequest = {
        listingId: params.listingId ?? '',
        royaltyRate: params.royaltyRate ?? 0,
        maxAgeRating: params.maxAgeRating ?? UniverseContentMaturity.None,
        dau7DayThreshold: params.dau7DayThreshold ?? DauBucket.None,
        name: params.name ?? '',
        description: params.description ?? '',
        visibility: params.visibility ?? LicenseVisibility.Private,
        enableMonetization: params.enableMonetization ?? false,
        countries: params.countries ?? [],
        creatorDau7DayThreshold: params.creatorDau7DayThreshold ?? DauBucket.None,
        contentStandardsDocumentId: documentId ?? '',
        contentStandardScope: params.contentStandardScope ?? '',
        contentStandardAnswers: params.contentStandardAnswers ?? [],
        licenseDuration: params.licenseDuration,
      };

      return contentLicensingClient.createLicense(accountId, licenseResponse);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LICENSES_QUERY_KEY });
      onSuccess?.();
    },
    onError: (error) => {
      captureException(error, {
        tags: { module: 'license-manager', operation: 'addLicense' },
        extra: { accountId },
      });
      onError?.(error);
    },
  });
};

export interface UpdateLicenseParams extends LicensesUpdateLicenseRequest {
  licenseId: string;
  contentStandardsDocument?: Blob;
}

export const useUpdateLicenseMutation = ({
  onSuccess,
  onError,
}: {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
} = {}) => {
  const queryClient = useQueryClient();
  const { account } = useCurrentAccountContext();
  const accountId = account?.id;

  return useMutation({
    mutationFn: async ({ licenseId, contentStandardsDocument, ...params }: UpdateLicenseParams) => {
      if (!accountId) {
        throw new Error('Missing account ID');
      }

      let documentId = params.contentStandardsDocumentId;
      if (contentStandardsDocument) {
        const documentMetadata = await contentLicensingClient.uploadLicensingDocument(
          accountId,
          contentStandardsDocument,
        );
        documentId = documentMetadata.id ?? undefined;
      }

      const updateLicenseRequest: LicensesUpdateLicenseRequest = {
        royaltyRate: params.royaltyRate ?? 0,
        maxAgeRating: params.maxAgeRating ?? UniverseContentMaturity.None,
        dau7DayThreshold: params.dau7DayThreshold ?? DauBucket.None,
        name: params.name ?? '',
        description: params.description ?? '',
        visibility: params.visibility ?? LicenseVisibility.Private,
        enableMonetization: params.enableMonetization ?? false,
        countries: params.countries ?? [],
        creatorDau7DayThreshold: params.creatorDau7DayThreshold ?? DauBucket.None,
        contentStandardsDocumentId: documentId ?? '',
        contentStandardScope: params.contentStandardScope ?? '',
        contentStandardAnswers: params.contentStandardAnswers ?? [],
        licenseDuration: params.licenseDuration,
      };

      return contentLicensingClient.updateLicense(accountId, licenseId, updateLicenseRequest);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LICENSES_QUERY_KEY });
      onSuccess?.();
    },
    onError: (error, variables) => {
      captureException(error, {
        tags: { module: 'license-manager', operation: 'updateLicense' },
        extra: { accountId, licenseId: variables.licenseId },
      });
      onError?.(error);
    },
  });
};

export const useArchiveLicenseMutation = ({
  onSuccess,
  onError,
}: {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
} = {}) => {
  const queryClient = useQueryClient();
  const { account } = useCurrentAccountContext();
  const accountId = account?.id;

  return useMutation({
    mutationFn: async (id: string) => {
      if (!accountId) {
        throw new Error('Missing account ID');
      }

      return contentLicensingClient.archiveLicense(accountId, id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LICENSES_QUERY_KEY });
      onSuccess?.();
    },
    onError: (error, licenseId) => {
      captureException(error, {
        tags: { module: 'license-manager', operation: 'archiveLicense' },
        extra: { accountId, licenseId },
      });
      onError?.(error);
    },
  });
};

export const useSetLicenseVisibilityMutation = ({
  onSuccess,
  onError,
}: {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
} = {}) => {
  const queryClient = useQueryClient();
  const { account } = useCurrentAccountContext();
  const accountId = account?.id;

  return useMutation({
    mutationFn: async ({
      licenseId,
      visibility,
    }: {
      licenseId: string;
      visibility: LicenseVisibility;
    }) => {
      if (!accountId) {
        throw new Error('Missing account ID');
      }

      // First, fetch the latest license data to avoid stale/race conditions
      // as best we can
      const currentLicenseResponse = await contentLicensingClient.getLicense(accountId, licenseId);

      let contentStandardAnswers: ContentStandardQuestionAnswerRequest[] = [];
      if (currentLicenseResponse.contentStandardAnswers) {
        contentStandardAnswers = currentLicenseResponse.contentStandardAnswers
          .map((a) => ({
            questionId: a.questionId ?? '',
            answer: convertToContentStandardAnswer(a.answer),
          }))
          .filter(
            (a): a is { questionId: string; answer: ContentStandardAnswer } =>
              a.answer !== undefined,
          );
      }

      const updatedLicenseRequest: LicensesUpdateLicenseRequest = {
        name: currentLicenseResponse.name ?? '',
        description: currentLicenseResponse.description ?? '',
        royaltyRate: currentLicenseResponse.royaltyRate ?? 0,
        maxAgeRating: currentLicenseResponse.maxAgeRating ?? UniverseContentMaturity.None,
        dau7DayThreshold: currentLicenseResponse.dau7DayThreshold ?? DauBucket.None,
        creatorDau7DayThreshold: currentLicenseResponse.creatorDau7DayThreshold ?? DauBucket.None,
        countries: currentLicenseResponse.countries ?? [],
        visibility,
        enableMonetization: currentLicenseResponse.enableMonetization ?? false,
        contentStandardsDocumentId: currentLicenseResponse.contentStandardsDocumentId ?? '',
        contentStandardScope: currentLicenseResponse.contentStandardsScope ?? undefined,
        contentStandardAnswers,
        licenseDuration: currentLicenseResponse.licenseDuration,
      };

      // Then update the license with the new visibility
      return contentLicensingClient.updateLicense(accountId, licenseId, updatedLicenseRequest);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LICENSES_QUERY_KEY });
      // Also invalidate the IP listing query since listing visibility may change
      // when license visibility changes
      queryClient.invalidateQueries({ queryKey: IP_LISTINGS_QUERY_KEY });
      onSuccess?.();
    },
    onError: (error, variables) => {
      captureException(error, {
        tags: { module: 'license-manager', operation: 'setLicenseVisibility' },
        extra: { accountId, licenseId: variables.licenseId, visibility: variables.visibility },
      });
      onError?.(error);
    },
  });
};

export const useMakeLicensesPrivateMutation = ({
  onSuccess,
  onError,
}: {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
} = {}) => {
  const queryClient = useQueryClient();
  const { account } = useCurrentAccountContext();
  const accountId = account?.id;

  return useMutation({
    mutationFn: async (licenseIds: string[]) => {
      if (!accountId) {
        throw new Error('Missing account ID');
      }

      // Process each license in parallel
      const results = await Promise.all(
        licenseIds.map(async (licenseId) => {
          // First, fetch the latest license data, so we avoid stale/race conditions
          // as best we can
          const currentLicenseResponse = await contentLicensingClient.getLicense(
            accountId,
            licenseId,
          );

          const updatedLicenseRequest: LicensesUpdateLicenseRequest = {
            name: currentLicenseResponse.name ?? '',
            description: currentLicenseResponse.description ?? '',
            royaltyRate: currentLicenseResponse.royaltyRate ?? 0,
            maxAgeRating: currentLicenseResponse.maxAgeRating ?? UniverseContentMaturity.None,
            dau7DayThreshold: currentLicenseResponse.dau7DayThreshold ?? DauBucket.None,
            creatorDau7DayThreshold:
              currentLicenseResponse.creatorDau7DayThreshold ?? DauBucket.None,
            countries: currentLicenseResponse.countries ?? [],
            contentStandardsDocumentId: currentLicenseResponse.contentStandardsDocumentId ?? '',
            visibility: LicenseVisibility.Private,
            enableMonetization: currentLicenseResponse.enableMonetization ?? false,
          };

          // Then update the license with private visibility
          return contentLicensingClient.updateLicense(accountId, licenseId, updatedLicenseRequest);
        }),
      );

      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LICENSES_QUERY_KEY });
      // Also invalidate the IP listing query since listing visibility may change
      // when license visibility changes
      queryClient.invalidateQueries({ queryKey: IP_LISTINGS_QUERY_KEY });
      onSuccess?.();
    },
    onError: (error, licenseIds) => {
      captureException(error, {
        tags: { module: 'license-manager', operation: 'makeLicensesPrivate' },
        extra: { accountId, licenseCount: licenseIds.length },
      });
      onError?.(error);
    },
  });
};
