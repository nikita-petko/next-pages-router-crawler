import React, { FunctionComponent, useMemo } from 'react';
import { Typography } from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
import EligibilityRow, { EligibilityStatus } from '@modules/eligibility/components/EligibilityRow';
import {
  EligibilityCheckIntlKeyProps,
  EligibilityCheckIntlKeys,
  EligibilityCheckType,
} from '../constants/AffiliateProgramChecksConstants';

export interface AffiliateProgramEligibilityRowProps {
  eligibilityCheckType: EligibilityCheckType;
  status: EligibilityStatus;
  verifyLink?: () => void;
  isOpenInNewLink?: boolean;
  isCardComponent?: boolean;
}

const AffiliateProgramEligibilityRow: FunctionComponent<AffiliateProgramEligibilityRowProps> = ({
  eligibilityCheckType,
  status,
  verifyLink,
  isOpenInNewLink,
  isCardComponent = false,
}) => {
  const { translate } = useTranslation();
  const isVerified = useMemo(() => status === EligibilityStatus.Completed, [status]);

  const { title, titleShort, description, descriptionShort, buttonText, buttonTextVerified } =
    EligibilityCheckIntlKeys.get(eligibilityCheckType) as EligibilityCheckIntlKeyProps;

  const showButton =
    (!isVerified && verifyLink !== undefined) || (isVerified && buttonTextVerified !== undefined);

  const buttonKey = isVerified && buttonTextVerified ? buttonTextVerified : buttonText;

  return (
    <EligibilityRow
      key={eligibilityCheckType}
      headerText={translate(isCardComponent ? titleShort : title)}
      descriptionText={
        <Typography variant='body2' color='inherit'>
          {translate(isCardComponent ? descriptionShort : description)}
        </Typography>
      }
      status={status}
      linkText={showButton ? translate(buttonKey) : undefined}
      onClickLink={showButton ? verifyLink : undefined}
      isLowerCaseLink
      isOpenInNewLink={isOpenInNewLink === true}
      buttonSize={isCardComponent ? 'small' : 'medium'}
      buttonStyle={{ marginLeft: isCardComponent ? '12px' : '24px', alignSelf: 'center' }}
    />
  );
};

export default AffiliateProgramEligibilityRow;
