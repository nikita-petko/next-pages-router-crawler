import type { FunctionComponent } from 'react';
import type { HydratedAgreementWithHydratedTargetsResponse } from '@rbx/client-content-licensing-api/v1';
import { AgreementStatus, AgreementTransition } from '@rbx/client-content-licensing-api/v1';
import { useFlag } from '@rbx/flags';
import { useTranslationWithNamespace } from '@rbx/intl';
import { Typography } from '@rbx/ui';
import { isImageAttachmentEnabledInLicenseApplication } from '@generated/flags/contentLicensing';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { getAgreementActivityByTransition } from '../../agreements/utils/agreementActivity';
import AmDivider from '../../components/AmDivider';
import CreatorPitch from '../../components/CreatorPitch';

type CreatorIntentProps = {
  agreement: HydratedAgreementWithHydratedTargetsResponse;
};

const CreatorIntent: FunctionComponent<CreatorIntentProps> = ({ agreement }) => {
  const { translate } = useTranslationWithNamespace(TranslationNamespace.Licenses);
  const { ready, value: isPitchImageEnabled } = useFlag(
    isImageAttachmentEnabledInLicenseApplication,
  );
  // Drafts only exist for applications the Creator started, and they carry no Apply activity
  // until the application is submitted.
  const isCreatorInitiated =
    getAgreementActivityByTransition(agreement.activityLog, AgreementTransition.Apply) != null ||
    agreement.status === AgreementStatus.Draft;

  if (!ready || !isPitchImageEnabled || !isCreatorInitiated) {
    return null;
  }

  return (
    <>
      <AmDivider />

      <Typography variant='h5'>{translate('Heading.YourIntent')}</Typography>

      <CreatorPitch agreement={agreement} />
    </>
  );
};

export default CreatorIntent;
