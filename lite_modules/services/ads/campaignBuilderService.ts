import adsClient from '@clients/ads';
import {
  CreateCampaignResponse,
  CreationCampaignType,
  EditCampaignResponse,
  EditCampaignType,
  GetRecommendationResponse,
} from '@type/campaignBuilder';

export const getCampaignRecommendation = async (universeId: number) => {
  const response = await adsClient.get<GetRecommendationResponse>({
    url: `/v2/native/recommendation?universe_id=${universeId}`,
  });
  return response.data;
};

export const createSimplifiedCampaign = async (
  campaign: CreationCampaignType,
  idempotency_key: string,
) => {
  const response = await adsClient.post<CreateCampaignResponse>({
    body: { campaign, idempotency_key },
    url: '/v3/native/campaigns',
  });
  return response.data;
};

export const validateUniverseText = async (
  universeText: string,
): Promise<{ is_valid: boolean }> => {
  const response = await adsClient.get<{ is_valid: boolean }>({
    url: `/v3/native/universeText/validate?text=${encodeURIComponent(universeText)}`,
  });
  return response.data;
};

export const editSimplifiedCampaign = async (campaign: EditCampaignType) => {
  const response = await adsClient.patch<EditCampaignResponse>({
    body: { campaign },
    url: `/v3/native/campaigns/${campaign.id}`,
  });
  return response.data;
};
