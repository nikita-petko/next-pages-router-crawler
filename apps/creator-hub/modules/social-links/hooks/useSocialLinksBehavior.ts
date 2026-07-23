import { useQuery } from '@tanstack/react-query';
import guacClient from '@modules/clients/guac';

type SocialLinksBehavior = {
  shouldHideSocialLinksSection: boolean;
  shouldDisableSocialLinkCreation: boolean;
};

const DEFAULT_SOCIAL_LINKS_BEHAVIOR = {
  shouldHideSocialLinksSection: true,
  shouldDisableSocialLinkCreation: false,
};

export default function useSocialLinksBehavior() {
  const query = useQuery({
    queryKey: ['socialLinksBehavior'],
    queryFn: async () => {
      try {
        return await guacClient.loadBehavior<SocialLinksBehavior>('creator-hub-social-links');
      } catch {
        return DEFAULT_SOCIAL_LINKS_BEHAVIOR;
      }
    },
  });

  return {
    ...query,
    data: query.data ?? DEFAULT_SOCIAL_LINKS_BEHAVIOR,
  };
}
