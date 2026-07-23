import { useQuery } from '@tanstack/react-query';
import { creatorTransparencyClient } from '@modules/clients';

const useContentRestriction = (contentId: string, contentType: string) => {
  const { data, isLoading } = useQuery({
    queryKey: ['creatorTransparency', 'getRestriction', contentId, contentType],
    queryFn: () => creatorTransparencyClient.getRestriction(contentId, contentType),
    enabled: !!contentId && contentId !== '-1',
  });

  return {
    shouldDisplay: !!data?.isRestricted,
    description: data?.restrictionMessage ?? '',
    isLoading,
  };
};

export default useContentRestriction;
