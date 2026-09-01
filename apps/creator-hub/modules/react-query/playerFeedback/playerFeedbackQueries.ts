import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  ExperienceReviewListResponse,
  ReviewCategoryType,
} from '@rbx/client-player-generated-reviews-service/v1';
import { getAssetReviews, reportAssetReview, translateComment } from './playerFeedbackRequests';

export function useGetAssetReviews(
  assetId: number,
  limit?: number,
  cursor?: string,
  startTime?: string,
  endTime?: string,
  categoryType?: ReviewCategoryType,
  enabled?: boolean,
) {
  return useQuery({
    queryKey: ['getAssetReviews', assetId, limit, cursor, startTime, endTime, categoryType],
    queryFn: async () => {
      const response = await getAssetReviews({
        assetId,
        limit,
        cursor,
        startTime,
        endTime,
        categoryType,
      });
      return response;
    },
    enabled: enabled ?? !!assetId,
  });
}

export function useReportAsssetReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (reviewId: string) => {
      return reportAssetReview({ reviewId });
    },
    onSuccess: (_, reviewId) => {
      const allQueries = queryClient.getQueriesData<ExperienceReviewListResponse>({
        queryKey: ['getAssetReviews'],
      });

      allQueries.forEach(([queryKey, oldData]) => {
        if (!oldData || !oldData.reviews) {
          return;
        }

        // Check if the review exists before updating the cache
        const newReviews = oldData.reviews.filter((review) => review.id !== reviewId);
        if (newReviews.length === oldData.reviews.length) {
          return;
        } // No change, skip updating

        queryClient.setQueryData(queryKey, {
          ...oldData,
          reviews: newReviews,
        });
      });
    },
  });
}

export function useTranslateComment() {
  return useMutation({
    mutationFn: async ({
      reviewId,
      targetLanguage,
    }: {
      reviewId: string;
      targetLanguage: string;
    }) => {
      return translateComment({
        reviewId,
        translateCommentTranslateCommentRequest: {
          targetLanguage,
        },
      });
    },
  });
}
