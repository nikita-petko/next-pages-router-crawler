import {
  GetAllRewardMetadataApi,
  CreateRewardMetadataApi,
  UpdateRewardMetadataApi,
} from '@rbx/client-referral-reward-metadata/v1';
import { createClientConfiguration } from '@modules/clients/utils/createClientConfiguration';

const configuration = createClientConfiguration('referral-reward-metadata', 'bedev2');

export const getAllRewardMetadataClient = () => {
  return new GetAllRewardMetadataApi(configuration);
};

export const createRewardMetadataClient = () => {
  return new CreateRewardMetadataApi(configuration);
};

export const updateRewardMetadataClient = () => {
  return new UpdateRewardMetadataApi(configuration);
};

export default {
  getAllRewardMetadataClient,
  createRewardMetadataClient,
  updateRewardMetadataClient,
};
