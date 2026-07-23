import { getBEDEV2ServiceBasePath } from '@modules/clients/utils';
import {
  GetAllRewardMetadataApi,
  CreateRewardMetadataApi,
  UpdateRewardMetadataApi,
} from '@rbx/clients/referralRewardMetadata/v1';
import { Configuration } from '@rbx/clients';

const basePath = getBEDEV2ServiceBasePath('referral-reward-metadata');

const configuration = new Configuration({
  basePath,
  credentials: 'include',
});

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
