import itemconfigurationClient from '@modules/clients/itemconfiguration';
import useGetMetadata from '@modules/react-query/itemConfiguration/itemConfigurationQueries';

const useAvatarLooksGate = (): boolean | undefined => {
  const { data, isFetched } = useGetMetadata(itemconfigurationClient);

  if (!isFetched) {
    return undefined;
  }

  return data?.showAvatarLooksInCreations ?? false;
};

export default useAvatarLooksGate;
