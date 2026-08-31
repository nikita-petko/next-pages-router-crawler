import type { FunctionComponent } from 'react';
import type { HydratedAgreementWithHydratedTargetsResponse } from '@rbx/client-content-licensing-api/v1';
import { AgreementTransition } from '@rbx/client-content-licensing-api/v1';
import { ProgressCircle } from '@rbx/foundation-ui';
import { useTranslationWithNamespace } from '@rbx/intl';
import { Typography } from '@rbx/ui';
import ViewPitchAttachments from '@modules/licenses/components/ViewPitchAttachments';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { getAgreementActivityByTransition } from '../agreements/utils/agreementActivity';
import { useGetCreatorPitchImageAttachments } from '../creatorAgreements/hooks/useGetCreatorPitchImageAttachments';

type CreatorPitchProps = {
  agreement: HydratedAgreementWithHydratedTargetsResponse;
  /** Reads pitch images through the Rights holder routes instead of the creator's own routes. */
  isIpHolderView?: boolean;
};

const CreatorPitch: FunctionComponent<CreatorPitchProps> = ({
  agreement,
  isIpHolderView = false,
}) => {
  const { translate } = useTranslationWithNamespace(TranslationNamespace.Licenses);
  const agreementId = agreement.id ?? '';
  const {
    data: attachments,
    isPending,
    isError,
  } = useGetCreatorPitchImageAttachments({
    agreementId,
    enabled: agreementId !== '',
    isIpHolderView,
  });
  const pitchText =
    getAgreementActivityByTransition(agreement.activityLog, AgreementTransition.Apply)?.notes ?? '';

  if (agreementId === '') {
    return null;
  }

  return (
    <>
      <Typography whiteSpace='pre-wrap'>{pitchText}</Typography>
      {isPending && (
        <ProgressCircle
          size='Medium'
          variant='Indeterminate'
          ariaLabel={translate('Label.Loading')}
        />
      )}
      {isError && <Typography>{translate('Error.Generic')}</Typography>}
      {attachments != null && <ViewPitchAttachments attachments={attachments} />}
    </>
  );
};

export default CreatorPitch;
