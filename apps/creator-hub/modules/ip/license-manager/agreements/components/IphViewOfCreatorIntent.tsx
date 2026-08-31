import type { FunctionComponent } from 'react';
import type { HydratedAgreementWithHydratedTargetsResponse } from '@rbx/client-content-licensing-api/v1';
import { AgreementTransition } from '@rbx/client-content-licensing-api/v1';
import { useFlag } from '@rbx/flags';
import { useTranslationWithNamespace } from '@rbx/intl';
import { Typography } from '@rbx/ui';
import { isImageAttachmentEnabledInLicenseApplication } from '@generated/flags/contentLicensing';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { isNonEmptyString } from '@modules/miscellaneous/utils';
import ReportIpMessageMenu from '../../../components/ReportIpMessageMenu';
import AmDivider from '../../components/AmDivider';
import CreatorPitch from '../../components/CreatorPitch';
import { getAgreementActivityByTransition } from '../utils/agreementActivity';

type IphViewOfCreatorIntentProps = {
  agreement: HydratedAgreementWithHydratedTargetsResponse;
  creatorName: string;
  listingName: string;
};

const IphViewOfCreatorIntent: FunctionComponent<IphViewOfCreatorIntentProps> = ({
  agreement,
  creatorName,
  listingName,
}) => {
  const { translate } = useTranslationWithNamespace(TranslationNamespace.Licenses);
  const { ready, value: isPitchImageEnabled } = useFlag(
    isImageAttachmentEnabledInLicenseApplication,
  );
  const applyActivity = getAgreementActivityByTransition(
    agreement.activityLog,
    AgreementTransition.Apply,
  );

  if (!ready || !isPitchImageEnabled || applyActivity == null) {
    return null;
  }

  return (
    <>
      <AmDivider />

      <div className='flex items-center justify-between gap-medium'>
        <Typography variant='h5'>{translate('Heading.CreatorIntent')}</Typography>

        {applyActivity && isNonEmptyString(creatorName) ? (
          <ReportIpMessageMenu
            isCreator={false}
            agreementActivity={applyActivity}
            creatorName={creatorName}
            listingName={listingName}
          />
        ) : null}
      </div>

      <CreatorPitch agreement={agreement} isIpHolderView />
    </>
  );
};

export default IphViewOfCreatorIntent;
