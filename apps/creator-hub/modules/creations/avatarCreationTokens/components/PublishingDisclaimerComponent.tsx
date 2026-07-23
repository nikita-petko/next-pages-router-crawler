import { useTranslation } from '@rbx/intl';
import { Link, Typography } from '@rbx/ui';
import React, { FC } from 'react';
import {
  MARKETPLACE_POLICY,
  ROBLOX_COMMUNITY_STANDARDS,
} from '@modules/miscellaneous/common/constants/linkConstants';

const marketplacePolicyLink = {
  opening: 'policyLinkStart',
  closing: 'policyLinkEnd',
  content: function PolicyLinkContent(chunks: React.ReactNode) {
    return (
      <Link href={MARKETPLACE_POLICY} target='_blank'>
        {chunks}
      </Link>
    );
  },
};

const communityStandardsLink = {
  opening: 'standardsLinkStart',
  closing: 'standardsLinkEnd',
  content: function StandardsLinkContent(chunks: React.ReactNode) {
    return (
      <Link href={ROBLOX_COMMUNITY_STANDARDS} target='_blank'>
        {chunks}
      </Link>
    );
  },
};

const PublishingDisclaimerComponent: FC<{}> = () => {
  const { translateHTML } = useTranslation();

  return (
    <Typography variant='body2' style={{ color: '#CBCBCB', marginTop: '8px' }}>
      {translateHTML('Message.PolicyDisclaimer', [marketplacePolicyLink, communityStandardsLink], {
        lineBreak: <br />,
      })}
    </Typography>
  );
};

export default PublishingDisclaimerComponent;
