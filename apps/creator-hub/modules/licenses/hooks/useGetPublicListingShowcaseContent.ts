export type ShowcaseContentType = 'Universe';

export type ShowcaseContentReference = {
  contentType?: ShowcaseContentType;
  contentId?: string | null;
};

export type PublicListingShowcaseContent = {
  content?: ShowcaseContentReference[] | null;
};

type UseGetPublicListingShowcaseContentParams = {
  listingId: string;
  enabled: boolean;
};

type UseGetPublicListingShowcaseContentResult = {
  data: PublicListingShowcaseContent;
  isPending: boolean;
  isError: boolean;
};

const EMPTY_PUBLIC_LISTING_SHOWCASE_CONTENT: PublicListingShowcaseContent = { content: [] };

/**
 * Temporary placeholder for the upcoming Content Licensing public showcase-content query.
 * Keep production empty until the generated client is available.
 */
const useGetPublicListingShowcaseContent = (
  params: UseGetPublicListingShowcaseContentParams,
): UseGetPublicListingShowcaseContentResult => {
  if (!params.enabled || params.listingId.length === 0) {
    return {
      data: EMPTY_PUBLIC_LISTING_SHOWCASE_CONTENT,
      isPending: false,
      isError: false,
    };
  }

  return {
    data: EMPTY_PUBLIC_LISTING_SHOWCASE_CONTENT,
    isPending: false,
    isError: false,
  };
};

export default useGetPublicListingShowcaseContent;
