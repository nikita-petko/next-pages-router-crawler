import React from 'react';
import { COMMUNITY_STANDARDS_URL, REPORT_APPEALS_URL } from '../../../../utils/constants';
import useTranslateWithLink from '../../../../hooks/useTranslateWithLink';

/**
 * Content and page link about our community standards. Always shown
 */
const CommunityStandardsAndAppealsPageItem: React.FC = () => {
  const translateCommunityStandards = useTranslateWithLink(
    'Description.CommunityStandards',
    COMMUNITY_STANDARDS_URL,
  );
  const translateAppeal = useTranslateWithLink('Description.AppealWithPortal', REPORT_APPEALS_URL);

  return (
    <div data-testid='community-standards-and-appeals'>
      {translateCommunityStandards} {translateAppeal}
    </div>
  );
};

export default CommunityStandardsAndAppealsPageItem;
