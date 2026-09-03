import adsClient from '@clients/ads';
import { getHttpStatusFromError } from '@type/errorResponse';

interface GetSponsoredUniverseGamePreviewVideoResponse {
  video_asset_id?: number;
}

export const getSponsoredUniverseGamePreviewVideo = async (
  universeId: number,
): Promise<GetSponsoredUniverseGamePreviewVideoResponse | null> => {
  try {
    const response = await adsClient.get<GetSponsoredUniverseGamePreviewVideoResponse>({
      url: `/v1/universes/${universeId}/gamePreviewVideo`,
    });

    return response.data;
  } catch (error) {
    if (getHttpStatusFromError(error) === 404) {
      return null;
    }
    throw error;
  }
};
