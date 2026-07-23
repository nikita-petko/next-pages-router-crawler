import { UniverseContentMaturity } from '@rbx/client-content-licensing-api/v1';
import { useTranslation } from '@rbx/intl';
import type { LicenseFormData } from './LicenseForm';
import LicenseForm from './LicenseForm';
import { MinimumDAU } from './licenseFormTypes';

interface Props {
  onLicenseAdd: (data: LicenseFormData) => void;
  onPrev: () => void;
  onSkip: () => void;
  licenseFormData: LicenseFormData | null;
}

/**
 * Step 2: We can optionally add a license to the IP Listing
 */
const AddLicenseStep = ({ onLicenseAdd, onPrev, onSkip, licenseFormData }: Props) => {
  const { translate } = useTranslation();

  return (
    <LicenseForm
      defaultValues={
        licenseFormData || {
          name: '',
          description: '',
          revenueShare: 0,
          maxMaturityRating: UniverseContentMaturity.Minimal,
          minimumDAU: MinimumDAU.NoRequirement,
          contentStandardsFile: undefined,
          monitorType: null,
          contentStandardScope: '',
          contentStandardAnswers: [],
        }
      }
      onSubmit={(data) => onLicenseAdd(data)}
      onCancel={onPrev}
      onSkip={onSkip}
      submitButtonText={translate('Action.Next')}
      cancelButtonText={translate('Action.Back')}
      isSubmitting={false}
    />
  );
};

export default AddLicenseStep;
