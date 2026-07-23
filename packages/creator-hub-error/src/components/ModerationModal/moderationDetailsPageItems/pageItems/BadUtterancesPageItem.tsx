import React from 'react';
import {
  HttpControllerGetNotApprovedResponseBadUtterance,
  HttpControllerGetNotApprovedResponseViolation,
} from '@rbx/client-behavior-intervention/v1';
import ModerationBadUtterance from '../../ModerationBadUtterance';
import isPlatformEvidenceVisibleInView from '../../../../utils/isPlatformEvidenceVisibleInView';

type TBadUtterancesProps = {
  badUtterances?: Array<HttpControllerGetNotApprovedResponseBadUtterance>;
  violation?: HttpControllerGetNotApprovedResponseViolation;
};

/**
 * This is a special section reserved for badUtterances data
 * This is essentially an ennumeration of each violating items we identified under corresponding category
 */
const BadUtterancesPageItem: React.FC<TBadUtterancesProps> = ({ badUtterances, violation }) => {
  if (isPlatformEvidenceVisibleInView(violation) || !badUtterances || badUtterances.length === 0) {
    return null;
  }

  return (
    <div data-testid='bad-utterances'>
      {badUtterances?.map((badUtterance) => (
        <ModerationBadUtterance
          key={badUtterance.labelTranslationKey}
          badUtterance={badUtterance}
        />
      ))}
    </div>
  );
};

export default BadUtterancesPageItem;
