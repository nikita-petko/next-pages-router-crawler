import { urls } from '@modules/miscellaneous/common';
import { Link } from '@rbx/ui';
import React from 'react';

const ExperienceDetailsPageDocsLink = (chunks: React.ReactNode) => {
  const {
    creatorHub: { docs },
  } = urls;
  return (
    <Link href={docs.getExperienceDetailsPageRewardedAdsUrl()} target='_blank' underline='always'>
      {chunks}
    </Link>
  );
};

export default ExperienceDetailsPageDocsLink;
