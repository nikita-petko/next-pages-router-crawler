import type { FunctionComponent } from 'react';
import { useTranslation, withTranslation } from '@rbx/intl';
import { Dialog, DialogContent, Divider, Typography } from '@rbx/ui';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import type { CreatorType } from '@modules/miscellaneous/common';
import TranslationNamespace from '@modules/miscellaneous/localization/enums/TranslationNamespace';
import SelectPaymentMethod from '../SelectPaymentMethod/SelectPaymentMethod';
import type { CardVerificationResultEnum } from '../shared/stripeConstants';
import useSelectPaymentMethodDialogStyles from './SelectPaymentMethodDialog.styles';

export interface SelectPaymentMethodDialogProps {
  creatorType: CreatorType;
  creatorId: number;
  userId: number;
  closeDialog: () => void;
  saveStatus: (clientResponse: CardVerificationResultEnum, setDefault: boolean) => void;
}
const SelectPaymentMethodDialog: FunctionComponent<SelectPaymentMethodDialogProps> = ({
  creatorType,
  creatorId,
  userId,
  closeDialog,
  saveStatus,
}) => {
  const {
    classes: { addPaymentMethodHeader, addPaymentMethodDescription, topDivider },
  } = useSelectPaymentMethodDialogStyles();
  const { translate } = useTranslationWrapper(useTranslation());

  return (
    <Dialog open scroll='body' onClose={closeDialog} maxWidth='Large'>
      <DialogContent>
        <Typography variant='h5' className={addPaymentMethodHeader}>
          {translate(
            translationKey('Label.AddPaymentInformation', TranslationNamespace.CloudServices),
          )}
        </Typography>
        <Divider className={topDivider} />
        <Typography variant='h6' className={addPaymentMethodHeader}>
          {translate(
            translationKey('Header.ChoosePaymentMethod', TranslationNamespace.CloudServices),
          )}
        </Typography>
        <Typography variant='body2' color='secondary' className={addPaymentMethodDescription}>
          {translate(
            translationKey('Description.AddPaymentMethod', TranslationNamespace.CloudServices),
          )}
        </Typography>
        <SelectPaymentMethod
          creatorType={creatorType}
          creatorId={creatorId}
          userId={userId}
          nextStepper={closeDialog}
          closeDialog={closeDialog}
          saveStatus={saveStatus}
        />
      </DialogContent>
    </Dialog>
  );
};

export default withTranslation(SelectPaymentMethodDialog, [TranslationNamespace.CloudServices]);
