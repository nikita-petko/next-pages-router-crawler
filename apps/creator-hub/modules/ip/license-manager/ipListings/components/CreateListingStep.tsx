import { useTranslation } from '@rbx/intl';
import type { FormStore } from './IpListingForm';
import IpListingForm from './IpListingForm';

interface Props {
  onListingCreate: (data: FormStore) => void;
  onCancel: () => void;
  listingFormData: FormStore | null;
}

/**
 * Step 1: Create a new IP Listing
 */
const CreateListingStep = ({ onListingCreate, onCancel, listingFormData }: Props) => {
  const { translate } = useTranslation();

  return (
    <IpListingForm
      defaultValues={
        listingFormData || {
          ipFamilyId: '',
          name: '',
          description: '',
          thumbnails: [],
        }
      }
      onSubmit={onListingCreate}
      onCancel={onCancel}
      submitButtonText={translate('Action.Next')}
      isSubmitting={false}
    />
  );
};

export default CreateListingStep;
