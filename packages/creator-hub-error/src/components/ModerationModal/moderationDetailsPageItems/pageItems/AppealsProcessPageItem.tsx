import React from 'react';
import useTranslateWithLink from '../../../../hooks/useTranslateWithLink';
import { APPEALS_PROCESS_URL } from '../../../../utils/constants';

type TAppealsProcessProps = {
  showAppealsProcessLink?: boolean;
};

/**
 * Content and page link for the appeals process. Shown based on showAppealsProcessLink
 */
const AppealsProcessPageItem: React.FC<TAppealsProcessProps> = ({ showAppealsProcessLink }) => {
  const translateAppealsProcess = useTranslateWithLink(
    'Description.AppealsProcess',
    APPEALS_PROCESS_URL,
  );

  if (!showAppealsProcessLink) {
    return null;
  }

  return <div data-testid='appeals-process'>{translateAppealsProcess}</div>;
};

export default AppealsProcessPageItem;
