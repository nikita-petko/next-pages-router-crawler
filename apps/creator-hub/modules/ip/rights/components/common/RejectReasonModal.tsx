import type { FunctionComponent } from 'react';
import React from 'react';
import { useTranslation, withTranslation } from '@rbx/intl';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@rbx/ui';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { RobloxTermsOfUseLink } from '../../../common/TermsOfUseLink';

interface RejectReasonModalProps {
  reason?: string;
  dialogOpen: boolean;
  setDialogOpen: (open: boolean) => void;
}

// dialog modal for view reject reason. Forks: IpContentRejectReasonModal
const RejectReasonModal: FunctionComponent<RejectReasonModalProps> = ({
  reason,
  dialogOpen,
  setDialogOpen,
}) => {
  const { translate, translateHTML } = useTranslation();
  return (
    <Dialog
      open={dialogOpen}
      onClose={() => setDialogOpen(false)}
      maxWidth='Medium'
      onClick={(event) => event.stopPropagation()}>
      <DialogTitle>{translate('Label.RejectionReason')}</DialogTitle>
      <DialogContent>
        <DialogContentText>
          {reason?.split(/\\+n/).map((item) => (
            <React.Fragment key={item}>
              {item}
              <br />
            </React.Fragment>
          ))}
          <br />
          <>
            {translateHTML('Description.LearnMore', [
              {
                opening: 'tosLinkStart',
                closing: 'tosLinkEnd',
                content(chunks) {
                  return <RobloxTermsOfUseLink>{chunks}</RobloxTermsOfUseLink>;
                },
              },
            ])}
          </>
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button color='primaryBrand' variant='contained' onClick={() => setDialogOpen(false)}>
          {translate('Label.IUnderstand')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default withTranslation(RejectReasonModal, [TranslationNamespace.RightsPortal]);
