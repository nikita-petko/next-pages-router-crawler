import { Link } from '@rbx/ui';
import { creatorHub } from '@modules/miscellaneous/urls';

const ExperienceDetailsPageDocsLink = (chunks: React.ReactNode) => {
  const { docs } = creatorHub;
  return (
    <Link href={docs.getExperienceDetailsPageRewardedAdsUrl()} target='_blank' underline='always'>
      {chunks}
    </Link>
  );
};

export default ExperienceDetailsPageDocsLink;
