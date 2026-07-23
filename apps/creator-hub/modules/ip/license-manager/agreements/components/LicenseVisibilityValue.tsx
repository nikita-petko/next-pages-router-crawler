import React, { Fragment } from 'react';
import { LicenseVisibility } from '@rbx/clients/contentLicensingApi/v1';
import { useTranslation } from '@rbx/intl';

const visibilityMap: Record<LicenseVisibility, string> = {
  [LicenseVisibility.Public]: 'Label.Public',
  [LicenseVisibility.Private]: 'Label.Private',
};

export interface LicenseVisibilityValueProps {
  visibility: LicenseVisibility | undefined;
}

/**
 * Component to display a translated license visibility value
 */
export const LicenseVisibilityValue: React.FC<LicenseVisibilityValueProps> = ({ visibility }) => {
  const { translate } = useTranslation();

  if (visibility && visibility in visibilityMap) {
    return <Fragment>{translate(visibilityMap[visibility])}</Fragment>;
  }

  return <Fragment>{translate('Label.Unknown')}</Fragment>;
};

export default LicenseVisibilityValue;
