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
import { IpPolicyLink, RobloxTermsOfUseLink } from '../../../common/TermsOfUseLink';
import { findRejectionReasonLink, renderReasonSegment } from './rejectionReasonLink';

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
  const activeLink = findRejectionReasonLink(reason);
  return (
    <Dialog
      open={dialogOpen}
      onClose={() => setDialogOpen(false)}
      maxWidth='Medium'
      onClick={(event) => event.stopPropagation()}>
      <DialogTitle>{translate('Label.RejectionReason')}</DialogTitle>
      <DialogContent>
        <DialogContentText>
          {reason?.split(/\\+n/).map((item, index) => (
            // eslint-disable-next-line react/no-array-index-key -- reason segments are static text split from a fixed string; order never changes
            <React.Fragment key={index}>
              {renderReasonSegment(item, activeLink)}
              <br />
            </React.Fragment>
          ))}
          <br />
          <>
            {translateHTML('Description.LearnMoreWithIpPolicy', [
              {
                opening: 'tosLinkStart',
                closing: 'tosLinkEnd',
                content(chunks) {
                  return <RobloxTermsOfUseLink>{chunks}</RobloxTermsOfUseLink>;
                },
              },
              {
                opening: 'ipPolicyLinkStart',
                closing: 'ipPolicyLinkEnd',
                content(chunks) {
                  return <IpPolicyLink>{chunks}</IpPolicyLink>;
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
