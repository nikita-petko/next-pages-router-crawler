import React, { FunctionComponent } from 'react';
import { Dialog, DialogContent, Divider, Typography } from '@rbx/ui';
import { CreatorType } from '@modules/miscellaneous/common';
import { useTranslation, withTranslation } from '@rbx/intl';
import { useTranslationWrapper, translationKey } from '@modules/analytics-translations';
import TranslationNamespace from '@modules/miscellaneous/localization/enums/TranslationNamespace';
import useSelectPaymentMethodDialogStyles from './SelectPaymentMethodDialog.styles';
import SelectPaymentMethod from '../SelectPaymentMethod/SelectPaymentMethod';
import { CardVerificationResultEnum } from '../shared/stripeConstants';

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
