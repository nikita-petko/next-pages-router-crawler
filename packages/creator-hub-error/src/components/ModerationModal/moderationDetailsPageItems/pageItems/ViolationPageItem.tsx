import React from 'react';
import isPlatformEvidenceVisibleInView from '../../../../utils/isPlatformEvidenceVisibleInView';
import ModerationViolation, { TModerationViolationProps } from '../../ModerationViolation';

/**
 * This is a special section reserved for violation data
 */
const ViolationPageItem: React.FC<TModerationViolationProps> = ({ violation, beginDate }) => {
  if (!isPlatformEvidenceVisibleInView(violation)) {
    return null;
  }

  return (
    <div data-testid='violation'>
      <ModerationViolation violation={violation} beginDate={beginDate} />
    </div>
  );
};

export default ViolationPageItem;
