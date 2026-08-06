import developClient from '@modules/clients/develop';

const ASSET_DETAILS_BATCH_SIZE = 50;

const fetchDevelopmentItemAssetDetails = async (
  assetIds: readonly number[],
  signal?: AbortSignal,
) => {
  const isAborted = () => signal?.aborted === true;
  if (isAborted()) {
    return [];
  }

  const batches: number[][] = [];
  for (let index = 0; index < assetIds.length; index += ASSET_DETAILS_BATCH_SIZE) {
    batches.push(assetIds.slice(index, index + ASSET_DETAILS_BATCH_SIZE));
  }

  const responses = await Promise.all(batches.map((batch) => developClient.getAssetDetails(batch)));

  return isAborted() ? [] : responses.flatMap((response) => response.data ?? []);
};

export default fetchDevelopmentItemAssetDetails;
