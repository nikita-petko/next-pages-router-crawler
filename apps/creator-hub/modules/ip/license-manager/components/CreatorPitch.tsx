import type { FunctionComponent } from 'react';
import type { HydratedAgreementWithHydratedTargetsResponse } from '@rbx/client-content-licensing-api/v1';
import { ProgressCircle } from '@rbx/foundation-ui';
import { useTranslationWithNamespace } from '@rbx/intl';
import { Typography } from '@rbx/ui';
import ViewPitchAttachments from '@modules/licenses/components/ViewPitchAttachments';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import AgreementDetailsTabs from '../agreements/enums/AgreementDetailsTabs';
import { getPitchText } from '../agreements/utils/agreementActivity';
import { useGetCreatorPitchImageAttachments } from '../creatorAgreements/hooks/useGetCreatorPitchImageAttachments';
import { IPH_AGREEMENT_DETAILS_HREF } from '../urls';

type CreatorPitchProps = {
  agreement: HydratedAgreementWithHydratedTargetsResponse;
  /** Reads pitch images through the IP holder route and enables shareable full-size previews. */
  isIpHolderView?: boolean;
};

const CreatorPitch: FunctionComponent<CreatorPitchProps> = ({
  agreement,
  isIpHolderView = false,
}) => {
  const { translate } = useTranslationWithNamespace(TranslationNamespace.Licenses);
  const agreementId = agreement.id ?? '';
  // Pitch images are best effort: a failed fetch renders no images and no error, so the pitch
  // text still reaches the reader.
  const { data: attachmentsResult, isPending } = useGetCreatorPitchImageAttachments({
    agreementId,
    enabled: agreementId !== '',
    isIpHolderView,
  });
  const attachments = attachmentsResult?.attachments;
  const pitchText = getPitchText(agreement.activityLog, isIpHolderView);

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
      {attachments != null && (
        <ViewPitchAttachments
          attachments={attachments}
          parentTitle={
            isIpHolderView ? translate('Heading.CreatorIntent') : translate('Heading.YourIntent')
          }
          imgSharingBaseUrl={
            isIpHolderView
              ? `${IPH_AGREEMENT_DETAILS_HREF(agreementId)}?tab=${AgreementDetailsTabs.Details}`
              : undefined
          }
          accessContext={isIpHolderView ? attachmentsResult?.accessContext : undefined}
        />
      )}
    </>
  );
};

export default CreatorPitch;
