import { useQuery } from '@tanstack/react-query';
import catalogClient from '@modules/clients/catalog';
import developClient from '@modules/clients/develop';

const contentsDetailsKey = 'rightsClient/contentsDetails';

const bundleDetails = async (itemIds: number[]): Promise<number[]> => {
  const response = await catalogClient.postBundleDetails(itemIds);
  const validIds = response.data?.map((item) => item.id) || [];
  const invalidIds = itemIds.filter((id) => !validIds.includes(id));
  return invalidIds;
};

const assetDetails = async (itemIds: number[]): Promise<number[]> => {
  const response = await developClient.getAssetDetails(itemIds);
  const validIds = response.data?.map((item) => item.id) || [];
  const invalidIds = itemIds.filter((id) => !validIds.includes(id));
  return invalidIds;
};

export default function useValidateContentIds(assetIds: number[], bundleIds: number[]) {
  const response = useQuery({
    queryKey: [contentsDetailsKey, assetIds, bundleIds],
    queryFn: async () => {
      const invalidAssetIds = await assetDetails(assetIds);
      const invalidBundleIds = await bundleDetails(bundleIds);
      const invalidContentIds = [...invalidAssetIds, ...invalidBundleIds];
      return invalidContentIds;
    },
  });

  return { invalidContentIds: response.data || [], ...response };
}
