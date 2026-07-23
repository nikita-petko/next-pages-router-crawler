import React from 'react';
import { TERMS_OF_USE_URL } from '../../../../utils/constants';
import useTranslateWithLink from '../../../../hooks/useTranslateWithLink';

/**
 * Message and link regarding Roblox's terms of use. Always shown
 */
const TermsOfUsePageItem: React.FC = () => {
  return (
    <div data-testid='terms-of-use'>
      {useTranslateWithLink('Description.Violation', TERMS_OF_USE_URL)}
    </div>
  );
};

export default TermsOfUsePageItem;
